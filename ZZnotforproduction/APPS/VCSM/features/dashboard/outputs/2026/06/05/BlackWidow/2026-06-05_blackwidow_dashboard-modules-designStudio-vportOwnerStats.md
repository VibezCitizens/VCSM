# BLACKWIDOW Adversarial Review — Dashboard Modules: designStudio + vportOwnerStats

**Date:** 2026-06-05
**Reviewer:** BLACKWIDOW
**Scope:** VCSM — dashboard/modules/designStudio, dashboard/modules/vportOwnerStats
**VENOM Dependency Gate:** PASS — VEN-DS-001/002/003 produced this session; vportOwnerStats VENOM 2026-06-04
**ARCHITECT Gate:** PASS — both modules ARCHITECT COMPLETE 2026-06-05
**Status:** COMPLETE
**Findings Summary:** 0 CRITICAL | 0 HIGH | 1 MEDIUM | 0 LOW
**Adversarial Results:** 10 BLOCKED | 2 PARTIAL | 0 BYPASSED
**THOR Release Blocker:** CAUTION — BW-DS-001 (MEDIUM/PARTIAL — revoked owner is_void gap; DB state unclear)

---

## Behavior Contract Attack Summary — designStudio

BEHAVIOR.md §7 Must Never Happen — Adversarial Coverage:

| MNH | Invariant | Attack Attempted | Result |
|---|---|---|---|
| MNH-001 | Owner must not mutate another owner's design document | Cross-owner documentId injection | BLOCKED |
| MNH-002 | Caller-supplied documentId must not bypass ownership verification | Bare documentId without owner | BLOCKED |
| MNH-003 | Page version must not insert without owner binding | Cross-owner documentId on save | BLOCKED |
| MNH-004 | Page must not be created in unowned document | Cross-owner documentId on create | BLOCKED |
| MNH-005 | Page must not be deleted from unowned document | Cross-owner pageId on delete | BLOCKED |
| MNH-006 | Export/render job must not queue for unowned document | Cross-owner documentId on export | BLOCKED |
| MNH-007 | Export refresh must not expose unowned exports | Cross-owner documentId on refresh | BLOCKED |
| MNH-008 | Revoked owner row must not satisfy owner gate | is_void=true owner row | PARTIAL — DAL gap confirmed |
| MNH-009 | Document must not be created without authenticated owner access | Unauthenticated load attempt | BLOCKED |
| MNH-010 | Invalid scene content must not be persisted without normalization | Malformed scene injection | BLOCKED |
| MNH-011 | Final remaining page must not be deleted | Single-page delete | BLOCKED |

§9 Invariants with BYPASSED result: NONE.

---

## FINDING: BW-DS-001

```
Finding ID:     BW-DS-001
Title:          Revoked Owner Bypass — is_void Gap Confirmed in DAL Source
Severity:       MEDIUM
Adversarial Result: PARTIAL
THOR Blocker:   CAUTION — not a hard release blocker; depends on DB soft-delete behavior
Status:         OPEN
VENOM Cross-Reference: VEN-DS-001

Attack Scenario:
  1. Actor A owns VPORT P.
  2. Ownership is revoked — actor_owners row for A/P has is_void set to true
     (soft-delete mechanism).
  3. Actor A calls any designStudio controller with ownerActorId=P_actor_id.
  4. dalReadAuthenticatedUserId() returns Actor A's user_id (valid session).
  5. dalReadActorOwnerRow({ actorId: P_actor_id, userId: A_user_id }):
     SELECT actor_id,user_id FROM vc.actor_owners
     WHERE actor_id = P_actor_id AND user_id = A_user_id
     ← NO is_void filter
  6. Row with is_void=true is returned → non-null → gate passes.
  7. requireOwnerActorAccess: !ownerRow check passes → userId returned.
  8. Full write access to design documents, pages, exports.

Adversarial Result: PARTIAL
  Code path confirmed BYPASSED IF is_void is used as soft-delete mechanism.
  DB behavior UNVERIFIED — if ownership revocation hard-deletes the row, BLOCKED.
  If ownership revocation soft-deletes (is_void=true), BYPASSED.

Evidence Location:
  designStudio.read.dal.js:5-15 — missing .eq("is_void", false)
  designStudio.shared.controller.js:10-18 — only null-checks ownerRow

Impact:
  Revoked VPORT owners retain full design studio access indefinitely
  (until row is hard-deleted, if that ever happens).

Required Follow-up: DB — confirm is_void soft-delete or hard-delete behavior for actor_owners
```

---

## BLOCKED Adversarial Scenarios — designStudio

| Scenario | Attack Vector | Result | Evidence |
|---|---|---|---|
| Cross-owner documentId on save | ownerActorId valid, documentId owned by other | BLOCKED | requireDesignDocumentOwnerAccess: document.owner_actor_id !== ownerActorId → throw |
| Cross-owner documentId on page create | Same as above | BLOCKED | ctrlCreateDesignPage:74 requireDesignDocumentOwnerAccess |
| Cross-owner pageId on delete | Own documentId + other's pageId | BLOCKED | dalListDesignPagesByDocument(documentId) → pages.find(pageId) → throws Page not found |
| Unauthenticated design studio access | No session | BLOCKED | dalReadAuthenticatedUserId: !userId → throw "Sign in required." |
| Stale session replay | Expired JWT | BLOCKED | supabase.auth.getUser() validates active session |
| Cross-owner pageId on version save | Own documentId + other's pageId | BLOCKED | ctrlSaveDesignPageScene:37 pageRow.document_id !== documentId → throw |
| Export for unowned document | Cross-owner documentId on export queue | BLOCKED | ctrlQueueDesignExport calls requireDesignDocumentOwnerAccess |
| Final page delete | Single page in document | BLOCKED | ctrlDeleteDesignPage:127 pages.length <= 1 → throw |
| MAX_PAGES_PER_DOCUMENT bypass | Create page when limit reached | BLOCKED | ctrlCreateDesignPage:77 pages.length >= MAX_PAGES_PER_DOCUMENT → throw |
| Scene content injection | Malformed scene JSON | BLOCKED | ensureSceneContent normalizes before insert |

---

## Module: vportOwnerStats — Carry Forward

Prior BLACKWIDOW run: 2026-06-04 — all scenarios BLOCKED except BW-VPORTOS-001 (PATCHED)

This pass adds no new adversarial attacks on vportOwnerStats — read-only controller with
full ownership verification chain confirmed in prior session.

BW-VPORTOS-001: LOW/HARDENED — lifecycle guard patched; TESTREQ-BW-vportOwnerStats-001 MISSING.

---

## Required Follow-up

| Command | Reason | Priority |
|---|---|---|
| DB | Confirm actor_owners revocation mechanism (is_void soft-delete vs hard-delete) | P1 |
| DB | Verify vc.design_* RLS policies filter is_void from actor_owners JOIN (if any) | P1 |
| SPIDER-MAN | Add revoked owner regression test once DB behavior confirmed | P2 |

---

## SOURCE READ SUMMARY

Full Rediscovery Performed: YES — VENOM findings consumed as attack starting points
VENOM Report Consumed: 2026-06-05 (produced this session)
BEHAVIOR.md §7 Attacked: YES — all 11 MNH invariants attacked
