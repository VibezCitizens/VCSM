# VCSM Platform — System Map
# ARCHITECT Global Scan — 2026-06-02

---

## Applications

| App | Path | Product | Deploy Target |
|---|---|---|---|
| VCSM | apps/VCSM/ | Social marketplace hybrid (Instagram + Airbnb) | vibezcitizens.com |
| Wentrex | apps/wentrex/ | Standalone multi-tenant LMS SaaS | wentrex.com |
| Traffic | apps/Traffic/ | Programmatic SEO directory engine (Next.js 14) | traffic.vibezcitizens.com |

Apps are fully isolated. No cross-app imports. Shared logic lives in engines/ or shared/ only.

---

## Shared Infrastructure

### Engines (engines/)

| Engine | Alias | Consuming Features (from scan) |
|---|---|---|
| engines/booking | @booking | booking, vport, notifications |
| engines/chat | @chat | chat, moderation |
| engines/hydration | @hydration | profiles, post, feed, explore, hydration |
| engines/identity | (direct) | identity |
| engines/media | @media | upload, portfolio, vport |
| engines/notifications | @notifications | notifications |
| engines/portfolio | @portfolio | portfolio |
| engines/reviews | (direct) | reviews |

### Shared Primitives (shared/)

Domain-neutral UI primitives, utilities, and types. Consumed by both VCSM and Wentrex.
No feature-specific logic. Not scanned in this run.

---

## Feature Layer — VCSM (apps/VCSM/src/features/)

29 features scanned on 2026-06-02.

| Feature | Tier | Architecture State | Module Status |
|---|---|---|---|
| auth | CRITICAL | EVOLVING | MOSTLY_COMPLETE |
| booking | CRITICAL | EVOLVING | MOSTLY_COMPLETE |
| identity | CRITICAL | EVOLVING | MOSTLY_COMPLETE |
| actors | CRITICAL | EVOLVING | MOSTLY_COMPLETE |
| profiles | HIGH | EVOLVING | MOSTLY_COMPLETE |
| dashboard | HIGH | EVOLVING | MOSTLY_COMPLETE |
| chat | HIGH | STABLE | MOSTLY_COMPLETE |
| settings | HIGH | EVOLVING | MOSTLY_COMPLETE |
| block | HIGH | STABLE | MOSTLY_COMPLETE |
| moderation | HIGH | FLAGGED | MOSTLY_COMPLETE |
| legal | HIGH | STABLE | MOSTLY_COMPLETE |
| public | HIGH | FLAGGED | MOSTLY_COMPLETE |
| vport | HIGH | EVOLVING | MOSTLY_COMPLETE |
| post | MEDIUM | EVOLVING | MOSTLY_COMPLETE |
| feed | MEDIUM | EVOLVING | MOSTLY_COMPLETE |
| social | MEDIUM | EVOLVING | MOSTLY_COMPLETE |
| notifications | MEDIUM | EVOLVING | MOSTLY_COMPLETE |
| upload | MEDIUM | FLAGGED | MOSTLY_COMPLETE |
| invite | MEDIUM | EVOLVING | MOSTLY_COMPLETE |
| join | MEDIUM | EVOLVING | MOSTLY_COMPLETE |
| onboarding | MEDIUM | STABLE | MOSTLY_COMPLETE |
| explore | LOW | EVOLVING | MOSTLY_COMPLETE |
| media | MEDIUM | STABLE | MOSTLY_COMPLETE |
| professional | MEDIUM | EVOLVING | MOSTLY_COMPLETE |
| ads | LOW | EVOLVING | MOSTLY_COMPLETE |
| void | LOW | EVOLVING | INCOMPLETE |
| hydration | LOW | STABLE | MOSTLY_COMPLETE |
| portfolio | LOW | EVOLVING | MOSTLY_COMPLETE |
| reviews | LOW | EVOLVING | MOSTLY_COMPLETE |

---

## Architecture Health Summary

### By Tier

| Tier | Feature Count | STABLE | EVOLVING | FLAGGED | INCOMPLETE |
|---|---|---|---|---|---|
| CRITICAL | 4 | 0 | 4 | 0 | 0 |
| HIGH | 9 | 3 | 4 | 2 | 0 |
| MEDIUM | 11 | 2 | 8 | 1 | 0 |
| LOW | 5 | 1 | 3 | 0 | 1 |
| **TOTAL** | **29** | **6** | **19** | **3** | **1** |

### Health Interpretation

- **STABLE (6)**: chat, block, legal, onboarding, media, hydration — bounded scope, low structural drift, no open BEFORE RELEASE blockers
- **EVOLVING (19)**: majority of platform — active development, open findings, known gaps; mergeable with gating
- **FLAGGED (3)**: moderation, public, upload — active blockers; THOR-blocked or CARNAGE-blocked; do not merge without resolution
- **INCOMPLETE (1)**: void — scaffold only, pre-implementation; route is live but feature is empty

### Platform-Wide Controller / DAL / Hook Totals

| Layer | Count |
|---|---|
| Controllers | 214 |
| DALs | 248 |
| Hooks | 229 |

### Open Security Findings (from structural_risks)

- CRITICAL-severity open findings: 8 (identity VF-01, moderation UUID mismatch + audit trail + migration order, post DR-001, public VL-001, upload R2 CORS)
- HIGH-severity open findings: 20+
- DB-BLOCKED findings: 4 (TICKET-BOOKING-RPC-001, BLOCK-BOOK-002, BLOCK-INVITE-003, social migrations)

---

## Dependency Direction (enforced)

```
apps/VCSM     ──┐
                ├──→ engines/ ──→ shared/
apps/wentrex  ──┘

apps/Traffic  ──── standalone (Next.js 14, no engine deps)
```

Cross-app imports: PROHIBITED
apps/WT: internal transfer workspace — NEVER deploy, NEVER import from

---

## Files That Must Never Ship to Production

| Path | Purpose |
|---|---|
| .claude/ | Claude Code tooling config |
| planning/ | Session planning files |
| logan/ | System documentation |
| session-summaries/ | Conversation logs |
| db_snapshot/ | Schema snapshots and seeds |
| debuggers/ | Dev-only debug panels |
| apps/WT/ | Internal transfer workspace |
| zNOTFORPRODUCTION/ | Canonical private contracts and skills |

---

ARCHITECT Run: 2026-06-02
Features scanned: 29
