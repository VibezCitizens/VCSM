# Runtime Feature Index: void

## Metadata
| Field | Value |
|---|---|
| Feature | void |
| CURRENT Folder | CURRENT/features/void |
| Source Folder | apps/VCSM/src/features/void |
| Generated | 2026-06-02 |
| Scope | VCSM |
| Evidence Mode | Source scan + CURRENT evidence |

## Source Inventory
| Layer | Count | Key Files |
|---:|---:|---|
| Controllers | 0 | usecases/index.js (zero bytes) |
| DALs | 0 | dal/index.js (zero bytes) |
| Hooks | 0 | hooks/index.js (zero bytes) |
| Models | 0 | model/index.js (zero bytes) |
| Screens | 1 | VoidScreen.jsx (placeholder) |
| Components | 0 | ui/index.js (zero bytes) |
| Routes | 1 | /void (protected, app.routes.jsx:161) |
| Tests | 0 | None found |

> All subdirectory index files (adapters, api, lib, screens, ui, hooks, dal, model, usecases)
> are zero bytes. void.js at feature root is a commented stub (`export {}`).

## Route / Screen Map
| Route / Screen | Source Path | Public/Auth/Owner | Notes |
|---|---|---|---|
| /void | apps/VCSM/src/features/void/VoidScreen.jsx | Auth | Protected route — placeholder screen only |

## Mutation Surface Map
| Surface | Source Path | Write Type | Ownership Gate Known | Risk |
|---|---|---|---|---|
| — | — | None | N/A | No mutations implemented |

No write surfaces exist. The feature is a scaffold with no business logic.

## Security-Sensitive Surface Map
| Surface | Source Path | Sensitivity | Evidence |
|---|---|---|---|
| /void route (future) | apps/VCSM/src/app/routes/protected/app.routes.jsx:161 | HIGH (planned 18+ realm) | Route live but no age gate or realm-ID isolation implemented |
| Void actor kind (future) | apps/VCSM/src/features/chat/setup.js (consumer, not void feature) | HIGH | is_void flag returned for chat engine — enforcement not inside features/void |

## Notes
- Feature is PLANNED / pre-implementation. Architecture is scaffold-only.
- Key invariant (platform memory): VPORT system posts are void:false by construction;
  must always use resolvePublicRealmIdDAL(), never viewer session realmId.
- Related enforcement in other features: settings/vports/dal/vports.read.dal.js filters
  is_void:false; chat/setup.js resolves is_void for the chat engine.
- ARCHITECT-VOID-0001 — first ARCHITECT pass completed 2026-06-02.
- Recommended first command: VENOM (security posture fully unknown for 18+ realm).
