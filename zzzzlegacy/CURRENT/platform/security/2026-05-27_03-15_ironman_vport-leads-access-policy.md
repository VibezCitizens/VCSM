# IRONMAN Ownership Report — vportLeads Access Policy

**Date:** 2026-05-27
**Time:** 03:15
**Reviewer:** IRONMAN
**Trigger:** BW-008-INFO — BlackWidow flagged that `vportLeads` uses `assertActorOwnsVportActorController` (owner-only) rather than a delegation model. Question: intentional or gap?
**Scope:** VCSM
**Finding:** Owner-only access is INTENTIONAL POLICY — not a feature gap.

---

## IRONMAN TARGET

Feature / Engine: vportLeads — VPORT business card lead management
Application Scope: VCSM
Reason for review: Determine whether the owner-only access policy on vportLeads.controller.js is intentional or should support delegated org/location managers.

---

## 1. Purpose

vportLeads manages contact leads submitted to a VPORT business card. When a visitor submits their contact info via a VPORT's public business card (name, phone, email, message), that data is stored in `vport.business_card_leads` and surfaced to the VPORT owner through the `/actor/:actorId/dashboard/leads` route.

The feature provides four operations: list leads, count new leads, mark a lead as contacted, delete a lead. All four are owner-gated.

---

## 2. Application Scope

VCSM

---

## 3. Code Roots

```
Controller:   apps/VCSM/src/features/dashboard/vport/controller/vportLeads.controller.js
DAL (read):   apps/VCSM/src/features/dashboard/vport/dal/read/vportLeads.read.dal.js
DAL (write):  apps/VCSM/src/features/dashboard/vport/dal/write/vportLeads.write.dal.js
Model:        apps/VCSM/src/features/dashboard/vport/model/vportLead.model.js
Hooks:        apps/VCSM/src/features/dashboard/vport/hooks/useVportLeads.js
              apps/VCSM/src/features/dashboard/vport/hooks/useVportNewLeadsCount.js
Screen:       apps/VCSM/src/features/dashboard/vport/screens/VportDashboardLeadsView.jsx
Component:    apps/VCSM/src/features/dashboard/vport/components/VportLeadsChip.jsx
Auth gate:    apps/VCSM/src/features/booking/controller/assertActorOwnsVportActor.controller.js
              (consumed via booking.adapter.js §5.3 exception)
```

---

## 4. Core Layers

```
DAL:        vportLeads.read.dal.js (profileId-scoped reads)
            vportLeads.write.dal.js (profileId-scoped writes)
Model:      vportLead.model.js (normalizeVportLead — pure transform)
Controller: vportLeads.controller.js (4 operations, all owner-gated)
Hook:       useVportLeads.js (list/mark/delete)
            useVportNewLeadsCount.js (badge count, polls every 60s)
Screen:     VportDashboardLeadsView.jsx (VPORT dashboard leads tab)
Component:  VportLeadsChip.jsx (unread count badge in dashboard nav)
```

---

## 5. Engines Used

None directly. Auth gate uses `assertActorOwnsVportActorController` from `@/features/booking/adapters/booking.adapter` (§5.3 approved cross-feature exception — shared ownership primitive).

---

## 6. Database / Schema Ownership

```
Table:           vport.business_card_leads
Schema:          id, vport_profile_id, actor_id, name, phone, email, message, source, created_at
PII fields:      name, phone, email, message
Sensitivity:     HIGH — personal contact information submitted by potential customers
Read owner:      vportLeads.controller.js (owner-scoped via profileId)
Write owner:     vportLeads.controller.js (mark/delete, owner-scoped via profileId)
RLS owner:       vport schema — profileId-scoped policies (assumed; DB audit via DB command)
Migration owner: Carnage
```

---

## 7. Rule Ownership

```
Actor ownership:  assertActorOwnsVportActorController — DB-verified via actor_owners
Authorization:    Owner-only. No delegation model exists or is modelled.
Leads access:     vport_profile_id scoping at DAL layer (double-gates the DB query)
PII access:       Explicit select columns — no wildcard reads
Delegation:       NOT MODELLED — intentional policy (see determination below)
```

---

## 8. Contracts Touched

- Boundary Isolation Contract: VCSM root, no cross-root access
- Architecture Contract: controller layer enforces auth before DAL, correct layer ordering
- Actor Ownership Contract: assertActorOwnsVportActorController is the canonical ownership gate

---

## 9. Documentation Links

- Security audit: `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-27_02-10_blackwidow_vport-booking-qr-module.md` (BW-008)
- Prior VEMON audit: VPD-V-016 (referenced in controller comment)

---

## 10. Policy Determination

**Owner-only access to vportLeads is INTENTIONAL POLICY.**

### Evidence

**1. Consistency across the entire VPORT dashboard.**
Every dashboard controller uses `assertActorOwnsVportActorController`:
- `vportLeads.controller.js` — 4 operations
- `vportTeamAccess.controller.js` — 5 operations
- `upsertVportRate.controller.js` — rate management
- (others) — service management, gas pricing, exchange rates

No VCSM dashboard controller uses a delegation model. The pattern is uniform and deliberate.

**2. No app-layer delegation infrastructure exists.**
`assertActorCanManageResource` lives at the booking engine layer for booking-resource access. There is no equivalent delegation gate in the VCSM app layer. Building delegation for leads would require building the primitive first — a multi-session product feature, not a one-line fix.

**3. Leads contain PII.**
`business_card_leads` holds submitted names, phone numbers, emails, and messages. This is the most sensitive table in the VPORT dashboard. Owner-only is correct for PII access. Any delegation of PII access requires an explicit product and privacy decision, not a code change.

**4. VPD-V-016 comment establishes explicit intent.**
The comment in `vportLeads.controller.js` documents that the auth gate was deliberately upgraded from a naive string comparison to the canonical DB-verified `assertActorOwnsVportActorController`. The intent was to make the gate MORE restrictive, not to open a delegation path.

**5. Team members don't get dashboard access.**
`vportTeamAccess.controller.js` tracks team members with roles (owner/manager/staff), but team membership does not grant controller access. `assertActorOwnsVportActorController` requires the caller to be in `actor_owners`, not `vport_team_members`. These are separate systems by design.

### Conclusion

Owner-only access is correct for leads. BW-008 correctly noted the system is "more restrictive than necessary for a delegation model" — but the VCSM dashboard currently has no delegation model at all. This is not a security gap; it is the intended boundary.

---

## 11. Responsibilities

- vportLeads owns all read/write access to `vport.business_card_leads` for the dashboard surface
- Auth gate is the canonical `assertActorOwnsVportActorController` (not a DIY ownership check)
- PII fields must not be exposed in public routes or non-owner surfaces

---

## 12. Boundaries

- Must NOT allow non-owners (team members, org managers) to access leads unless a delegation primitive is first built and reviewed by VENOM
- Must NOT use profileId as an authority surface (profileId is resolved internally after ownership verification, not accepted from caller)
- Must NOT expose leads in any public API or non-authenticated route

---

## 13. Change Impact Rules

If vportLeads changes:
- Any relaxation of the ownership gate requires VENOM review
- Any change to PII field exposure requires privacy review
- Any delegation addition requires: new app-layer delegation primitive → VENOM audit → DB policy review (Carnage) → IRONMAN update

---

## 14. Release Gate Notes

No THOR blockers. Owner-only policy is correct. No authorization gap exists.

---

## 15. Open Ownership Questions

**Q: Should team members (manager/staff roles) ever access leads in the future?**
If yes: requires building an `assertActorCanManageVport` primitive at the app layer (analogous to the engine's `assertActorCanManageResource`), plus a VENOM trust-boundary review, plus DB RLS policy updates via Carnage. Not a current requirement.

**Q: Is RLS on `vport.business_card_leads` confirmed?**
Assumed present (vport schema). DB command should verify `vport_profile_id` scoping at the DB layer. Assign to DB if confirmation needed.

---

## IRONMAN OWNERSHIP FINDING

```
IRONMAN OWNERSHIP FINDING
- Finding ID:                     IRONMAN-2026-05-27-001
- Feature / Engine:               vportLeads — VPORT business card lead management
- Application Scope:              VCSM
- Responsibility Type:            Feature ownership, Security ownership, Data ownership
- Ownership Clarity:              CLEAR
- Boundary Risk:                  NONE (current state) / MEDIUM (if delegation ever added)
- Severity:                       LOW (documentation gap only)
- Primary code roots:             apps/VCSM/src/features/dashboard/vport/controller/vportLeads.controller.js
- Core layers:                    DAL → Model → Controller → Hook → Screen
- Engines used:                   None directly; auth gate via booking.adapter §5.3 exception
- Tables / Objects touched:       vport.business_card_leads (PII)
- Rule ownership:                 assertActorOwnsVportActorController — canonical gate, CLEAR
- Contracts touched:              Boundary Isolation, Architecture Contract, Actor Ownership Contract
- Docs touched:                   VPD-V-016 (referenced in code); BW-008 (this review)
- Runtime ownership:              useVportLeads hook → listVportLeadsController →
                                  assertActorOwnsVportActorController → vportLeads DAL
- Current ambiguity:              None. Policy is owner-only, intentional, consistent with all peers.
- Risk:                           If delegation is added in future without VENOM review, PII exposure risk rises.
- Recommended ownership clarification:
                                  Add policy comment to vportLeads.controller.js documenting
                                  owner-only as intentional (not a missing delegation feature).
- Recommended handoff:            None required. Close BW-008.
- Rationale:                      Owner-only is the correct posture for PII leads data.
                                  No delegation infrastructure exists at the app layer.
                                  Consistent with all other VPORT dashboard controllers.
```

---

## RESPONSIBILITY CLASSIFICATION

| Responsibility Type    | Owner                            | Confidence | Notes                               |
|------------------------|----------------------------------|-----------|-------------------------------------|
| Feature ownership      | VCSM / dashboard/vport           | HIGH      | Clear code roots                    |
| Security ownership     | assertActorOwnsVportActorController | HIGH   | Canonical gate, all 4 ops           |
| Data ownership         | vportLeads DAL (profileId-scoped)| HIGH      | PII — explicit select, double-gate  |
| Documentation ownership| IRONMAN (this file)              | HIGH      | No prior Logan doc for this feature |
| Migration ownership    | Carnage                          | HIGH      | vport schema                        |
| Delegation policy      | Product decision (future only)   | N/A       | Not currently modelled              |

---

## Recommended Action (Non-Code)

Add the following policy comment to `vportLeads.controller.js` immediately after the VPD-V-016 comment:

```
// ACCESS POLICY: Owner-only access is intentional for all lead operations.
// vport.business_card_leads contains PII (name, phone, email, message).
// Delegation to team members (manager/staff) or org managers is NOT supported.
// If delegation is ever required, build assertActorCanManageVport at the app layer
// first, then run VENOM trust-boundary review and DB policy review (Carnage) before wiring.
```

BW-008 is CLOSED — no security gap, no implementation change needed beyond this comment.
