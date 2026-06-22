# ELEKTRA Precision Security Report — Exchange Profile Module

**Date:** 2026-05-28  
**Scanner:** ELEKTRA  
**Module:** exchange-profile  
**App:** apps/VCSM  
**Finding range:** ELEK-2026-05-28-045 – ELEK-2026-05-28-049  
**Prior audit note:** Exchange module received a full ELEKTRA pass on 2026-05-27 (see `2026-05-27_16-00_elektra_exchange-module-patch-advisory.md`). This pass covers exchange-profile specifically: the rate write path (`upsertVportRateController`) and the feed publish path (`publishExchangeRateUpdateAsPostController`).

---

## Scan Scope

Write paths:
- `exchangeRateValidation.js` — `assertValidRate`
- `publishExchangeRateUpdateAsPostController` — ownership check + rate validation + post creation
- `upsertVportRateController` — the primary rate write controller (rates/ not exchange/dal, but same domain)
- `upsertVportRateDal` — DB write
- `usePublishExchangeRatePost` — UI hook surface

Read paths: `resolveVportExchangeNameDAL`, `hasRecentExchangeRatePostDAL` — not in scope for ownership writes.

---

## Summary

| ID | Severity | Title | Status |
|---|---|---|---|
| ELEK-2026-05-28-045 | LOW | `assertValidRate` — no upper-bound check; arbitrarily large rates accepted | OPEN |
| ELEK-2026-05-28-046 | INFO | `publishExchangeRateUpdateAsPostController` — ownership correctly gated via `assertActorOwnsVportActorController` | CLEAN |
| ELEK-2026-05-28-047 | INFO | `upsertVportRateController` — full validation + ownership chain correct | CLEAN |
| ELEK-2026-05-28-048 | INFO | `upsertVportRateDal` — no actor_id column in rates table; scoped via `profile_id` resolved server-side | CLEAN |
| ELEK-2026-05-28-049 | INFO | `usePublishExchangeRatePost` — `identityActorId` resolved from session correctly | CLEAN |

---

## Finding Detail

---

### ELEK-2026-05-28-045

**Severity:** LOW  
**Title:** `assertValidRate` — validates positive finite number but enforces no upper bound; arbitrarily large rates (e.g., 999999999) are accepted

**File:** `apps/VCSM/src/features/profiles/kinds/vport/controller/exchange/exchangeRateValidation.js:1–9`

```js
export function assertValidRate(name, value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(...)
  }
  return n;
}
```

**Chain:**

```
useUpsertVportRate (hook) → upsertVportRateController →
  assertValidRate("buyRate", buyRate)   // no upper bound
  assertValidRate("sellRate", sellRate) // no upper bound
  upsertVportRateDal → vport.rates UPSERT
```

Also called in `publishExchangeRateUpdateAsPostController:49–53` for the feed-post path.

**Source:** `buyRate`, `sellRate` are user-submitted from the exchange rate editor UI. They reach `assertValidRate` via `upsertVportRateController` without prior numeric clamping.

**Sink:** `vport.rates` table (via `upsertVportRateDal`) and the `payload.buyRate`/`payload.sellRate` fields of any published `exchange_rate_update` post.

**Impact:** An owner of an exchange VPORT can write `buyRate = 9007199254740991` (Number.MAX_SAFE_INTEGER) into the rates table. This would render the published exchange rate post technically accurate (it posts what was saved) but misleading in all UI display contexts. It does not affect other actors — ownership is verified. The damage is limited to the VPORT's own data and public feed posts. Exploitability: LOW — requires ownership of the VPORT; no cross-actor impact.

**Missing defense:** No `MAX_RATE` bound check in `assertValidRate`. Recommended platform-safe upper bound: `1_000_000` (covers any realistic FX rate pair).

**Proposed patch (text only — do not apply):**

```js
// exchangeRateValidation.js
const MAX_RATE = 1_000_000;

export function assertValidRate(name, value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`${name} must be a positive finite number — received ${JSON.stringify(value)}`);
  }
  if (n > MAX_RATE) {
    throw new Error(`${name} exceeds maximum allowed rate of ${MAX_RATE} — received ${n}`);
  }
  return n;
}
```

---

### ELEK-2026-05-28-046

**Severity:** INFO  
**Title:** `publishExchangeRateUpdateAsPostController` — ownership correctly gated

**File:** `apps/VCSM/src/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js:36–39`

```js
await assertActorOwnsVportActorController({
  requestActorId: identityActorId,
  targetActorId: actorId,
});
```

**Chain analysis:**
- `identityActorId` is resolved in `usePublishExchangeRatePost` from `identity.actorId` (kind=user) or `availableActors.find(a => a.actorKind === 'user').actorId`. This is session-derived — not caller-injected.
- `actorId` is the VPORT being acted on.
- `assertActorOwnsVportActorController` verifies `actor_owners` with the session-bound user actor. This is the canonical ownership model.
- Rate validation (`assertValidRate`) runs after ownership check — correct order.
- Dedup throttle (`hasRecentExchangeRatePostDAL`) prevents spam.

No exploit path found. CLEAN.

---

### ELEK-2026-05-28-047

**Severity:** INFO  
**Title:** `upsertVportRateController` — full validation + ownership chain correct

**File:** `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js`

Complete chain verified:
1. `assertValidRateType` — only "fx" accepted
2. `assertValidMeta` — size-bounded, no arrays
3. `assertValidCurrencyCode` — ISO 4217 allowlist enforced (SUPPORTED_FX_CURRENCIES)
4. `assertValidRate` — positive finite (upper bound gap captured in ELEK-2026-05-28-045)
5. `baseCurrency !== quoteCurrency` guard present
6. `assertActorOwnsVportActorController` called with session-derived `identityActorId`
7. DAL receives validated values only

No structural gaps. CLEAN except for ELEK-2026-05-28-045.

---

### ELEK-2026-05-28-048

**Severity:** INFO  
**Title:** `upsertVportRateDal` — `profile_id` resolved server-side from `actorId` via `resolveVportProfileId`

**File:** `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js:22–23`

```js
const profileId = await resolveVportProfileId(actorId);
```

The `profile_id` used for the UPSERT conflict key is server-resolved. The attacker cannot directly supply a `profile_id`. The UPSERT scopes to the authenticated actor's profile. CLEAN.

Note: the `rates` table does not appear to have an `actor_id` column — ownership is tracked via `profile_id` + `profiles.actor_id` join. This is consistent with the vport schema pattern and not a gap.

---

### ELEK-2026-05-28-049

**Severity:** INFO  
**Title:** `usePublishExchangeRatePost` — `identityActorId` correctly session-derived

**File:** `apps/VCSM/src/features/profiles/kinds/vport/hooks/exchange/usePublishExchangeRatePost.js:6–12`

```js
const identityActorId = useMemo(() => {
  if (identity?.kind === 'user') return identity.actorId ?? null;
  const userActor = availableActors?.find((a) => a.actorKind === 'user');
  return userActor?.actorId ?? null;
}, [identity, availableActors]);
```

This resolves the user-kind actor from the identity context (session-bound), not from any prop. Correct handling of the user/vport actor identity switch. CLEAN.

---

## Exchange Profile Write Chain Summary

| Write path | Ownership gate | Rate validation | Currency validation | Session binding | Assessment |
|---|---|---|---|---|---|
| `upsertVportRateController` | assertActorOwnsVportActorController | assertValidRate (no upper bound — LOW) | ISO 4217 allowlist | YES | LOW finding only |
| `publishExchangeRateUpdateAsPostController` | assertActorOwnsVportActorController | assertValidRate (no upper bound — LOW) | n/a (display only) | YES | LOW finding only |
| `upsertVportRateDal` | profile_id server-resolved | N/A | N/A | Supabase RLS | CLEAN |

---

## Conclusion

The exchange-profile module is well-hardened. The prior ELEKTRA pass (2026-05-27) resolved all critical and high findings. This pass surfaces one LOW finding (no upper-bound rate cap) and finds all other write paths CLEAN. No authorization bypass exists. The module may be confirmed COMPLETE pending resolution of ELEK-2026-05-28-045.

---

## Governance Note

The exchange module governance folder exists at:
`zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/VPORT/DASHBOARD/modules/exchange/`

No new folder creation required. The exchange governance docs already record ELEKTRA COMPLETE as of 2026-05-27. This pass is additive — one new LOW finding (ELEK-2026-05-28-045) added.
