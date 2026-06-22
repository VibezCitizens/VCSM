# WOLVERINE Output: TICKET-PUBLIC-VENOM-001-PATCH
# Date: 2026-06-02
# Command: WOLVERINE (Security Patch)
# Feature: public
# Status: COMPLETE

---

## Files Changed

| File | Change | Finding Resolved |
|---|---|---|
| `apps/VCSM/src/features/public/vportBusinessCard/model/vportBusinessCard.model.js` | Removed `profileId: raw.profile_id ?? null` from `mapVportBusinessCardPublicRow` return object. profileId is now stripped entirely from the public business card API response. | PUBLIC-001 |
| `apps/VCSM/src/features/public/vportBusinessCard/controller/vportBusinessCard.controller.js` | Changed `getVportBusinessCardSectionsController` signature from `{ profileId }` to `{ slug }`. Controller now derives profileId internally by calling `readVportBusinessCardPublicBySlugDAL({ slug })` and extracting `row.profile_id`. profileId is never accepted from or returned to the caller. | PUBLIC-002 |
| `apps/VCSM/src/features/public/vportBusinessCard/hooks/useVportBusinessCardSections.js` | Changed hook signature from `{ profileId, enabled }` to `{ slug, enabled }`. Calls controller with `{ slug }` instead of `{ profileId }`. Dependency array updated from `[profileId, enabled]` to `[slug, enabled]`. | PUBLIC-002 |
| `apps/VCSM/src/features/public/vportBusinessCard/view/VportBusinessCardPublic.view.jsx` | Changed `useVportBusinessCardSections({ profileId: card?.profileId ?? null, enabled: anySectionEnabled })` to `useVportBusinessCardSections({ slug, enabled: anySectionEnabled })`. `slug` is the view's own prop — no new import needed. | PUBLIC-002 |
| `apps/VCSM/src/features/public/screens/VportMenuRedirect.jsx` | Changed redirect logic. Previously navigated to `/vport/${actorId}/menu`. Now calls `getVportPublicDetailsController({ actorId })` asynchronously, extracts `result.details.username` (the resolved slug), and navigates to `/profile/${slug}/menu`. Falls back to `/actor/${actorId}/menu` on resolution failure. Cleanup cancellation pattern added. | PUBLIC-005 |
| `zNOTFORPRODUCTION/CURRENT/features/public/SECURITY.md` | Added VENOM pass 2026-06-02 findings. Updated command coverage to COMPLETE. Marked ELEK-007/008 RESOLVED per source inspection. Added PUBLIC-001/002 RESOLVED. Added PUBLIC-003 through PUBLIC-011 as open findings. | Documentation |
| `zNOTFORPRODUCTION/CURRENT/features/public/CURRENT_STATUS.md` | Updated status, resolved findings, open findings, recommended next command, last command runs table, release gate state, DR. STRANGE summary. | Documentation |
| `zNOTFORPRODUCTION/CURRENT/features/public/HISTORY_INDEX.md` | Created. Full audit history index with artifact links and open audit gaps. | Documentation |

---

## Behavior Changed

### PUBLIC-001 — profileId stripped from public business card API
- **Before:** `mapVportBusinessCardPublicRow` returned `{ profileId: raw.profile_id, actorId, slug, businessName, ... }`. Any visitor loading `/card/:slug` received the internal profile_id UUID in the JavaScript API response.
- **After:** Return object no longer contains `profileId`. `actorId` remains as the canonical identity reference.
- **Preserved:** All display fields (businessName, avatarUrl, logoUrl, address, phone, email, hours, etc.) unchanged.

### PUBLIC-002 — Business card sections controller no longer accepts caller-supplied profileId
- **Before:** `getVportBusinessCardSectionsController({ profileId })` accepted profileId from the hook, which received it from the card model (PUBLIC-001 source). Any caller with a known profileId could call the controller directly.
- **After:** `getVportBusinessCardSectionsController({ slug })` accepts slug only. Internally resolves profileId by re-fetching the card raw row (`readVportBusinessCardPublicBySlugDAL`). One additional DB call per sections fetch — acceptable trade-off for eliminating the IDOR surface.
- **Preserved:** Sections data rendered in the view (services, portfolio, menu, fuel_prices, amenities, rates) unchanged. Hook API surface changed from `{ profileId, enabled }` to `{ slug, enabled }`.

### PUBLIC-005 — /m/:actorId redirect now resolves to canonical slug URL
- **Before:** `VportMenuRedirect` navigated to `/vport/${actorId}/menu` with `replace: true`.
- **After:** `VportMenuRedirect` calls `getVportPublicDetailsController({ actorId })`, extracts `details.username` (the resolved slug), navigates to `/profile/${slug}/menu`. On resolution failure, falls back to `/actor/${actorId}/menu` to maintain backward compatibility for existing QR codes.
- **Preserved:** The `/m/:actorId` route still exists in the route registry (QR code backward compat). The `replace: true` behavior is preserved. The rendered URL after redirect is now slug-based when resolution succeeds.

---

## Grep Verification

| Check | Command | Result |
|---|---|---|
| profileId removed from model | `grep -n "profileId\|profile_id" vportBusinessCard.model.js` | No matches — profileId fully removed from public model |
| profile_id not returned to public clients | `grep -rn "profile_id" features/public/` | Only in controller (internal use) and DAL (parameter) and comments — never in public response |
| Sections controller accepts slug | `grep -n "getVportBusinessCardSectionsController" features/public/` | Controller: `{ slug } = {}`. Hook: calls with `{ slug }`. Both updated. |
| Old redirect destination removed | `grep -n "vport.*actorId.*menu\|/vport/\${actorId}/menu" VportMenuRedirect.jsx` | No matches — old redirect pattern removed |
| Single caller of useVportBusinessCardSections | `grep -rn "useVportBusinessCardSections" apps/VCSM/src/` | Definition + 1 import + 1 call in view — all using `{ slug }` |
| card.profileId not referenced anywhere | `grep -rn "card\.profileId\|card\?\.profileId" apps/VCSM/src/features/public/` | No matches |

---

## PUBLIC-003 NOT Implemented

PUBLIC-003 (VL-001–005 CARNAGE migration) is NOT implemented in this ticket.
Reason: Requires DB-level migration (GRANT EXECUTE TO PUBLIC revocation, INSERT policy hardening, actor_id NOT NULL constraint). This is outside the scope of a code patch and requires a dedicated CARNAGE sprint.
Status: OPEN — documented in SECURITY.md. Recommended next action: CARNAGE.

---

## Source Files NOT Touched

- No Wentrex files touched
- No Traffic files touched
- No engines files touched
- No other VCSM features touched
- No migrations modified
- No DB changes
- No route registrations changed (route `/m/:actorId` is preserved; its handler behavior was updated)

---

## Tests Run

Not run — no test files exist for this feature. SPIDER-MAN coverage is an open gap.
Grep-based static verification performed instead. See Grep Verification above.

---

## Build Result

Not run — UI app requires dev server. Static analysis confirms the call chain is complete:
- Model returns `actorId` (not `profileId`) ✓
- Controller accepts `slug`, returns sections data only ✓
- Hook passes `slug` to controller ✓
- View passes `slug` prop to hook ✓
- Redirect resolves slug before navigating ✓

---

## Remaining TODOs (Open)

| Finding | Status | Next Ticket |
|---|---|---|
| PUBLIC-003 — VL-001–005 CARNAGE migration | OPEN | CARNAGE sprint for business_card_leads security hardening |
| PUBLIC-004 — Wildcard CORS on all 5 edge functions | OPEN | ELEKTRA |
| PUBLIC-005 — /actor/:actorId/menu legacy route with raw ID | PARTIAL — fallback still uses actorId route | Separate ticket to retire /actor/:actorId/menu |
| PUBLIC-006 — menu_category_id/menu_item_id in public response | OPEN | ELEKTRA — determine if ID exposure is acceptable |
| PUBLIC-007 — DAL DELETE RLS not verified | OPEN | CARNAGE — verify DELETE policies on menu_categories/menu_items |
| PUBLIC-008 — anon key auth on send-lead-confirmation | OPEN | ELEKTRA |
| PUBLIC-009 — no rate limiting on lead submission | OPEN | Separate sprint |
| PUBLIC-010 — lat/lng in public details response | OPEN | ELEKTRA |
| PUBLIC-011 — caller-supplied source/vportName/userAgent | OPEN | ELEKTRA |
| PUBLIC-W002 — 5 DB views with no tracked migrations | OPEN | CARNAGE |
