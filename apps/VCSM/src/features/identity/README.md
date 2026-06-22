# features/identity

**Identity = who is acting now** (active actor, switching, resolution, provisioning).

Full boundary contract:
`ZZnotforproduction/APPS/VCSM/features/identity/IDENTITY_BOUNDARY_CONTRACT.md`

## Rules (summary)
- Enter through `adapters/identity.adapter.js` — never import `controllers/`,
  `dal/`, or `model/` directly.
- **No new production imports from `state/identity`.** It is the temporary live
  runtime; use the adapter instead.
- Authorization (`vc.actor_owners`) belongs in `features/authorization`, not here.
- Hydration mappers (`mapProfileActor`/`mapVportActor`) belong in
  `features/hydration`, not here.

## Status
Façade over the live runtime in `state/identity` (migration in progress).
`state/identity` still owns the IdentityProvider, switching, self-heal, storage,
and query bridge — these move here in IDENTITY-BOUNDARY-006.
