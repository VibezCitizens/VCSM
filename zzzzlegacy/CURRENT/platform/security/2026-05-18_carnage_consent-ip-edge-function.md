# CARNAGE MIGRATION REPORT — Consent IP Edge Function

**Date:** 2026-05-18
**Application Scope:** VCSM
**Migration reason:** VENOM Finding 4 — `ip_address` on `platform.user_consents` is currently omitted entirely (client-side capture is spoofable). Server-side capture required for legal audit trail integrity.
**Migration type:** New Supabase Edge Function + DAL routing update
**Triggered by:** CEREBRO 2026-05-18 verification pass on `vcsm.dal.legal.md`
**Source references:** `2026-05-10_venom_terms-of-service-logic.md` Finding 4 · `vcsm.dal.legal.md` CARNAGE deferred task

---

## Migration Safety Status

```
Migration Safety Status: CAUTION
Confidence: HIGH
Blocking Risks: NONE — ip_address column already nullable; no schema lock risk
```

---

## Schema Trust Classification

| Object | Classification | Reason |
|---|---|---|
| `platform.user_consents` | Identity-sensitive + Runtime-critical | Legal audit record per user; consent gate controls all protected route access |
| `platform.user_consents.ip_address` | Identity-sensitive | Server-side IP is the jurisdiction/identity evidence for consent |
| `supabase/functions/record-legal-consent` | Runtime-critical | New Edge Function becomes the consent write path for all users |

---

## Current Structure

| Object | Purpose | Dependencies |
|---|---|---|
| `platform.user_consents` | Stores consent rows per user per document version | RLS: select_own + insert_own + deny_update + deny_delete; audit trigger |
| `platform.user_consents.ip_address` | `inet` type, nullable — currently always NULL (client-side capture intentionally disabled) | `getPublicIp.dal.js` retained as reference; not called |
| `dalRecordLegalAcceptance` | Client-side Supabase insert — omits ip_address | Called by `legalConsent.controller.js` via `recordLegalAcceptance` and `recordSignupConsent` |
| `getPublicIp.dal.js` | Dead reference file — calls `api.ipify.org`, zero importers | Retained until Edge Function ships |

---

## Migration Blast Radius

```
Affected systems: Legal consent write path — affects signup, re-consent, and barbershop join flows
Runtime impact: LOW — adds one Edge Function hop; no DB schema lock; no table rewrite
Release impact: MEDIUM — replaces the client DAL write with an Edge Function call; requires deploy coordination
Rollback impact: FULL — rollback by reverting DAL to client-side insert (with ip_address omitted as before)
```

---

## RLS Impact Review

| Object | RLS Dependency | Risk | Follow-up Required |
|---|---|---|---|
| `platform.user_consents` | CRITICAL | INSERT GRANT already on `authenticated` role (migration 20260510030000) | Edge Function should use user JWT (not service role) so `user_consents_insert_own` RLS still validates `user_id = auth.uid()` |
| Edge Function JWT handling | DIRECT | Edge Function must pass user Authorization header to the Supabase client to preserve RLS enforcement | VENOM review recommended before deploy |

**Key design constraint:** The Edge Function MUST use the caller's JWT (not the service role) for the consent insert. This preserves the `user_consents_insert_own` RLS policy, which is the only server-side guard preventing a user from inserting a consent row with a different `user_id`. If the Edge Function uses `service_role`, RLS is bypassed and a malicious call could insert rows for arbitrary users.

---

## Runtime Impact Analysis

| Runtime Area | Risk | Expected Impact | Mitigation |
|---|---|---|---|
| Consent write latency | LOW | One additional network hop (client → Edge Function → DB) vs client → DB directly | Edge Functions run at the Supabase edge — typically <50ms overhead |
| Cold start (Edge Function) | LOW | First call after idle may have 100-300ms cold start | Consent writes are infrequent (signup + re-consent only); acceptable |
| Consent gate read path | NONE | Reads are unchanged — still direct DAL queries | N/A |
| Cache invalidation | NONE | `invalidateConsentCache` is called inside `recordLegalAcceptance` — unchanged | N/A |
| Multi-document parallel writes | LOW | `Promise.all` pattern in controller must still work via Edge Function (one call per document or batched) | Prefer a batched payload: send all documents in one Edge Function call |

---

## Migration Dependency Graph

| Dependency Type | Affected Area | Risk |
|---|---|---|
| DAL dependency | `userConsents.write.dal.js` — replaced by Edge Function call | MEDIUM — existing callers must be updated |
| Controller dependency | `legalConsent.controller.js` — `recordLegalAcceptance`, `recordSignupConsent` | LOW — swap DAL import; no logic change |
| Engine dependency | None — `legalCompliance.engine.js` is pure computation; no write access | NONE |
| RLS dependency | `user_consents_insert_own` — must remain enforced via JWT path | CRITICAL |
| Cache dependency | `consentCache` invalidation in controller — unchanged | NONE |
| External API dependency | `api.ipify.org` — referenced in `getPublicIp.dal.js` (dead file); NOT used in Edge Function | NONE |
| Native dependency | Consent write is called from web only; native parity N/A | NONE |

---

## Data Integrity Review

| Integrity Area | Risk | Detection Method | Mitigation |
|---|---|---|---|
| `ip_address` authenticity | MEDIUM (current: NULL; Edge Function: real server IP) | No risk — moving from NULL to real value; no existing data changes | Run after deploy; existing NULL rows remain NULL (historical only) |
| `user_id` correctness | CRITICAL | RLS `user_id = auth.uid()` enforces this if JWT path is used | Use userClient (JWT-authenticated) for the insert, never adminClient |
| Duplicate consent rows (batch) | LOW | `Promise.all` with one Edge Function call per document OR a single batched Edge Function call | Prefer batched — fewer round trips, atomicity optional |
| `accepted_at` server time | RESOLVED | Already omitted from client payload; DB DEFAULT now() applies; Edge Function continues this pattern | Ensure Edge Function insert also omits `accepted_at` |

---

## Migration Execution Strategy

| Phase | Strategy | Risk | Notes |
|---|---|---|---|
| 1 | Create Edge Function `record-legal-consent` | LOW | New file; no schema changes; no existing code touched |
| 2 | Create new DAL `recordConsent.edge.dal.js` | LOW | Calls Edge Function via `supabase.functions.invoke()`; replaces direct insert |
| 3 | Update `legalConsent.controller.js` | LOW | Swap import from `dalRecordLegalAcceptance` to new edge DAL function |
| 4 | Smoke test consent flow in dev | LOW | Verify IP is populated in consent rows after signup and re-consent |
| 5 | Delete `getPublicIp.dal.js` | LOW | Dead reference file; safe to remove once Edge Function is live |
| 6 | VENOM re-verify | MEDIUM | Confirm Finding 4 is closed; confirm JWT path preserved |

**No schema migration file required** — `ip_address inet` column is already present and nullable. No ALTER TABLE needed.

---

## Rollback Survivability

```
Rollback status: FULL
Data recovery risk: NONE — reverting to client DAL simply leaves ip_address as NULL again
Compatibility rollback risk: LOW — reverting DAL import in controller is a one-line change
Operational complexity: LOW — Edge Function can be disabled/deleted independently
```

---

## Proposed Edge Function Design (text only — do not execute)

**Location:** `apps/VCSM/supabase/functions/record-legal-consent/index.ts`

**Request shape:**
```ts
POST /functions/v1/record-legal-consent
Authorization: Bearer <user-jwt>
Content-Type: application/json

{
  documents: Array<{
    id: string           // legal_document_id
    app_id: string
    document_type: string
    version: string
  }>,
  acceptedVia: string,  // 'signup' | 'reconsent'
  userAppAccountId?: string | null
}
```

**Key implementation points:**
1. Use `userClient` (created with user JWT) for the insert — preserves `user_consents_insert_own` RLS
2. Extract IP: `req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null`
3. Validate IP string before inserting (must be valid IPv4/IPv6 format or null)
4. Insert all documents in parallel (Promise.all pattern preserved)
5. Return `{ ok: true, results: [{id, accepted_at}...] }`
6. Omit `accepted_at` from insert payload — DB DEFAULT now() applies

**Proposed DAL (`recordConsent.edge.dal.js`):**
```js
import { supabase } from '@/services/supabase/supabaseClient'

export async function dalRecordLegalAcceptanceViaEdge({
  documents,
  acceptedVia,
  userAppAccountId,
}) {
  const { data, error } = await supabase.functions.invoke(
    'record-legal-consent',
    {
      body: { documents, acceptedVia, userAppAccountId: userAppAccountId ?? null },
    }
  )
  if (error) throw error
  return data?.results ?? []
}
```

**Controller update** — replace the `dalRecordLegalAcceptance` import with `dalRecordLegalAcceptanceViaEdge` and update the `documents` shape passed to it (batch all docs in one call).

---

## Validation Checklist

| Validation Area | Status | Notes |
|---|---|---|
| Schema compatibility | VERIFIED | `ip_address inet` column exists and is nullable |
| DAL compatibility | DESIGN — awaiting implementation | New Edge DAL replaces direct insert |
| Controller compatibility | DESIGN — awaiting implementation | One import swap |
| RLS validation | DESIGN — JWT path must be verified post-deploy | `user_consents_insert_own` must still fire |
| Runtime performance | ACCEPTABLE | One extra Edge Function hop on an infrequent write path |
| Rollback | FULL | Revert DAL import; Edge Function can remain inactive |
| Native compatibility | N/A | Web-only consent write path |

---

## Boundary Migration Review

| Schema Object | Scope Owner | Cross-Root Risk | Status |
|---|---|---|---|
| `platform.user_consents` | VCSM | NONE — platform schema is VCSM-exclusive | CLEAR |
| `supabase/functions/record-legal-consent` | VCSM | NONE — new function in VCSM supabase folder | CLEAR |

---

## Recommended Handoffs

- **Wolverine** — Implementation: create Edge Function + recordConsent.edge.dal.js + controller update + delete getPublicIp.dal.js
- **VENOM** — Re-verify Finding 4 after Edge Function is live; confirm JWT path preserved in RLS
- **LOGAN** — Update `vcsm.dal.legal.md` after implementation: add new DAL file, remove dead file, update call chain
- **CARNAGE (next)** — No additional schema migration required for this task

---

## FINAL CARNAGE STATUS: CAUTION

Safe to implement. No schema lock risk, no breaking changes, full rollback path. Key caution: Edge Function MUST use user JWT for insert — service_role bypass would break `user_consents_insert_own` RLS and allow cross-user consent fraud.
