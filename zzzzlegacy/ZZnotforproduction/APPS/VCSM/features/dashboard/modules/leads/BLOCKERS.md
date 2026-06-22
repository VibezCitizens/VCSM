# Blockers — dashboard/modules/leads

Last Updated: 2026-06-04
Owner: THOR

---

## THOR-LEADS-BLOCK-001

Blocker: Edge Function JWT validation absent
Source Finding: VEN-LEADS-001 (VENOM) / ELEK-2026-06-04-001 (ELEKTRA) / HAWK-F-001 (HAWKEYE)
Severity: HIGH
Blocking Since: 2026-06-04
THOR Gate: YES

Description: `send-lead-confirmation` Edge Function performs a Bearer presence-only check (startsWith "Bearer "). No JWT signature validation. The Supabase anon key is public in all frontend bundles. Any external caller can invoke the function directly and send Vibez Citizens-branded emails to arbitrary addresses. SES reputation risk, phishing vector, AWS suspension risk.

Required Resolution: Patch Edge Function to validate JWT against Supabase project signing secret. Optionally add per-email cooldown and lead-ID binding.
Owner: Unassigned (IRON-LEADS-003 — Wolverine must assign)
Resolution Path: VENOM patches → ELEKTRA verifies source-to-sink → SECURITY.md updated → DR. STRANGE re-runs

---

## THOR-LEADS-BLOCK-002

Blocker: RLS SELECT policy existence unconfirmed
Source Finding: VEN-LEADS-004 (VENOM)
Severity: MEDIUM
Blocking Since: 2026-06-04
THOR Gate: YES

Description: `business_card_leads_owner_select` RLS SELECT policy on `vport.business_card_leads` is referenced in governance docs but the defining migration was not recovered during the VENOM scan. The policy may or may not exist on the live database. Until confirmed, the SELECT path's data-layer defense cannot be assessed.

Required Resolution: DB command queries `pg_policies` on `vport.business_card_leads` and confirms the SELECT policy exists with correct USING expression. If missing, CARNAGE writes the migration.
Owner: DB command
Resolution Path: DB run → SECURITY.md updated → VEN-LEADS-004 closed

---

## THOR-LEADS-BLOCK-003

Blocker: SECURITY.md output routing contract violation
Source Finding: DRIFT-LEADS-001 (DR. STRANGE) / §10.4 contract
Severity: HIGH (governance)
Blocking Since: 2026-06-04
THOR Gate: YES

Description: ELEKTRA and BLACKWIDOW both produced primary output files on 2026-06-04. Neither command updated SECURITY.md. The domain file still shows `ELEKTRA Status: NOT RUN` and `BLACKWIDOW Status: NOT RUN`, which is factually incorrect. The security posture record is inaccurate. THOR cannot evaluate a feature's security posture from a stale domain file.

Required Resolution: LOGAN updates SECURITY.md with summaries of the ELEKTRA and BLACKWIDOW runs. Status fields must reflect actual run state. DR. STRANGE must re-run to confirm correction.
Owner: LOGAN
Resolution Path: LOGAN updates SECURITY.md → DR. STRANGE re-runs → DRIFT-LEADS-001 closed

---

## THOR-LEADS-BLOCK-004

Blocker: BEHAVIOR.md DRAFT — not APPROVED
Source Finding: Behavior Release Gate Gate 1
Severity: HIGH (governance)
Blocking Since: 2026-06-04
THOR Gate: YES

Description: BEHAVIOR.md exists and is well-populated (6 happy paths, 9 failure paths, 6 security rules, 6 MNH invariants, 8 ACs, 8 TESTREQs). Status is DRAFT. THOR requires APPROVED status for P1 features before release. APPROVED requires: all §9 invariants have passing tests, VENOM has confirmed §5 rules, and PROFESSOR X has signed off.

Required Resolution: (1) SPIDER-MAN writes TESTREQ-DASH-leads-001. (2) PROFESSOR X reviews BEHAVIOR.md. (3) Status advanced to APPROVED.
Owner: Wolverine (orchestration) → SPIDER-MAN → PROFESSOR X
Resolution Path: TESTREQ-001 written → PROFESSOR X review → BEHAVIOR.md status = APPROVED → THOR re-evaluates

---

## THOR-LEADS-BLOCK-005

Blocker: AC-DASH-leads-001 untested — non-owner screen mount has no passing test
Source Finding: Behavior Release Gate Gate 3
Severity: MEDIUM
Blocking Since: 2026-06-04
THOR Gate: YES

Description: AC-DASH-leads-001 requires that the lead inbox renders only for target VPORT owners. TESTREQ-DASH-leads-001 (screen/hook integration test confirming unauthenticated and non-owner viewers cannot mount the view) is MISSING. The ownership gate is source-verified but not test-covered at the screen/hook level.

Required Resolution: SPIDER-MAN writes the integration test for TESTREQ-DASH-leads-001.
Owner: SPIDER-MAN
Resolution Path: Test written → TESTS.md updated → AC-DASH-leads-001 marked TEST COVERED → BEHAVIOR.md can advance to APPROVED
