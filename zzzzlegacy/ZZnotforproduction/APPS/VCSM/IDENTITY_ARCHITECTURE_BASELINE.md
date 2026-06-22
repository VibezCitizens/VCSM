---
name: vcsm.identity-architecture-baseline
description: Canonical identity surface baseline for VCSM — parameter inventory, injection surfaces, drift detection rules, and monitoring contract. Supersedes all prior identity surface mappings.
metadata:
  type: identity-baseline
  ticket: TICKET-MONITOR-IDENTITY-BASELINE-001
  date: 2026-06-07
  source: TICKET-CODE-INVENTORY-PARAMETERS-001 (Reports 1–4)
  status: ACTIVE
---

# VCSM Identity Architecture Baseline
**Established:** 2026-06-07
**Ticket:** TICKET-MONITOR-IDENTITY-BASELINE-001
**Status:** CANONICAL — treat as authoritative until replaced by a newer inventory

---

## Source Reports

All four reports are co-located at:
`ZZnotforproduction/APPS/VCSM/outputs/2026/06/`

| Report | File | Contents |
|---|---|---|
| Report 1 | `07.TICKET-CODE-INVENTORY-PARAMETERS-001.report-1-function-inventory.md` | Full function inventory by feature and type |
| Report 2 | `07.TICKET-CODE-INVENTORY-PARAMETERS-001.report-2-identity-parameter-inventory.md` | Identity parameter inventory grouped by category |
| Report 3 | `07.TICKET-CODE-INVENTORY-PARAMETERS-001.report-3-parameter-frequency.md` | Parameter frequency analysis — top 50 all, top 50 identity |
| Report 4 | `07.TICKET-CODE-INVENTORY-PARAMETERS-001.report-4-identity-injection-surfaces.md` | Tier 1–4 injection surface mapping |

---

## Baseline Metrics

These are the authoritative counts as of 2026-06-07. Future scans must compare against these.

| Metric | Baseline Value |
|---|---|
| Total functions | 4,173 |
| Total parameter occurrences | 8,001 |
| Unique parameter names | 2,033 |
| Average parameters per function | 1.92 |
| Identity parameter occurrences | 1,306+ |
| Functions with identity parameters | 1,025 |
| Tier 1 mutation controllers | 33 |
| Tier 1 mutation DAL | 12 |
| Tier 2 read controllers | 17 |
| Tier 2 read DAL | 8 |
| Tier 3 hook propagation surfaces | 178 |
| Tier 4 UI-only surfaces | 112 |

---

## Baseline: Top Identity Parameters

| Rank | Parameter | Baseline Count | Category |
|---|---|---|---|
| 1 | actorId | 574 | Actor identity |
| 2 | targetActorId | 78 | Target actor |
| 3 | realmId | 76 | Realm routing |
| 4 | userId | 72 | Raw auth UID |
| 5 | viewerActorId | 56 | Read-scope viewer |
| 6 | callerActorId | 55 | Mutation caller |
| 7 | profileId | 48 | Profile row ID |
| 8 | ownerActorId | 47 | Resource owner |
| 9 | vportId | 39 | VPORT row ID |
| 10 | actorIds | 20 | Plural batch |
| 11 | identityActorId | 15 | Internal resolution |
| 12 | requesterActorId | 15 | Internal ownership |
| 13 | blockedActorId | 10 | Block target |
| 14 | requestActorId | 10 | Booking gate |
| 15 | vportActorId | 10 | VPORT actor |
| 16 | profileActorId | 10 | Profile actor ref |
| 17 | assertingActorId | 9 | Assertion context |
| 18 | barberVportActorId | 9 | Join flow |
| 19 | recipientActorId | 9 | Notification target |
| 20 | studentActorId | 9 | Learning |
| 21 | followerActorId | 8 | Social |
| 22 | followedActorId | 8 | Social |
| 23 | memberActorId | 7 | Chat |
| 24 | blockerActorId | 5 | Block |
| 25 | createdByActorId | 5 | Media authorship |
| 26 | observerActorId | 5 | Audit observer |
| 27 | profileIds | 5 | Plural batch |
| 28 | friendActorIds | 5 | Social graph |
| 29 | myActorId | 4 | Self-ref hooks |
| 30 | currentActorId | 4 | Identity engine |
| 31 | userAppAccountId | 4 | Legal consent |
| 32 | senderActorId | 4 | Notification sender |
| 33 | moderatorActorId | 4 | Moderation |
| 34 | realmIdProp | 4 | UI prop variant |
| 35 | reporterActorId | 3 | Moderation author |
| 36 | resolvedActorId | 3 | Resolution output |
| 37 | actorIdProp | 3 | UI prop variant |
| 38 | targetVportId | 3 | Dashboard |
| 39 | fallbackProfileId | 2 | Fallback |
| 40 | candidateActorIds | 2 | Social suggestions |
| 41 | customerActorId | 2 | Booking customer |
| 42 | requestedByActorId | 2 | Follow request |
| 43 | inviterActorId | 2 | Invite attribution |
| 44 | actorIdFromSlug | 2 | Slug resolution |
| 45 | reviewAuthorActorId | 2 | Review authorship |
| 46 | ownerCustomerActorId | 2 | Dual ownership |
| 47 | setOwnerCustomerActorId | 2 | Setter for above |
| 48 | targetActorIdProp | 2 | UI prop variant |
| 49 | vcRealmId | 2 | vc schema realm |
| 50 | wandersRealmId | 1 | Wanders realm |

---

## Baseline: Identity Surface by Feature

| Feature | Identity Params | Tier 1 Surfaces |
|---|---|---|
| profiles | 291 | many |
| learning | 177 | many |
| vportDashboard | 168 | many |
| settings | 95 | 6 controllers |
| social | 65 | 4 controllers |
| dev | 54 | 0 (diagnostics only) |
| post | 49 | 2 controllers |
| feed | 46 | read-only |
| state | 35 | 1 controller (switchActor) |
| booking | 33 | 7 controllers |
| chat | 33 | 2 controllers |
| notifications | 33 | 2 controllers |
| block | 30 | 3 controllers |
| flyerBuilder | 28 | 2 controllers |
| moderation | 27 | 3 controllers |
| public | 20 | 0 (read-only) |
| auth | 18 | 1 controller |
| initiation | 18 | 6 controllers |
| legal | 12 | 3 controllers |
| wanders | 11 | 1 controller |
| join | 10 | 3 controllers |
| identity | 8 | 1 controller |
| vport | 8 | 0 (dormant updateVport) |
| wanderex | 8 | 1 controller |
| ads | 6 | 0 |
| media | 6 | 2 controllers |
| professional | 6 | 0 |
| upload | 6 | 1 controller |
| explore | 5 | 0 (read-only) |
| actors | 2 | 0 (read-only) |
| invite | 2 | 1 controller |
| shared | 2 | 0 |
| app | 1 | 0 (route) |
| bootstrap | 1 | 1 controller |
| hydration | 1 | 0 |
| shell | 1 | 0 (UI) |

---

## Identity Contract (Enforced)

These rules are the locked VCSM Identity Contract. Any future parameter that violates these is a security finding.

```
Canonical identity field:     actorId  (vc.actors.id)
Canonical identity kind:      kind     ('user' | 'vport')
Canonical ownership table:    vc.actor_owners

NEVER use as ownership signal:
  profileId
  vportId
  userId
  owner_user_id

NEVER expose via useIdentity() or public hook:
  profileId
  vportId

Ownership must resolve through:
  actor_owners → actorId chain

userId is permitted ONLY inside these features:
  auth
  identity
  state
  legal
```

---

## Continuous Watch List

The following parameters must be monitored on every future scan. Any new occurrence outside an established baseline location requires security review.

```
actorId              — canonical; new mutation sinks always require review
targetActorId        — dual-actor surface; always requires ownership gate
callerActorId        — mutation caller; requires assertActorOwnsVportActor or equivalent
viewerActorId        — read-scoped; verify no mutation paths downstream
ownerActorId         — ownership claim; verify actor_owners resolution
requestActorId       — booking gate; requires assertActorOwnsVportActor
requesterActorId     — internal ownership; verify actor_owners
customerActorId      — booking customer; verify booking injection guard
reporterActorId      — moderation; verify reporter != target enforcement
recipientActorId     — notification target; verify no self-notification bypass
senderActorId        — notification sender; verify session derivation
moderatorActorId     — elevated privilege; verify moderator role check
vportActorId         — VPORT actor gate; requires assertActorOwnsVportActor
profileId            — secondary constraint only; never primary ownership
vportId              — secondary constraint only; never primary ownership
userId               — raw auth UID; must not appear outside auth/identity/state/legal
realmId              — realm routing; must use resolvePublicRealmIdDAL() for system posts
```

---

## Drift Detection Rules

Every future architecture review or scan must compare against this baseline and produce a drift report with these sections:

### Required Sections

```
NEW PARAMETERS
  — parameters that appear in the codebase that are not in this baseline
  — flag any new *ActorId, *UserId, *ProfileId, *VportId, *OwnerId, *RealmId

REMOVED PARAMETERS
  — parameters from this baseline that no longer appear
  — flag removals from Tier 1 surfaces (may indicate refactor or dead-code cleanup)

RENAMED PARAMETERS
  — parameters that appear to be renames of existing baseline parameters
  — detect by context: same feature + same function purpose, different name

NEW MUTATION SURFACES
  — new controllers or DAL functions not in this baseline that accept identity params
  — always flag for security review

NEW IDENTITY SINKS
  — new INSERT/UPDATE/DELETE/RPC calls that receive actorId-family parameters

NEW AUTHORITY PATHS
  — new caller chains that reach actor_owners or ownership assertion functions

NEW REALM SURFACES
  — new functions accepting realmId, particularly in mutation paths

NEW OWNER SURFACES
  — new functions accepting ownerActorId, ownerUserId, or ownership claims

NEW USERID SURFACES
  — new functions accepting userId outside auth/identity/state/legal
  — always flag CRITICAL
```

---

## Future Detection Thresholds

### Flag as CRITICAL

Any of the following:
- Caller-supplied `actorId` reaches an INSERT, UPDATE, UPSERT, DELETE, or RPC call without:
  - `assertActorOwnsVportActorController` in the call chain, OR
  - `assertSessionOwnsVportActorController` in the call chain, OR
  - `auth.uid()` session derivation at the DB layer, OR
  - A SECURITY DEFINER RPC handling ownership internally
- New `userId` parameter appearing in any controller outside `auth`, `identity`, `state`, `legal`
- New `realmId` parameter in a mutation path not using `resolvePublicRealmIdDAL()`
- New `owner_user_id` used as a primary ownership signal (not secondary defense-in-depth)

### Flag as HIGH

Any of the following:
- New `reporterActorId`-style parameter (attacker-controlled audit trail)
- New `customerActorId`-style parameter (dual-actor booking identity)
- New `callerActorId + targetActorId` pattern without ownership gate
- New `actorId` in a mutation controller not in this baseline
- New `userId` parameter in any feature not on the permitted list
- New ownership check using `profileId`, `vportId`, or `owner_user_id` as primary signal

### Flag as MEDIUM

Any of the following:
- New `viewerActorId` in a path that touches write operations
- New `profileId` as a primary WHERE clause constraint (not secondary defense-in-depth)
- New `vportId` used without an upstream `assertActorOwnsVportActor` gate
- New `realmId` in a read path without privacy guard

### Flag as LOW / INFO

Any of the following:
- New variant name for an existing parameter (e.g. `targetActorIdProp` → new component prop)
- New plural (`actorIds`, `profileIds`) used in read-only batch queries
- Parameter count changes in existing functions (refactor signal)

---

## Questions Every Future Review Must Answer

```
1. What identity surfaces changed since the 2026-06-07 baseline?
2. What new authority surfaces appeared (Tier 1 additions)?
3. Did any new actor injection opportunities appear?
4. Did any new userId boundaries appear outside permitted features?
5. Did any new ownership paths appear that bypass actor_owners?
6. Did any new realm-routing surfaces appear in mutation paths?
7. Which changes require a full VENOM / ELEKTRA security pass?
8. Are all new callerActorId + vportActorId patterns gated by assertActorOwnsVportActor?
9. Did actorId count increase by more than 20 (new feature signal)?
10. Did any Tier 1 surface lose its ownership gate?
```

---

## Baseline Supersession Rule

This document is superseded when:
1. A new `TICKET-CODE-INVENTORY-PARAMETERS-NNN` scan completes and produces updated Reports 1–4
2. The new reports are explicitly registered as the replacement baseline
3. This document is updated with a `Superseded by:` header pointing to the new baseline

Until supersession, all architecture and security reviews must reference this document as the identity surface baseline.

---

## Related Documents

| Document | Path |
|---|---|
| Identity Contract | `zNOTFORPRODUCTION/_CANONICAL/zcontract/ARCHITECTURE.md` |
| Global Security Posture | `ZZnotforproduction/APPS/VCSM/GLOBAL_SECURITY.md` |
| Scanner Ownership Review | `ZZnotforproduction/APPS/VCSM/features/vport/outputs/2026/06/07.TICKET-SCANNER-OWNERSHIP-AWARENESS-001.scanner-accuracy-review.md` |
| Report 1 — Function Inventory | `ZZnotforproduction/APPS/VCSM/outputs/2026/06/07.TICKET-CODE-INVENTORY-PARAMETERS-001.report-1-function-inventory.md` |
| Report 2 — Identity Parameter Inventory | `ZZnotforproduction/APPS/VCSM/outputs/2026/06/07.TICKET-CODE-INVENTORY-PARAMETERS-001.report-2-identity-parameter-inventory.md` |
| Report 3 — Parameter Frequency Analysis | `ZZnotforproduction/APPS/VCSM/outputs/2026/06/07.TICKET-CODE-INVENTORY-PARAMETERS-001.report-3-parameter-frequency.md` |
| Report 4 — Identity Injection Surfaces | `ZZnotforproduction/APPS/VCSM/outputs/2026/06/07.TICKET-CODE-INVENTORY-PARAMETERS-001.report-4-identity-injection-surfaces.md` |
