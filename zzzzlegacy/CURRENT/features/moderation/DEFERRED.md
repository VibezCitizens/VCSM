# DEFERRED — moderation

**Last updated:** 2026-06-04
**Source:** TICKET-MODERATION-DB-GUARD-APPLY-0001 | THOR Write 2

---

## DEFERRED-MOD-001 — BEHAVIOR.md Authoring (ACTIVE)

**Risk:** MISSING_BEHAVIOR_CONTRACT [moderation]
**Original Severity:** HIGH (VENOM-MODERATION-2026-06-04-005)
**Accepted By:** THOR (conditional — DB-only security patch exemption)
**Accepted:** 2026-06-04
**Expiration:** 2026-06-07 (target — must exist before any subsequent code or feature release for moderation)

BEHAVIOR.md does not exist for the moderation feature. The THOR behavioral release gate
(MISSING_BEHAVIOR_CONTRACT) was conditionally accepted for the DB migration push component
of TICKET-MODERATION-DB-GUARD-APPLY-0001 only.

**Conditions of acceptance:**
1. Deferral applies ONLY to the DB migration push in TICKET-MODERATION-DB-GUARD-APPLY-0001
2. BEHAVIOR.md must be authored via ProfessorX before any subsequent code or behavioral release
3. At minimum, §9 Must Never Happen must declare:
   - BEH-MOD-001: A non-platform-admin MUST NEVER receive truthy result from can_manage_domain
   - BEH-MOD-002: A non-moderator MUST NEVER update a report status via direct DB client
   - BEH-MOD-003: Moderation audit events MUST be attributed to the actual session actor
4. VENOM-MODERATION-2026-06-04-003 (moderatorActorId not session-bound) must be resolved
   before any moderator dashboard feature release

**Follow-up:** /ProfessorX [moderation] → author BEHAVIOR.md

---

## DEFERRED-MOD-002 — Moderator Dashboard (ACTIVE)

**Risk:** VENOM-MODERATION-2026-06-04-002 — Moderator controllers dead exports
**Original Severity:** HIGH
**Accepted By:** THOR
**Accepted:** 2026-06-04
**Expiration:** Next sprint (no hard date — risk is low while no dashboard exists)

`hideReportedObjectController` and `dismissReportController` are exported but have zero
callers. No moderator dashboard route exists. After the DB fix, legitimate platform admins
cannot moderate through the app UI.

**Conditions of acceptance:**
- Exploitability is LOW (controllers unreachable — no exploit path)
- DB fix still closes the privilege escalation (separate from UI access)
- Must resolve DEFERRED-MOD-003 before this is resolved

**Follow-up:** /Wolverine → create moderator dashboard ticket

---

## DEFERRED-MOD-003 — moderatorActorId Session Binding (ACTIVE)

**Risk:** VENOM-MODERATION-2026-06-04-003 — moderatorActorId not session-bound
**Original Severity:** MEDIUM
**Accepted By:** THOR
**Accepted:** 2026-06-04
**Expiration:** Must resolve before moderator dashboard ships

`moderationActions.controller.js` accepts moderatorActorId from caller. The authorization
check uses auth.uid() but the actorId stored in audit records is caller-supplied. A
legitimate platform admin could attribute moderation actions to any actorId.

**Conditions of acceptance:**
- Exploitability LOW currently (controllers unreachable)
- Becomes HIGH when dashboard is built
- MUST fix before any moderator UI ships

**Follow-up:** Fix controller to derive moderatorActorId from session identity

---

## DEFERRED-MOD-004 — Diagnostic Assertions Post-Fix Update (ACTIVE)

**Risk:** VENOM-MODERATION-2026-06-04-004 — Dev diagnostics will fail post-fix
**Original Severity:** MEDIUM
**Accepted By:** THOR
**Accepted:** 2026-06-04
**Expiration:** Within same sprint as DB push

After `can_manage_domain` is fixed, diagnostic writes in `reports.group.js`,
`reports.group.helpers.js`, and `social.group.js` will receive RLS denials (42501).
The diagnostic test suite expects these writes to succeed.

**Conditions of acceptance:**
- Dev-only tooling; no production security impact
- Diagnostic failures are expected and correct post-fix
- Must be updated before diagnostics are trusted for moderation post-push

**Follow-up:** /SPIDER-MAN → update diagnostic assertions to expect RLS denial for non-admin actors

---

*DEFERRED.md created: 2026-06-04 | TICKET-MODERATION-DB-GUARD-APPLY-0001 | THOR*
