# VCSM VPORT Business Card

> **Version:** 4
> **Created:** 2026-04-25
> **Last Updated:** 2026-05-24
> **Scope:** Public shareable business card page + owner publish controls + anonymous lead capture + owner notification

---

## 1. Purpose

Every VPORT with a slug can have a public business card — a standalone, shareable web page at `/vport/:slug/card`. It is entirely separate from the main VPORT profile page. Its purpose is lead capture: a visitor fills in a contact form and a lead is written to `vport.business_card_leads`.

The card is invisible to the public until the owner explicitly publishes it via Settings → VPORTs → Business Cards. Publishing is reversible — unpublish at any time.

---

## 2. Scope

**In scope:**
- Public card route: `/vport/:slug/card` (Wanders feature, read-only for public)
- Owner publish/unpublish controls (Settings → VPORTs tab)
- Anonymous lead capture form (no auth required)
- DB schema: `vport.profiles.business_card_published`, `vport.business_card_leads`
- Three SECURITY DEFINER RPCs

**Out of scope:**
- VPORT profile page (`/vport/:slug`) — separate system
- Lead management UI (owner inbox, mark-contacted, delete) — documented in [`vcsm.vport.leads-dashboard.md`](vcsm.vport.leads-dashboard.md)
- VPORT-side card customisation (future)

**Feature boundary:** This feature lives in `src/features/wanders/` (public experience) and `src/features/settings/vports/` (owner controls). Do not conflate it with the main VPORT profile system.

---

## 3. Availability Rules

A card is publicly accessible only when **all three** conditions are true on `vport.profiles`:

| Condition | Column |
|---|---|
| Owner has published it | `business_card_published = true` |
| VPORT is active | `is_active = true` |
| VPORT is not soft-deleted | `is_deleted = false` |

`vport.read_business_card_public(slug)` enforces all three — returns zero rows otherwise. The app-layer page shows a "card unavailable" state on null return.

`vport.submit_business_card_lead(slug, ...)` repeats the same check before inserting — a lead cannot be submitted to an unavailable card.

---

## 4. DB Schema

### `vport.profiles` — column added

| Column | Type | Default |
|---|---|---|
| `business_card_published` | `BOOLEAN NOT NULL` | `false` |

### `vport.business_card_leads` — new table

| Column | Type | Notes |
|---|---|---|
| `id` | `UUID PK` | gen_random_uuid() |
| `vport_profile_id` | `UUID NOT NULL` | FK → vport.profiles(id) ON DELETE CASCADE |
| `actor_id` | `UUID NULL` | FK → vc.actors(id) ON DELETE SET NULL |
| `name` | `TEXT NOT NULL` | Lead's name |
| `phone` | `TEXT NULL` | At least one of phone/email required (CHECK constraint) |
| `email` | `TEXT NULL` | |
| `message` | `TEXT NOT NULL` | |
| `source` | `TEXT NOT NULL` | Default: `'business_card'` |
| `user_agent` | `TEXT NULL` | |
| `ip_address` | `INET NULL` | |
| `created_at` | `TIMESTAMPTZ NOT NULL` | now() |

**RLS and write model (post-hardening — migrations `20260524010000` + `20260524020000`):**

| Actor | Operation | Allowed | Mechanism |
|---|---|---|---|
| `anon` / `authenticated` | INSERT (direct) | **No** | `WITH CHECK (false)` policy + INSERT grants revoked |
| `anon` / `authenticated` | INSERT (via RPC) | **Yes** | `submit_business_card_lead` is SECURITY DEFINER — runs as `postgres`, bypasses RLS |
| `authenticated` owner | SELECT | **Yes** | `business_card_leads_owner_select` — owner subquery via `vport.profiles + vc.actor_owners + auth.uid()` |
| `authenticated` owner | UPDATE | **Yes — source column only** | `business_card_leads_owner_update` (same owner gate) + `GRANT UPDATE (source)` — all other columns are read-only post-insert |
| `authenticated` owner | DELETE | **Yes** | `business_card_leads_owner_delete` (same owner gate) |
| `authenticated` non-owner | Any write | **No** | RLS ownership subquery returns false |

The `source` column is the only column owners may mutate post-insert. This enables the "mark contacted" pattern (`"directory"` → `"directory_contacted"`) used by the dashboard. All PII columns (`name`, `phone`, `email`, `message`) are immutable after the RPC inserts them.

See [vcsm.vport.leads-dashboard.md](vcsm.vport.leads-dashboard.md) for the full owner dashboard architecture.

**Indexes:** `(vport_profile_id, created_at DESC)`, `(actor_id, created_at DESC)`

---

## 5. RPCs

All three are SECURITY DEFINER with `search_path = public, vport, vc`.

### `vport.set_business_card_publish_state(p_vport_id UUID, p_published BOOLEAN)`

- **Caller:** `authenticated` only
- **Ownership check:** `WHERE id = p_vport_id AND owner_user_id = auth.uid() AND is_deleted = false`
- **Effect:** Sets `business_card_published = p_published`, `updated_at = now()`
- **Returns:** `{ ok, vport_id, actor_id, slug, business_card_published }`
- **Error codes:** `AUTH_REQUIRED`, `INVALID_INPUT`, `VPORT_NOT_FOUND_OR_UNAUTHORIZED`

### `vport.read_business_card_public(p_slug TEXT)`

- **Caller:** `anon` + `authenticated`
- **Reads:** `vport.profiles` JOIN `vport.profile_public_details` + LEFT JOIN `reviews.public_vport_review_summary_v` + LATERAL `vport.profile_categories`
- **Availability guard:** `business_card_published = true AND is_active = true AND is_deleted = false`
- **Returns table:** `profile_id, actor_id, slug, business_name, bio, avatar_url, logo_url, phone_public, email_public, website_url, location_text, address, business_card_settings, review_count, average_rating, category_key, hours, directory_visible, directory_status`
- Returns zero rows when card is unavailable — never throws

**Column source map:**

| Column | Source table |
|---|---|
| `profile_id`, `actor_id`, `slug`, `business_name` (`p.name`), `bio`, `avatar_url`, `business_card_settings`, `directory_visible`, `directory_status` | `vport.profiles p` |
| `logo_url`, `phone_public`, `email_public`, `website_url`, `location_text`, `address`, `hours` | `vport.profile_public_details d` |
| `review_count`, `average_rating` | `reviews.public_vport_review_summary_v` (LEFT JOIN on `target_actor_id = p.actor_id`) |
| `category_key` | `vport.profile_categories` (LATERAL, primary only) |

**Critical column naming rule:** The profiles table column is `name`, not `business_name`. It is aliased `p.name AS business_name` in the function. Using `p.business_name` will throw `column does not exist`.

### `vport.submit_business_card_lead(p_slug, p_name, p_phone, p_email, p_message, p_source, p_user_agent, p_ip)`

- **Caller:** `anon` + `authenticated`
- **Validates:** slug not empty, name not empty, message not empty, phone or email present
- **Availability guard:** Re-checks `business_card_published + is_active + !is_deleted` before insert
- **Effect:** Inserts into `vport.business_card_leads`
- **Returns:** `{ ok, lead_id, profile_id, actor_id }`
- **Error codes:** `INVALID_INPUT`, `CARD_UNAVAILABLE`

---

## 5b. Lead Notification Pipeline

After a successful lead insert, the controller fires two side effects (both fire-and-forget — neither blocks the lead submission):

| Side Effect | Function | Recipient |
|---|---|---|
| Confirmation email | `fireLeadConfirmationEmail()` → `send-lead-confirmation` Edge Function | Lead submitter (if email provided) |
| Owner notification | `fireLeadOwnerNotification()` → `publishVcsmNotification()` | VPORT owner actor |

### Owner Notification Shape

```js
{
  kind: "lead_received",
  recipientActorId: result.actor_id,   // from RPC return value
  actorId: null,                        // anonymous — lead submitter has no actorId
  objectType: "lead",
  objectId: result.lead_id,
  linkPath: `/actor/${recipientActorId}/dashboard/leads`,
  context: { leadName, source }
}
```

`result.actor_id` comes directly from the `vport.submit_business_card_lead` RPC return value — no extra query needed.

### Notification Path Split — VCSM vs TRAZE

The two submission paths produce different notification outcomes:

| Submission path | Owner notification | Confirmation email |
|---|---|---|
| VCSM public card (`/vport/:slug/card`) | ✅ Yes — `fireLeadOwnerNotification()` in `submitVportBusinessCardLeadController` | ✅ Yes — `fireLeadConfirmationEmail()` (if email provided) |
| TRAZE directory (`apps/Traffic/`) | ❌ No | ✅ Yes — `invokeProviderLeadConfirmation()` in `submitProviderLeadRow` |

**Why TRAZE does not notify owners:** TRAZE (`apps/Traffic/src/features/conversion/dal/submitProviderLead.write.dal.js`) calls `submit_business_card_lead` RPC directly with an anon Supabase client. It does not go through the VCSM controller, so `fireLeadOwnerNotification()` is never called. The notification pipeline depends on `publishVcsmNotification()`, which requires an authenticated `auth.uid()` context — a Postgres trigger or the RPC itself cannot call it.

**Fix path:** A `notify-lead-owner` Edge Function, callable by TRAZE after RPC success, would close this gap. The RPC already returns `{ ok, lead_id, profile_id, actor_id }` — all fields the Edge Function would need to build and dispatch the owner notification.

---

## 5c. Review Count Bug — Root Cause and Fix (2026-05-11)

### The Bug

Migration `20260503060000` rewrote `vport.read_business_card_public` and introduced `column reference "review_count" is ambiguous`, surfacing as "Card unavailable" in the app.

**Root cause — two layers:**

1. **Ambiguous column reference.** In a plpgsql `RETURNS TABLE` function, output column names become implicit variables visible throughout the function scope. The subquery selected `review_count` from `reviews.public_vport_review_summary_v` without a table alias, so PostgreSQL saw both the view column and the output variable named `review_count` — ambiguous.

2. **Wrong column name.** The same migration used `p.business_name` which does not exist on `vport.profiles`. The real column is `p.name`, aliased as `business_name` in the SELECT.

**Migration history:**
- `20260429200000` — introduced the ambiguity
- `20260429210000` — fixed it with `cnt`/`avg_rating` aliases
- `20260503060000` — rewrote the function and reintroduced both bugs
- `20260511010000` — final fix (see below)

### The Fix

Migration `20260511010000_fix_read_business_card_public_remove_review_join.sql`

Two changes in the subquery:

```sql
-- broken: no alias on view, review_count unqualified
LEFT JOIN (
  SELECT target_actor_id, review_count, average_rating
  FROM reviews.public_vport_review_summary_v
) rs ON rs.target_actor_id = p.actor_id

-- fixed: view aliased as s, columns fully qualified — no collision possible
LEFT JOIN (
  SELECT s.target_actor_id,
         s.review_count   AS rc,
         s.average_rating AS avg_rating
  FROM reviews.public_vport_review_summary_v s
) rs ON rs.target_actor_id = p.actor_id
```

And in the outer SELECT:
```sql
COALESCE(rs.rc, 0)::bigint   AS review_count,
rs.avg_rating::numeric        AS average_rating,
```

`s.review_count` is unambiguously the view column. `rc`/`avg_rating` aliases ensure the outer SELECT never references a name that matches an output parameter.

### Invariant

Any future rewrite of `vport.read_business_card_public` that joins a reviews table must:
1. Alias the view with a short alias (`s`, `rv`, etc.)
2. Use fully qualified column references (`s.review_count`) inside the subquery
3. Use non-conflicting aliases (`rc`, `avg_rating`) in the subquery SELECT list
4. Use `p.name AS business_name` — never `p.business_name`

---

## 5d. Relationship to VPORT Dashboard Leads

The business card feature and the leads dashboard feature are two halves of the same flow, sharing `vport.business_card_leads` but owning separate responsibilities.

| Responsibility | Owner |
|---|---|
| Lead creation — public card form, RPC call, validation, notification pipeline | **Business Card** (`features/wanders/`, `features/public/vportBusinessCard/`) |
| Lead management — inbox list, mark contacted, delete, badge count | **Dashboard Leads** (`features/dashboard/vport/`) |
| DB table `vport.business_card_leads` | **Shared** — created by business card schema; read/updated/deleted by dashboard |

**Boundary rules:**
- The business card feature must not import internals from `features/dashboard/vport/`.
- The dashboard leads feature must not own public submission logic or call `submit_business_card_lead`.
- Cross-feature access must go through adapters — the dashboard leads module is not an adapter-exposed surface of the business card feature.

Full dashboard architecture: [vcsm.vport.leads-dashboard.md](vcsm.vport.leads-dashboard.md)

---

## 5e. Known Domain Debt — source Column Overloading

The `source` column currently carries two distinct concerns:

| Concern | Current encoding | Example |
|---|---|---|
| Acquisition channel | Base source value | `"business_card"`, `"directory"`, `"traze"` |
| Lifecycle state | Suffix mutation | `"directory"` → `"directory_contacted"` |

The `isContacted` flag in the dashboard is derived entirely from `source.includes("contacted")`. This means:
- The source field is mutable post-insert (owner can append `_contacted`).
- Acquisition channel can no longer be read cleanly once the lead is contacted.
- No contacted timestamp exists — only the presence of a suffix.

**Future schema direction (do not implement in this doc update):**

```
source:       business_card | qr | referral | directory | traze   (immutable after insert)
status:       new | contacted | archived                           (owner-mutable)
contacted_at: TIMESTAMPTZ NULL                                     (set on first contact)
```

Separating these concerns would make acquisition channel analytics reliable, provide an audit timestamp, and remove the string-mutation pattern from the write path. The source CHECK constraint added in migration `20260524020000` already enforces a known allowlist — a future migration can split the field cleanly.

This is tracked as DB-003 (source allowlist) and the P2 recommendation in the Carnage migration report: `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-24_carnage_vport-business-card-leads-security-hardening.md`.

---

## 6. Architecture — Public Card (Wanders feature)

```
/vport/:slug/card
  └── VportBusinessCardPublic.screen.jsx
        └── VportBusinessCardPublic.view.jsx
              ├── useVportBusinessCardExperience.hook.js  — loads card data
              └── useVportBusinessCardLeadForm.hook.js    — form state + submit

useVportBusinessCardExperience
  └── getVportBusinessCardPublicController({ slug })
        └── readVportBusinessCardPublicBySlugDAL({ slug })
              └── vportSchema.rpc('read_business_card_public', { p_slug })

useVportBusinessCardLeadForm
  └── submitVportBusinessCardLeadController({ slug, name, phone, email, message, ... })
        ├── validateVportBusinessCardLeadInput()  — model layer
        ├── createVportBusinessCardLeadDAL({ slug, ... })
        │     └── vportSchema.rpc('submit_business_card_lead', { ... })
        ├── fireLeadConfirmationEmail()  — fire-and-forget, sends email to lead submitter
        └── fireLeadOwnerNotification() — fire-and-forget, publishVcsmNotification to owner
```

---

## 7. Architecture — Owner Controls (Settings → VPORTs tab)

```
Settings → VPORTs tab
  └── VportsTab.view.jsx  →  useVportsController.js
        ├── setBusinessCardPublished(vportId, published)
        │     └── ctrlSetVportBusinessCardPublishState({ vportId, published })
        │           └── setVportBusinessCardPublishStateDAL(vportId, published)
        │                 └── vportSchema.rpc('set_business_card_publish_state', { p_vport_id, p_published })
        │
        └── listMyVportsDAL()  — now includes business_card_published in SELECT
```

**State tracked in hook:**

| State | Type | Purpose |
|---|---|---|
| `busyCardPublishId` | `string \| null` | ID of the VPORT currently publishing/unpublishing |
| `errCardPublish` | `string` | Error message from most recent failed operation |
| `errCardPublishId` | `string \| null` | ID of the VPORT whose operation last errored |

Local `items` is updated optimistically on success: `{ ...v, business_card_published: published }`.

---

## 8. Owner Controls UI

Location: Settings → VPORTs tab → "Business Cards" card (below "Your VPORTs").

Renders for every VPORT that has a `slug` — both active and deactivated (deactivated rows are shown in a disabled/locked state with a helper message).

### Per-VPORT row

| Element | Behaviour |
|---|---|
| Status badge | "Published" (green) or "Unpublished" (muted) |
| Card URL row | `https://vibezcitizens.com/vport/:slug/card` — visible when active, hidden when disabled |
| Publish card button | Immediate — fires RPC, no confirmation modal |
| Unpublish button | Opens amber confirmation modal — "The public link will stop working immediately" |
| Copy link button | Copies `https://vibezcitizens.com/vport/:slug/card`. Shows "Copied" + checkmark for 2s. Disabled when unpublished. |
| Preview button | Opens `/vport/:slug/card` in a new tab. Disabled when unpublished. |

### Disabled states

| Condition | Controls | Helper text |
|---|---|---|
| `is_deleted = true` | All disabled | "Restore this VPORT before publishing its business card." |
| `is_active = false` | All disabled | "This VPORT is inactive." |

---

## 9. Lead Capture Form

The public card form requires:
- **Name** (required)
- **Phone** (optional, but phone or email must be present)
- **Email** (optional, but phone or email must be present)
- **Message** (required)

Validation is split:
1. Client-side: `validateVportBusinessCardLeadInput()` in `vportBusinessCard.model.js` — returns `{ ok, fieldErrors, payload }`
2. DB-side: RPC enforces same rules as SECURITY DEFINER before insert

On success: form resets, success state shown. Error codes `CARD_UNAVAILABLE` and `INVALID_INPUT` are surfaced with user-friendly messages.

---

## 10. Files Map

| File | Role |
|---|---|
| `apps/VCSM/supabase/migrations/20260425013000_vport_business_card_and_leads.sql` | Schema: `business_card_published` column, `business_card_leads` table, 3 RPCs, RLS |
| `apps/VCSM/src/features/wanders/core/dal/read/vportBusinessCard.read.dal.js` | `readVportBusinessCardPublicBySlugDAL` — calls `read_business_card_public` RPC |
| `apps/VCSM/src/features/wanders/core/dal/write/vportBusinessCardLead.write.dal.js` | `createVportBusinessCardLeadDAL` — calls `submit_business_card_lead` RPC |
| `apps/VCSM/src/features/wanders/core/models/vportBusinessCard.model.js` | `mapVportBusinessCardPublicRow`, `validateVportBusinessCardLeadInput` |
| `apps/VCSM/src/features/wanders/core/controllers/vportBusinessCard.controller.js` | `getVportBusinessCardPublicController`, `submitVportBusinessCardLeadController` |
| `apps/VCSM/src/features/wanders/core/hooks/useVportBusinessCardExperience.hook.js` | Loads card data by slug |
| `apps/VCSM/src/features/wanders/core/hooks/useVportBusinessCardLeadForm.hook.js` | Lead form state + submission |
| `apps/VCSM/src/features/wanders/screens/VportBusinessCardPublic.screen.jsx` | Route screen |
| `apps/VCSM/src/features/wanders/screens/view/VportBusinessCardPublic.view.jsx` | Public card view |
| `apps/VCSM/src/app/routes/public/wanders.routes.jsx` | `/vport/:slug/card` route |
| `apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js` | `listMyVportsDAL` — includes `business_card_published` in select |
| `apps/VCSM/src/features/settings/vports/dal/vports.write.dal.js` | `setVportBusinessCardPublishStateDAL` |
| `apps/VCSM/src/features/settings/vports/controller/vportBusinessCard.controller.js` | `ctrlSetVportBusinessCardPublishState` |
| `apps/VCSM/src/features/settings/vports/hooks/useVportsController.js` | `setBusinessCardPublished` + busy/error states |
| `apps/VCSM/src/features/settings/vports/ui/VportsTab.view.jsx` | Business Cards section + unpublish modal |

---

## 11. Invariants

1. `vport.read_business_card_public` and `vport.submit_business_card_lead` both re-check `business_card_published + is_active + !is_deleted` independently — the DB is the authority, not the client.
2. `set_business_card_publish_state` requires `is_deleted = false` — a deleted VPORT cannot be (re)published without restore.
3. `business_card_leads` INSERT is RPC-only — `WITH CHECK (false)` policy + revoked INSERT grants block all direct inserts. Owner UPDATE is column-scoped to `source` only (authenticated role). Owner DELETE is permitted via RLS ownership gate. (Hardened 2026-05-24 — migrations `20260524010000` + `20260524020000`.)
4. The owner controls (Settings tab) reflect the server-authoritative state loaded from `listMyVportsDAL` at mount, then updated optimistically on successful RPC response.
5. Preview opens the public card in a new tab — only enabled when published, so the owner always sees the real public state.

---

## 12. Change Log

### 2026-05-24 — v4 (current)

**Documentation alignment — leads dashboard boundary, security hardening, domain debt**

No code changes. No schema changes. Documentation only.

**Changes:**
- §2 Out of scope: cross-link to `vcsm.vport.leads-dashboard.md` (new Logan doc for owner inbox)
- §4 RLS note: expanded from one line to explicit per-actor write model table — INSERT blocked, SELECT owner-gated, UPDATE column-scoped to `source`, DELETE owner-gated; hardening migrations `20260524010000` + `20260524020000` referenced
- §5b Coverage Gap: rewritten as "Notification Path Split — VCSM vs TRAZE" with explicit table showing which path triggers owner notification and which does not; fix path documented (`notify-lead-owner` Edge Function)
- §5d (NEW): "Relationship to VPORT Dashboard Leads" — ownership boundary table, boundary rules, link to leads dashboard doc
- §5e (NEW): "Known Domain Debt — source Column Overloading" — documents acquisition/lifecycle conflation, future schema direction (`source` / `status` / `contacted_at`), Carnage report link
- §11 Invariant 3: expanded to reflect post-hardening grant model (column-scoped UPDATE, blocked INSERT)

---

### 2026-04-25 — v1 (current)

**Task A — Public business card + lead capture (Wanders, built by prior agent)**
- Migration `20260425013000`: `business_card_published` column, `vport.business_card_leads` table, RLS, 3 RPCs
- Full Wanders DAL → model → controller → hook → screen stack for public card route
- Route `/vport/:slug/card` added to `wanders.routes.jsx`

**Task B — Owner publish controls (Settings → VPORTs tab)**
- `vports.write.dal.js` (NEW): `setVportBusinessCardPublishStateDAL`
- `settings/vports/controller/vportBusinessCard.controller.js` (NEW): `ctrlSetVportBusinessCardPublishState`
- `useVportsController.js`: `setBusinessCardPublished`, `busyCardPublishId`, `errCardPublish`, `errCardPublishId`
- `vports.read.dal.js`: `business_card_published` added to `listMyVportsDAL` select
- `VportsTab.view.jsx`: Business Cards section (status, URL, Publish/Unpublish/Copy/Preview) + unpublish confirmation modal

**Files Changed (Task B):**
- `apps/VCSM/src/features/settings/vports/dal/vports.read.dal.js`
- `apps/VCSM/src/features/settings/vports/dal/vports.write.dal.js` (NEW)
- `apps/VCSM/src/features/settings/vports/controller/vportBusinessCard.controller.js` (NEW)
- `apps/VCSM/src/features/settings/vports/hooks/useVportsController.js`
- `apps/VCSM/src/features/settings/vports/ui/VportsTab.view.jsx`

Generated by: Claude

---

### 2026-04-25 — v2 (current)

**Task C — Public card UI redesign (view layer only)**

All hook, controller, DAL, and model logic is untouched. Only `VportBusinessCardPublic.view.jsx` changed.

**Design changes:**
- Added lucide-react icons: `Phone`, `MessageSquare`, `ExternalLink`, `MapPin`, `Send`
- `cardStrip`: 68px purple gradient header band — gives instant "business card" read
- Avatar: 80×80px, `borderRadius: 16`, floats up 40px over the strip, purple border ring
- Identity (name + @handle) centered below avatar
- Contact details (phone, location) rendered as icon+text rows in a `detailsStrip` pill container — replaces the old label/value grid that read like a form
- CTA hierarchy: 3 ghost buttons (Call · Text · Profile) in a row, then full-width purple "Send a request" button below
- Lead form made visually secondary: smaller heading (16px), dimmed subtitle (44% opacity), same fields
- Submit label changed to "Submit request"
- `onError` fallback added to avatar `<img>` (→ `/avatar.jpg`)
- `composeAddressLabel` separator changed from ` • ` to ` · ` for consistency

**Files Changed (Task C):**
- `apps/VCSM/src/features/wanders/screens/view/VportBusinessCardPublic.view.jsx` (REDESIGNED)

---

### 2026-04-29 — v3 (current)

**Task D — Lead notification wiring + form UX + Profile button + WanderEx off**

**Lead notification:**
- `vportBusinessCard.controller.js`: added `fireLeadOwnerNotification()` — calls `publishVcsmNotification` after every successful lead insert
- Event kind: `lead_received`, recipient: VPORT owner actor, deep-link to `/actor/{actorId}/dashboard/leads`
- Both email and notification are fire-and-forget — neither blocks lead submission

**Form UX:**
- Lead form hidden by default — shown only when "Send a request" is clicked (`showForm` state)
- On success: 2s display of success message, then form resets and closes (`setShowForm(false)`)

**Profile button:**
- Profile button now links externally to `https://traze.vibezcitizens.com/us/pro/{slug}`
- Opens in a new tab (`target="_blank"`)
- Country slug hardcoded as `us` — business card model does not expose `countrySlug`
- Note (2026-05-09): TRAZE canonical provider URL changed to `/{country}/pro/{slug}`. The `/us/pro/{slug}` format used here IS the correct canonical for US providers. A future improvement would make the country dynamic for non-US VPORTs.

**WanderEx disabled:**
- All WanderEx routes (`/us`, `/us/:category`, `/p/:slug`, etc.) removed from VCSM router
- Profile button no longer uses internal React Router `<Link>` — uses `<a>` pointing to TRAZE
- WanderEx banner removed from ExploreScreen
- WanderEx Public Profile card removed from VportSettingsScreen
- VportPublicMenuBySlugScreen no longer redirects to `/p/{slug}` on not-found

**Card UI (premium redesign):**
- Band height raised to 88px, stronger gradient `#3b0764 → #5b21b6 → #7c5cff`
- Logo: 92×92px, `borderRadius: 18`, purple border ring
- Business name: `fontSize: 24, fontWeight: 900, letterSpacing: -0.5px`
- Contact rows: 30×30 icon pill containers with purple tint
- Ghost buttons (Call · Text · Profile): `borderRadius: 99` pill shape, 3-column grid
- Primary CTA: gradient `#5b21b6 → #7c5cff`, `fontSize: 15, fontWeight: 800`
- Optional `card.website` row with Globe icon
- Optional `card.category` badge pill

**Files Changed (Task D):**
- `apps/VCSM/src/features/wanders/core/controllers/vportBusinessCard.controller.js`
- `apps/VCSM/src/features/wanders/screens/view/VportBusinessCardPublic.view.jsx`
- `apps/VCSM/src/app/routes/public/wanderex.routes.jsx` (emptied)
- `apps/VCSM/src/app/routes/index.jsx` (WanderEx imports + spread removed)
- `apps/VCSM/src/features/explore/screens/ExploreScreen.jsx` (WanderEx banner removed)
- `apps/VCSM/src/features/dashboard/vport/screens/VportSettingsScreen.jsx` (WanderEx card removed)
- `apps/VCSM/src/features/public/vportMenu/screen/VportPublicMenuBySlugScreen.jsx` (redirect removed)
