# Runtime Feature Index: invite

## Metadata

| Field | Value |
|---|---|
| Feature | invite |
| CURRENT Folder | CURRENT/features/invite |
| Source Folder | apps/VCSM/src/features/invite |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |
| ARCHITECT Run | 2026-06-02 (ARCHITECT-INVITE-0001) — first full audit of standalone module |

## Source Inventory

| Layer | Count | Key Files |
|---:|---:|---|
| Controllers | 1 | `controller/invite.controller.js` |
| DALs | 1 | `dal/invite.dal.js` |
| Hooks | 1 | `hooks/useInvite.js` |
| Models | 0 | NONE — no model/transformer layer |
| Screens | 3 | `screens/InviteScreen.jsx`, `screens/InviteView.jsx`, `screens/InviteView.styles.js` |
| Components | 0 | NONE — all UI is inline in screens |
| Routes | 1 | `/invite` — ProtectedRoute (auth required) |
| Tests | 0 | NONE — zero test coverage confirmed |

**Scope note:** This index covers only `apps/VCSM/src/features/invite/`. Related invite surfaces (join/acceptance at `features/join/`, dashboard team invite at `features/dashboard/vport/`, Edge Function `send-citizen-invite`) are indexed separately in their respective modules.

## Route / Screen Map

| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| `/invite` | `apps/VCSM/src/features/invite/screens/InviteScreen.jsx` | AUTH | Registered in `app.routes.jsx` inside ProtectedRoute. Lazy-loaded via `lazyApp.jsx`. |
| `InviteView` | `apps/VCSM/src/features/invite/screens/InviteView.jsx` | AUTH (via parent) | View component rendered by InviteScreen. Contains full form + success state. |

## Mutation Surface Map

| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| `ctrlSendCitizenInvite` | `controller/invite.controller.js` | Edge Function invoke (POST) | PARTIAL — ProtectedRoute guards route; no controller-layer ownership assertion on inviterActorId | MEDIUM |
| `sendCitizenInviteDAL` | `dal/invite.dal.js` | `supabase.functions.invoke('send-citizen-invite')` → writes `vc.vibe_invites` server-side | NO — DAL passes inviterActorId without ownership check; Edge Function is sole enforcement point | MEDIUM-HIGH |

## Security-Sensitive Surface Map

| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| `sendCitizenInviteDAL` | `dal/invite.dal.js` | EDGE_FUNCTION — writes invite record, triggers email | BLOCK-INVITE-004: wildcard CORS on Edge Function; BLOCK-INVITE-003: O(n) listUsers() email enumeration oracle (DB-BLOCKED) |
| `inviterActorId` passthrough | `hooks/useInvite.js` → `controller/invite.controller.js` → `dal/invite.dal.js` | IDENTITY — actor impersonation risk if route guard bypassed | No controller-layer ownership assertion; client-supplied actorId passes to Edge Function unverified |
| `rawDebugError` in hook + view | `hooks/useInvite.js`, `screens/InviteView.jsx` | DEV PROBE — raw Edge Function response exposed in DEV | Guarded by `import.meta.env.DEV`; cleanup pending per inline comments |

## Architecture State

| Field | Value |
|---|---|
| Architecture State | EVOLVING |
| Module Status | MOSTLY COMPLETE |
| THOR Status | BLOCKED |
| Security Audit | PARTIAL — standalone module first audited by ARCHITECT 2026-06-02; VENOM/ELEKTRA not yet run on standalone module |
| Test Coverage | 0% |

## Open Blockers (Carried From Prior Audits)

| Blocker | Severity | Status |
|---|---|---|
| BLOCK-INVITE-001 — createBarberVportAndAccept missing ownership assertion (features/join/) | HIGH — THOR BLOCKER | OPEN |
| BLOCK-INVITE-002 — Standalone features/invite/ module zero security audit | THOR BLOCKER | PARTIAL — ARCHITECT audit complete; VENOM/ELEKTRA pending |
| BLOCK-INVITE-003 — O(n) listUsers() email enumeration oracle in Edge Function | HIGH — DB-BLOCKED | OPEN |
| BLOCK-INVITE-004 — Wildcard CORS on send-citizen-invite Edge Function | HIGH | OPEN |
| BLOCK-INVITE-005 — findEligibleBarberActorIdsDAL uses banned owner_user_id (features/join/) | ARCH VIOLATION | OPEN |

## Recommended Next Command

VENOM — scoped to `apps/VCSM/src/features/invite/` standalone module.
Follow with ELEKTRA for precision source-to-sink trace on `inviterActorId` passthrough.
SPIDER-MAN for zero-coverage baseline after security findings resolved.
