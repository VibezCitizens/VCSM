# Logan — VCSM Technical Documentation

Architecture docs, pipeline traces, audits, and system documentation.

**Last updated:** May 10, 2026 (added kinds-architecture-map, registered tab-classification and business-card, registered service-catalog)
**Naming convention:** `domain.system.topic.md` (lowercase, hyphens in topic, dots between segments)

## Structure

```
logan/
├── vcsm/
│   ├── identity/          ← Auth, actors, login, switch, hydration
│   │   ├── vcsm.identity.auth-pipeline.md
│   │   ├── vcsm.identity.email-flows.md
│   │   ├── vcsm.identity.engine-architecture.md
│   │   ├── vcsm.identity.actor-switch-pipeline.md
│   │   ├── vcsm.identity.actor-directory-projection.md
│   │   ├── vcsm.identity.actor-hydration-audit.md
│   │   ├── vcsm.identity.citizen-to-vport-switch.md
│   │   ├── vcsm.identity.context-file-map.md
│   │   ├── vcsm.identity.login-pipeline-trace.md
│   │   ├── vcsm.identity.vport-creation-audit.md
│   │   ├── vcsm.identity.account-settings-tab.md
│   │   ├── vcsm.identity.citizen-soft-delete.md
│   │   └── vcsm.identity.vport-access-block.md
│   ├── chat/              ← Chat runtime, badges, migration
│   │   ├── vcsm.chat.runtime-pipeline.md
│   │   ├── vcsm.chat.badge-pipeline.md
│   │   ├── vcsm.chat.notification-pipeline.md
│   │   ├── vcsm.chat.migration-status.md
│   │   └── vcsm.chat.message-flow-audit.md
│   ├── feed/              ← Feed and post pipeline
│   │   ├── vcsm.feed.post-pipeline.md
│   │   └── vcsm.feed.profiler-system.md
│   ├── notifications/     ← Notification system
│   │   ├── vcsm.notifications.pipeline.md
│   │   ├── vcsm.notifications.coverage-audit.md
│   │   └── vcsm.notifications.engine-extraction-plan.md
│   ├── profiles/          ← Profile system, social
│   │   ├── vcsm.profiles.social-pipeline.md
│   │   ├── vcsm.profiles.system-audit.md
│   │   ├── vcsm.profiles.citizen-vs-vport-audit.md
│   │   └── vcsm.profiles.subscribe-pipeline.md
│   ├── social/            ← Follow/subscriber architecture, actor graph model
│   │   └── vcsm.social.subscribe-architecture.md  ← actor pair matrix, RPC audit, visibility model, open tickets (2026-05-27)
│   ├── moderation/        ← Moderation and block pipeline
│   │   └── vcsm.moderation.block-pipeline.md
│   ├── booking/           ← Booking pipeline
│   │   └── vcsm.booking.pipeline.md
│   ├── explore/           ← Explore search pipeline
│   │   └── vcsm.explore.search-pipeline.md
│   ├── upload/            ← Upload consistency
│   │   └── vcsm.upload.remote-consistency-map.md
│   ├── public/            ← Public pages, SEO, conversion funnel
│   │   ├── vcsm.public.seo-infrastructure.md
│   │   └── vcsm.public.conversion-funnel.md
│   ├── wanders/           ← Wanders async card messaging system
│   │   └── vcsm.wanders.system.md
│   ├── theme/             ← Theme system, splash screen
│   │   ├── vcsm.theme.design-tokens.md
│   │   └── vcsm.theme.splash-screen.md
│   ├── native/            ← Native iOS runtime
│   │   ├── vcsm.native.runtime-audit.md
│   │   └── vcsm.native.ios-translation-guide.md
│   └── runtime/           ← Mutation matrix, idempotency, risk maps
│       ├── vcsm.runtime.mutation-matrix.md
│       ├── vcsm.runtime.authority-matrix.md
│       ├── vcsm.runtime.idempotency-matrix.md
│       ├── vcsm.runtime.transaction-boundary-map.md
│       ├── vcsm.runtime.high-risk-mutations.md
│       ├── vcsm.runtime.top-mutation-bug-risks.md
│       ├── vcsm.runtime.silent-failure-map.md
│       └── vcsm.runtime.duplicate-write-authorities.md
│
├── vports/                ← VPORT business profiles and reviews
│   ├── vcsm.vport.kinds-architecture-map.md  ← all 11 kinds, layer tiers, tab configs, dashboard screens, adapter strategy
│   ├── vcsm.vport.tab-classification.md      ← 48 vport types, 13 groups, tab layouts, resolver algorithm
│   ├── vcsm.vport.business-pipeline.md
│   ├── vcsm.vport.business-pipeline.v2.md
│   ├── vcsm.vport.business-card.md
│   ├── vcsm.vport.delete-lifecycle.md        ← soft delete + hard delete RPCs, two-step enforcement, UI wiring
│   ├── vcsm.vport.menu-pipeline.md
│   ├── vcsm.vport.content-pages-pipeline.md
│   ├── vcsm.vport.barber-profile-spec.md
│   ├── vcsm.vport.gas-station-profile-spec.md
│   ├── vcsm.vport.locksmith-profile-spec.md
│   ├── vcsm.vport.money-exchange-profile-spec.md
│   ├── vcsm.vport.restaurant-profile-spec.md
│   ├── vcsm.vport.review-implementation-plan.md
│   ├── vcsm.vport.review-pipeline-audit.md
│   ├── vcsm.vport.external-site-integration.md
│   ├── vcsm.vport.service-catalog.md
│   └── vcsm.vport.tripoint-integration.md
│
├── legal/                 ← Legal consent system and automation
│   ├── vcsm.legal.consent-system.md
│   └── vcsm.legal.automation-scripts.md
│
├── platform/              ← Cross-app pipeline, realtime, user journey, performance
│   ├── vcsm.platform.pipeline-map.md
│   ├── vcsm.platform.realtime-event-pipeline.md
│   ├── vcsm.platform.features-remediation-plan.md
│   ├── vcsm.platform.user-journey-guide.md
│   ├── vcsm.platform.security-headers.md     ← HTTP headers audit, CSP allowlist, rollout plan
│   ├── platform.performance.observability-system.md
│   ├── platform.i18n.foundation.md
│   └── platform.upload.architecture.md
│
├── engines/               ← Shared engine audits
│   ├── engines.isolation.chat-identity-audit.md
│   ├── engines.drift.vcsm-wentrex-pipeline-analysis.md
│   └── engines.notifications.engine-architecture.md
│
├── wentrex/               ← Wentrex-specific docs (add as needed)
│
├── architecture/          ← ARCHITECT scan output + architecture analysis
│   ├── system-map.md
│   ├── feature-map.md
│   ├── dependency-map.md
│   ├── database-read-map.md
│   ├── cache-audit.md
│   ├── repository-architecture-interpretation.md
│   ├── code-derived-app-review.md
│   └── dev-performance-code-logic.md
│
└── marvel/                ← Command execution logs (what each command actually did)
    ├── loki/              ← Runtime observation sessions
    │   └── 2026-04-12.runtime-observability-build.md
    ├── kraven/            ← Performance hunt sessions
    │   └── 2026-04-12.badge-duplicate-read-hunt.md
    ├── wolverine/         ← Execution orchestration logs
    ├── bugsbunny/         ← Debug investigation logs
    ├── venom/             ← Security review logs
│   │   └── 2026-04-25.security-headers-audit.md
    ├── carnage/           ← Migration planning logs
    ├── ironman/           ← Ownership mapping logs
    ├── thor/              ← Release readiness logs
    ├── captain/           ← Idea capture logs
    └── architect/         ← Architecture scan logs
```

## Skills

Agent instruction contracts live in `zNOTFORPRODUCTION/_CANONICAL/skills/`. They are
not documentation — they are behavioral contracts for AI/code agents. They are indexed
here for discoverability but maintained separately from Logan docs.

| File | Purpose |
|---|---|
| `skills/vcsm/SKILL.md` | Full VCSM execution contract — workspace overview, layer rules, ticket workflow, adapter boundaries, security command routing, dashboard/feed rules, output format |
| `skills/vcsm-contributor/SKILL.md` | Contributor quality gate — human protection rule, no-slop rule, evidence requirements, approval gates, rejection triggers, PR/review behavior |

These files are the canonical source of truth for how agents must behave.
App-level `CLAUDE.md` files (loaded automatically by Claude Code) gate and point to these.

---

## Naming Convention

All files must follow: `[domain].[system].[topic].md`

- **domain:** `vcsm`, `engines`, or the folder context
- **system:** feature area (identity, chat, feed, etc.)
- **topic:** specific subject, hyphenated (auth-pipeline, badge-pipeline, etc.)
- All lowercase, no spaces, no underscores, no SCREAMING_CASE
