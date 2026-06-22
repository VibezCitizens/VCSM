# Security Posture — leads

Last Updated: 2026-06-04
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-LEADS-001 / ELEK-2026-06-04-001 (HIGH), VEN-LEADS-004 (MEDIUM), BW-LEADS-001 / ELEK-2026-06-04-002 (MEDIUM)

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

### Open Findings

| Finding | Severity | Status | Summary |
|---|---|---|---|
| VEN-LEADS-001 | HIGH | OPEN | Edge Function `send-lead-confirmation`: Bearer token is presence-only check (no JWT validation). Anon key is public in frontend bundle → email spam abuse vector. THOR BLOCKER. |
| VEN-LEADS-002 | MEDIUM | OPEN | `submit_business_card_lead` RPC: no rate limiting or flood throttle visible in migrations. VPORT lead inbox flood risk from anon callers. |
| VEN-LEADS-003 | MEDIUM | OPEN | `traze_provider_lead_contacted` source variant missing from DB CHECK constraint. Marking a traze_provider_lead as contacted will hit a constraint violation. Route to CARNAGE. |
| VEN-LEADS-004 | MEDIUM | OPEN | `business_card_leads_owner_select` RLS SELECT policy referenced but defining migration not recovered. DB must confirm policy exists. THOR BLOCKER until confirmed. |
| VEN-LEADS-005 | LOW | OPEN | CORS on Edge Function is browser-enforcement only. Not a security boundary. Documented, fix inherited from VEN-LEADS-001. |
| VEN-LEADS-006 | LOW | OPEN | `readNewLeadsCountByProfileDAL` silently returns 0 on error. DB regression would be invisible to owner and engineering. |

### Confirmed Safe (Source Verified)

- Final screen ownership gate: SOURCE VERIFIED (VportDashboardLeadsFinalScreen.jsx:26–48)
- All 5 owner controllers assert `assertActorOwnsVportActorController` before any DAL call: SOURCE VERIFIED
- Write DALs scope by leadId + profileId: SOURCE VERIFIED (vportLeads.write.dal.js:28–29, 45–46)
- RLS UPDATE + DELETE policies exist (business_card_leads_owner_update/delete): SOURCE VERIFIED in migrations
- Rule 9 public barrel: RESOLVED — index.js exports no DALs or controllers
- Fast count ownership gate: PATCHED + SOURCE VERIFIED
- Direct INSERT blocked (WITH CHECK false + grants revoked): SOURCE VERIFIED (20260524010000)
- Legacy RPC overload (p_vport_profile_id): DROPPED — SOURCE VERIFIED (20260524010000)
- Source allowlist constraint: DEPLOYED — SOURCE VERIFIED (20260524020000)
- Column-scoped UPDATE grant (source only): RESTORED — SOURCE VERIFIED (20260524020000)

### THOR Gate Status

| Gate | Status | Blocker |
|---|---|---|
| Edge Function JWT validation | NOT IN PLACE | YES — VEN-LEADS-001 |
| RLS SELECT policy on business_card_leads | UNVERIFIED | YES — VEN-LEADS-004 |
| RPC rate limiting | NOT VERIFIED | NO (MEDIUM risk) |
| traze_provider_lead_contacted constraint | MISSING | NO (MEDIUM, future code path) |

### Prior Patched Findings (Pre-VENOM V2)

| Finding | Severity | Status |
|---|---|---|
| LEADS-FASTCOUNT-001 | MEDIUM | PATCHED / SOURCE VERIFIED |
| RULE9-DASH-LEADS-001 | P1 architecture | RESOLVED / SOURCE VERIFIED |
| BW-VPD-003 (weak assertion) | MEDIUM historical | SOURCE APPEARS PATCHED |

### Follow-Up Required

- ELEKTRA: Trace VEN-LEADS-001 source-to-sink; check other edge functions for same pattern
- DB: Confirm business_card_leads_owner_select policy; inspect submit_business_card_lead function body for rate logic; confirm p_ip population
- CARNAGE: traze_provider_lead_contacted missing constraint variant; rate limiting migration if DB confirms absent
- SPIDER-MAN: Edge Function direct-invocation test; count DAL error fallback test; traze lead mark-contacted constraint test

---

## ELEKTRA STATUS
ELEKTRA Last Run: 2026-06-04
ELEKTRA Status: COMPLETE

### Open Findings

| Finding | Severity | Status | Patch Complexity | Summary |
|---|---|---|---|---|
| ELEK-2026-06-04-001 | HIGH | OPEN | COMPLEX | Edge Function Bearer-only auth: `startsWith("Bearer ")` is the only check. No JWT verification. Anon key is public. Patch: add `auth.getUser()` JWT verification + lead_id binding to tie confirmation email to a real DB row. THOR BLOCKER. |
| ELEK-2026-06-04-002 | MEDIUM | OPEN | MODERATE | RPC `p_source` accepts `_contacted` variants at INSERT time. DB CHECK constraint does not separate submission-time from mutation-time values. Patch: add `SUBMISSION_SOURCE_ALLOWLIST` guard in DAL + RPC-level `_contacted` rejection via CARNAGE migration. |
| ELEK-2026-06-04-003 | MEDIUM | OPEN | SIMPLE | `fastCountNewVportLeadsController` accepts caller-supplied `profileId` without VPORT affinity check. Patch: call `resolveProfileId(actorId)` inside the fast path instead of trusting the caller-supplied value. |
| ELEK-2026-06-04-004 | LOW | OPEN | MODERATE | Both VCSM and Traffic DALs hardcode `p_ip: null`. Any IP-based rate limiting in the RPC is permanently disabled. Patch: populate `p_ip` from server-side request context. |
| ELEK-2026-06-04-005 | INFO | OPEN | SIMPLE | `normalizeVportLead` exposes `profileId` (raw VPORT profile UUID) in domain model. Patch: remove `profileId` from return object; verify no component references `lead.profileId`. |

### False Positives Confirmed Safe

- URL actorId → listVportLeadsController: DOUBLE BLOCKED (screen gate + controller DB query)
- User input fields → RPC → DB: SAFE — parameterized queries + React JSX auto-escaping
- vportName/providerProfileUrl in email: SAFE — server-fetched + escapeHtml applied

### Suggested Patch Queue

| # | Finding | Severity | Layer | Complexity | DB Change |
|---|---|---|---|---|---|
| 1 | ELEK-2026-06-04-001 | HIGH | Edge Function | COMPLEX | NO |
| 2 | ELEK-2026-06-04-002 | MEDIUM | DAL + DB Function | MODERATE | YES |
| 3 | ELEK-2026-06-04-003 | MEDIUM | Controller | SIMPLE | NO |
| 4 | ELEK-2026-06-04-004 | LOW | DAL | MODERATE | NO |
| 5 | ELEK-2026-06-04-005 | INFO | Model | SIMPLE | NO |

### Follow-Up Required

- DB: Inspect RPC body for p_source validation + p_ip rate logic (ELEK-002, -004)
- CARNAGE: RPC-level _contacted source guard migration (ELEK-002)
- BLACKWIDOW: Active confirmation of ELEK-001 for CRITICAL reclassification
- SPIDER-MAN: TESTREQ-BW-leads-001 (source guard), -002 (fast count affinity), -003 (profileId removal)

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

### Adversarial Results Summary

| Finding | Severity | Status | Exploit Chain | Summary |
|---|---|---|---|---|
| BW-LEADS-001 | MEDIUM | OPEN / DRAFT | BYPASSED | Direct RPC call with `p_source='business_card_contacted'` inserts leads that appear pre-contacted; invisible to new-leads count; owner inbox polluted. DB CHECK constraint permits `_contacted` values at INSERT. No RPC-level guard. THOR CAUTION addition. |
| BW-LEADS-002 | MEDIUM | OPEN / DRAFT | PARTIAL | `fastCountNewVportLeadsController` accepts caller-supplied `profileId` with no VPORT affinity check after ownership assertion. If VEN-LEADS-004 SELECT policy is absent, attacker can count another VPORT's uncontacted leads. |
| BW-LEADS-003 | INFO | OPEN / DRAFT | INFO | `normalizeVportLead` exposes `profileId` (raw VPORT profile UUID) in domain model. Owner-only context limits blast radius; identity rule compliance concern. |

### Scenarios BLOCKED (Invariants Confirmed Protected)

| §9 Invariant | BEH-ID | Attack Attempted | Result |
|---|---|---|---|
| Non-owner must never view another VPORT actor's lead inbox | BEH-DASH-leads-301 | Cross-actor URL navigation + session mismatch | BLOCKED — screen gate + controller DB query |
| Controllers must never call DAL before ownership passes | BEH-DASH-leads-302 | Direct controller call with attacker callerActorId | BLOCKED — assertActorOwnsVportActorController throws |
| Mark/delete must never mutate outside resolved owner profile | BEH-DASH-leads-303 | Cross-VPORT leadId mutation | BLOCKED — DAL double scope (leadId+profileId) |
| Cached profileId must not be standalone auth bypass | BEH-DASH-leads-304 | Null callerActorId; kind confusion; stale cache | BLOCKED — ownership gate fires before DAL |
| DALs/controllers must never be public card boundary | BEH-DASH-leads-305 | Direct import attempt | BLOCKED — index.js exports verified |

### THOR Impact from BW

| Gate | Status | Blocker |
|---|---|---|
| RPC source injection (p_source = _contacted at INSERT) | NOT PROTECTED | YES — BW-LEADS-001 |
| Fast count profileId affinity | WEAK (depends on VEN-LEADS-004) | CONDITIONAL |
| profileId in domain model | IDENTITY RULE VIOLATION | NO (INFO) |

### New SPIDER-MAN Requirements

| TESTREQ | Validates | Status |
|---|---|---|
| TESTREQ-BW-leads-001 | RPC submission with `_contacted` source rejected post-fix | MISSING |
| TESTREQ-BW-leads-002 | fastCount with mismatched profileId returns 0/error | MISSING |
| TESTREQ-BW-leads-003 | normalizeVportLead does not expose profileId | MISSING |

### Follow-Up Required

- DB: Inspect `submit_business_card_lead` function body for p_source validation (BW-LEADS-001) + p_ip null path
- CARNAGE: RPC-level guard rejecting `_contacted` source at INSERT (BW-LEADS-001)
- SPIDER-MAN: TESTREQ-BW-leads-001, -002, -003; TESTREQ-DASH-leads-001 (screen integration — still MISSING)
