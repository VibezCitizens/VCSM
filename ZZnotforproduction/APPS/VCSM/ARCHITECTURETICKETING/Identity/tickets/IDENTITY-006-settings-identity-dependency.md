# [IDENTITY-006] Settings → Identity Dependency Audit

Status: Open
Priority: P3
Type: TASK
Weight: Medium
Risk: LOW

---

## Goal

Trace all 8 identity imports within `features/settings/`, record which settings subsystem
(account, privacy, profile, vports) each import belongs to, and confirm all 8 are
adapter-compliant. Produce a change-impact map: if identity's adapter surface changes, which
settings files break.

---

## Context

Settings has 87 total cross-feature outbound imports — the highest fan-out in the codebase.
Its 8 identity imports are distributed across 4 subsystems. All are confirmed adapter-compliant
per scanner 0-violation result, but the specific file-level impact of any identity adapter
surface change is unknown.

This ticket creates the change-impact map so that future identity adapter changes can be
assessed without re-reading all of settings.

---

## Source Evidence

- `FEATURES_ARCHITECTURE_REVIEW.md`: "settings → identity 8x; settings is highest fan-out feature (87 outbound)"
- `IDENTITY-004` output: settings import classification records (confirmed from IDENTITY-004 enumeration)
- `FEATURE_IMPORT_MAP.json`: settings violations involving identity = 0

---

## Scope

Read settings files that import from identity. For each import:
1. Record the exact settings file path
2. Record what is imported from identity adapter
3. Record what the import is used for in that settings file
4. Classify the settings subsystem: account | privacy | profile | vports | other

---

## Out of Scope

- Settings feature architecture review
- Non-identity imports in settings
- Fixing any import
- Reviewing settings data access beyond identity usage

---

## Dependencies

IDENTITY-004 must be Complete (list of settings identity import sites needed).

---

## Blocked By

IDENTITY-004

---

## Exact Steps

1. Load IDENTITY-004 output — get the list of settings files with identity imports.
2. For each settings file:
   a. Read the file.
   b. Find the identity import line.
   c. Record: what is imported (hook name, function, object).
   d. Record: what uses it in the file (component, hook call, conditional check).
   e. Classify the settings subsystem.
   f. Record: what identity field is read (actorId? kind? ownerActorId? realmId?).
3. Build the change-impact map:
   - Group by identity export — "if this export changes, these settings files are affected"
4. Confirm all 8 imports go through `@/features/identity/adapters/` (not `@identity`).
5. Record any import that does NOT go through the adapter as a BYPASS finding.

---

## Validation

- [ ] All 8 settings identity import sites traced
- [ ] Every import's consuming subsystem classified
- [ ] Every import confirmed as adapter-compliant (or BYPASS logged)
- [ ] Change-impact map written: export → affected settings files
- [ ] No source file modified

---

## Rollback Plan

Read-only. No rollback needed.

---

## Do Not Touch

All source files. Any CONTRACTS/ file.

---

## Expected Output

Settings identity map appended to this ticket:
```
## Settings Identity Import Map — [DATE]

### Import Sites (8)
[table: settings file | subsystem | imported symbol | identity field read | adapter path]

### Subsystem Distribution
account: [count]
privacy: [count]
profile: [count]
vports: [count]
other: [count]

### Change-Impact Map
[table: identity export | settings files that would break if this export changes]

### Compliance
All COMPLIANT: YES / NO
BYPASS sites: [list or "None"]
```

---

## Next Ticket

IDENTITY-010 (engine alias policy — settings data informs the full consumer picture)
