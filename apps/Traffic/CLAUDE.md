# Traffic App — Agent Execution Gate

You are working inside `apps/Traffic/` — a standalone Next.js 14 programmatic
SEO directory engine.

---

## What Traffic Is

A static site that generates indexable city/service/neighborhood/provider directory
pages for organic search discovery. Visitors are routed back to the VCSM platform
via deep links with tracking parameters.

Current state: mock data only. No database. No authentication. No engine imports.
Fully self-contained. Deployment target: `traffic.vibezcitizens.com`

---

## Isolation Rules

- Do not import from `apps/VCSM/` or `apps/wentrex/`
- Do not add Supabase auth or DB connections without explicit approval
- Do not add engine imports without explicit approval
- Do not apply VCSM or Wentrex patterns here
- This is Next.js 14. VCSM is React + Vite. They are different runtimes with
  different build systems — do not cross-apply conventions

---

## Engineering Rules

- Surgical changes only
- Preserve static output behavior unless the task explicitly changes it
- No full rewrites without explicit approval
- No unrelated refactors
- When wiring real data: confirm the data source contract before writing any
  fetch or generation logic

---

## Architecture Review

When asked to audit or review Traffic: `apps/Traffic/REVIEW.md`

---

## Skill References

General execution contract:
`zNOTFORPRODUCTION/_CANONICAL/skills/vcsm/SKILL.md`

Contributor quality gate:
`zNOTFORPRODUCTION/_CANONICAL/skills/vcsm-contributor/SKILL.md`
