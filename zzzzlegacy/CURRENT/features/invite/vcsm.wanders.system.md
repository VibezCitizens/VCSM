# VCSM Wanders — System Architecture

**Last updated:** 2026-04-25

## 1 Purpose

Wanders is the async card messaging system inside VCSM. Actors send decorated digital postcards to each other (or to public share links). Cards are themed, carry optional CTAs, and support anonymous sending. Recipients view cards via a public link and can reply.

---

## 2 Scope

**Included:**
- Card creation (CardBuilder + template registry)
- Card send pipeline (actor-to-actor + public link)
- Mailbox (inbox/sent/archive)
- Public card view (share link experience)
- Reply composer and reply list
- Template system (registry pattern, per-card-type templates)
- Analytics (card open, CTA click events)

**Excluded:**
- Supabase schema definitions (see DB)
- Edge functions (send-citizen-invite is separate)

---

## 3 Ownership

**Application Scope:** VCSM  
**Code Root:** `apps/VCSM/src/features/wanders/`  
**No shared engine dependency** — fully self-contained within the wanders feature.

---

## 4 Entry Points

| Route | Screen |
|---|---|
| `/wanders` | `WandersHome.view.jsx` — landing / card type selector |
| `/wanders/create` | `WandersCreate.view.jsx` — card builder |
| `/wanders/mailbox` | `WandersMailbox.view.jsx` — inbox/sent/archive |
| `/wanders/sent` | `WandersSent.view.jsx` — sent cards list |
| `/wanders/card/:publicId` | `WandersCardPublic.view.jsx` — public card experience |
| `/wanders/i/:inboxId` | Inbox public link (guest-accessible) |

---

## 5 Template Registry Pattern

Templates are registered objects that describe a card type. Each template provides:

```js
{
  id: "template_id",         // unique, used as template_key in DB
  cardType: "birthday",       // groups template under a card type
  hideTemplatePicker: false,  // if true, hides template select dropdown
  defaultData: { ... },       // initial form state
  toPayload(data) { ... },    // converts form state to DB payload
  Form({ data, setData, ui }) { ... },    // input form component
  Preview({ data }) { ... },             // live preview component
}
```

**Registry file:** `components/cardstemplates/registry.js`

Card types currently registered:

| Key | Templates |
|---|---|
| `generic` | generic.minimal |
| `birthday` | birthday.modern |
| `valentines` | valentines.romantic, .classic, .cute, .minimal, .poem, .bold |
| `business` | business.professional |
| `photo` | photo.basic |
| `mothers_day` | mothers_day.basic, .premium, .vport_promo |
| `teacher_appreciation` | teacher_appreciation.basic, .premium, .classroom_thank_you, .vport_promo |

**Template resolution:** `WandersCardPreview` calls `findTemplateById(templateKey)` which walks all registry groups. It tries dot-to-hyphen and hyphen-to-dot aliases for backwards compatibility.

---

## 6 Data Flow

### Card Creation

```
CardBuilder
  → user picks card type → template picked from registry
  → Form component renders (controlled formData state)
  → "Create card" → template.toPayload(formData)
  → onSubmit(payload) → publishWandersFromBuilder (controller)
  → DB insert into wanders.cards
  → card stored with template_key + customization JSON
```

### Card View (Public Link)

```
WandersCardPublic.view.jsx
  → useWandersPublicCardExperience({ publicId })
  → DAL: fetch card by public_id
  → WandersCardPreview:
      findTemplateById(template_key)
      → if found: render registryTemplate.Preview({ data })
      → if not found: render generic fallback renderer
  → readCardCta(card): extract CTA from customization JSON
  → CTA click → trackCtaClick (analytics) → navigate / window.open
```

### Mailbox

```
WandersMailbox.view.jsx
  → useWandersMailboxExperience({ mode })
  → mailbox items list (WandersMailboxList → WandersMailboxItemRow)
  → selected item → WandersCardDetail
  → WandersRepliesList + WandersReplyComposer
```

---

## 7 Source of Truth

| Data | Table |
|---|---|
| Cards | `wanders.cards` |
| Deliveries | `wanders.deliveries` |
| Replies | `wanders.card_replies` |
| Analytics events | `wanders.card_events` |
| Inboxes | `wanders.inboxes` |

---

## 8 UI States

| State | Rendering |
|---|---|
| Loading | `WandersLoading` component |
| Empty mailbox | `WandersEmptyState` component |
| Card not found | `WandersEmptyState` with error message |
| Public card (has CTA) | CTA button rendered below card preview |
| Guest mailbox | Guest warning modal with `WandersShareVCSM` |

---

## 9 CSS Architecture

Wanders uses **two styling approaches**:

### A. wandersChrome.js (Tailwind arbitrary value classes)

Shared chrome token object imported by all Wanders views. Contains all page-level class strings (shell, header, dashBox, buttons, helpers).

**File:** `utils/wandersChrome.js`

All values use `var(--vc-*)` CSS custom properties via Tailwind arbitrary syntax (`bg-[var(--vc-bg-0)]`, `border-[var(--vc-border)]`, etc.). Hardcoded rgba values are prohibited — use token-aligned rgba literals only for glow/shadow effects where opacity is essential and CSS var alpha isn't available.

### B. Inline styles (view/component-level)

Views that use inline `style={}` props reference `var(--vc-*)` tokens directly in the string values:

```js
background: "var(--vc-surface)",
border: "1px solid var(--vc-border)",
color: "var(--vc-text)",
```

Files using this pattern:
- `screens/view/WandersCardPublic.view.jsx` — `styles` object (const, module-scoped)
- `screens/view/WandersMailbox.view.jsx` — `styles` object (const, module-scoped)
- `components/WandersMailboxItemRow.jsx` — `styles` object (useMemo, reactive to `isSelected`)
- `components/WandersCardPreview.jsx` — fallback renderer `styles` object + `getTemplateTheme()`

### C. Template previews (per-template inline Tailwind)

Each registry template's `Preview` component uses its own Tailwind classes with hardcoded palette values. These are intentionally scoped to their card aesthetic and do not consume `--vc-*` tokens. Examples: birthday amber palette, teacher_appreciation chalkboard palette.

### No wanders.css file

Wanders does not have a dedicated feature CSS file. The `wandersChrome.js` chrome object serves the same role for Tailwind-class consumers.

---

## 10 CTA System

CTAs are stored inside the card's `customization` JSON:

```json
{
  "cta": { "type": "visit_vport", "label": "View Profile", "url": "" },
  "vport_slug": "abc-store",
  "campaign": "teacher_appreciation_2026"
}
```

**CTA types:** `visit_vport`, `call`, `message`, `none`

**Sanitization:** `sanitizeCtaUrl()` in `WandersCardPublic.view.jsx` enforces an allowlist of internal routes and validates external URLs as http/https only.

**Allowed internal routes:**
```
/vport/[slug]/card
/profile/[slug]/menu
/profile/[slug]/reviews
```

**Analytics:** CTA clicks write to `wanders.card_events` with `event_type: "opened"` and `meta: { action: "cta_clicked", cta_type, cta_url, template_key, campaign }`.

---

## 11 Rules / Invariants

1. Templates must be registered in `registry.js` to appear in CardBuilder and resolve in WandersCardPreview.
2. `template_key` in DB must exactly match the template `id` in the registry.
3. `toPayload()` must always set both `templateKey` and `template_key` in the returned object.
4. CTA URLs must pass `sanitizeCtaUrl()` — never bypass this check.
5. `wandersChrome.js` is the only source of shared Wanders chrome classes — do not duplicate chrome classes in individual views.
6. Template `Preview` components may use their own color palette (hardcoded is acceptable for aesthetic intent).
7. All non-template UI (views, mailbox, public card chrome) must use `var(--vc-*)` tokens.

---

## 12 Failure Risks

| Risk | Area | Notes |
|---|---|---|
| Template key mismatch | CardPreview fallback triggers | DB `template_key` must match registry `id` exactly |
| CTA URL bypass | `sanitizeCtaUrl` | Always enforce allowlist — never accept raw user URLs without sanitization |
| `customization` double-JSON | `safeParseJson` | DB stores JSON string; `WandersCardPreview` unwraps up to 2 layers |
| Guest inbox lost | `localStorage` | Guest inboxes are browser-bound; shown in modal warning |
| Duplicate pending invite | `vibe_invites` unique index | Partial index blocks same (actor, channel, target) when pending |

---

## 13 Debug Notes

- `WandersCardPreview` logs template resolution to console (`[WandersCardPreview] templateKey =`, `template resolved?`). These are ungated — remove or gate with `import.meta.env.DEV` in future cleanup.
- `getTemplateTheme()` in `WandersCardPreview` is only reached when NO registry template is found. If you see the fallback renderer, the `template_key` in the DB does not match any registered `id`.
- To verify CTA resolution: inspect `card.customization.cta` and `card.customization.vport_slug` in the DB.

---

## 14 Files Map

| File | Role |
|---|---|
| `utils/wandersChrome.js` | Shared chrome token object (Tailwind class strings, `--vc-*` tokens) |
| `components/cardstemplates/registry.js` | Template registry — all card types |
| `components/cardstemplates/CardBuilder.jsx` | Card creation UI — type picker, template picker, form+preview |
| `components/WandersCardPreview.jsx` | Renders a card from payload or DB row; registry lookup + fallback |
| `components/WandersMailboxItemRow.jsx` | Single mailbox list row component |
| `screens/view/WandersCardPublic.view.jsx` | Public card experience (view, reply, CTA) |
| `screens/view/WandersMailbox.view.jsx` | Mailbox screen (list + detail panel + reply) |
| `screens/view/WandersHome.view.jsx` | Wanders landing / card type tiles |
| `screens/view/WandersCreate.view.jsx` | Card creation screen (wraps CardBuilder) |
| `components/cardstemplates/teacherappreciation/teacherAppreciation.shared.js` | Shared helpers, payload builder, palette resolver for TA templates |

---

## Change Log

### 2026-04-25 18:00

**Task:** Wanders CSS migration to `--vc-*` design tokens  
**Code Status Before:** Hardcoded `rgba()`, `bg-black`, `border-white/10`, `text-zinc-*`, and `rgba(124,58,237,...)` purple throughout all wanders chrome and view files.  
**Summary:** All Wanders chrome and view inline styles migrated to `var(--vc-*)` CSS custom property references. Template `Preview` components intentionally left with their own palettes.  
**Files Changed:**
- `utils/wandersChrome.js` — full token migration (bg, border, text, surface, glow colors)
- `components/WandersMailboxItemRow.jsx` — inline styles: unread dot, row bg/border, text colors
- `screens/view/WandersMailbox.view.jsx` — modal + panel inline styles
- `screens/view/WandersCardPublic.view.jsx` — panel, CTA, footer inline styles
- `components/WandersCardPreview.jsx` — `getTemplateTheme()` dark theme + fallback styles  
**Validation:** Visual parity with prior appearance; purple glow colors corrected from `rgba(124,58,237,...)` to `rgba(139,92,246,...)` to match `--vc-accent-primary` exactly.

### 2026-04-25 16:00

**Task:** Teacher Appreciation Card Pack V1  
**Summary:** Built 4 new card templates for Teacher Appreciation Week (May 4–8, 2026).  
**Files Created:**
- `components/cardstemplates/teacherappreciation/teacherAppreciation.shared.js`
- `components/cardstemplates/teacherappreciation/teacher_appreciation.basic.jsx`
- `components/cardstemplates/teacherappreciation/teacher_appreciation.premium.jsx`
- `components/cardstemplates/teacherappreciation/teacher_appreciation.classroom_thank_you.jsx`
- `components/cardstemplates/teacherappreciation/teacher_appreciation.vport_promo.jsx`  
**Files Modified:**
- `components/cardstemplates/registry.js` — added `teacher_appreciation` key
- `components/cardstemplates/CardBuilder.jsx` — added tile + amber tone
- `screens/view/WandersCardPublic.view.jsx` — CTA meta label generalized from hardcoded "Mother's Day Offer" to campaign-aware logic
