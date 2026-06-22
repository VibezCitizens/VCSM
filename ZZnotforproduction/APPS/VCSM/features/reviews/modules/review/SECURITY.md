# SECURITY — reviews / review
## Status: SOURCE_VERIFIED | 2026-06-05

---

## Module Security Profile

| Field | Value |
|-------|-------|
| Attack surface | Minimal — bootstrap shim only |
| Write path | Delegated to SECURITY DEFINER RPC (engines/reviews) |
| Direct DB writes | None |
| Auth dependency | Supabase auth.uid() (via RLS on vc.actor_owners) |
| Last security review | 2026-06-05 |

---

## Confirmed Findings

### REV-V-001 — RESOLVED: Ownership check queried vc.actors instead of vc.actor_owners

| Field | Value |
|-------|-------|
| Severity | HIGH |
| Status | RESOLVED |
| Finding type | Authorization bypass risk |
| Source file | `apps/VCSM/src/features/reviews/setup.js` |

**Issue:** The ownership resolver registered by the engine bootstrap previously queried `vc.actors` to verify that an actor ID existed, rather than `vc.actor_owners` to verify that the calling user actually owns the actor. This would have allowed any authenticated user to claim to be acting as any actor.

**Fix:** Resolver now queries `vc.actor_owners` with RLS policy `actor_owners_read_own` (user_id = auth.uid()). An empty result set = no ownership = request rejected.

**Defense in depth:** The downstream `reviews.upsert_neutral_review()` RPC is SECURITY DEFINER and validates ownership at the DB level, providing an independent enforcement layer.

---

## Security Properties

### Ownership Pre-Check

```
SELECT actor_id FROM vc.actor_owners WHERE actor_id = :actorId
RLS: actor_owners_read_own → user_id = auth.uid()
```

- If the authenticated user does not own the actor, RLS returns 0 rows
- 0 rows → resolver returns false → engine rejects write
- No app-level bypass is possible without a Supabase auth token for the owning user

### SECURITY DEFINER RPC

`reviews.upsert_neutral_review()` is SECURITY DEFINER. Even if the application-layer check were bypassed:
- The RPC re-validates ownership at the DB level
- A Supabase auth token for the correct owner is still required
- The RLS environment at the DB level is controlled by the DB, not the app

### Supabase Client Singleton

- Client is injected into the engine, not directly accessible to caller code
- storageKey: `sb-auth-main` — isolated from other app contexts
- Session is validated on every authenticated DB call

---

## No Known Open Findings

As of 2026-06-05, no open security findings exist at the module level for `reviews/review`.

Open findings for the broader reviews domain (write path, rate limiting, etc.) are tracked at the `engines/reviews` level, not this shim.

---

## Unverified Surfaces

| Surface | Risk | Notes |
|---------|------|-------|
| No test coverage for setup.js | LOW | Bootstrap function — difficult to misuse at runtime, but ownership resolver logic is not unit-tested |
| Engine configuration at runtime | INFO | If engine configure() is called multiple times, behavior is engine-defined — not validated in shim |

---

## Scanner Coverage

| Scanner | Status | Notes |
|---------|--------|-------|
| VENOM | Partial | REV-V-001 finding raised and confirmed resolved |
| ELEKTRA | Not run | Module not yet scanned |
| BlackWidow | Not run | Module not yet scanned |
