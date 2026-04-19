# Wentrex Deep Architecture Review

When the user says:

- "review wentrex"
- "run wentrex architecture review"
- "audit wentrex"
- "run deep wentrex review"

execute the Wentrex architecture audit.

---

## Scope

**Primary target:**
`/Users/vcsm/Desktop/VCSM/apps/wentrex`

**Connected areas allowed:**
- `/Users/vcsm/Desktop/VCSM/engines/auth`
- `/Users/vcsm/Desktop/VCSM/engines/identity`
- `/Users/vcsm/Desktop/VCSM/engines/chat`
- `/Users/vcsm/Desktop/VCSM/zNOTFORPRODUCTION/zcontract`

**Do NOT review:**
- `/Users/vcsm/Desktop/VCSM/apps/VCSM`
- unrelated engines
- unrelated folders

---

## Output Requirement

The review MUST automatically generate a document.

Write the final report to:
`/Users/vcsm/Desktop/VCSM/apps/wentrex/docs/WENTREX_ARCHITECTURE_REVIEW.md`

If the folder does not exist, create:
`/Users/vcsm/Desktop/VCSM/apps/wentrex/docs/`

The report should be fully written there so the user never has to copy/paste.

The chat response should only contain:
- a short summary
- the path to the generated document

Example response:

> Wentrex architecture review complete.
> Document written to:
> `/Users/vcsm/Desktop/VCSM/apps/wentrex/docs/WENTREX_ARCHITECTURE_REVIEW.md`

---

## Review Tasks

The review must:

1. Map current runtime ownership
2. Identify orphaned files
3. Detect duplicate logic
4. Identify partial migrations
5. Map Supabase usage
6. Detect dead DAL/controllers
7. Detect broken imports
8. Identify structural risks
9. Produce a future-work backlog
10. Assess major systems

---

## Systems to Assess

- identity
- auth
- chat
- announcements
- LMS
- route protection
- actor resolution
- shared engine integration

For each classify:

- frozen/stable
- active but evolving
- partially migrated
- legacy
- unclear ownership

---

## Output Structure (Required)

The generated document must contain:

A. Current architecture summary
B. Active runtime ownership map
C. Orphaned / dead / duplicate file candidates
D. Partial migrations and split-ownership zones
E. Supabase usage map
F. Dead DAL / controller / model layers
G. Broken imports / invalid paths
H. Future work backlog by priority
I. Structural risks and hidden coupling
J. Recommended cleanup order
K. What should be frozen vs what should still evolve

---

## Hard Rules

- Do not modify code
- Do not start VC migration
- Do not redesign architecture
- Focus only on current codebase reality
- Use explicit file paths
- Distinguish confirmed findings from likely findings
- Do not analyze folders outside the allowed scope
