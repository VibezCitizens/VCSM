# VENOM + ROBIN — RESTAURANT VPORT Profile Audit

**Date:** 2026-05-10
**Application Scope:** VCSM
**VPORT Type:** `restaurant`
**Tab Preset:** `VPORT_FOOD_TABS`
**Tab Order:** `menu → reviews → content → about → services → photos → vibes → subscribers`
**Supabase Schema:** `vport.*` (menu_categories, menu_items, profiles, profile_public_details, public_menu_read_model_v), `reviews.*`, `platform.media_assets`, `vc.actors`, `vc.posts`
**Review Dimensions:** Service, Food, Quality, Ambience, Value
**Public Menu View:** `vport.public_menu_read_model_v`

---

## VENOM TARGET

```
Feature / Route / Engine: VPORT Profile — Restaurant type
Application Scope: VCSM
Reason for review: Menu write-path ownership, public menu data exposure, media asset fire-and-forget, native parity
Primary trust boundary: Actor ownership (actor_id on menu row vs session actorId); public read via view vs authenticated write
```

---

## SECURITY SURFACE

```
Entry point: /profile/:slug (public), /vport/:slug/menu (public menu deep link), /vport/:slug/card (business card)
Auth source: Supabase session → useIdentity() → actorId + kind
Authorization layer: Controller (app-level ownership check on actor_id field) + RLS (DB-level)
Identity surface: actorId (correct), kind = 'vport'
Sensitive objects: vport.menu_categories, vport.menu_items, vport.profile_public_details (email_public, phone_public), platform.media_assets, vc.posts (menu system posts)
```

---

## TRUST BOUNDARY TRACE

```
Client input: slug → actorId (slug resolution from vport.profiles)
Validated at: saveVportActorMenuCategoryController and saveVportActorMenuItemController (app-level actor_id match)
Identity resolved at: Controller reads existing row → compares existing.actor_id to caller's actorId
Authorization enforced at: Controller (row ownership), RLS (DB-level write protection)
Data returned to: VportActorMenuPublicScreen (visitors), VportMenuManageView (owner) — public reads via vport.public_menu_read_model_v
```

---

## SECURITY RISK FINDINGS

---

### VENOM SECURITY FINDING — VR-01

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller.js:48-51` and `saveVportActorMenuCategory.controller.js:43-46`
- **Application Scope:** VCSM
- **Current behavior:** Ownership is verified by comparing `existing.actor_id` (from the DB row) to the caller-provided `actorId`. Example: `if (existing.actor_id !== actorId) throw new Error('Not allowed')`. This is an application-level ownership check using the `actor_id` stored on the menu row — not a check against `actor_owners`.
- **Risk:** The check `existing.actor_id !== actorId` is valid only if the caller passes the VPORT's `actorId` (not a user actor ID who owns the VPORT). If the session's identity is a user-actor who owns the restaurant VPORT-actor, the comparison fails silently and throws "Not allowed" — blocking valid owner writes. Conversely, if a caller constructs a payload with `actorId = targetVportActorId` without owning it, RLS is the only remaining protection.
- **Risk (secondary):** The ownership check pattern relies on the application correctly resolving the session's active actor as the VPORT actor — this is fragile if actor-switching is not enforced upstream.
- **Severity:** MEDIUM
- **Why it matters:** Menu write access for a restaurant is high-value (pricing, availability, items). An incorrect or bypassed ownership check would allow unauthorized menu mutations. The current design places too much trust in app-layer `actorId` equality without a formal `actor_owners` resolution.
- **Recommended mitigation:** Supplement app-level `actor_id` comparison with an `actor_owners` lookup confirming the session actor is an owner of the VPORT. Alternatively, push the ownership check into an RLS policy that enforces the same constraint at the DB level.
- **Rationale:** Owner verification must go through `actor_owners`, not row-level field equality.
- **Follow-up command:** DB (audit `vport.menu_categories` and `vport.menu_items` RLS policies)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING — VR-02

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller.js:114-138`
- **Application Scope:** VCSM
- **Current behavior:** `recordMenuItemMedia` is executed as a fire-and-forget IIFE (immediately invoked async function). Failures are caught and logged only in `DEV` mode: `if (import.meta.env?.DEV) console.warn(...)`. In production, media asset recording failures are silently swallowed.
- **Risk:** A menu item image can be uploaded to cloud storage (and served publicly via URL) while the corresponding `platform.media_assets` record is never created. This results in orphaned media: the file exists and is publicly accessible at its URL, but is not tracked in the platform's asset registry. There is no audit trail for who uploaded it, no ownership record, and no way to clean it up via the normal media management flows.
- **Severity:** MEDIUM
- **Why it matters:** Orphaned media is an operational security risk. Untracked media files on a public CDN have no expiry, no ownership attribution, and no cleanup path. For a restaurant with frequent menu updates, this accumulates over time. Additionally, suppressing errors in production means this failure goes undetected.
- **Recommended mitigation:** (1) Surface media asset recording failures to the caller as a non-fatal warning in the UI. (2) Add a server-side cleanup job for orphaned media with no matching `platform.media_assets` record. (3) Do not suppress errors silently in production — log to an observability surface.
- **Rationale:** Untracked assets on public storage with no ownership record violate asset security principles.
- **Follow-up command:** BUGSBUNNY (investigate orphaned media accumulation)
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Security Operations, Software Development Security

---

### VENOM SECURITY FINDING — VR-03

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller.js:79`
- **Application Scope:** VCSM
- **Current behavior:** `currency_code: (currencyCode ?? existing.currency_code ?? "USD").toString()` — any string value is accepted as `currencyCode` with no validation against an allowed currency enum (ISO 4217 or platform-defined set).
- **Risk:** A restaurant owner can store arbitrary strings as `currency_code` for menu item prices (e.g., an empty string, a script tag, a non-existent currency code). While XSS via stored currency code is only a risk if the field is rendered as raw HTML (which depends on component implementation), the data quality risk is real and could break downstream price formatting.
- **Severity:** LOW
- **Why it matters:** Currency code is displayed in the public menu. An invalid or injection-laden value could cause display errors or, if rendered unsafely, a stored XSS vector. For a restaurant, this field appears on the public-facing menu visible to all visitors.
- **Recommended mitigation:** Validate `currencyCode` against an allowed list (e.g., `['USD', 'EUR', 'MXN', ...]`) before storing. Reject unknown codes at the controller level.
- **Rationale:** All client-supplied enumerable fields must be validated before storage.
- **Follow-up command:** Wolverine
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Asset Security

---

### VENOM SECURITY FINDING — VR-04

- **Location:** `apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js:20-21`
- **Application Scope:** VCSM
- **Current behavior:** `email_public` and `phone_public` are returned as raw strings from `vport.profile_public_details` with no format validation at the DAL or model level.
- **Risk:** If a restaurant owner stores a malformed email (e.g., a mailto: link with tracking parameters, or a script-embedded string) and the consuming component renders it as a clickable link without sanitization, it becomes a stored XSS or phishing vector visible to all profile visitors.
- **Severity:** MEDIUM
- **Why it matters:** `email_public` is displayed on the restaurant's public `about` tab. Visitors may click the displayed email to contact the restaurant. A malformed or malicious value could redirect users or inject content. Restaurants are a high-trust, high-traffic VPORT type with public visibility.
- **Recommended mitigation:** (1) Validate email format at the profile update controller before storage. (2) Ensure all rendered email/phone values pass through a sanitization layer before being rendered as anchor tags.
- **Rationale:** User-facing contact fields on public profiles must be sanitized before display.
- **Follow-up command:** Wolverine
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Communication and Network Security

---

### VENOM SECURITY FINDING — VR-05

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js` (by pattern, from `publishBarbershopPortfolioUpdateAsPost` reference)
- **Application Scope:** VCSM
- **Current behavior:** Menu update system posts follow the same controller pattern as barbershop publish controllers — `actorId` is accepted as a parameter without `actor_owners` verification.
- **Risk:** An authenticated actor who knows a restaurant's `actorId` can trigger a "menu updated" system post on the public feed under the restaurant's identity.
- **Severity:** HIGH
- **Why it matters:** Same risk as VB-01 in the barbershop audit — unauthorized system posts under a restaurant's identity contaminate the feed and damage brand trust. For a restaurant, false "menu updated" posts could mislead customers.
- **Recommended mitigation:** Add `actor_owners` verification to all publish-as-post controllers before `createSystemPost` is called.
- **Rationale:** System posts published as a VPORT actor must verify the caller is an owner of that actor.
- **Follow-up command:** DB (verify `vc.posts` RLS for `post_type = 'menu_update'`)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Software Development Security

---

### VENOM SECURITY FINDING — VR-06

- **Location:** `apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js:9`
- **Application Scope:** VCSM
- **Current behavior:** `vport_id: newData.id` and `is_deleted` exposed in public profile response — shared across all VPORT types.
- **Risk:** Same as VB-02 and VB-03 in barbershop audit.
- **Severity:** MEDIUM / LOW respectively
- **Why it matters:** Same rationale applies to all types. Restaurant context: `vport_id` exposure is particularly sensitive because the public menu deep-link (`/vport/:slug/menu`) already provides public access without the internal ID being needed.
- **Recommended mitigation:** Remove `vport_id` from response; add `.eq('is_deleted', false)` filter.
- **Rationale:** Architecture contract §1.3, data minimization.
- **Follow-up command:** review-contract
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Identity and Access Management

---

## MITIGATION PLAN

| Risk | Layer to Fix | Priority |
|---|---|---|
| VR-01: Menu write ownership via row actor_id not actor_owners | Controller + DB | MEDIUM |
| VR-02: Fire-and-forget media recording silences production errors | Controller | MEDIUM |
| VR-03: currencyCode not validated against enum | Controller | LOW |
| VR-04: email_public / phone_public unsanitized before render | Controller (write-time validation) + Component (render-time) | MEDIUM |
| VR-05: publishMenuUpdateAsPost missing actor_owners check | Controller | HIGH |
| VR-06: vport_id / is_deleted in public response | DAL | MEDIUM / LOW |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 0 | No policy gaps in scope |
| Asset Security | 3 | VR-02 (orphaned media), VR-04 (public contact fields), VR-06 |
| Security Architecture and Engineering | 0 | Public menu view architecture is sound (uses dedicated public view) |
| Communication and Network Security | 1 | VR-04 (email/phone phishing surface) |
| Identity and Access Management | 2 | VR-01, VR-05 (ownership not via actor_owners) |
| Security Assessment and Testing | 0 | Out of scope for this type review |
| Security Operations | 1 | VR-02 (silent production failure) |
| Software Development Security | 3 | VR-02, VR-03, VR-04 |

---

## ROBIN — NATIVE TRANSFER ANALYSIS

### Module Reference
`native-transfer/modules/public-vport-profile.md` | Status: **Partial**
`native-transfer/modules/public-menu.md` | Status: **Partial** (migrated to `vport.public_menu_read_model_v` — RESOLVED)

### PWA Source Files (Restaurant-specific)
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportMenuView.jsx` — profile menu tab (within profile)
- `apps/VCSM/src/features/public/vportMenu/` — standalone public menu route (`/vport/:slug/menu`)
- `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuItem.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/saveVportActorMenuCategory.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/menu/publishMenuUpdateAsPost.controller.js`
- `apps/VCSM/src/features/public/vportMenu/dal/` (public menu read — uses `vport.public_menu_read_model_v`)

### Native Files (Restaurant-relevant)
- `VCSMNativeApp/Features/PublicMenu/Screens/VPortPublicMenuScreen.swift`
- `VCSMNativeApp/Features/PublicMenu/Screens/VPortPublicMenuViewScreen.swift`
- `VCSMNativeApp/Features/PublicMenu/Screens/VPortPublicMenuQRScreen.swift`
- `VCSMNativeApp/Features/PublicMenu/Screens/VPortPublicMenuQRViewScreen.swift`
- `VCSMNativeApp/Features/PublicMenu/DAL/PublicMenuReads.dal.swift` ← migrated to `vport.public_menu_read_model_v`
- `VCSMNativeApp/Features/Profile/DAL/ProfileMenuReads.dal.swift`
- `VCSMNativeApp/Features/Profile/DAL/ProfileMenuWrites.dal.swift`
- `VCSMNativeApp/Features/Profile/Screens/VPortMenuEditorScreen.swift` (owner menu edit)

### Tab Set — Restaurant Native Parity

| Tab | PWA | Native | Status |
|---|---|---|---|
| menu | ✓ (first tab, VPORT_FOOD_TABS) | ✓ (VPortPublicMenuScreen) | **Verify tab-first position** |
| reviews | ✓ | ✓ | Parity |
| content | ✓ | Not confirmed | **Verify P2** |
| about | ✓ | ✓ | Parity |
| services | ✓ | ✓ | Parity |
| photos | ✓ | ✓ | Parity |
| vibes | ✓ | ✓ | Parity |
| subscribers | ✓ | ✓ | Parity |

### Native Gaps — Restaurant

1. **P1 — Menu tab as first tab in VPORT_FOOD_TABS.** Native must confirm the menu tab renders first (not services or about) for restaurant type. The tab resolver uses `VPORT_FOOD_TABS` which places `menu` first. Verify native `ProfileTabBar.swift` resolves `restaurant` → VPORT_FOOD_TABS → menu first.

2. **P1 — Owner menu write parity.** `VPortMenuEditorScreen.swift` exists for owner menu management. Verify it covers: create category, create item, edit item (including price_cents and currency_code), delete item, delete category, reorder. The `ProfileMenuWrites.dal.swift` DAL must use the same schema paths as the PWA (`vport.menu_categories`, `vport.menu_items`).

3. **P1 — Public menu schema alignment.** `PublicMenuReads.dal.swift` was migrated to `vport.public_menu_read_model_v` (resolved per ROADTRIP_INDEX). Verify no native code still references `vc_public` for menu reads. Zero `vc_public` references confirmed per 2026-05-04 resolution.

4. **P1 — Media recording not present in native menu write.** `ProfileMenuWrites.dal.swift` write path must record `platform.media_assets` when a menu item image is uploaded. The PWA's fire-and-forget pattern (VR-02) is a risk there — native should implement this as a synchronous step, not fire-and-forget, to avoid orphaned media accumulation in the native upload path.

5. **P2 — QR code menu route.** `VPortPublicMenuQRScreen.swift` and `VPortPublicMenuQRViewScreen.swift` exist and are mapped. Verify QR scan correctly resolves to the menu view using slug (not raw actorId in the URL — per `no raw IDs in public URLs` memory rule).

6. **P2 — Content tab unverified.** Present in `VPORT_FOOD_TABS` but native content page rendering not confirmed.

7. **P2 — Food review sub-tab.** In the PWA, the menu tab includes a "Leave food review" link that routes to the reviews tab with `?subtab=food`. Native must support this deep link routing within the review tab if implemented.

### RLS/Schema Watch — Restaurant

- `vport.public_menu_read_model_v`: public read — confirmed in use; verify RLS allows anon reads
- `vport.menu_categories` / `vport.menu_items`: writes must be scoped to profile owner via RLS (`actor_id` column + RLS policy)
- `platform.media_assets`: menu item images — verify `owner_actor_id` is correctly set on native uploads

### Priority Classification

| Gap | Priority | Blocking? |
|---|---|---|
| Menu tab first position | P1 | Yes — wrong tab order is a UX correctness issue |
| Owner menu write parity | P1 | Yes — owners can't manage menu natively without this |
| Public menu schema alignment | P1 | Resolved — verify |
| Media recording in native write | P1 | No (launch-safe), but creates orphaned media |
| QR route slug resolution | P2 | No |
| Content tab | P2 | No |
| Food review subtab | P2 | No |

---

*VENOM is read-only. No code was modified. All findings are recommendations only.*
*Robin analysis is planning-only. No native code was changed.*
