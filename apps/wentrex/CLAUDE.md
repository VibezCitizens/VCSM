# Wentrex App — Agent Execution Gate

You are working inside `apps/wentrex/` — a standalone multi-tenant LMS SaaS.

This is not VCSM. Do not apply VCSM patterns here.

---

## What Wentrex Is

A purpose-built Learning Management System serving four distinct audiences across
isolated school workspaces accessed via URL slug (e.g., `/learning/springfield-high`).
A super admin layer at `/learning` sits above all tenants.

| Role | Access |
|---|---|
| **Student** | Takes courses, submits assignments, tracks progress |
| **Teacher** | Delivers content, grades work |
| **Parent/Observer** | Read-only view of linked student's progress |
| **Admin** | Manages organizations, rosters, platform access |
| **Super Admin** | Above all tenants — creates and monitors all school workspaces |

Domain hierarchy:

```
Realm → Organization → Course Term → Course → Module →
Lesson → Assignment → Submission → Grade
```

---

## Isolation Rules

- Do not import from `apps/VCSM/` or `apps/Traffic/`
- Do not use VCSM's actor/Vport identity model — Wentrex has its own membership/role model
- Do not conflate Wentrex's LMS with the embedded `/learning` route inside VCSM.
  They are separate products with separate schemas and domain models.
- Do not add social, marketplace, or Vport concepts to this app

---

## Multi-Tenancy Rules — Non-Negotiable

- Every database query must be scoped to a Realm
- Realm slug is the entry point — validate it before resolving any domain data
- Never use `.select('*')` in any DAL file
- Never bypass Realm scoping in any query
- Never leak data across Realm boundaries
- RLS enforces tenant isolation at the database layer — queries must still scope to Realm

---

## Architecture Layer Order

```
DAL → Model → Controller → Hook → Screen
```

---

## Engineering Rules

- Surgical changes only — change exactly what was asked, nothing more
- Preserve existing behavior unless the task explicitly changes it
- No full rewrites without explicit approval
- No unrelated refactors

---

## Active Features

- Lesson completion tracking
- Rubric-based grading with public/private feedback
- File uploads, late submission policies, attempt limits
- Role-based memberships
- Audit logging
- Observer-to-student linking

---

## Architecture Review

When asked to audit or review Wentrex: `apps/wentrex/REVIEW.md`

---

## Skill References

General execution contract:
`zNOTFORPRODUCTION/_CANONICAL/skills/vcsm/SKILL.md`

Contributor quality gate:
`zNOTFORPRODUCTION/_CANONICAL/skills/vcsm-contributor/SKILL.md`
