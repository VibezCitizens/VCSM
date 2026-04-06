# App: Wentrex

Standalone multi-tenant LMS SaaS. Each school or institution gets an isolated workspace.

## What This App Is

A purpose-built Learning Management System serving four distinct audiences across isolated school workspaces accessed via URL slug (e.g., `/learning/springfield-high`). A super admin layer at `/learning` sits above all tenants.

## Audiences

| Role | Access |
|------|--------|
| **Student** | Takes courses, submits assignments, tracks progress |
| **Teacher** | Delivers content, grades work |
| **Parent/Observer** | Read-only view of linked student's progress |
| **Admin** | Manages organizations, rosters, platform access |
| **Super Admin** | Above all tenants — creates and monitors all school workspaces |

## Domain Hierarchy

```
Realms (tenants)
  └─ Organizations
       └─ Course Terms
            └─ Courses
                 └─ Modules
                      └─ Lessons
                           └─ Assignments
                                └─ Submissions
                                     └─ Grades
```

## Active Features

- Lesson completion tracking
- Rubric-based grading with public/private feedback
- File uploads
- Late submission policies
- Attempt limits
- Role-based memberships
- Audit logging
- Observer-to-student linking

## Roadmap (Next Frontier)

- Quizzes
- Gradebook
- Announcements
- SIS/LTI integrations
- Analytics

## Stack

- React 19 + Vite
- Supabase (PostgreSQL + Auth + Realtime) with row-level security per tenant
- Multi-tenant isolation via Realm slug routing

## Multi-Tenancy Rules

- Every query must be scoped to a Realm
- Row-level security enforces tenant isolation at the database level
- Never leak data across Realm boundaries
- Realm slug is the entry point — always validate it before resolving any domain data

## Architecture Layer Order

```
DAL → Model → Controller → Hook → Screen
```

## What NOT to Do

- Do not import anything from `apps/VCSM`
- Do not use VCSM's actor/Vport identity model here — Wentrex has its own membership/role model
- Do not conflate Wentrex's LMS with the embedded `/learning` route inside VCSM — they are separate products
- Do not use `.select('*')` in any DAL file
- Do not bypass Realm scoping in any query
- Do not add social, marketplace, or Vport concepts to this app
