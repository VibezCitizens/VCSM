# Identity ID Audit — profileId / vportId / user_id Leak Analysis

**Date:** 2026-06-06
**Scope:** `/apps/VCSM/src`
**Auditor:** Full-scale search audit (manual classification)
**Ticket basis:** Audit-only. No code modified.

---

## 1. Executive Summary

**Verdict: PARTIAL_DRIFT**

`profileId` and `vportId` are **not leaking through the actor identity surface** (`useIdentity`, public provider API). The canonical `actorId` / `kind` contract at the provider layer is intact.

However, both IDs cross layer boundaries in multiple places:
- `vportId` appears in view model output, UI component props, and hook return values
- `profileId` flows from UI hooks into controller/engine APIs without being hidden
- `ownerUserId` surfaces in search model output
- `user_id` is dual-exported in the canonical post model
- Route-builder functions accept `vportId` parameters where value semantics are ambiguous across call sites

None of the findings constitute a proven ownership bypass (all ownership checks use `actor_owners`). The risk is **naming confusion leading to future identity type errors** and **internal IDs surfacing in model data consumed by UI**.

---

## 2. Hit Count Summary

| Term | Count | Highest Risk Layer |
|---|---:|---|
| profileId | 408 | hook, view-model |
| profile_id | 248 | DAL (normal), model leaks |
| vportId | 259 | hook, UI component, view-model |
| vport_id | 85 | DAL (normal), model leaks |
| owner_user_id | 48 | DAL (normal), search model |
| user_id | 86 | DAL (normal), canonical post model |

**Total hits:** 1,134

---

## 3. Layer Summary

| Layer | Hits (approx) | Risk |
|---|---:|---|
| DAL | ~620 | LOW — expected DB column mapping |
| model | ~85 | MEDIUM — some models surface internal IDs |
| controller | ~130 | LOW-MEDIUM — mostly internal but some boundary issues |
| hook | ~95 | MEDIUM — profileId/vportId cross into hook APIs |
| UI/component | ~18 | HIGH — vportId in JSX props and view state |
| adapter | 0 | NONE |
| route/path | ~8 | MEDIUM — route builder accepts vportId |
| state/provider | ~4 | LOW — only in DAL supporting state |
| service | 0 | NONE |
| test/diagnostics | ~174 | NONE — fixtures and debug code |

---

## 4. High-Risk Findings

---

### FINDING-001

```
Title:       vportId exposed in public view-model output
Classification: PUBLIC_IDENTITY_LEAK
Severity:    HIGH
File:        features/settings/profile/model/vportPublicDetails.model.js
Line:        33
Evidence:    vportId: row.vport_id ?? null,
             (returned as top-level key in mapVportPublicDetailsToView)
Why:         This model maps to a UI view surface (dashboard settings, public details).
             Any consumer of this model receives the raw internal vport profile UUID
             under the key "vportId", which the Architecture Contract prohibits from
             crossing into public or hook-layer surfaces.
Fix:         Strip vport_id from the view model output. Consumers needing the vport
             profile ID must resolve it internally through the controller chain, not
             receive it from a view model.
```

---

### FINDING-002

```
Title:       ownerUserId surfaced in search model output
Classification: PUBLIC_IDENTITY_LEAK
Severity:    HIGH
File:        features/explore/model/search.model.js
Line:        47
Evidence:    ownerUserId: row.owner_user_id ?? null,
             (returned in mapVportSearchResult — public search surface)
Why:         mapVportSearchResult produces results consumed by public search UI.
             Exposing ownerUserId (a raw user-profile UUID) in search model output
             violates the identity contract. Ownership identity must never surface
             in public search data; actors are identified by actorId + slug only.
Fix:         Remove ownerUserId from mapVportSearchResult. The owner's actor is
             already accessible via actorId relationship if needed.
```

---

### FINDING-003

```
Title:       userId / user_id dual-exported in canonical post model
Classification: PUBLIC_IDENTITY_LEAK
Severity:    MEDIUM
File:        features/profiles/model/postCanonical.model.js
Lines:       83-84
Evidence:    userId: row?.user_id ?? row?.userId ?? null,
             user_id: row?.user_id ?? row?.userId ?? null,
Why:         The canonical post model is consumed by profile views. Exporting both
             "userId" and "user_id" means consumers can read a raw user-profile UUID
             from post data. Posts should be identified only by actorId / actor_id.
             The user_id is a legacy DB column that should not flow into view models.
Fix:         Remove both "userId" and "user_id" from buildCanonicalProfilePostModel
             return shape. Callers that need the author's identity should use actorId.
```

---

### FINDING-004

```
Title:       useProfileHeaderMessaging accepts prop named profileId but receives actorId
Classification: POSSIBLE_CONTRACT_DRIFT
Severity:    MEDIUM
Files:
  Hook:      features/profiles/hooks/header/useProfileHeaderMessaging.js:4
  Caller:    features/profiles/screens/views/ActorProfileHeader.jsx:37-39
Evidence:
  Hook:      export function useProfileHeaderMessaging({ profileId }) {
             await start({ id: profileId, kind: "user" });
  Caller:    const actorId = profile?.actorId ?? null
             useProfileHeaderMessaging({ profileId: actorId })
Why:         The hook's interface names the param "profileId" but every caller passes
             an actorId value. Internally the hook passes { id: profileId, kind: "user" }
             to the chat start function — if that function expects an actorId (which it
             does), the hook works today only because actorId is passed. Any future
             caller that reads the param name and passes a real profileId will break
             the chat start identity chain.
Fix:         Rename the hook param from "profileId" to "actorId" and update the caller.
             The prop at ActorProfileHeader.jsx:38 should become "actorId: actorId".
```

---

### FINDING-005

```
Title:       profileId extracted from profile.id in hook and passed to booking hook/controller
Classification: POSSIBLE_CONTRACT_DRIFT
Severity:    MEDIUM
Files:
  Extractor: features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js:45
  Receiver:  features/booking/hooks/useBookingContextResolver.js:5-6
Evidence:
  useVportBookingView:  const profileId = profile?.id ?? null;
                        bookingContext = useBookingContextResolver({ profileId, ... })
  useBookingContextResolver: resolveBookingContext({ profileId, ... })
Why:         profile.id is the raw vport profile UUID from the vport schema profiles table.
             It flows from the UI hook (useVportBookingView) into the resolver hook, then
             into the booking engine's resolveBookingContext controller. The hook layer
             is a semi-public surface — callers of useVportBookingView should not need
             to know that the booking engine operates on raw profile IDs.
             The booking engine controller correctly uses this internally, but the
             architecture contract says resolution of profileId should be hidden behind
             a controller, not exposed through the hook chain.
Fix:         Move the actorId → profileId resolution into the booking engine controller.
             useVportBookingView should pass only ownerActorId to the booking context
             resolver and let the engine resolve profileId internally. This matches the
             pattern in useQrLinks (which correctly hides the profileId in a ref).
```

---

### FINDING-006

```
Title:       vportId returned in useAccountController public API and used in AccountTab UI
Classification: UI_LAYER_VIOLATION
Severity:    MEDIUM
Files:
  Hook:      features/settings/account/hooks/useAccountController.js:152
  UI:        features/settings/account/ui/AccountTab.view.jsx:12, 70
Evidence:
  Hook:      return { ..., vportId, ... }
  UI:        const { vportId } = useAccountController()
             const activeVport = vports.find(v => v.id === vportId) ?? null
Why:         vportId (a raw vport profile UUID from the vport.profiles table) is returned
             in the hook's public API and destructured directly in a UI component.
             The UI then uses it for data filtering (v.id === vportId). This is a raw
             internal profile UUID used in UI-layer state matching.
Fix:         The UI should filter by actorId or slug, not by raw profile UUID.
             If vportId is needed for a controller call, it should be passed through
             a scoped controller function rather than held in UI state.
```

---

### FINDING-007

```
Title:       vportId prop in FlyerEditorPanel JSX component
Classification: UI_LAYER_VIOLATION
Severity:    MEDIUM
Files:
  Component: features/dashboard/flyerBuilder/components/FlyerEditorPanel.jsx:14, 21
  Hook:      features/dashboard/flyerBuilder/hooks/useFlyerEditor.js:4, 23
Evidence:
  FlyerEditorPanel: props: { vportId }
                    useFlyerEditor({ vportId, ... })
  useFlyerEditor:   saveFlyerPublicDetailsCtrl({ patch: draft, ownerActorId: vportId })
Why:         FlyerEditorPanel is a UI component that accepts vportId as a prop, then
             passes it to useFlyerEditor, which then uses it as ownerActorId in the
             controller call. The naming confusion here is bidirectional: the component
             accepts a field named "vportId" but the controller expects "ownerActorId",
             suggesting the actual value is an actorId. If that is so, the prop should
             be named "actorId" at the component boundary, not "vportId".
Fix:         Rename the FlyerEditorPanel prop from "vportId" to "actorId".
             Update useFlyerEditor to accept "actorId" instead of "vportId".
```

---

### FINDING-008

```
Title:       makeActorRoute in DAL builds /vport/{vportId} URL with potentially ambiguous vportId
Classification: ROUTE_PARAM_RISK
Severity:    MEDIUM
Files:
  DAL:        features/profiles/dal/post/fetchPostsForActor.dal.js:4-9, 57, 165
  Controller: features/profiles/controller/post/getActorPosts.controller.js:8-10, 43
  Controller: features/post/postcard/controller/getPostMentionMap.controller.js:6-11, 42
Evidence:
  function makeActorRoute({ kind, username, actorId, vportId }) {
    if (kind === "vport" && vportId) return `/vport/${vportId}`;
  }
  Call site A (DAL:57):     vportId: actorRow.id          ← actorId value (OK)
  Call site B (DAL:165):    vportId = id                  ← actorId value (OK)
  Call site C (ctrl:43):    vportId: kind==="vport" ? actorId : null  ← actorId (OK)
  Call site D (ctrl:42):    vportId = row?.vport_id ?? null ← raw DB vport_id (RISK)
Why:         Call sites A, B, C all pass actorId as vportId — the route /vport/{actorId}
             is acceptable if the route is designed around actorId.
             Call site D (getPostMentionMap.controller.js:42) reads row.vport_id from
             the hydration engine's return shape. In practice this field is null because
             get_actor_summaries RPC does not return vport_id, so the route falls through
             to the actorId branch. However, the code structurally reads vport_id and
             would use it in a URL if it were ever present — that would expose a raw
             internal DB UUID in a public navigation route.
             Additionally, the function parameter named "vportId" receives actorId values
             across 3 of 4 call sites, which is misleading.
Fix (immediate): In getPostMentionMap.controller.js, remove the row?.vport_id read and
             replace with explicit: vportId: kind === "vport" ? actorId : null
Fix (medium term): Rename the parameter from "vportId" to "routeActorId" across all
             makeActorRoute implementations so the semantics are unambiguous.
```

---

### FINDING-009

```
Title:       params.vportId from URL route param — internal ID in URL namespace
Classification: ROUTE_PARAM_RISK
Severity:    MEDIUM
File:        features/settings/profile/hooks/useProfileController.js:43, 53
Evidence:    const needsVportResolution = mode === 'vport' && !params.vportId && ...
             if (mode === 'vport') return params.vportId || resolvedVportId || null
Why:         The hook reads params.vportId from the router, implying a route like
             /settings/profile/:vportId. If that param contains a raw vport profile UUID
             (not a slug), it exposes an internal DB ID in the browser URL bar.
             The Architecture Contract requires human-readable slugs in all public URLs.
Fix:         Audit the route definition for /settings/profile/:vportId. If the param
             is a raw UUID, replace it with a slug-based param (:vportSlug) and resolve
             the profileId internally from the slug via the controller chain.
```

---

### FINDING-010

```
Title:       useVportLeadsCount passes cached profileId to controller alongside actorId
Classification: POSSIBLE_CONTRACT_DRIFT
Severity:    LOW
File:        features/shell/modules/bottom-bar/hooks/useVportLeadsCount.js:31
Evidence:    const n = await fastCountNewVportLeadsController(actorId, profileId);
Why:         The hook caches a resolved profileId in a ref and passes it as a second
             argument to the controller. While the profileId is not returned to callers,
             the controller interface accepts a raw profileId as a parameter alongside
             actorId. If the booking/leads controller is meant to be actor-first, it
             should resolve profileId internally rather than accepting it from the hook.
Fix:         LOW PRIORITY. Consider moving the actorId→profileId resolution into the
             controller and removing the profile ID from the hook's internal cache.
             The controller should accept only actorId.
```

---

## 5. Full Inventory Table (High / Medium Risk Only)

| Term | File | Line | Layer | Classification | Notes |
|---|---|---:|---|---|---|
| vportId | features/settings/profile/model/vportPublicDetails.model.js | 33 | model | PUBLIC_IDENTITY_LEAK | Exposed in view model key |
| ownerUserId | features/explore/model/search.model.js | 47 | model | PUBLIC_IDENTITY_LEAK | In public search result shape |
| userId / user_id | features/profiles/model/postCanonical.model.js | 83-84 | model | PUBLIC_IDENTITY_LEAK | Dual-exported in canonical post model |
| profileId | features/profiles/hooks/header/useProfileHeaderMessaging.js | 4 | hook | POSSIBLE_CONTRACT_DRIFT | Param misnamed — receives actorId |
| profileId | features/profiles/kinds/vport/screens/booking/hooks/useVportBookingView.js | 45, 62 | hook | POSSIBLE_CONTRACT_DRIFT | Flows from UI hook into booking engine |
| profileId | features/booking/hooks/useBookingContextResolver.js | 5-6, 23 | hook | POSSIBLE_CONTRACT_DRIFT | Hook API accepts raw profileId |
| vportId | features/settings/account/hooks/useAccountController.js | 152 | hook | UI_LAYER_VIOLATION | vportId in hook public return API |
| vportId | features/settings/account/ui/AccountTab.view.jsx | 12, 70 | UI | UI_LAYER_VIOLATION | vportId destructured in UI, used for filtering |
| vportId | features/dashboard/flyerBuilder/components/FlyerEditorPanel.jsx | 14, 21 | UI | UI_LAYER_VIOLATION | vportId as JSX prop |
| vportId | features/dashboard/flyerBuilder/hooks/useFlyerEditor.js | 4, 23 | hook | POSSIBLE_CONTRACT_DRIFT | vportId received but used as ownerActorId |
| vport_id (via row) | features/post/postcard/controller/getPostMentionMap.controller.js | 42, 55 | controller | ROUTE_PARAM_RISK | raw vport_id read for route building (null in practice) |
| vportId | features/profiles/controller/post/getActorPosts.controller.js | 8-10 | controller | POSSIBLE_CONTRACT_DRIFT | makeActorRoute param semantics ambiguous |
| vportId | features/profiles/dal/post/fetchPostsForActor.dal.js | 4-9, 57, 165 | DAL | POSSIBLE_CONTRACT_DRIFT | makeActorRoute in DAL; call sites pass actorId as vportId |
| params.vportId | features/settings/profile/hooks/useProfileController.js | 43, 53 | hook | ROUTE_PARAM_RISK | URL route param may be raw UUID |
| profileId | features/shell/modules/bottom-bar/hooks/useVportLeadsCount.js | 28-31 | hook | POSSIBLE_CONTRACT_DRIFT | profileId passed as second controller arg |
| vportId | features/vport/hooks/useRestoreVport.js | 6, 18, 22, 32 | hook | POSSIBLE_CONTRACT_DRIFT | vportId in hook return API |
| vportId | features/vport/screens/RestoreVportScreen.jsx | 9, 50 | UI | UI_LAYER_VIOLATION | vportId in UI screen state |
| vportId | features/settings/vports/hooks/useResolvedVportId.js | 17, 49 | hook | ALLOWED_CONTROLLER_INTERNAL | Intentional resolution hook; not surfaced further |
| vportId | features/settings/vports/hooks/useVportDirectoryVisibility.js | 20-69 | hook | ALLOWED_CONTROLLER_INTERNAL | Pre-resolved by parent, passed to controller |
| vportId | features/settings/vports/hooks/useVportBusinessCardSettings.js | 29-91 | hook | ALLOWED_CONTROLLER_INTERNAL | Pre-resolved by parent, passed to controller |
| profileId | features/booking/hooks/useQrLinks.js | 24-55 | hook | ALLOWED_CONTROLLER_INTERNAL | Hidden in ref, never surfaced to callers |
| profileId | features/settings/profile/model/profile.model.js | 73 | model | ALLOWED_MODEL_TRANSFORM | ownerUserId in private settings model; gated by auth |
| profileId | features/initiation/model/onboarding.model.js | 40-41 | model | ALLOWED_MODEL_TRANSFORM | Internal onboarding shape |
| profile_id / vport_id | All features/*/dal/*.js | various | DAL | ALLOWED_DAL_INTERNAL | DB column mapping |
| profileId / vportId | engines/booking/src/**/*.js | various | engine | ALLOWED_CONTROLLER_INTERNAL | Booking engine internals |
| profile_id / vport_id | dev/diagnostics/** | various | test/dev | ALLOWED_TEST_FIXTURE | Dev-only, never production |

---

## 6. Identity Contract Violations

The following fields appear **outside** the DAL/engine/model-transform layer in ways that violate the contract:

| Field | Location | Violation |
|---|---|---|
| vportId | vportPublicDetails.model.js:33 | View model exposes internal DB ID |
| ownerUserId | search.model.js:47 | Public search shape exposes owner user UUID |
| userId / user_id | postCanonical.model.js:83-84 | Canonical post model passes user UUID to UI |
| vportId | AccountTab.view.jsx:70 | UI component holds and uses raw vport UUID |
| vportId | FlyerEditorPanel.jsx:14 | JSX prop receives raw vport UUID |
| vportId | RestoreVportScreen.jsx:9,50 | UI screen holds raw vport UUID |
| profileId | useProfileHeaderMessaging.js:4 | Hook param named "profileId" receives actorId (inversion) |

`useIdentity()` and the AuthProvider do NOT expose profileId, vportId, or user_id. The provider-layer contract is intact.

---

## 7. Route Exposure Findings

| URL Pattern | Source | Risk |
|---|---|---|
| `/vport/${vportId}` built in `makeActorRoute` | fetchPostsForActor.dal.js:6, getActorPosts.controller.js:10 | MEDIUM — param named "vportId" receives actorId in 3/4 call sites (acceptable), raw vport_id in 1/4 (null in practice) |
| `/settings/profile/:vportId` (inferred from params.vportId) | useProfileController.js:43,53 | MEDIUM — route param name implies raw UUID; needs route definition audit |
| `/vport/${actorId}` | All makeActorRoute call sites except FINDING-008:D | ACCEPTABLE — actorId is canonical identity |

No evidence of raw `profile_id` or `vport_id` UUIDs confirmed in browser URL bar. The makeActorRoute risk is structural (code path exists) but not confirmed active.

---

## 8. Ownership Drift Findings

All ownership checks audited use `vc.actor_owners` correctly. No instance found where ownership is resolved via `profileId`, `vportId`, `owner_user_id`, or `user_id` alone as the ownership gate.

Relevant patterns confirmed clean:
- `assertActorOwnsVportActorController` — uses `actor_owners` table
- `assertSessionOwnsVportActorController` — uses `actor_owners` table  
- `readActorOwnerLinkByActorAndUserProfile.dal.js` — queries `actor_owners` filtered by `user_id` (the profile FK to auth.users) which is correct
- `vports.write.dal.js:44` — uses `owner_user_id = auth.uid()` as defense-in-depth alongside `actor_owners` (documented in comments as intentional)

No OWNERSHIP_BYPASS_RISK findings.

---

## 9. Recommended Follow-Up Tickets

### P1 — Identity Contract Violations

```
P1-ID-001: Strip vportId from mapVportPublicDetailsToView output
           File: features/settings/profile/model/vportPublicDetails.model.js:33
           Action: Remove vportId key from return shape. Audit all consumers.

P1-ID-002: Remove ownerUserId from mapVportSearchResult
           File: features/explore/model/search.model.js:47
           Action: Remove ownerUserId. Consumers must not receive owner UUID.

P1-ID-003: Remove userId / user_id from buildCanonicalProfilePostModel
           File: features/profiles/model/postCanonical.model.js:83-84
           Action: Remove both fields. Author identity is actorId only.

P1-ID-004: Fix useProfileHeaderMessaging param name (profileId → actorId)
           Files: useProfileHeaderMessaging.js:4, ActorProfileHeader.jsx:38
           Action: Rename param at both hook definition and call site.
```

### P2 — Architecture Cleanup

```
P2-ARCH-001: Hide profileId resolution inside booking context controller
             Files: useVportBookingView.js:45, useBookingContextResolver.js:5
             Action: resolveBookingContext should accept actorId, resolve profileId
             internally. Remove profileId from hook API surface.

P2-ARCH-002: Remove vportId from useAccountController return API
             Files: useAccountController.js:152, AccountTab.view.jsx:12,70
             Action: Return actorId or slug instead. UI filtering by raw DB UUID.

P2-ARCH-003: Remove vportId prop from FlyerEditorPanel / useFlyerEditor
             Files: FlyerEditorPanel.jsx:14, useFlyerEditor.js:4
             Action: Rename to actorId if that is the true semantic.

P2-ARCH-004: Fix makeActorRoute — remove raw vport_id read path
             File: getPostMentionMap.controller.js:42
             Action: Replace `row?.vport_id ?? null` with `kind === "vport" ? actorId : null`

P2-ARCH-005: Audit /settings/profile/:vportId route param
             File: useProfileController.js:43,53
             Action: Confirm whether params.vportId is a UUID or slug in the route
             definition. If UUID, replace with slug.

P2-ARCH-006: Remove vportId from useRestoreVport return API
             Files: useRestoreVport.js:6,32, RestoreVportScreen.jsx:9,50
             Action: Consider whether vportId is needed at screen level or can remain
             internal to the hook.
```

### P3 — Low Priority / Documentation

```
P3-DOC-001: Rename makeActorRoute param "vportId" to "routeActorId" across 3 DAL/ctrl files
            Files: fetchPostsForActor.dal.js, getActorPosts.controller.js,
                   getPostMentionMap.controller.js
            Action: Rename param to clarify that the value is actorId, not profile UUID.

P3-DOC-002: Clarify useVportLeadsCount profileId caching pattern
            File: useVportLeadsCount.js:28-31
            Action: Move resolution into controller or add comment clarifying the ref
            is an internal implementation detail not a public surface.
```

---

## 10. Final Verdict

**PARTIAL_DRIFT**

The actor identity surface (`useIdentity`, AuthProvider, adapters) is **clean** — no profileId or vportId leaks through the canonical identity provider.

Ownership checks use `actor_owners` exclusively — **no OWNERSHIP_BYPASS_RISK**.

The drift is in **model output** (3 models expose internal IDs in their public shape), **hook APIs** (vportId in return values), and **UI components** (vportId as JSX props and filtering state). This creates a class of bugs where future callers passing a real `profileId` where an `actorId` is expected (or vice versa) would silently produce wrong behavior.

The booking engine's `profileId`-based API is intentional and internal, but the hook boundary between the VCSM app and the engine should hide it (P2-ARCH-001).

Priority order: P1-ID-001 → P1-ID-003 → P1-ID-004 → P2-ARCH-004 → P2-ARCH-002 → P2-ARCH-001.
