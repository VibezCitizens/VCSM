# DR. STRANGE Report — leads

## Metadata

- Date: 2026-06-04
- Feature: leads (dashboard module)
- Command: DR. STRANGE
- Output file: ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/outputs/2026/06/04/dr-strange/001_dr-strange_leads_status-oracle.md
- Read-only inputs used:
  - ZZnotforproduction/GOVERNANCE/FEATURE_STATUS.md
  - ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/README.md
  - ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/CURRENT_STATUS.md
  - ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/SECURITY.md
  - ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/ARCHITECTURE.md
  - ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/BEHAVIOR.md
  - apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/ (directory listing)

---

## Scorecard

| Category | Score |
|---|---|
| Governance | 50% — 4 of 8 standard CURRENT files present |
| Documentation | 100% — README + CURRENT_STATUS both populated |
| Security | 50% — SECURITY.md exists; open HIGH findings remain |
| Architecture | 100% — ARCHITECTURE.md present and dated 2026-06-04 |
| Ownership | 0% — OWNERSHIP.md missing |
| Testing | 0% — TESTS.md missing (source tests exist; SPIDER-MAN not run) |
| Performance | 0% — PERFORMANCE.md missing |
| Command Coverage | 15% — 2.5 / 17 applicable commands |
| THOR Eligibility | 0% — BLOCKED |
| DR. STRANGE Readiness | 35% |

---

## Current Status

`leads` is the VPORT owner's PII management surface for business card scan leads. A lead is a contact record (name, phone, email, message) created when someone scans the VPORT's public business card QR code. The module provides list, count, mark-contacted, delete, and fast-count-poll operations — all gated to the VPORT owner only. No team delegation.

ARCHITECT ran 2026-06-04: architecture STABLE, Rule 9 compliant, ownership gate consistent across all 5 operations. Two open ARCHITECT findings (ARC-LEADS-001 LOW accepted cross-module DAL pattern; ARC-LEADS-002 MEDIUM 60s polling routed to KRAVEN).

VENOM ran 2026-06-04: 6 open findings. Two are THOR BLOCKERS — Edge Function JWT absence (VEN-LEADS-001 HIGH) and unverified RLS SELECT policy (VEN-LEADS-004 MEDIUM). Both block release.

BEHAVIOR.md exists at DRAFT status — reverse-engineered via TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001. Not yet APPROVED.

**DRIFT DETECTED — P2:** BEHAVIOR.md §19 declares ELEKTRA: COMPLETE and BLACKWIDOW: COMPLETE. SECURITY.md contradicts both — ELEKTRA: NOT RUN, BLACKWIDOW: NOT RUN. The security file is the authoritative source. Either SECURITY.md was not updated after those commands ran, or BEHAVIOR.md was written aspirationally. LOGAN must reconcile before THOR proceeds.

---

## Open Blockers

No BLOCKERS.md present. Active blockers identified from SECURITY.md:

| Blocker | Severity | Source |
|---|---|---|
| VEN-LEADS-001 — Edge Function `send-lead-confirmation`: Bearer token is presence-only (no JWT validation). Anon key public in bundle → email spam abuse. | HIGH — THOR BLOCKER | SECURITY.md |
| VEN-LEADS-004 — `business_card_leads_owner_select` RLS SELECT policy referenced but defining migration not recovered. DB must confirm policy exists. | MEDIUM — THOR BLOCKER | SECURITY.md |

---

## Deferred Items

No DEFERRED.md present. Deferred items identified from SECURITY.md and BEHAVIOR.md:

| Item | Source |
|---|---|
| DEFER-009 — Public lead submission RPC + `send-lead-confirmation` Edge Function governance | BEHAVIOR.md §13, SECURITY.md follow-up |
| LEADS-PUBLIC-RPC-001 — `submit_business_card_lead` RPC governance at DB level | BEHAVIOR.md §13 |
| LEADS-ROUTE-001 — Route documentation drift (LOW) | BEHAVIOR.md §13 |
| OQ-DASH-leads-003 — mark-contacted: dedicated `contacted_at` column vs. encoding in `source` | BEHAVIOR.md §17 |
| OQ-DASH-leads-004 — delete: soft-delete vs. hard delete audit trail | BEHAVIOR.md §17 |

---

## Security Posture

Source: SECURITY.md (Last Updated: 2026-06-04)

Highest Open Severity: **HIGH**
THOR Release Blocker: **YES — VEN-LEADS-001, VEN-LEADS-004**

| Finding | Severity | Status | Summary |
|---|---|---|---|
| VEN-LEADS-001 | HIGH | OPEN — THOR BLOCKER | Edge Function Bearer token: presence-only check, no JWT validation. Anon key in bundle → spam vector. |
| VEN-LEADS-002 | MEDIUM | OPEN | `submit_business_card_lead` RPC: no rate limiting; VPORT lead inbox flood risk. |
| VEN-LEADS-003 | MEDIUM | OPEN | `traze_provider_lead_contacted` source variant missing from DB CHECK constraint. Route to CARNAGE. |
| VEN-LEADS-004 | MEDIUM | OPEN — THOR BLOCKER | `business_card_leads_owner_select` RLS SELECT policy — defining migration not recovered. DB must confirm. |
| VEN-LEADS-005 | LOW | OPEN | CORS browser-enforcement only; fix inherited from VEN-LEADS-001. |
| VEN-LEADS-006 | LOW | OPEN | `readNewLeadsCountByProfileDAL` silently returns 0 on error — invisible DB regression. |

Confirmed safe (source verified):
- Final screen ownership gate: SOURCE VERIFIED
- All 5 owner controllers assert `assertActorOwnsVportActorController` before any DAL call: SOURCE VERIFIED
- Write DALs scope by leadId + profileId: SOURCE VERIFIED
- RLS UPDATE + DELETE policies: SOURCE VERIFIED in migrations
- Rule 9 public barrel: RESOLVED
- Fast count ownership gate: PATCHED + SOURCE VERIFIED
- Direct INSERT blocked (WITH CHECK false + grants revoked): SOURCE VERIFIED
- Legacy RPC overload dropped: SOURCE VERIFIED
- Source allowlist constraint deployed: SOURCE VERIFIED

ELEKTRA: NOT RUN (per SECURITY.md — contradicts BEHAVIOR.md §19, see Drift)
BLACKWIDOW: NOT RUN (per SECURITY.md — contradicts BEHAVIOR.md §19, see Drift)

---

## Architecture State

Source: ARCHITECTURE.md (Last Updated: 2026-06-04)

Last ARCHITECT run: 2026-06-04
Architecture State: STABLE

Key decisions in effect:
- Full layer stack: DAL (read + write) → Model → Controller → Hook → Screen
- All 5 controller operations assert ownership before any profile resolution or DAL access
- Write DALs additionally scope by profileId AND leadId (defense in depth)
- No engine dependencies — direct Supabase DAL calls only
- Rule 9 compliant: index.js exports models, hooks, screens only
- Cross-module DAL import from parent vport DAL is accepted dashboard card pattern (ARC-LEADS-001 LOW)
- Access is OWNER ONLY — no team/staff delegation by design

Known structural risks:
- ARC-LEADS-002 MEDIUM: 60s polling fires ownership-gated DB call every cycle → route to KRAVEN

---

## Missing Governance Files

| File | Priority | Action |
|---|---|---|
| OWNERSHIP.md | P3 | Run IRONMAN |
| TESTS.md | P3 | Run SPIDER-MAN (source tests exist: vportLeads.controller.test.js, leads.index.rule9.test.js) |
| PERFORMANCE.md | P3 | Run KRAVEN (ARC-LEADS-002 already routed there) |
| HISTORY_INDEX.md | P3 | LOGAN must create |

BEHAVIOR.md is present but DRAFT — not a gap for now; becomes a P2 THOR gate when APPROVED status is required.

---

## Drift Detected

**DRIFT-LEADS-001 — P2 — SECURITY.md vs. BEHAVIOR.md command sign-off contradiction**

| File | ELEKTRA | BLACKWIDOW |
|---|---|---|
| SECURITY.md (authoritative) | NOT RUN | NOT RUN |
| BEHAVIOR.md §19 | COMPLETE WITH CAUTION | COMPLETE WITH CAUTION |

SECURITY.md is the canonical authority for security command status. BEHAVIOR.md §19 appears to have been written ahead of actual runs, or SECURITY.md was not updated after the runs. LOGAN must reconcile — if both commands ran, SECURITY.md must be updated with their findings. If they did not run, BEHAVIOR.md §19 must be corrected.

---

## Last Audit Dates

| Command | Last Run | Finding Summary |
|---|---|---|
| VENOM | 2026-06-04 | 6 open findings; 2 THOR BLOCKERS |
| ELEKTRA | NEVER (per SECURITY.md) | — |
| BLACKWIDOW | NEVER (per SECURITY.md) | — |
| ARCHITECT | 2026-06-04 | STABLE; 2 open findings (LOW + MEDIUM) |
| KRAVEN | NEVER | ARC-LEADS-002 routed here |
| SPIDER-MAN | NEVER | Tests exist in source; not formally documented |
| SENTRY | NEVER | — |
| HAWKEYE | NEVER | — |
| IRONMAN | NEVER | — |
| WATCHER | NEVER | — |
| LOKI | NEVER | — |
| DB | NEVER | Needed: confirm business_card_leads_owner_select RLS; inspect submit_business_card_lead rate logic |
| THOR | NEVER | BLOCKED |

---

## Command Coverage Matrix

Feature: leads (dashboard module)
Applicable Commands: 17 (WINTER SOLDIER N/A — no Android app)
Coverage Score: 2.5 / 17
Coverage %: 15%

| Command | Status | Last Run | Evidence | Next Action |
|---|---|---|---|---|
| ARCHITECT | ✅ COMPLETE | 2026-06-04 | ARCHITECTURE.md + output file confirmed | — |
| VENOM | 🟡 PARTIAL | 2026-06-04 | SECURITY.md: 6 open findings; 2 HIGH THOR BLOCKERS | Patch VEN-LEADS-001 + VEN-LEADS-004; re-run |
| ELEKTRA | ⬜ NOT RUN | NEVER | SECURITY.md: "ELEKTRA Status: NOT RUN" — contradicts BEHAVIOR.md §19 | Run ELEKTRA; reconcile drift |
| BLACKWIDOW | ⬜ NOT RUN | NEVER | SECURITY.md: "BLACKWIDOW Status: NOT RUN" — contradicts BEHAVIOR.md §19 | Run after ELEKTRA; reconcile drift |
| SENTRY | ⬜ NOT RUN | NEVER | No evidence | Schedule |
| IRONMAN | ⬜ NOT RUN | NEVER | OWNERSHIP.md missing | Run IRONMAN |
| SPIDER-MAN | ⬜ NOT RUN | NEVER | TESTS.md missing; source tests exist but not formally documented | Run SPIDER-MAN |
| KRAVEN | ⬜ NOT RUN | NEVER | PERFORMANCE.md missing; ARC-LEADS-002 routed here (60s poll) | Run KRAVEN |
| THOR | 🔴 BLOCKED | NEVER | Open HIGH THOR BLOCKERS: VEN-LEADS-001, VEN-LEADS-004 | Unblock VENOM findings first |
| CARNAGE | ⏳ PENDING | NEVER | VEN-LEADS-003 routes here: traze_provider_lead_contacted constraint migration needed | Execute after DB confirms scope |
| DB | ⬜ NOT RUN | NEVER | SECURITY.md routes: confirm RLS SELECT policy; inspect RPC rate logic | Run DB |
| HAWKEYE | ⬜ NOT RUN | NEVER | No evidence | Not urgent; schedule |
| WATCHER | ⬜ NOT RUN | NEVER | No evidence | Optional |
| FALCON | ⬜ NOT RUN | NEVER | BEHAVIOR.md §15: all native parity items "OPEN QUESTION" | Schedule after PWA coverage solid |
| WINTER SOLDIER | — N/A | — | No Android app | — |
| LOGAN | 🟡 PARTIAL | 2026-06-04 | README + CURRENT_STATUS present; BEHAVIOR.md created by Wolverine ticket | Reconcile DRIFT-LEADS-001 |
| WOLVERINE | 🟡 PARTIAL | 2026-06-04 | BEHAVIOR.md by TICKET-BEHAV-DASHBOARD-BATCH-REVERSE-ENGINEER-0001 | Resolve VEN-LEADS-001 sprint |
| DR. STRANGE | ✅ COMPLETE | 2026-06-04 | This run | — |

COVERAGE SUMMARY:
  Complete: 2   Partial: 3   Pending: 1
  Not Run:  9   Blocked: 1   N/A:     1
  Coverage %: 15%  (2.0 + 1.5 partial = 3.5pts; wait — see note below)

Note on score: ARCHITECT (1.0) + VENOM (0.5) + LOGAN (0.5) + WOLVERINE (0.5) + DR.STRANGE (1.0) = 3.5 / 17 = 20.6% including this DR.STRANGE run.

```
COVERAGE THRESHOLD CHECK
Feature: leads (dashboard module)
Security Tier: HIGH
Coverage %: 21% (post this run)
Minimum for THOR Eligible: 30%
Status: BELOW MINIMUM
Hard Floor (15%): ABOVE FLOOR
```

Below THOR Eligible minimum for HIGH tier — adds a CAUTION item.

---

## BEHAVIOR Contract Coverage

| Feature | BEHAVIOR.md | Status | BEH IDs | AC IDs | TESTREQs | THOR Eligible |
|---|---|---|---|---|---|---|
| leads | YES | DRAFT | 21 (HP×6, FP×9, SEC×7, MNH×6) | 8 | 8 | BLOCKED — DRAFT only |

Behavior Coverage Rating: **PARTIAL** — BEHAVIOR.md exists but status is DRAFT. Must reach APPROVED before THOR considers it.

§9 (Side Effects): 7 entries documented — Notifications, Analytics, Media, Exports, Jobs, Cache, Other. All accounted for.

TESTREQs with MISSING status: TESTREQ-DASH-leads-001 (screen/hook non-owner mount), TESTREQ-DASH-leads-007 (route map assertion).
TESTREQs PARTIAL: TESTREQ-DASH-leads-003 (mark-contacted DAL argument coverage still missing).
TESTREQ EXTERNAL: TESTREQ-DASH-leads-006, TESTREQ-DASH-leads-008 (tracked under DEFER-009).

---

## THOR Eligibility

Status: **🔴 BLOCKED**

Blocking Reasons:
- VEN-LEADS-001 HIGH OPEN — Edge Function JWT validation absent. THOR BLOCKER.
- VEN-LEADS-004 MEDIUM OPEN — `business_card_leads_owner_select` RLS SELECT policy unverified. THOR BLOCKER.
- BLACKWIDOW = NOT RUN and feature has write paths (mark-contacted, delete). Per §19.2: THOR BLOCKED until BLACKWIDOW runs on write path.
- ELEKTRA = NOT RUN. Per §19.2: THOR BLOCKED if ELEKTRA has not run on a controller/DAL surface. (Drift with BEHAVIOR.md must be resolved.)
- BEHAVIOR.md status DRAFT — not APPROVED. THOR requires APPROVED behavior contract for ELIGIBLE.

Caution Items (would apply if blockers resolved):
- SPIDER-MAN NOT RUN — hook/screen coverage unknown (source tests exist for controller/Rule 9 only)
- KRAVEN NOT RUN — 60s polling performance unknown (ARC-LEADS-002 routed there)
- CARNAGE PENDING — traze_provider_lead_contacted constraint migration unexecuted
- Coverage 21% — below 30% minimum for HIGH tier THOR Eligible

Required Before THOR:
  [ ] VENOM — patch VEN-LEADS-001 (Edge Function JWT) and verify VEN-LEADS-004 (RLS SELECT)
  [ ] ELEKTRA — run; update SECURITY.md; resolve DRIFT-LEADS-001
  [ ] BLACKWIDOW — run on write paths (mark-contacted, delete)
  [ ] DB — confirm business_card_leads_owner_select RLS policy exists
  [ ] CARNAGE — execute traze_provider_lead_contacted constraint migration
  [ ] BEHAVIOR.md — advance from DRAFT to APPROVED

Estimated commands to THOR Eligible: 6 required + 3 recommended (SPIDER-MAN, KRAVEN, IRONMAN)

---

## Governance Gaps

| Gap | File | Priority | Action |
|---|---|---|---|
| DRIFT-LEADS-001 | SECURITY.md vs BEHAVIOR.md §19 (ELEKTRA/BLACKWIDOW status) | P2 | LOGAN reconciles |
| OWNERSHIP.md missing | OWNERSHIP.md | P3 | Run IRONMAN |
| TESTS.md missing | TESTS.md | P3 | Run SPIDER-MAN |
| PERFORMANCE.md missing | PERFORMANCE.md | P3 | Run KRAVEN |
| HISTORY_INDEX.md missing | HISTORY_INDEX.md | P3 | LOGAN creates |

No P1 gaps. CURRENT folder present. Security posture documented. Architecture documented.

---

## Current File Locations

| Document | Path | Status |
|---|---|---|
| Feature Status | ZZnotforproduction/GOVERNANCE/FEATURE_STATUS.md | PRESENT |
| Feature Overview | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/README.md | PRESENT |
| Current Status Note | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/CURRENT_STATUS.md | PRESENT |
| Security Posture | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/SECURITY.md | PRESENT |
| Architecture State | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/ARCHITECTURE.md | PRESENT |
| Behavior Contract | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/BEHAVIOR.md | PRESENT — DRAFT |
| Ownership | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/OWNERSHIP.md | MISSING |
| Test Coverage | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/TESTS.md | MISSING |
| Performance | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/PERFORMANCE.md | MISSING |
| Deferred Items | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/DEFERRED.md | NOT PRESENT (optional) |
| Blockers | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/BLOCKERS.md | NOT PRESENT (optional) |
| History Index | ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/HISTORY_INDEX.md | MISSING |

---

## Commands to Run Next

No planned work declared. Based on current state, the recommended sequence is:

**Sprint: Unblock THOR**

Priority 1 (THOR hard blockers — run in order):
1. **DB** — confirm `business_card_leads_owner_select` RLS SELECT policy exists (VEN-LEADS-004)
2. **ELEKTRA** — trace VEN-LEADS-001 source-to-sink; update SECURITY.md; resolve DRIFT-LEADS-001
3. **BLACKWIDOW** — runtime adversarial pass on mark-contacted and delete write paths
4. **CARNAGE** — traze_provider_lead_contacted constraint migration (VEN-LEADS-003)

Priority 2 (THOR soft blockers — close after sprint):
5. **SPIDER-MAN** — screen/hook integration test coverage; TESTREQ-DASH-leads-001, TESTREQ-DASH-leads-003 missing
6. **KRAVEN** — 60s polling bottleneck (ARC-LEADS-002)
7. **BEHAVIOR.md** — advance to APPROVED after ELEKTRA/BLACKWIDOW findings are incorporated

Priority 3 (gap closure):
8. **IRONMAN** — ownership and responsibility document
9. **LOGAN** — HISTORY_INDEX.md; reconcile DRIFT-LEADS-001

To receive targeted routing for specific planned work, re-run:
`/Dr.Strange leads — I am going to [description of planned changes]`

---

## Output Routing Reminder

Every command that runs on leads must write to TWO locations:

  Primary output (immutable, dated):
  ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/outputs/YYYY/MM/DD/[COMMAND]/YYYY-MM-DD_[command]_leads.md

  CURRENT update (in-place, always latest):
  ZZnotforproduction/APPS/VCSM/features/dashboard/modules/leads/[SECURITY|ARCHITECTURE|OWNERSHIP|TESTS|PERFORMANCE].md

Commands that write a primary output but do not update the CURRENT domain file are in contract violation. Notify LOGAN.

---

## Recommended Next Ticket

**TICKET-LEADS-THOR-UNBLOCK-001** — Resolve VEN-LEADS-001 and VEN-LEADS-004 to clear the two active THOR hard blockers on the leads module.

## Recommended Next Command

**DB** — The fastest THOR blocker to close is VEN-LEADS-004: run DB to confirm `business_card_leads_owner_select` RLS SELECT policy exists on `vport.business_card_leads`. If confirmed, VEN-LEADS-004 drops from THOR BLOCKER to closed. Removes one of two hard THOR gates in a single read-only pass.

---

## Final Verdict

**BLOCKED**

Two active THOR hard blockers (VEN-LEADS-001 HIGH, VEN-LEADS-004 MEDIUM). BLACKWIDOW and ELEKTRA not confirmed run. BEHAVIOR.md at DRAFT. Coverage at 21% — below 30% HIGH-tier minimum. The ownership gates are solid and architecture is clean. This feature is well-built at the application layer; the gap is at the external surface (Edge Function JWT, RLS policy confirmation) and governance completeness (ELEKTRA/BLACKWIDOW drift, BEHAVIOR.md approval).
