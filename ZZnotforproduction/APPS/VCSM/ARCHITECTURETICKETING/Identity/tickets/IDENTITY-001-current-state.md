# [IDENTITY-001] Current State Capture

Status: Open
Priority: P3
Type: TASK
Weight: Light
Risk: ZERO

---

## Goal

Produce a frozen, verifiable snapshot of the `identity` feature as it exists today: file list,
export surface, layer assignment for each file, and what the feature actually does. This becomes
the immutable source of truth for all other IDENTITY-* tickets.

---

## Context

The identity feature is the platform's most-consumed primitive: 41 inbound consumers, 0
outbound, 0 violations per scanner. Before any planning or audit, this ticket establishes
exactly what exists in `apps/VCSM/src/features/identity/` so nothing can be assumed or
contradicted by later tickets.

Source: FEATURE_IMPORT_MAP.json (identity: 9 files), FEATURES_ARCHITECTURE_REVIEW.md.

---

## Source Evidence

- `FEATURE_IMPORT_MAP.json`: identity file_count = 9, inbound = 41, outbound = 0, violations = 0
- `FEATURES_ARCHITECTURE_REVIEW.md`: identity consumed 38x (now scanner confirms 41 via JSON)
- `actor-first-architecture-audit.md`: `toPublicIdentity()` surface defined; resolvers, adapters,
  controllers, DALs described

---

## Scope

Read the following files and record their actual exported surface:
```
apps/VCSM/src/features/identity/setup.js
apps/VCSM/src/features/identity/controller/refreshActorDirectory.controller.js
apps/VCSM/src/features/identity/controller/ensureVcsmPlatformBootstrap.controller.js
apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js
apps/VCSM/src/features/identity/adapters/identity.adapter.js
apps/VCSM/src/features/identity/adapters/identityOps.adapter.js
apps/VCSM/src/features/identity/hooks/useIdentityOps.js
apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js
apps/VCSM/src/features/identity/dal/provision.rpc.dal.js
```

For each file, record:
1. Full path
2. Layer (setup | controller | resolver | adapter | hook | dal)
3. Exported functions/hooks/objects (actual export names)
4. What it calls internally (other files within the identity feature only)
5. What external engine it imports from (`@identity` or other)
6. Table schema it touches (if any)

---

## Out of Scope

- Consumer features (those are IDENTITY-004)
- Modifying any file
- Checking DB RLS state (separate DB audit)
- Comparing to prior versions

---

## Dependencies

None. This is the first ticket.

---

## Blocked By

Nothing.

---

## Exact Steps

1. Read `setup.js`. Record: what engine it calls, what it exports.
2. Read `adapters/identity.adapter.js`. Record every exported hook/function and what it calls.
3. Read `adapters/identityOps.adapter.js`. Record every exported hook/function and what it calls.
4. Read `resolvers/vcsmIdentity.resolver.js`. Record resolver shape and what it returns.
5. Read `controller/refreshActorDirectory.controller.js`. Record params, what it calls.
6. Read `controller/ensureVcsmPlatformBootstrap.controller.js`. Record params, what it calls.
7. Read `hooks/useIdentityOps.js`. Record exported hook signature.
8. Read `dal/refreshActorDirectory.dal.js`. Record table name and query shape.
9. Read `dal/provision.rpc.dal.js`. Record RPC name and schema tables touched.
10. Write complete snapshot to the output section of this ticket.
11. Verify file count = 9. If more or fewer files exist, document discrepancy.

---

## Validation

- [ ] All 9 identity files read and listed
- [ ] Every exported symbol recorded (no UNKNOWN exports)
- [ ] Each file's layer assignment confirmed
- [ ] No source file modified
- [ ] File count matches scanner: 9

---

## Rollback Plan

Read-only. No rollback needed.

---

## Do Not Touch

All source files. Any CONTRACTS/ file.

---

## Expected Output

Completed output section appended to this ticket file:
```
## Current State Snapshot — [DATE]

### File Inventory
[9 files, one per row: path | layer | exports | external deps | DB tables]

### Adapter Surface
[All exports from identity.adapter.js and identityOps.adapter.js]

### toPublicIdentity() Shape
[Confirmed shape from resolver or adapter]

### Engine Dependency
[Which engine alias/path does identity feature import from]
```

---

## Next Ticket

IDENTITY-002 — actors vs identity Boundary (can run in parallel with IDENTITY-003)
