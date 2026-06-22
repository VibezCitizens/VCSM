# [IDENTITY-007] Notifications → Identity Dependency Audit

Status: Open
Priority: P3
Type: TASK
Weight: Medium
Risk: LOW

---

## Goal

Trace all 4 identity imports within `features/notifications/`, confirm adapter compliance,
and document what actor data each notification component or hook reads from identity.
Produce a clean import map for the notifications → identity relationship.

---

## Context

Notifications resolves actor identity data for rendering notification items (sender name,
avatar, actor kind). It has 4 identity imports confirmed by scanner. All are adapter-compliant
per 0-violation result.

This is a contained, low-risk audit. The goal is completeness for IDENTITY-004's full
consumer picture and to establish a change-impact record for the notifications feature.

---

## Source Evidence

- `FEATURES_ARCHITECTURE_REVIEW.md`: "notifications → identity 4x"
- `IDENTITY-004` output: notifications import classification records
- `FEATURE_IMPORT_MAP.json`: notifications violations involving identity = 0

---

## Scope

Read notifications files that import from identity. For each import:
1. Record the exact notifications file path
2. Record what is imported from identity adapter
3. Record what the import is used for (display rendering, actor kind check, owner resolution)

---

## Out of Scope

- Notifications feature architecture review
- Non-identity imports in notifications
- Realtime subscription logic beyond identity usage
- Fixing any import

---

## Dependencies

IDENTITY-004 must be Complete (list of notifications identity import sites needed).

---

## Blocked By

IDENTITY-004

---

## Exact Steps

1. Load IDENTITY-004 output — get the list of notifications files with identity imports.
2. For each notifications file:
   a. Read the file.
   b. Find the identity import line.
   c. Record: what is imported (hook name, function, object).
   d. Record: what uses it (component prop, conditional, data transform).
   e. Record: which identity field is read (actorId, kind, ownerActorId, realmId).
3. Confirm all 4 imports go through `@/features/identity/adapters/` (not `@identity`).
4. Record any import that does NOT go through the adapter as a BYPASS finding.
5. Note if any import resolves actor identity for a notification actor (not the current user) —
   this would be an actor lookup pattern, not a session identity pattern.

---

## Validation

- [ ] All 4 notifications identity import sites traced
- [ ] Each import's use classified (display | kind-check | owner-resolution | other)
- [ ] All 4 confirmed adapter-compliant (or BYPASS logged)
- [ ] Actor lookup vs session identity pattern distinguished
- [ ] No source file modified

---

## Rollback Plan

Read-only. No rollback needed.

---

## Do Not Touch

All source files. Any CONTRACTS/ file.

---

## Expected Output

Notifications identity map appended to this ticket:
```
## Notifications Identity Import Map — [DATE]

### Import Sites (4)
[table: notifications file | imported symbol | identity field read | use case | adapter path]

### Pattern Classification
Session identity (current user): [count]
Actor lookup (notification sender actor): [count]

### Compliance
All COMPLIANT: YES / NO
BYPASS sites: [list or "None"]

### Note for IDENTITY-010
[Are any notification imports using @identity engine alias?]
```

---

## Next Ticket

IDENTITY-008 — Profiles dependency audit
