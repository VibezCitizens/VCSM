# VENOM + ROBIN — MONEY EXCHANGE VPORT Profile Audit

**Date:** 2026-05-10
**Application Scope:** VCSM
**VPORT Type:** `exchange`
**Tab Preset:** `VPORT_RATES_TABS`
**Tab Order:** `rates → services → content → reviews → about → photos → vibes → subscribers`
**Supabase Schema:** `vport.rates`, `vport.profiles`, `vc.actors`, `reviews.*`
**Review Dimensions:** Expertise, Communication, Timeliness, Professionalism, Value
**DAL ownership file:** `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js` (exists but unused in write path)

---

## VENOM TARGET

```
Feature / Route / Engine: VPORT Profile — Exchange (money exchange / FX) type
Application Scope: VCSM
Reason for review: Financial data write path with no controller-level ownership check; rate upsert trust boundary; native rates DAL gap
Primary trust boundary: RLS only — controller explicitly voids the identity actor ID parameter
```

---

## SECURITY SURFACE

```
Entry point: /profile/:slug (public), rates tab (read), owner rate management (write)
Auth source: Supabase session → useIdentity() → actorId + kind
Authorization layer: RLS ONLY — controller does not enforce ownership
Identity surface: actorId (correct), kind = 'vport'
Sensitive objects: vport.rates (live FX exchange rates — financial data), vport.profiles, vc.actors
Sensitive context: Exchange rates are financial data. Incorrect rates displayed on a public profile could defraud users transacting at posted rates.
```

---

## TRUST BOUNDARY TRACE

```
Client input: actorId (from session), rateType, baseCurrency, quoteCurrency, buyRate, sellRate
Validated at: DAL only — presence of actorId, baseCurrency, quoteCurrency
Identity resolved at: NOT RESOLVED — controller voids identityActorId parameter
Authorization enforced at: RLS (DB-level only) — no app-level ownership check
Data returned to: VportRatesView (public, visitor) and rate management screen (owner)
```

---

## SECURITY RISK FINDINGS

---

### VENOM SECURITY FINDING — VE-01 ⚠️ CRITICAL

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js:3-13`
- **Application Scope:** VCSM
- **Current behavior:**
  ```js
  export default async function upsertVportRateController({
    identityActorId: _identityActorId,   // ← received
    actorId,
    ...
  } = {}) {
    void _identityActorId;               // ← immediately discarded
    return upsertVportRateDal({ actorId, ... });
  }
  ```
  `identityActorId` is destructured, renamed to `_identityActorId`, and discarded with `void`. The controller passes `actorId` directly to the DAL without verifying that `identityActorId` (the session actor) is an authorized owner of `actorId` (the target VPORT). No call to `actor_owners`, no ownership lookup, no comparison.
- **Risk:** Any authenticated actor who knows a target VPORT's `actorId` can call this controller (or trigger it through the hook) with any `actorId` and upsert exchange rates for that VPORT. If RLS on `vport.rates` does not correctly enforce ownership (or if the rate upsert uses a SECURITY DEFINER function), an unauthorized actor can publish false exchange rates under any exchange VPORT's identity.
- **Severity:** CRITICAL
- **Why it matters:** Exchange rates are financial data displayed publicly on a money exchange VPORT's profile. A false rate could defraud visitors who transact at the displayed rate. The `actorOwners.read.dal.js` file exists in the rates DAL folder — confirming that ownership verification was planned but was not wired to this controller. The `void _identityActorId` line is a code smell indicating the ownership check was placeholder-removed.
- **Recommended mitigation:**
  1. Add actor ownership check: fetch `actor_owners` where `actor_id = actorId` and verify `identityActorId` appears as an owner.
  2. Wire `actorOwners.read.dal.js` (already present in the rates DAL folder) into the controller.
  3. Confirm `vport.rates` RLS enforces ownership via `auth.uid()` → `vc.actors` → `actor_owners` chain.
  4. Remove the `void _identityActorId` line and enforce the check.
- **Rationale:** Financial data writes with zero controller-level authorization and a voided identity parameter is the highest-risk pattern in the codebase. RLS as the sole protection for financial rate upserts is insufficient.
- **Follow-up command:** DB (immediate — audit `vport.rates` RLS policy; confirm whether upsert uses SECURITY DEFINER)
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security Architecture and Engineering, Software Development Security

---

### VENOM SECURITY FINDING — VE-02 — HIGH

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js:17-52`
- **Application Scope:** VCSM
- **Current behavior:** The DAL function `upsertVportRateDal` resolves `profileId` from `actorId` via `vport.profiles` and then upserts into `vport.rates` scoped by `profile_id`. The upsert uses `onConflict: 'profile_id,rate_type,base_currency,quote_currency'` — an idempotent update pattern. No ownership check exists in the DAL itself.
- **Risk:** The DAL will successfully write rates for any `actorId` that has a `vport.profiles` row. Because the controller discards the identity actor (VE-01), the DAL is the only gating layer, and it does not gate on ownership.
- **Severity:** HIGH
- **Why it matters:** DAL files must not contain authorization logic (per architecture contract §2.1). However, absent controller-level ownership enforcement, the DAL becomes the only enforcer — which it is not equipped to be. This is a defense-in-depth gap.
- **Recommended mitigation:** Add controller-level ownership gate (VE-01). The DAL does not need to change — it should remain dumb. The fix belongs in the controller.
- **Rationale:** Architecture contract: "Security lives in RLS. Meaning lives in Controllers." Controllers must enforce ownership before calling the DAL.
- **Follow-up command:** DB (verify RLS on `vport.rates`)
- **CISSP Domain:**
  - Primary: Security Architecture and Engineering
  - Secondary: Identity and Access Management

---

### VENOM SECURITY FINDING — VE-03 — HIGH

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js:6-8`
- **Application Scope:** VCSM
- **Current behavior:** `buyRate` and `sellRate` are passed directly to the DAL without any range validation. There is no minimum, maximum, or sanity check on the rate values. Rates of 0, negative values, or astronomically large values are accepted.
- **Risk:** A malicious or confused owner can publish rates that are 0 (implying free currency exchange), negative, or absurdly high/low, misleading customers who transact based on the displayed rates.
- **Severity:** HIGH
- **Why it matters:** Unlike gas price submissions (which have a `requireSanityForSuggestion` setting and configurable `minPrice`/`maxPrice`/`maxDeltaPct`), exchange rates have no such guardrails. The gas station VPORT type has a full sanity check pipeline; the exchange type has none. This is an asymmetric risk.
- **Recommended mitigation:** Add rate sanity validation: minimum positive value, maximum delta from a reference rate (if available), and rejection of zero/negative rates. Model the same `settings.requireSanityForSuggestion` pattern used in the gas price controller.
- **Rationale:** Financial data must have input validation bounds. Zero or negative rates are never valid for FX exchange.
- **Follow-up command:** Wolverine
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Security and Risk Management

---

### VENOM SECURITY FINDING — VE-04 — MEDIUM

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js:4`
- **Application Scope:** VCSM
- **Current behavior:** `baseCurrency` and `quoteCurrency` are validated only for presence (`!baseCurrency` check in DAL). Any string is accepted as a currency code. No ISO 4217 validation.
- **Risk:** Invalid, empty, or malicious strings can be stored as currency pair identifiers. A script tag or injection string stored in `base_currency` would be rendered in the rates view visible to all public visitors of the exchange VPORT.
- **Severity:** MEDIUM
- **Why it matters:** Currency codes are displayed publicly as headers for the rate table (e.g., "USD → MXN"). An XSS string in this field, if rendered as raw HTML, would execute for every visitor who views the exchange profile.
- **Recommended mitigation:** Validate both `baseCurrency` and `quoteCurrency` against an allowed list of ISO 4217 currency codes before passing to the DAL. Reject any value not in the list.
- **Rationale:** All client-supplied enumerable fields must be validated against an allowed set before storage.
- **Follow-up command:** Wolverine
- **CISSP Domain:**
  - Primary: Software Development Security
  - Secondary: Communication and Network Security

---

### VENOM SECURITY FINDING — VE-05 — MEDIUM

- **Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/exchange/publishExchangeRateUpdateAsPost.controller.js` (by pattern)
- **Application Scope:** VCSM
- **Current behavior:** Exchange rate update system posts follow the same pattern as other publish controllers — `actorId` accepted without `actor_owners` verification.
- **Risk:** An authenticated actor who knows an exchange VPORT's `actorId` can trigger a "rates updated" system post on the public feed under the exchange VPORT's identity.
- **Severity:** MEDIUM (lower than VE-01 because the write is a social post, not financial data mutation)
- **Why it matters:** Exchange rate update posts could be used to spread false signals about rate changes, potentially influencing user behavior (e.g., creating urgency to exchange currency before a false "rate change" post).
- **Recommended mitigation:** Apply `actor_owners` verification to `publishExchangeRateUpdateAsPostController` before `createSystemPost`.
- **Rationale:** Consistent with all other publish-as-post controllers — actor ownership must be verified.
- **Follow-up command:** DB
- **CISSP Domain:**
  - Primary: Identity and Access Management
  - Secondary: Security and Risk Management

---

### VENOM SECURITY FINDING — VE-06 — MEDIUM

- **Location:** `apps/VCSM/src/features/profiles/dal/vportPublicDetails.read.dal.js`
- **Application Scope:** VCSM
- **Current behavior:** `vport_id` and `is_deleted` exposed in public profile response — same systemic issue as all VPORT types.
- **Risk:** Same as VB-02 / VB-03 in barbershop audit.
- **Severity:** MEDIUM / LOW
- **Why it matters:** For exchange VPORT, `vport_id` exposure combined with the rates write vulnerability (VE-01) could theoretically assist an attacker in constructing targeted rate manipulation — knowing the internal profile UUID helps correlate DB-level access patterns.
- **Recommended mitigation:** Remove `vport_id` from response; filter `is_deleted = false` at DAL.
- **Follow-up command:** review-contract
- **CISSP Domain:**
  - Primary: Asset Security
  - Secondary: Identity and Access Management

---

## MITIGATION PLAN

| Risk | Layer to Fix | Priority |
|---|---|---|
| VE-01: Controller voids identity actor — no ownership check | Controller (URGENT) | CRITICAL — block any rate write deployment |
| VE-02: DAL-only protection without controller gate | Controller | HIGH — must fix with VE-01 |
| VE-03: No rate range / sanity validation | Controller | HIGH — financial data integrity |
| VE-04: Currency code not ISO 4217 validated | Controller | MEDIUM |
| VE-05: publishExchangeRateUpdateAsPost missing ownership | Controller | MEDIUM |
| VE-06: vport_id / is_deleted in response | DAL | MEDIUM / LOW |

---

## CISSP DOMAIN COVERAGE SUMMARY

| CISSP Domain | Findings | Notes |
|---|---:|---|
| Security and Risk Management | 2 | VE-03, VE-05 (financial data integrity, false market signals) |
| Asset Security | 1 | VE-06 |
| Security Architecture and Engineering | 2 | VE-01, VE-02 (RLS as sole protection; controller voids identity) |
| Communication and Network Security | 1 | VE-04 (XSS via currency code render) |
| Identity and Access Management | 2 | VE-01, VE-05 (no ownership verification) |
| Security Assessment and Testing | 0 | Out of scope |
| Security Operations | 0 | No logging or audit findings in scope |
| Software Development Security | 3 | VE-01 (void identity), VE-03 (no validation), VE-04 (unvalidated input) |

**Note:** VE-01 is rated CRITICAL and is the highest-severity finding across all five VPORT type audits. The `void _identityActorId` pattern in a financial write controller requires immediate remediation.

---

## ROBIN — NATIVE TRANSFER ANALYSIS

### Module Reference
`native-transfer/modules/public-vport-profile.md` | Status: **Partial**

### PWA Source Files (Exchange-specific)
- `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/upsertVportRate.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/rates/getVportRates.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/upsertVportRate.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/rates/actorOwners.read.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/useVportRates.js`
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/useUpsertVportRate.js`
- `apps/VCSM/src/features/profiles/kinds/vport/screens/views/tabs/VportRatesView.jsx`

### Native Files (Exchange-relevant)
- `VCSMNativeApp/Features/Profile/Screens/VPortRatesEditorScreen.swift` — owner rate management
- `VCSMNativeApp/Features/Profile/Components/ProfileTabDetailSections.swift` — rates tab display (inferred)
- No confirmed `ProfileRatesReads.dal.swift` in the transfer inventory

### Tab Set — Exchange Native Parity

| Tab | PWA | Native | Status |
|---|---|---|---|
| rates | ✓ (first tab, VPORT_RATES_TABS) | ✓ (VPortRatesEditorScreen for owner; visitor view needs confirmation) | **Verify visitor read-only rates view** |
| services | ✓ | ✓ | Parity |
| content | ✓ | Not confirmed | **Verify P2** |
| reviews | ✓ | ✓ | Parity |
| about | ✓ | ✓ | Parity |
| photos | ✓ | ✓ | Parity |
| vibes | ✓ | ✓ | Parity |
| subscribers | ✓ | ✓ | Parity |

### Native Gaps — Exchange

1. **P1 — Rates read DAL not confirmed.** `VPortRatesEditorScreen.swift` handles owner rate writes. A separate read-only rates view for visitors (non-owners) is required. No `ProfileRatesReads.dal.swift` was identified in the native Profile DAL inventory. Confirm whether rates reads are handled inline in the editor screen store or in a separate service, and whether they query `vport.rates` with the correct schema path.

2. **P1 — Rates tab first position.** Native tab resolution must confirm `exchange` type → `VPORT_RATES_TABS` → rates tab first. Verify `getTabsForVportType("exchange")` in native returns `VPORT_RATES_TABS` with rates as the leading tab.

3. **P1 — CRITICAL: If VE-01 is not fixed before native launch, native inherits the zero-ownership-check write path.** Any native implementation of the rates upsert call that maps to `upsertVportRateController` propagates the same controller vulnerability. The native write path must not proceed until VE-01 is remediated in the controller or RLS is confirmed sufficient.

4. **P1 — Stale rates cache risk.** Exchange rates change frequently. If native caches rates with the same 60s TTL as `getVportPublicDetailsController`, visitors could see stale rates for up to 60 seconds after an update. For FX rates, 60 seconds is significant. Native should implement either a shorter cache TTL or a realtime subscription to `vport.rates` for the exchange type.

5. **P2 — No native equivalent for publish exchange rate update as post.** Owner action to publish a rate-change system post exists in PWA. Native `VPortRatesEditorScreen.swift` may not include this action. Low priority for launch.

6. **P2 — Content tab not confirmed.** Present in `VPORT_RATES_TABS` but native rendering not confirmed.

### RLS/Schema Watch — Exchange

- `vport.rates`: **URGENT** — verify RLS enforces `profile_id` ownership via `auth.uid()` → `vc.actors` → `actor_owners` chain. This is the sole protection while VE-01 is unresolved.
- `vport.profiles`: rates upsert resolves `profile_id` via `actor_id` — verify this lookup cannot be used to resolve a profile owned by a different user.
- Do NOT use stale cached rates for visitor display on exchange VPORTs.

### Priority Classification

| Gap | Priority | Blocking? |
|---|---|---|
| Rates read DAL confirmation | P1 | Yes — visitor view requires read path |
| Rates tab first position | P1 | Yes — correctness |
| VE-01 must be fixed before native launch | P1 | YES — CRITICAL blocker |
| Stale rates cache | P1 | No (but misleads users) |
| Publish rate update as post | P2 | No |
| Content tab | P2 | No |

---

*VENOM is read-only. No code was modified. All findings are recommendations only.*
*Robin analysis is planning-only. No native code was changed.*
*VE-01 is the highest-severity finding in this entire audit set — remediate before any exchange VPORT rate write surface goes to production or native.*
