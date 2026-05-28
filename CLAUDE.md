# VCSM Workspace — Root Agent Rules

This workspace contains three completely separate products. They share engines
and a contract, but they must never be mixed.

When working inside any app directory, the app-level CLAUDE.md for that app
loads automatically. Read it before making any change.

---

## The Three Apps

| App | Path | Product |
|---|---|---|
| **VCSM** | `apps/VCSM/` | Social marketplace hybrid platform (Instagram + Airbnb) |
| **Wentrex** | `apps/wentrex/` | Standalone multi-tenant LMS SaaS |
| **Traffic** | `apps/Traffic/` | Programmatic SEO directory engine (Next.js 14) |

**VCSM** is the core platform — creators and service providers manage actor-based
identities (personal profiles or business VPORTs), post content, chat, book services,
and run storefronts. External business sites consume their VPORT data from VCSM via
Edge Function APIs, keeping their own domain while VCSM remains the source of truth.

**Traffic** generates indexable directory pages for organic search discovery, routing
visitors back to VCSM via deep links with tracking parameters. Runs on mock data —
self-contained and deployment-ready at `traffic.vibezcitizens.com` once data is wired.

---

## Isolation Rules — Non-Negotiable

- Never import from one product app into another. `apps/VCSM`, `apps/wentrex`,
  and `apps/Traffic` are fully isolated products.
- Never assume a pattern from one app applies to another.
- Always confirm which app you are working in before making any change. If ambiguous, ask.
- Never move features between apps. Shared logic belongs in `engines/` or `shared/`.
- Both apps have LMS features — they are not the same LMS. VCSM has an embedded
  `/learning` route. Wentrex IS a standalone LMS SaaS. Do not conflate them.
- `apps/WT/` is an internal transfer workspace, not a product. Never import from it
  or deploy it.

## Dependency Direction

```
apps/VCSM     ──┐
                ├──→ engines/ ──→ shared/
apps/wentrex  ──┘
```

Apps never depend on each other. Ever.

---

## Shared Infrastructure (Safe to Consume from Either App)

- `engines/` — reusable domain engines (chat, identity, hydration, portfolio, reviews,
  booking, notifications)
- `shared/` — domain-neutral primitives (UI, utils, types)

---

## Ticket Workflow

Every task must use a persistent ticket. Open one before analysis begins.
Never merge unrelated work into one ticket.

```
[TICKET-ID] Title
Status: Open | In Progress | Blocked | Complete
Priority: P0–P3
Type: ENG | BUG | TASK | SEC
App: VCSM | Wentrex | Traffic | engines | shared
Goal / Context / Decisions / Constraints / Next Action
```

Continuation: `Continue [TICKET-ID]`

---

## Wentrex and Traffic Architecture Reviews

When the user says "review wentrex", "audit wentrex", or "run deep wentrex review":
follow the spec in `apps/wentrex/REVIEW.md`.

When the user says "review traffic", "audit traffic", or "run deep traffic review":
follow the spec in `apps/Traffic/REVIEW.md`.

---

## Files That Must Never Ship to Production

| Directory | Purpose |
|---|---|
| `.claude/` | Claude Code tooling config |
| `planning/` | Session planning files |
| `logan/` | System documentation |
| `session-summaries/` | Conversation logs |
| `db_snapshot/` | Schema snapshots and seeds |
| `debuggers/` | Dev-only debug panels |
| `apps/WT/` | Internal transfer workspace — never deploy |
| `zNOTFORPRODUCTION/` | Canonical private contracts and skills |

---

## Documentation Rules

- All documentation belongs in `logan/` — never inside `apps/`, `engines/`,
  `shared/`, or `src/`.
- `README.md` files are banned except `logan/README.md`. Ask before creating one.
- No filenames with spaces. All filenames must have valid extensions.
- **Exception — App-root CLAUDE.md files:** `apps/VCSM/CLAUDE.md`,
  `apps/wentrex/CLAUDE.md`, and `apps/Traffic/CLAUDE.md` are tooling configuration
  files, not documentation. They serve the same category as `.claude/settings.json`.
  They are explicitly allowed and exempt from the no-.md-files-inside-apps/ rule.
- No other `.md` files inside `apps/` without explicit approval.

---

## Command System

| Command | Purpose |
|---|---|
| `/Wolverine` | Main planning, routing, and execution orchestrator |
| `/Logan` | Documentation review, drift detection, sync |
| `/Deadpool` | Root cause debug |
| `/CAPTAIN` | Next-session order capture (ideas only) |
| `/DB` | Database reviewer and analyst |
| `/ARCHITECT` | Repository architecture mapping and DB read audit |
| `/Loki` | Runtime observability and request trace |
| `/Kraven` | Performance hunter and bottleneck analysis |
| `/Venom` | Security sheriff and trust boundary review |
| `/BlackWidow` | Ethical red team — adversarial runtime verification |
| `/ELEKTRA` | Precision security scanner and patch advisor |
| `/HAWKEYE` | Precision endpoint and API contract verification |
| `/SPIDER-MAN` | Regression safety net and test coverage |
| `/WATCHER` | Session change provenance |
| `/Carnage` | Database migration architect |
| `/Ironman` | Feature ownership and system responsibility |
| `/Thor` | Release commander |
| `/NickFury` | Parallel build orchestrator — isolated side-missions |
| `/Falcon` | iOS parity governance — PWA → Native transfer |
| `/Vision` | Analytics intelligence — telemetry, funnels, attribution |
| `/review-contract` | Architecture contract compliance check |
| `/session-summary` | End-of-session audit log |

---

## Canonical Skill References

Full execution contract:
`zNOTFORPRODUCTION/_CANONICAL/skills/vcsm/SKILL.md`

Contributor and quality gate contract:
`zNOTFORPRODUCTION/_CANONICAL/skills/vcsm-contributor/SKILL.md`
