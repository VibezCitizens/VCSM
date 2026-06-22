# CURRENT Root File Classification

```yaml
ticket: TICKET-CURRENT-ROOT-FILE-CLASSIFICATION-0001
command: logan
category: platform-documentation
status: COMPLETE
generated_at: 2026-06-02T00:00:00-07:00
scope: zNOTFORPRODUCTION/CURRENT excluding CURRENT/features movement
mode: report_only_no_moves
```

## Executive Summary

- Total files scanned outside CURRENT/features: 775
- Files correctly placed / kept: 553
- Files proposed for move: 186
- Files needing review: 36
- Duplicate/stale candidates: 15
- Frozen feature exclusions: 16
- No files were moved, deleted, or rewritten as part of this report.
- Approval required before any movement: EXECUTE_MOVE_PLAN.

## Classification Counts

| Classification | Count |
| --- | --- |
| CODEX_CONTEXT | 13 |
| DASHBOARD_MODULE_DOC_MISPLACED | 44 |
| FEATURE_DOC_MISPLACED | 164 |
| FEATURE_INDEX | 29 |
| HISTORY_FILE | 13 |
| IMMUTABLE_EVIDENCE | 65 |
| PLATFORM_DOC | 394 |
| ROOT_REGISTRY | 7 |
| RUNTIME_INDEX | 31 |
| SCANNER_DOC | 4 |
| STALE | 6 |
| UNKNOWN | 5 |

## Phase 1 - Inventory

| Current Path | File Type | Size | Last Modified | Initial Classification |
| --- | --- | --- | --- | --- |
| CATEGORY_REGISTRY.md | markdown | 25364 | 2026-06-03T00:17:23Z | root governance registry |
| FEATURE_DOCUMENTATION_INDEX.md | markdown | 233461 | 2026-06-03T00:14:22Z | root governance registry |
| FEATURE_INDEX_RUNTIME/actors.md | markdown | 5799 | 2026-06-02T21:56:51Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/ads.md | markdown | 4017 | 2026-06-02T22:05:18Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/auth.md | markdown | 9628 | 2026-06-02T21:58:10Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/block.md | markdown | 7922 | 2026-06-02T21:57:33Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/booking.md | markdown | 8843 | 2026-06-02T22:01:27Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/chat.md | markdown | 8339 | 2026-06-02T21:57:57Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/dashboard.md | markdown | 14379 | 2026-06-02T22:00:05Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/explore.md | markdown | 3312 | 2026-06-02T22:02:24Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/feed.md | markdown | 4954 | 2026-06-02T22:11:35Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/hydration.md | markdown | 3539 | 2026-06-02T22:06:19Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/identity.md | markdown | 8289 | 2026-06-02T21:57:53Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/invite.md | markdown | 4315 | 2026-06-02T22:02:13Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/join.md | markdown | 7774 | 2026-06-02T22:02:49Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/legal.md | markdown | 7913 | 2026-06-02T21:57:24Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/media.md | markdown | 6773 | 2026-06-02T22:03:10Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/moderation.md | markdown | 6796 | 2026-06-02T21:57:17Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/notifications.md | markdown | 7495 | 2026-06-02T22:02:55Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/onboarding.md | markdown | 5095 | 2026-06-02T22:02:17Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/portfolio.md | markdown | 8157 | 2026-06-02T22:07:49Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/post.md | markdown | 6378 | 2026-06-02T22:04:51Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/professional.md | markdown | 4384 | 2026-06-02T22:04:35Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/profiles.md | markdown | 7457 | 2026-06-02T22:02:16Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/public.md | markdown | 8110 | 2026-06-02T21:57:55Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/README.md | markdown | 7011 | 2026-06-02T11:00:08Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/reviews.md | markdown | 5954 | 2026-06-02T22:07:06Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/settings.md | markdown | 9490 | 2026-06-02T21:58:22Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/social.md | markdown | 6393 | 2026-06-02T22:01:42Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/upload.md | markdown | 8617 | 2026-06-02T22:02:38Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/vgrid.md | markdown | 3312 | 2026-06-02T10:58:39Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/void.md | markdown | 2343 | 2026-06-02T22:10:58Z | runtime feature index artifact |
| FEATURE_INDEX_RUNTIME/vport.md | markdown | 10284 | 2026-06-02T21:58:00Z | runtime feature index artifact |
| FEATURE_INDEX/actors.md | markdown | 3277 | 2026-06-02T13:41:45Z | feature index artifact |
| FEATURE_INDEX/ads.md | markdown | 2660 | 2026-06-02T12:38:58Z | feature index artifact |
| FEATURE_INDEX/auth.md | markdown | 4100 | 2026-06-02T13:41:45Z | feature index artifact |
| FEATURE_INDEX/block.md | markdown | 3755 | 2026-06-02T13:41:45Z | feature index artifact |
| FEATURE_INDEX/booking.md | markdown | 4416 | 2026-06-02T13:41:45Z | feature index artifact |
| FEATURE_INDEX/chat.md | markdown | 3977 | 2026-06-02T10:32:12Z | feature index artifact |
| FEATURE_INDEX/dashboard.md | markdown | 4416 | 2026-06-02T13:42:44Z | feature index artifact |
| FEATURE_INDEX/explore.md | markdown | 2848 | 2026-06-02T12:38:50Z | feature index artifact |
| FEATURE_INDEX/feed.md | markdown | 4142 | 2026-06-02T10:33:08Z | feature index artifact |
| FEATURE_INDEX/hydration.md | markdown | 3123 | 2026-06-02T12:39:31Z | feature index artifact |
| FEATURE_INDEX/identity.md | markdown | 4141 | 2026-06-02T11:40:27Z | feature index artifact |
| FEATURE_INDEX/invite.md | markdown | 4434 | 2026-06-02T11:40:26Z | feature index artifact |
| FEATURE_INDEX/join.md | markdown | 4248 | 2026-06-02T11:40:26Z | feature index artifact |
| FEATURE_INDEX/legal.md | markdown | 3219 | 2026-06-02T10:34:30Z | feature index artifact |
| FEATURE_INDEX/media.md | markdown | 3872 | 2026-06-02T11:40:27Z | feature index artifact |
| FEATURE_INDEX/moderation.md | markdown | 4084 | 2026-06-02T10:35:20Z | feature index artifact |
| FEATURE_INDEX/notifications.md | markdown | 4299 | 2026-06-02T10:35:43Z | feature index artifact |
| FEATURE_INDEX/onboarding.md | markdown | 2479 | 2026-06-02T10:35:55Z | feature index artifact |
| FEATURE_INDEX/portfolio.md | markdown | 3240 | 2026-06-02T10:36:11Z | feature index artifact |
| FEATURE_INDEX/post.md | markdown | 3793 | 2026-06-02T10:36:33Z | feature index artifact |
| FEATURE_INDEX/professional.md | markdown | 2919 | 2026-06-02T12:39:08Z | feature index artifact |
| FEATURE_INDEX/profiles.md | markdown | 4781 | 2026-06-02T11:40:28Z | feature index artifact |
| FEATURE_INDEX/public.md | markdown | 4673 | 2026-06-02T11:28:05Z | feature index artifact |
| FEATURE_INDEX/settings.md | markdown | 4512 | 2026-06-02T13:40:55Z | feature index artifact |
| FEATURE_INDEX/social.md | markdown | 4400 | 2026-06-02T11:40:28Z | feature index artifact |
| FEATURE_INDEX/upload.md | markdown | 4610 | 2026-06-02T11:40:28Z | feature index artifact |
| FEATURE_INDEX/vgrid.md | markdown | 2643 | 2026-06-02T10:38:58Z | feature index artifact |
| FEATURE_INDEX/void.md | markdown | 2982 | 2026-06-02T12:39:20Z | feature index artifact |
| FEATURE_INDEX/vport.md | markdown | 5271 | 2026-06-02T11:40:29Z | feature index artifact |
| FEATURE_STATUS.md | markdown | 5614 | 2026-06-02T09:50:38Z | root governance registry |
| FROZEN_FEATURE_CONTRACT.md | markdown | 4512 | 2026-06-02T09:50:38Z | root governance registry |
| frozen/learning/README.md | markdown | 451 | 2026-06-02T09:50:38Z | frozen feature archive |
| frozen/learning/STATUS.md | markdown | 2057 | 2026-06-02T09:50:38Z | frozen feature archive |
| frozen/vgrid/README.md | markdown | 369 | 2026-06-02T09:50:38Z | frozen feature archive |
| frozen/vgrid/STATUS.md | markdown | 1872 | 2026-06-02T09:50:38Z | frozen feature archive |
| frozen/wanderex/README.md | markdown | 378 | 2026-06-02T09:50:38Z | frozen feature archive |
| frozen/wanderex/STATUS.md | markdown | 1890 | 2026-06-02T09:50:38Z | frozen feature archive |
| frozen/wanders/README.md | markdown | 375 | 2026-06-02T09:50:38Z | frozen feature archive |
| frozen/wanders/STATUS.md | markdown | 1926 | 2026-06-02T09:50:38Z | frozen feature archive |
| NEEDS_TRIAGE/CONFLICT_FROM_ACTIVE_CANONICAL___CANONICAL__logan__README.md | markdown | 8873 | 2026-06-02T09:50:38Z | triage holding area |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-03.md__09-03.md | markdown | 5498 | 2026-06-02T09:50:38Z | triage holding area |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-06.md__09-06.md | markdown | 8139 | 2026-06-02T09:50:38Z | triage holding area |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-07.md__09-07.md | markdown | 9074 | 2026-06-02T09:50:38Z | triage holding area |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-08.md__09-08.md | markdown | 2628 | 2026-06-02T09:50:38Z | triage holding area |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__10__10-06.md__10-06.md | markdown | 5063 | 2026-06-02T09:50:38Z | triage holding area |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__19__19-01.md__19-01.md | markdown | 2896 | 2026-06-02T09:50:38Z | triage holding area |
| NEEDS_TRIAGE/DR_STRANGE.md | markdown | 4089 | 2026-06-02T12:18:46Z | triage holding area |
| OUTPUT_NAMING_CONTRACT.md | markdown | 3095 | 2026-06-02T11:02:50Z | root governance registry |
| outputs/2026/06/02/ARCHITECT/ARCHITECT_VERIFICATION_PASS_2.md | markdown | 9649 | 2026-06-02T22:35:19Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/dead-and-spaghetti-code-report.md | markdown | 29875 | 2026-06-02T22:20:47Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/engine-consumer-map.md | markdown | 10467 | 2026-06-02T22:35:06Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/feature-map.md | markdown | 29572 | 2026-06-02T22:17:11Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/INDEX.md | markdown | 9939 | 2026-06-02T22:21:35Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.actors.architecture.md | markdown | 9109 | 2026-06-02T21:57:42Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.ads.architecture.md | markdown | 11887 | 2026-06-02T22:06:22Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.auth.architecture.md | markdown | 13680 | 2026-06-02T21:59:29Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.block.architecture.md | markdown | 14638 | 2026-06-02T21:58:57Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.booking.architecture.md | markdown | 15345 | 2026-06-02T22:02:49Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.chat.architecture.md | markdown | 17615 | 2026-06-02T21:59:33Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.dashboard.architecture.md | markdown | 18359 | 2026-06-02T22:01:43Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.explore.architecture.md | markdown | 10872 | 2026-06-02T22:03:28Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.feed.architecture.md | markdown | 15746 | 2026-06-02T22:13:09Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.hydration.architecture.md | markdown | 11473 | 2026-06-02T22:07:20Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.identity.architecture.md | markdown | 15888 | 2026-06-02T21:59:19Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.invite.architecture.md | markdown | 10244 | 2026-06-02T22:03:09Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.join.architecture.md | markdown | 13697 | 2026-06-02T22:04:07Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.legal.architecture.md | markdown | 13221 | 2026-06-02T21:58:37Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.media.architecture.md | markdown | 12158 | 2026-06-02T22:04:17Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.moderation.architecture.md | markdown | 13539 | 2026-06-02T21:58:28Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.notifications.architecture.md | markdown | 15682 | 2026-06-02T22:04:24Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.onboarding.architecture.md | markdown | 9949 | 2026-06-02T22:03:12Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.portfolio.architecture.md | markdown | 16231 | 2026-06-02T22:09:14Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.post.architecture.md | markdown | 18793 | 2026-06-02T22:06:35Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.professional.architecture.md | markdown | 11427 | 2026-06-02T22:05:34Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.profiles.architecture.md | markdown | 18617 | 2026-06-02T22:03:54Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.public.architecture.md | markdown | 15185 | 2026-06-02T21:59:18Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.reviews.architecture.md | markdown | 12576 | 2026-06-02T22:08:18Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.settings.architecture.md | markdown | 14382 | 2026-06-02T21:59:43Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.social.architecture.md | markdown | 13229 | 2026-06-02T22:02:54Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.upload.architecture.md | markdown | 12899 | 2026-06-02T22:03:44Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.void.architecture.md | markdown | 9823 | 2026-06-02T22:11:41Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.vport.architecture.md | markdown | 14615 | 2026-06-02T21:59:26Z | immutable command evidence |
| outputs/2026/06/02/ARCHITECT/system-map.md | markdown | 4934 | 2026-06-02T22:14:05Z | immutable command evidence |
| outputs/2026/06/02/blackwidow/001_platform-security_blackwidow_TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001.md | markdown | 64111 | 2026-06-02T23:24:08Z | immutable command evidence |
| outputs/2026/06/02/blackwidow/INDEX.md | markdown | 392 | 2026-06-02T23:24:15Z | immutable command evidence |
| outputs/2026/06/02/dr-strange/001_platform-governance_dr-strange_drstrange-coverage-audit.md | markdown | 30459 | 2026-06-02T11:19:48Z | immutable command evidence |
| outputs/2026/06/02/dr-strange/002_platform-documentation_dr-strange_command-matrix-backfill.md | markdown | 19246 | 2026-06-02T12:18:46Z | immutable command evidence |
| outputs/2026/06/02/dr-strange/003_cerebro-architect-pending-audit.md | markdown | 8599 | 2026-06-02T21:53:01Z | immutable command evidence |
| outputs/2026/06/02/dr-strange/004_platform-documentation_dr-strange_matrix-refresh.md | markdown | 9863 | 2026-06-02T23:38:31Z | immutable command evidence |
| outputs/2026/06/02/dr-strange/005_platform-documentation_dr-strange_governance-realignment-platform-refresh.md | markdown | 11911 | 2026-06-03T00:32:35Z | immutable command evidence |
| outputs/2026/06/02/dr-strange/INDEX.md | markdown | 956 | 2026-06-03T00:13:06Z | immutable command evidence |
| outputs/2026/06/02/ELEKTRA/2026-06-02_elektra_flyerbuilder-write-surfaces.md | markdown | 23390 | 2026-06-02T11:57:16Z | immutable command evidence |
| outputs/2026/06/02/ELEKTRA/2026-06-02_elektra_public-edge-functions-rpc.md | markdown | 15237 | 2026-06-02T11:37:37Z | immutable command evidence |
| outputs/2026/06/02/ELEKTRA/INDEX.md | markdown | 373 | 2026-06-02T12:07:43Z | immutable command evidence |
| outputs/2026/06/02/logan/001_platform-documentation_logan_codex-context-build.md | markdown | 3231 | 2026-06-02T12:41:56Z | immutable command evidence |
| outputs/2026/06/02/logan/001_platform-documentation_logan_governance-v2-index-rebuild.md | markdown | 10891 | 2026-06-02T12:42:22Z | immutable command evidence |
| outputs/2026/06/02/logan/003_platform-documentation_logan_governance-realignment.md | markdown | 2604 | 2026-06-03T00:32:42Z | immutable command evidence |
| outputs/2026/06/02/logan/INDEX.md | markdown | 614 | 2026-06-03T00:13:06Z | immutable command evidence |
| outputs/2026/06/02/scanner/001_TICKET-SCANNER-BARREL-REEXPORT-TRACE-0001_barrel-resolution-upgrade.md | markdown | 6021 | 2026-06-03T00:33:10Z | immutable command evidence |
| outputs/2026/06/02/sentry/001_dashboard-booking_sentry_rule9-remediation.md | markdown | 5452 | 2026-06-02T13:11:25Z | immutable command evidence |
| outputs/2026/06/02/sentry/INDEX.md | markdown | 264 | 2026-06-02T13:11:32Z | immutable command evidence |
| outputs/2026/06/02/venom/001_platform-security_venom_TICKET-VENOM-ARCHITECT-FINDINGS-0001.md | markdown | 59900 | 2026-06-02T22:58:38Z | immutable command evidence |
| outputs/2026/06/02/venom/INDEX.md | markdown | 453 | 2026-06-02T22:58:45Z | immutable command evidence |
| outputs/2026/06/02/wolverine/001_wolverine_dashboard_settings-doc-sync.md | markdown | 6579 | 2026-06-02T10:56:49Z | immutable command evidence |
| outputs/2026/06/02/wolverine/002_dashboard-settings_wolverine_venom-doc-sync.md | markdown | 5916 | 2026-06-02T11:18:13Z | immutable command evidence |
| outputs/2026/06/02/wolverine/003_public_wolverine_public-venom-p1-patch.md | markdown | 8088 | 2026-06-02T11:20:09Z | immutable command evidence |
| outputs/2026/06/02/wolverine/004_block_wolverine_ownership-completion.md | markdown | 2658 | 2026-06-02T11:27:03Z | immutable command evidence |
| outputs/2026/06/02/wolverine/005_platform-documentation_wolverine_drstrange-p0-backfill.md | markdown | 5417 | 2026-06-02T11:31:16Z | immutable command evidence |
| outputs/2026/06/02/wolverine/006_dashboard-settings_wolverine_blackwidow-doc-sync.md | markdown | 2892 | 2026-06-02T11:32:01Z | immutable command evidence |
| outputs/2026/06/02/wolverine/007_dashboard-settings_wolverine_blackwidow-doc-sync-formal.md | markdown | 3969 | 2026-06-02T11:38:41Z | immutable command evidence |
| outputs/2026/06/02/wolverine/008_platform-documentation_wolverine_drstrange-p1-backfill.md | markdown | 2409 | 2026-06-02T11:41:13Z | immutable command evidence |
| outputs/2026/06/02/wolverine/009_platform-documentation_wolverine_drstrange-p2-backfill.md | markdown | 3527 | 2026-06-02T12:02:17Z | immutable command evidence |
| outputs/2026/06/02/wolverine/INDEX.md | markdown | 2994 | 2026-06-02T12:02:45Z | immutable command evidence |
| platform/change-intent/27-02.md | markdown | 1954 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/change-intent/27-17.md | markdown | 1593 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/change-intent/CHANGE_INTENT.md | markdown | 2307 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/change-intent/DR_STRANGE.md | markdown | 3478 | 2026-06-02T12:18:46Z | platform/shared documentation |
| platform/debuggers/DR_STRANGE.md | markdown | 3367 | 2026-06-02T12:18:46Z | platform/shared documentation |
| platform/debuggers/vcsm.debug.architecture.md | markdown | 3374 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/03-13.md | markdown | 2143 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/03-14.md | markdown | 4558 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/03-15.md | markdown | 2957 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/09-09.md | markdown | 3138 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/09-13.md | markdown | 3445 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/09-18.md | markdown | 7783 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/09-20.md | markdown | 2494 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/10-08.md | markdown | 9597 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/12-03.md | markdown | 2510 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/12-09.md | markdown | 1482 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/16-02.md | markdown | 2429 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/16-04.md | markdown | 2522 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/19-04.md | markdown | 2929 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/2026-04-01.captain-log.md | markdown | 4357 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/2026-04-10.captain-log.md | markdown | 1594 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/2026-04-13_folder-alignment-report.md | markdown | 6733 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/2026-04-13.captain-log.md | markdown | 2023 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/2026-04-19.captain-log.md | markdown | 3298 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/2026-05-10.captain-log.md | markdown | 4477 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/2026-05-27_architect_vport-dtab-001-duplicate-registry.md | markdown | 4201 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| platform/documentation/2026-05-27_architect_vport-dtab-006-adapter-boundary.md | markdown | 4784 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| platform/documentation/2026-05-27_carnage_book-slot-collision-proposal.md | markdown | 5088 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/2026-05-27_cross-root-approval_traffic-seo-routes.md | markdown | 2915 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/documentation/2026-05-27_venom_vport-book-tab.md | markdown | 5792 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| platform/documentation/2026-05-27_venom_vport-gas-tab.md | markdown | 5756 | 2026-06-02T09:50:38Z | dashboard module documentation for gas |
| platform/documentation/2026-05-27_venom_vport-owner-tab.md | markdown | 4864 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| platform/documentation/2026-05-27_watcher008-dependency-review.md | markdown | 5485 | 2026-06-02T09:50:37Z | feature documentation for review |
| platform/documentation/2026-06-02_wolverine_dashboard-ticket-0004.md | markdown | 3271 | 2026-06-02T09:50:38Z | feature documentation for dashboard |
| platform/documentation/25-01.md | markdown | 7054 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/27-01.md | markdown | 2630 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/27-09.md | markdown | 4168 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/BAT-03-01.md | markdown | 1807 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/BEHAVIOR_TEMPLATE.md | markdown | 8576 | 2026-06-02T22:46:30Z | platform/shared documentation |
| platform/documentation/bottom-navigation.graph.json | json | 33720 | 2026-05-11T08:52:04Z | platform/shared documentation |
| platform/documentation/code-derived-app-review.md | markdown | 16374 | 2026-06-02T09:50:38Z | feature documentation for review |
| platform/documentation/codex-context/codex-command-decision-tree.md | markdown | 1517 | 2026-06-02T12:41:27Z | codex context documentation |
| platform/documentation/codex-context/codex-command-registry.md | markdown | 9604 | 2026-06-02T12:41:27Z | codex context documentation |
| platform/documentation/codex-context/codex-feature-routing.md | markdown | 4828 | 2026-06-02T12:41:27Z | codex context documentation |
| platform/documentation/codex-context/codex-governance-v2-rulebook.md | markdown | 3273 | 2026-06-02T12:41:27Z | codex context documentation |
| platform/documentation/codex-context/codex-output-template.md | markdown | 233 | 2026-06-02T12:41:27Z | codex context documentation |
| platform/documentation/codex-context/codex-ticket-workflow.md | markdown | 2233 | 2026-06-02T12:41:27Z | codex context documentation |
| platform/documentation/codex-context/CODEX.md | markdown | 2711 | 2026-06-02T12:41:27Z | codex context documentation |
| platform/documentation/codex-context/prompt/360.md | markdown | 598 | 2026-06-02T13:05:55Z | codex context documentation |
| platform/documentation/codex-context/prompt/architect.md | markdown | 9248 | 2026-06-02T13:25:28Z | codex context documentation |
| platform/documentation/codex-context/prompt/DR. STRANGE.md | markdown | 821 | 2026-06-02T13:06:00Z | codex context documentation |
| platform/documentation/codex-context/prompt/Engineering Reality.md | markdown | 463 | 2026-06-02T13:02:57Z | codex context documentation |
| platform/documentation/codex-context/prompt/One.md | markdown | 576 | 2026-06-02T13:03:39Z | codex context documentation |
| platform/documentation/codex-context/prompt/THOR Readiness.md | markdown | 404 | 2026-06-02T13:03:16Z | codex context documentation |
| platform/documentation/command-preflight-matrix.md | markdown | 12396 | 2026-06-02T23:15:26Z | scanner/command documentation |
| platform/documentation/CURRENT_OUTPUT_CONTRACT_001.md | markdown | 2006 | 2026-06-02T10:31:43Z | platform/shared documentation |
| platform/documentation/CURRENT_STATUS.md | markdown | 3636 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/dal-map.graph.json | json | 1091444 | 2026-05-11T11:29:05Z | platform/shared documentation |
| platform/documentation/database-read-map.md | markdown | 11392 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/dev-performance-code-logic.md | markdown | 16578 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/DOCS_MIGRATION_PLAN.md | markdown | 16603 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/DR_STRANGE.md | markdown | 7648 | 2026-06-03T00:32:56Z | platform/shared documentation |
| platform/documentation/ENGINE_INDEPENDENCE_AUDIT.md | markdown | 19800 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/ENGINE_INDEPENDENCE_FINAL_REPORT.md | markdown | 12138 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/evidence/001_platform-governance_dr-strange_drstrange-coverage-audit.md | markdown | 30459 | 2026-06-02T12:08:06Z | platform/shared documentation |
| platform/documentation/evidence/005_platform-documentation_wolverine_drstrange-p0-backfill.md | markdown | 5417 | 2026-06-02T12:08:06Z | platform/shared documentation |
| platform/documentation/evidence/008_platform-documentation_wolverine_drstrange-p1-backfill.md | markdown | 2409 | 2026-06-02T12:08:06Z | platform/shared documentation |
| platform/documentation/extractor.md | markdown | 24221 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/feature-map.md | markdown | 14727 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/feedback_ticketing_output_format.md | markdown | 599 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/Founder Narrative.md | markdown | 7620 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/GLOBAL_DIRECTORY_ARCHITECTURE.md | markdown | 5931 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/GLOBAL_DIRECTORY_AUDIT_REPORT.md | markdown | 127956 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/HISTORY_INDEX.md | markdown | 5665 | 2026-06-02T12:07:43Z | platform/shared documentation |
| platform/documentation/HISTORY_RELOCATION_AUDIT.md | markdown | 16114 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/HISTORY_RELOCATION_COVERAGE_AUDIT.md | markdown | 33336 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/home-feed.graph.json | json | 21644 | 2026-05-11T08:53:22Z | feature documentation for feed |
| platform/documentation/legacy-outcomes/_ACTIVE__tools__shield-visualizer/README.md | markdown | 1027 | 2026-05-11T08:06:36Z | platform/shared documentation |
| platform/documentation/logan-cleanup-report-2026-05-11.md | markdown | 25017 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/documentation/mission.md | markdown | 5353 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/p2_batch2_manifest_20260430_212747.md | markdown | 5064 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/p2_batch3_manifest_20260430.md | markdown | 4988 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/phase3a-identity-drift-2026-05-11.md | markdown | 13975 | 2026-06-02T09:50:37Z | feature documentation for identity |
| platform/documentation/phase3b-booking-vports-drift-2026-05-11.md | markdown | 14593 | 2026-06-02T09:50:37Z | dashboard module documentation for booking |
| platform/documentation/phase3c-chat-engines-audit-chain-2026-05-11.md | markdown | 9118 | 2026-06-02T09:50:37Z | feature documentation for chat |
| platform/documentation/phase3d-runtime-mutations-drift-2026-05-11.md | markdown | 10388 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/documentation/phase3e-profiles-public-notifications-drift-2026-05-11.md | markdown | 8422 | 2026-06-02T09:50:37Z | feature documentation for profiles |
| platform/documentation/phase3f-vport-schema-migration-scope-2026-05-11.md | markdown | 8122 | 2026-06-02T09:50:37Z | dashboard module documentation for vport |
| platform/documentation/Platform Principles.md | markdown | 2701 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/platform.performance.observability-system.md | markdown | 16253 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/Product Philosophy.md | markdown | 1728 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/README.md | markdown | 5331 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/remediation_phase1_20260430_191833.md | markdown | 3542 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/REPOSITORY_GOVERNANCE.md | markdown | 6030 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/repository-architecture-interpretation.md | markdown | 31535 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/review.md | markdown | 6463 | 2026-06-02T09:50:38Z | feature documentation for review |
| platform/documentation/route-tree.md | markdown | 7375 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/scanner-freshness-contract.md | markdown | 6843 | 2026-06-02T23:16:06Z | scanner/command documentation |
| platform/documentation/scanner-output-contract.md | markdown | 7530 | 2026-06-02T23:17:35Z | scanner/command documentation |
| platform/documentation/scanner-trust-contract.md | markdown | 8754 | 2026-06-02T23:16:53Z | scanner/command documentation |
| platform/documentation/SOURCE_ROOT_CLASSIFICATION.md | markdown | 17387 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/system-map.2026-04.md | markdown | 5672 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/The Vibez Citizens Manifesto.md | markdown | 1933 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/TRAFFIC_ARCHITECTURE_REVIEW.md | markdown | 57606 | 2026-06-02T09:50:38Z | feature documentation for review |
| platform/documentation/TRAFFIC_FOLDER_ARCHITECTURE_AUDIT.md | markdown | 45992 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/TRAFFIC_VPORT_INTEGRATION_AUDIT.md | markdown | 27234 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| platform/documentation/traffic-architecture-map.md | markdown | 19069 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/traffic-data-evolution-plan.md | markdown | 8395 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/traffic-performance-report.md | markdown | 3636 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/traffic-security-report.md | markdown | 2285 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/traffic.architecture-audit.md | markdown | 11556 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/traffic.seo.canonical-metadata-fix.md | markdown | 5242 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/traffic.taxonomy.naming-contract.md | markdown | 14888 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/traffic.traze.vcsm-funnel-audit.md | markdown | 13686 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/traffic.vport.directory-integration.md | markdown | 10829 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| platform/documentation/TRAZE_IMPLEMENTATION_LOG.md | markdown | 11805 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/vcsm-engine-consumer-map.md | markdown | 5849 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/vcsm-performance-report.md | markdown | 6589 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/vcsm-reviews-component-tree.md | markdown | 8222 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| platform/documentation/vcsm-reviews-event-flow-map.md | markdown | 12296 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| platform/documentation/vcsm.chat.badge-pipeline.md | markdown | 12317 | 2026-06-02T09:50:38Z | feature documentation for chat |
| platform/documentation/vcsm.chat.message-flow-audit.md | markdown | 15428 | 2026-06-02T09:50:38Z | feature documentation for chat |
| platform/documentation/vcsm.dal.chat.md | markdown | 60546 | 2026-06-02T09:50:38Z | feature documentation for chat |
| platform/documentation/vcsm.dal.explore.md | markdown | 46628 | 2026-06-02T09:50:38Z | feature documentation for explore |
| platform/documentation/vcsm.dal.invite.md | markdown | 35915 | 2026-06-02T09:50:38Z | feature documentation for invite |
| platform/documentation/vcsm.explore.search-pipeline.md | markdown | 15902 | 2026-06-02T09:50:38Z | feature documentation for explore |
| platform/documentation/vcsm.feed.profiler-system.md | markdown | 7476 | 2026-06-02T09:50:38Z | feature documentation for feed |
| platform/documentation/vcsm.i18n.phase2-string-wiring.md | markdown | 12448 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/vcsm.identity.actor-switch-pipeline.md | markdown | 13418 | 2026-06-02T09:50:38Z | feature documentation for identity |
| platform/documentation/vcsm.identity.auth-pipeline.md | markdown | 19645 | 2026-06-02T09:50:38Z | feature documentation for auth |
| platform/documentation/vcsm.identity.email-flows.md | markdown | 15465 | 2026-06-02T09:50:38Z | feature documentation for identity |
| platform/documentation/vcsm.identity.engine-architecture.md | markdown | 20276 | 2026-06-02T09:50:38Z | feature documentation for identity |
| platform/documentation/vcsm.native.runtime-audit.md | markdown | 36351 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/vcsm.navigation.audit.md | markdown | 32641 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/vcsm.performance.known-bottlenecks.md | markdown | 9564 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/vcsm.performance.optimization-history.md | markdown | 15772 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/vcsm.performance.route-profiles.md | markdown | 6729 | 2026-06-02T09:50:38Z | feature documentation for profiles |
| platform/documentation/vcsm.platform.nav-screens-read-cache-skeleton.md | markdown | 9189 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/vcsm.platform.read-audit-5-surfaces.md | markdown | 9285 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/vcsm.platform.read-optimization-plan.md | markdown | 9668 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/vcsm.public.conversion-funnel.md | markdown | 10899 | 2026-06-02T09:50:38Z | feature documentation for public |
| platform/documentation/vcsm.public.seo-infrastructure.md | markdown | 17933 | 2026-06-02T09:50:38Z | feature documentation for public |
| platform/documentation/vcsm.public.top-nav.md | markdown | 10845 | 2026-06-02T09:50:38Z | feature documentation for public |
| platform/documentation/vcsm.runtime.profile-nav-audit.md | markdown | 30359 | 2026-06-02T09:50:38Z | feature documentation for profile |
| platform/documentation/vcsm.runtime.settings-profile-audit.md | markdown | 16484 | 2026-06-02T09:50:38Z | feature documentation for profile |
| platform/documentation/vcsm.runtime.vibes-tab-audit.md | markdown | 28489 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/vcsm.vport.review-implementation-plan.md | markdown | 12701 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| platform/documentation/VERTICAL_PRIORITY_AUDIT.md | markdown | 29102 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/WENTREX_ARCHITECTURE_REVIEW.md | markdown | 16365 | 2026-06-02T09:50:38Z | feature documentation for review |
| platform/documentation/WENTREX_USER_CREATION_PIPELINE.md | markdown | 20171 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/wentrex-database-read-map.md | markdown | 5372 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/wentrex-dependency-map.md | markdown | 3984 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/wentrex-feature-map.md | markdown | 7111 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/wentrex-performance-migration-report.md | markdown | 6183 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/wentrex-security-report.md | markdown | 9300 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/wentrex-system-map.md | markdown | 4023 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/documentation/zNOTFORPRODUCTION_DISCOVERY_REPORT.md | markdown | 61087 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/native/10-05.md | markdown | 10470 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/native/11-01.md | markdown | 1797 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/native/14-approval-tracker.md | markdown | 1176 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/native/18-approval-tracker.md | markdown | 2360 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/native/2026-04-05_10-41_contracts-dead-code-i18n-audit.md | markdown | 5804 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/native/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | markdown | 12962 | 2026-06-02T09:50:38Z | feature documentation for legal |
| platform/native/24-approval-tracker.md | markdown | 1561 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/native/26-06.md | markdown | 3408 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/native/27-approval-tracker.md | markdown | 1898 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/native/AGENTS.md | markdown | 2773 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/auth.md | markdown | 6109 | 2026-06-02T09:50:37Z | feature documentation for auth |
| platform/native/booking.md | markdown | 5562 | 2026-06-02T09:50:37Z | feature documentation for booking |
| platform/native/bottom-nav-runtime.md | markdown | 31038 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/chat-inbox-deep-audit.md | markdown | 39818 | 2026-06-02T09:50:37Z | feature documentation for chat |
| platform/native/chat-inbox.md | markdown | 8254 | 2026-06-02T09:50:37Z | feature documentation for chat |
| platform/native/composer-upload.md | markdown | 5168 | 2026-06-02T09:50:37Z | feature documentation for upload |
| platform/native/dashboard-routes.md | markdown | 7347 | 2026-06-02T09:50:37Z | feature documentation for dashboard |
| platform/native/dashboard-vport-deep-audit.md | markdown | 23542 | 2026-06-02T09:50:37Z | dashboard module documentation for vport |
| platform/native/DELETE_FEATURE_TRANSFER.md | markdown | 20246 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/DOCS_SPAGHETTI_AUDIT.md | markdown | 21262 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/native/DR_STRANGE.md | markdown | 3704 | 2026-06-02T12:18:46Z | platform/shared documentation |
| platform/native/explore-search.md | markdown | 4772 | 2026-06-02T09:50:37Z | feature documentation for explore |
| platform/native/falcon_chat_dal_parity_2026-05-14.md | markdown | 15108 | 2026-06-02T09:50:37Z | feature documentation for chat |
| platform/native/falcon_feed-dal-parity-2026-05-14.md | markdown | 7834 | 2026-06-02T09:50:37Z | feature documentation for feed |
| platform/native/feed.md | markdown | 5859 | 2026-06-02T09:50:37Z | feature documentation for feed |
| platform/native/identity.md | markdown | 3534 | 2026-06-02T09:50:37Z | feature documentation for identity |
| platform/native/learning.md | markdown | 6288 | 2026-06-02T09:50:37Z | frozen feature reference |
| platform/native/moderation.md | markdown | 8540 | 2026-06-02T09:50:37Z | feature documentation for moderation |
| platform/native/MODULE_PROMPT_TEMPLATE.md | markdown | 1778 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/NATIVE_COMMAND_CENTER.md | markdown | 13506 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/NATIVE_SYNC_COMMAND.md | markdown | 6286 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/notifications.md | markdown | 7354 | 2026-06-02T09:50:37Z | feature documentation for notifications |
| platform/native/PIPELINE_PROMPT.md | markdown | 2843 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/post-card.md | markdown | 4420 | 2026-06-02T09:50:37Z | feature documentation for post |
| platform/native/post-detail.md | markdown | 4656 | 2026-06-02T09:50:37Z | feature documentation for post |
| platform/native/public-menu.md | markdown | 4104 | 2026-06-02T09:50:37Z | feature documentation for public |
| platform/native/public-vport-profile.md | markdown | 5029 | 2026-06-02T09:50:37Z | dashboard module documentation for vport |
| platform/native/PWA_TO_NATIVE_GENERATOR.md | markdown | 1563 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/README.md | markdown | 2990 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/reviews.md | markdown | 4460 | 2026-06-02T09:50:37Z | feature documentation for reviews |
| platform/native/rls-authenticated-access.md | markdown | 4137 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/ROADTRIP_INDEX.md | markdown | 21776 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/ROADTRIP.md | markdown | 73613 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/RUN_NATIVE_SYNC.md | markdown | 425 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/schema-platform.md | markdown | 3614 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/schema-reviews.md | markdown | 2767 | 2026-06-02T09:50:37Z | feature documentation for reviews |
| platform/native/schema-vc.md | markdown | 5360 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/native/schema-vport.md | markdown | 4977 | 2026-06-02T09:50:37Z | dashboard module documentation for vport |
| platform/native/settings.md | markdown | 9914 | 2026-06-02T09:50:37Z | feature documentation for settings |
| platform/native/social-follow.md | markdown | 4688 | 2026-06-02T09:50:37Z | feature documentation for social |
| platform/native/vport-types-tabs-deep-audit.md | markdown | 38884 | 2026-06-02T09:50:37Z | dashboard module documentation for vport |
| platform/native/wanders.md | markdown | 2778 | 2026-06-02T09:50:37Z | frozen feature reference |
| platform/security/01-04.md | markdown | 11424 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/03-02.md | markdown | 3382 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/03-04.md | markdown | 4146 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/03-11.md | markdown | 12581 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/03-18.md | markdown | 3575 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/03-21.md | markdown | 3013 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/05-16.md | markdown | 40318 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/09-22-report.md | markdown | 26468 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/10-01.md | markdown | 1218 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/10-04.md | markdown | 9076 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/10-05.md | markdown | 2427 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/12-22-settings-fix.md | markdown | 2095 | 2026-06-02T09:50:38Z | feature documentation for settings |
| platform/security/12-32.md | markdown | 2344 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/13-01.md | markdown | 3244 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/13-02.md | markdown | 4665 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/14-03.md | markdown | 3173 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/16-03.md | markdown | 7225 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/18-01.md | markdown | 3534 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/18-03.md | markdown | 4224 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/19-09.md | markdown | 708 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/19-11.md | markdown | 2600 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/20-02.md | markdown | 3912 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-04-12.runtime-observability-build.md | markdown | 4216 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/2026-04-25.security-headers-audit.md | markdown | 2562 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/2026-05-03_deletion-pipeline-audit.md | markdown | 32621 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/2026-05-09_00-00_venom_whole-project-deep.md | markdown | 30224 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-10_00-00_venom_vcsm-full-deep-scan.md | markdown | 33979 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-10_04-04_carnage_secdefiner-rls-elimination.md | markdown | 40938 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-10_04-04_venom_secdefiner-trust-boundaries.md | markdown | 27160 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-10_moderation-db-remediation-plan.md | markdown | 45755 | 2026-06-02T09:50:38Z | feature documentation for moderation |
| platform/security/2026-05-10_pre-push_venom_full-security-sweep.md | markdown | 21634 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-10.block-follow-privacy-enforcement.md | markdown | 21022 | 2026-06-02T09:50:38Z | feature documentation for block |
| platform/security/2026-05-10.deleted-account-gate.md | markdown | 6401 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/2026-05-10.post-system-quick-wins.md | markdown | 4476 | 2026-06-02T09:50:38Z | feature documentation for post |
| platform/security/2026-05-10.security-hardening-full-remediation.md | markdown | 18345 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/2026-05-11_carnage_block-friend-ranks.md | markdown | 2299 | 2026-06-02T09:50:37Z | feature documentation for block |
| platform/security/2026-05-14_14-00_blackwidow_vcsm-full-pass.md | markdown | 35165 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-14_18-45_db_vport-rls-full-schema-audit.md | markdown | 31203 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| platform/security/2026-05-14_carnage_booking-rls-policies.md | markdown | 28856 | 2026-06-02T09:50:37Z | feature documentation for booking |
| platform/security/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | markdown | 38668 | 2026-06-02T09:50:37Z | feature documentation for auth |
| platform/security/2026-05-14_carnage_chat-inbox-attachments-migration-history.md | markdown | 18069 | 2026-06-02T09:50:37Z | feature documentation for chat |
| platform/security/2026-05-14_carnage_content-pages-legacy-policy-cleanup.md | markdown | 24653 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-14_carnage_feed-dal-rls-verification.md | markdown | 21401 | 2026-06-02T09:50:37Z | feature documentation for feed |
| platform/security/2026-05-14_thor_booking-availability-write-release-gate.md | markdown | 17155 | 2026-06-02T09:50:37Z | feature documentation for booking |
| platform/security/2026-05-14_thor_booking-postfix-release-gate.md | markdown | 11543 | 2026-06-02T09:50:37Z | feature documentation for booking |
| platform/security/2026-05-18_blackwidow_feed-dal-rls-adversarial.md | markdown | 12568 | 2026-06-02T09:50:37Z | feature documentation for feed |
| platform/security/2026-05-18_carnage_booking-rls-readiness.md | markdown | 8293 | 2026-06-02T09:50:37Z | feature documentation for booking |
| platform/security/2026-05-18_carnage_consent-ip-edge-function.md | markdown | 10721 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-18_carnage_feed-dal-rls-delta.md | markdown | 6405 | 2026-06-02T09:50:37Z | feature documentation for feed |
| platform/security/2026-05-18_carnage_identity-rpc-migration-ownership.md | markdown | 23605 | 2026-06-02T09:50:37Z | feature documentation for identity |
| platform/security/2026-05-18_venom_identity-provision-rpc-security.md | markdown | 16160 | 2026-06-02T09:50:37Z | feature documentation for identity |
| platform/security/2026-05-19_11-20_db_platform-identity-security-review.md | markdown | 15787 | 2026-06-02T09:50:38Z | feature documentation for identity |
| platform/security/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | markdown | 17573 | 2026-06-02T09:50:37Z | feature documentation for media |
| platform/security/2026-05-19_13-30_thor_media-dal-release-gate.md | markdown | 13156 | 2026-06-02T09:50:37Z | feature documentation for media |
| platform/security/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | markdown | 9897 | 2026-06-02T09:50:37Z | feature documentation for media |
| platform/security/2026-05-22_10-00_carnage_vc-posts-insert-ownership-rls.md | markdown | 19601 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-22_carnage_vc-posts-insert-rls-cerebro-verification.md | markdown | 6971 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-23_17-30_db_portfolio-rls-policies.md | markdown | 32040 | 2026-06-02T09:50:38Z | feature documentation for portfolio |
| platform/security/2026-05-23_carnage_reviews-schema-provenance-and-rls.md | markdown | 15164 | 2026-06-02T09:50:37Z | feature documentation for reviews |
| platform/security/2026-05-23_carnage_vport-services-rates-rls-backfill.md | markdown | 20086 | 2026-06-02T09:50:37Z | dashboard module documentation for services |
| platform/security/2026-05-23_db_profiles-session-rls-audit.md | markdown | 28698 | 2026-06-02T09:50:38Z | feature documentation for profiles |
| platform/security/2026-05-23_db_vport-services-migration-review.md | markdown | 11258 | 2026-06-02T09:50:38Z | dashboard module documentation for services |
| platform/security/2026-05-23_db_vport-services-rls-security-verification.md | markdown | 42293 | 2026-06-02T09:50:38Z | dashboard module documentation for services |
| platform/security/2026-05-23_thor_profiles-cerebro-release-gate.md | markdown | 16939 | 2026-06-02T09:50:37Z | feature documentation for profiles |
| platform/security/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | markdown | 23480 | 2026-06-02T09:50:37Z | dashboard module documentation for leads |
| platform/security/2026-05-24_db_vport-business-card-leads.md | markdown | 24293 | 2026-06-02T09:50:38Z | dashboard module documentation for leads |
| platform/security/2026-05-25_09-00_db_reviews-schema-deep-audit.md | markdown | 22197 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| platform/security/2026-05-26_carnage_migration-history-registration-plan.md | markdown | 25067 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-26_elektra_db-drift-code-chain-review.md | markdown | 22936 | 2026-06-02T09:50:37Z | feature documentation for review |
| platform/security/2026-05-26_hawkeye_db-drift-endpoint-impact.md | markdown | 26238 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-26_thor_db-drift-release-gate.md | markdown | 23464 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-26_venom_db-drift-rls-review.md | markdown | 24492 | 2026-06-02T09:50:37Z | feature documentation for review |
| platform/security/2026-05-27_03-15_ironman_vport-leads-access-policy.md | markdown | 11837 | 2026-06-02T09:50:37Z | dashboard module documentation for leads |
| platform/security/2026-05-27_05-42_db_barber-rls-verification.md | markdown | 13192 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/2026-05-27_06-40_thor_vport-book-tab-release-gate.md | markdown | 16258 | 2026-06-02T09:50:37Z | dashboard module documentation for vport |
| platform/security/2026-05-27_14-00_dataengineer_gasprices-batch-c-db-constraints.md | markdown | 26446 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | markdown | 41948 | 2026-06-02T09:50:37Z | feature documentation for review |
| platform/security/2026-05-27_15-30_venom_ticket-0008-code-review.md | markdown | 28932 | 2026-06-02T09:50:37Z | feature documentation for review |
| platform/security/2026-05-27_16-30_venom_ticket-platform-rls-001.md | markdown | 17761 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-27_18-30_venom_external-site.md | markdown | 44702 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-27_18-30_venom_tripoint.md | markdown | 51731 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-27_19-00_blackwidow_external-site-tripoint.md | markdown | 51075 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-27_20-00_elektra_external-site.md | markdown | 32106 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-27_carnage_team-settings-rls-audit.md | markdown | 10708 | 2026-06-02T09:50:37Z | feature documentation for settings |
| platform/security/2026-05-27_carnage_ticket-0005-bookings-select-rls-verification.md | markdown | 20524 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | markdown | 10152 | 2026-06-02T09:50:37Z | feature documentation for auth |
| platform/security/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | markdown | 12992 | 2026-06-02T09:50:37Z | feature documentation for profiles |
| platform/security/2026-05-27_carnage_vport-profile-public-details-rls.md | markdown | 6013 | 2026-06-02T09:50:37Z | dashboard module documentation for vport |
| platform/security/2026-05-27_ticket-sub-001-subscriber-rpc-architecture.md | markdown | 17913 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-05-27_watcher005-ci-workflow-review.md | markdown | 2098 | 2026-06-02T09:50:37Z | feature documentation for review |
| platform/security/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | markdown | 17834 | 2026-06-02T09:50:37Z | feature documentation for actor |
| platform/security/2026-05-28_elektra_tripoint.md | markdown | 3437 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/2026-06-01_db_tier2-surgical-confirmations.md | markdown | 5450 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/2026-06-02_wolverine_ticket-0007A_current-backfill.md | markdown | 11354 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/24-02.md | markdown | 3171 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/25-01.md | markdown | 3362 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/25-02.md | markdown | 3582 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/25-03.md | markdown | 4016 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/26-05.md | markdown | 2410 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/26-12.md | markdown | 3880 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/27-12.md | markdown | 5496 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/27-13.md | markdown | 3491 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/27-19.md | markdown | 2158 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/27-20.md | markdown | 2309 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/27-approval-tracker-12.md | markdown | 1679 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/api-exposure-map.md | markdown | 5237 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/audit-status.md | markdown | 891 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/auth-login.graph.json | json | 30684 | 2026-05-11T09:13:52Z | feature documentation for auth |
| platform/security/avengers-assembly-2026-05-14-booking.md | markdown | 18048 | 2026-06-02T09:50:38Z | feature documentation for booking |
| platform/security/avengers-assembly-2026-05-18-dashboard-dal.md | markdown | 16687 | 2026-06-02T09:50:38Z | feature documentation for dashboard |
| platform/security/BAT-03-02.md | markdown | 3674 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/bundle-boundary-map.md | markdown | 4154 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/cerebro_venom-fix-plan.md | markdown | 11537 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/client-server-execution-map.md | markdown | 4018 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/COMMAND_OUTPUT_CONTRACT_PLAN.md | markdown | 16353 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/CURRENT_STATUS.md | markdown | 3802 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/database-read-map.md | markdown | 7346 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/dead-and-spaghetti-code-report.md | markdown | 15227 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/dead-feature-report.md | markdown | 4834 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/dependency-map.md | markdown | 5899 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/DR_STRANGE.md | markdown | 3461 | 2026-06-02T12:18:46Z | platform/shared documentation |
| platform/security/engine-consumer-map.md | markdown | 2287 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/engine.hydration.owner.md | markdown | 10236 | 2026-06-02T09:50:38Z | feature documentation for hydration |
| platform/security/event-flow-map.md | markdown | 5616 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/explore.graph.json | json | 10858 | 2026-05-11T08:53:52Z | feature documentation for explore |
| platform/security/feature-ownership-map.md | markdown | 5476 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/FINAL_SUMMARY.md | markdown | 9950 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/governance-overlays.graph.json | json | 7122 | 2026-05-26T00:11:35Z | platform/shared documentation |
| platform/security/HISTORY_INDEX.md | markdown | 3530 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/home-central-feed-runtime-map.md | markdown | 13308 | 2026-06-02T09:50:38Z | feature documentation for feed |
| platform/security/p2_batch6_manifest_20260430.md | markdown | 6909 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/PROFILE_UPLOAD_WRITEBACK_20260430-222216.md | markdown | 5800 | 2026-06-02T09:50:38Z | feature documentation for profile |
| platform/security/PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md | markdown | 2684 | 2026-06-02T09:50:38Z | feature documentation for profile |
| platform/security/README.md | markdown | 4694 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/release-status.md | markdown | 571 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/restoredMapvcsm.auth-login.runtime-map.md | markdown | 37750 | 2026-06-02T09:50:38Z | feature documentation for auth |
| platform/security/rls-assumption-map.md | markdown | 5333 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/security.md | markdown | 816 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/settings.graph.json | json | 19754 | 2026-05-11T08:58:27Z | feature documentation for settings |
| platform/security/source-imports.graph.json | json | 2700944 | 2026-05-11T10:00:12Z | platform/shared documentation |
| platform/security/supabase-view-dependency-tree.md | markdown | 4251 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/system-map.md | markdown | 2568 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/ticket_platform_rls_001.md | markdown | 1327 | 2026-06-02T09:50:37Z | platform/shared documentation |
| platform/security/TRAFFIC_P0_ARCHITECTURE_REMEDIATION_20260430-205704.md | markdown | 5956 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | markdown | 6024 | 2026-06-02T09:50:38Z | feature documentation for upload |
| platform/security/vcsm-database-read-map.md | markdown | 10269 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/vcsm-dependency-map.md | markdown | 4385 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/vcsm-feature-map.md | markdown | 9017 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/vcsm-migration-risk-report.md | markdown | 10431 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/vcsm-module-architecture-summary.md | markdown | 15516 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/vcsm-reviews-api-exposure-map.md | markdown | 6100 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| platform/security/vcsm-reviews-bundle-client-server-map.md | markdown | 6891 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| platform/security/vcsm-reviews-database-read-map.md | markdown | 10851 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| platform/security/vcsm-reviews-dead-and-spaghetti-report.md | markdown | 12724 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| platform/security/vcsm-reviews-feature-ownership-map.md | markdown | 6633 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| platform/security/vcsm-reviews-governance-overlay.graph.json | json | 7206 | 2026-05-25T06:05:30Z | feature documentation for reviews |
| platform/security/vcsm-reviews-rls-assumption-map.md | markdown | 9294 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| platform/security/vcsm-reviews-supabase-view-tree.md | markdown | 6268 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| platform/security/vcsm-security-report.md | markdown | 14253 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/vcsm-system-map.md | markdown | 2303 | 2026-06-02T09:50:38Z | platform/shared documentation |
| platform/security/vcsm-vport-gas-prices.graph.json | json | 20646 | 2026-05-25T22:56:26Z | dashboard module documentation for gas |
| platform/security/vcsm.ads.architecture.md | markdown | 3084 | 2026-06-02T09:50:38Z | feature documentation for ads |
| platform/security/vcsm.auth-login.architecture.md | markdown | 22477 | 2026-06-02T09:50:38Z | feature documentation for auth |
| platform/security/vcsm.auth.architecture.md | markdown | 10036 | 2026-06-02T09:50:38Z | feature documentation for auth |
| platform/security/vcsm.block.owner.md | markdown | 7807 | 2026-06-02T09:50:38Z | feature documentation for block |
| platform/security/vcsm.booking.architecture.md | markdown | 26649 | 2026-06-02T09:50:38Z | feature documentation for booking |
| platform/security/vcsm.bottom-nav.explore.architecture.md | markdown | 5185 | 2026-06-02T09:50:38Z | feature documentation for explore |
| platform/security/vcsm.bottom-nav.profile.architecture.md | markdown | 6319 | 2026-06-02T09:50:38Z | feature documentation for profile |
| platform/security/vcsm.bottom-nav.upload.architecture.md | markdown | 5783 | 2026-06-02T09:50:38Z | feature documentation for upload |
| platform/security/vcsm.bottom-nav.vox-chat.architecture.md | markdown | 5557 | 2026-06-02T09:50:38Z | feature documentation for chat |
| platform/security/vcsm.dal.learning.md | markdown | 58319 | 2026-06-02T09:50:38Z | frozen feature reference |
| platform/security/vcsm.explore.architecture.md | markdown | 4341 | 2026-06-02T09:50:38Z | feature documentation for explore |
| platform/security/vcsm.hydration.architecture.md | markdown | 3655 | 2026-06-02T09:50:38Z | feature documentation for hydration |
| platform/security/vcsm.identity.architecture.md | markdown | 8164 | 2026-06-02T09:50:38Z | feature documentation for identity |
| platform/security/vcsm.identity.owner.md | markdown | 13154 | 2026-06-02T09:50:38Z | feature documentation for identity |
| platform/security/vcsm.legal.architecture.md | markdown | 3360 | 2026-06-02T09:50:38Z | feature documentation for legal |
| platform/security/vcsm.media.owner.md | markdown | 11288 | 2026-06-02T09:50:38Z | feature documentation for media |
| platform/security/vcsm.moderation.architecture.md | markdown | 3862 | 2026-06-02T09:50:38Z | feature documentation for moderation |
| platform/security/vcsm.notifications.architecture.md | markdown | 8082 | 2026-06-02T09:50:38Z | feature documentation for notifications |
| platform/security/vcsm.notifications.owner.md | markdown | 12416 | 2026-06-02T09:50:38Z | feature documentation for notifications |
| platform/security/vcsm.portfolio-card.architecture.md | markdown | 38284 | 2026-06-02T09:50:38Z | feature documentation for portfolio |
| platform/security/vcsm.professional.architecture.md | markdown | 4783 | 2026-06-02T09:50:38Z | feature documentation for professional |
| platform/security/vcsm.profiles.owner.md | markdown | 12031 | 2026-06-02T09:50:38Z | feature documentation for profiles |
| platform/security/vcsm.public.architecture.md | markdown | 6136 | 2026-06-02T09:50:38Z | feature documentation for public |
| platform/security/vcsm.reviews.architecture.md | markdown | 21838 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| platform/security/vcsm.social.architecture.md | markdown | 7061 | 2026-06-02T09:50:38Z | feature documentation for social |
| platform/security/vcsm.upload.architecture.md | markdown | 4752 | 2026-06-02T09:50:38Z | feature documentation for upload |
| platform/security/vcsm.void.architecture.md | markdown | 3535 | 2026-06-02T09:50:38Z | feature documentation for void |
| platform/security/vcsm.vport-availability.architecture.md | markdown | 23372 | 2026-06-02T09:50:38Z | dashboard module documentation for availability |
| platform/security/vcsm.vport-dashboard-leads.architecture.md | markdown | 20832 | 2026-06-02T09:50:38Z | dashboard module documentation for leads |
| platform/security/vcsm.vport-dashboard.architecture.md | markdown | 27345 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| platform/security/vcsm.vport-exchange-rate-dashboard.architecture.md | markdown | 26116 | 2026-06-02T09:50:38Z | dashboard module documentation for exchange |
| platform/security/vcsm.vport-gas-prices.architecture.md | markdown | 34996 | 2026-06-02T09:50:38Z | dashboard module documentation for gas |
| platform/security/vcsm.vport-public-menu.architecture.md | markdown | 29395 | 2026-06-02T09:50:38Z | dashboard module documentation for menu |
| platform/security/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | markdown | 34601 | 2026-06-02T09:50:38Z | dashboard module documentation for menu |
| platform/security/vcsm.vport-reviews-dashboard.architecture.md | markdown | 27084 | 2026-06-02T09:50:38Z | dashboard module documentation for reviews |
| platform/security/vcsm.vport-reviews.owner.md | markdown | 13812 | 2026-06-02T09:50:38Z | dashboard module documentation for reviews |
| platform/security/vcsm.vport-services-dashboard-card.architecture.md | markdown | 19146 | 2026-06-02T09:50:38Z | dashboard module documentation for services |
| platform/security/vcsm.wanderex.architecture.md | markdown | 6991 | 2026-06-02T09:50:38Z | frozen feature reference |
| platform/security/vcsm.wanders.architecture.md | markdown | 11978 | 2026-06-02T09:50:38Z | frozen feature reference |
| platform/security/VPORT_ARCHITECTURE_FOLDER_GAP_REPORT.md | markdown | 14294 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| platform/security/VPORT_FOLDER_BUILD_PLAN.md | markdown | 27438 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| platform/security/VPORT_TRIAD_COVERAGE_MATRIX.md | markdown | 17708 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| PROM/ARchitect.doc | doc | 958 | 2026-06-02T09:50:38Z | unregistered root subfolder |
| PROM/cerebro.doc | doc | 1393 | 2026-06-02T09:50:38Z | unregistered root subfolder |
| PROM/INVESTOR.doc | doc | 4154 | 2026-06-02T09:50:38Z | unregistered root subfolder |
| README.md | markdown | 1825 | 2026-06-02T09:50:38Z | root governance registry |
| services/03-20.md | markdown | 1363 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/12-04.md | markdown | 1650 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/12-14.md | markdown | 6481 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/12-15.md | markdown | 4780 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/12-26.md | markdown | 2976 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/18-04.md | markdown | 7637 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/19-10.md | markdown | 1590 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/2026-04_month_summary.md | markdown | 5672 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/2026-04-06_12-00_full-platform-audit-migration-hardening.md | markdown | 15673 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/2026-04-10_02-30_legal-consent-theme-unification.md | markdown | 9370 | 2026-06-02T09:50:38Z | feature documentation for legal |
| services/2026-04-12_00-00_psl-foundation-notification-engine-migration.md | markdown | 9172 | 2026-06-02T09:50:38Z | feature documentation for notification |
| services/27-11.md | markdown | 2477 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/DR_STRANGE.md | markdown | 3751 | 2026-06-02T12:18:46Z | platform/shared documentation |
| services/findings.md | markdown | 1278 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/ownership.md | markdown | 202 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/performance.md | markdown | 169 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/README.md | markdown | 1202 | 2026-06-02T09:50:38Z | platform/shared documentation |
| services/vcsm.vport.external-site-integration.md | markdown | 10277 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| services/vcsm.vport.menu-pipeline.md | markdown | 40234 | 2026-06-02T09:50:38Z | dashboard module documentation for menu |
| services/vcsm.vport.tripoint-integration.md | markdown | 12868 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| shared/.batsignal.md | markdown | 1686 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/01-01.md | markdown | 12331 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/01-03.md | markdown | 5694 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/02-01.md | markdown | 3724 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/03-01.md | markdown | 2178 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/03-05.md | markdown | 4248 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/03-06.md | markdown | 5758 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/03-07.md | markdown | 5889 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/03-08.md | markdown | 4930 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/03-10.md | markdown | 4927 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/03-12.md | markdown | 4895 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/04-01.md | markdown | 2685 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/05-01.md | markdown | 14977 | 2026-06-02T09:50:37Z | platform/shared documentation |
| shared/05-02.md | markdown | 15716 | 2026-06-02T09:50:37Z | platform/shared documentation |
| shared/05-03.md | markdown | 8836 | 2026-06-02T09:50:37Z | platform/shared documentation |
| shared/05-04.md | markdown | 4796 | 2026-06-02T09:50:37Z | platform/shared documentation |
| shared/05-05.md | markdown | 9700 | 2026-06-02T09:50:37Z | platform/shared documentation |
| shared/05-06.md | markdown | 11517 | 2026-06-02T09:50:37Z | platform/shared documentation |
| shared/05-07.md | markdown | 11333 | 2026-06-02T09:50:37Z | platform/shared documentation |
| shared/05-08.md | markdown | 7318 | 2026-06-02T09:50:37Z | platform/shared documentation |
| shared/05-10.md | markdown | 5684 | 2026-06-02T09:50:37Z | platform/shared documentation |
| shared/05-12.md | markdown | 10863 | 2026-06-02T09:50:37Z | platform/shared documentation |
| shared/05-13.md | markdown | 10677 | 2026-06-02T09:50:37Z | platform/shared documentation |
| shared/05-17.md | markdown | 7696 | 2026-06-02T09:50:37Z | platform/shared documentation |
| shared/06-02.md | markdown | 9071 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/09-04.md | markdown | 7933 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/09-05.md | markdown | 11197 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/09-06.md | markdown | 6371 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/09-07.md | markdown | 7829 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/09-08.md | markdown | 7854 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/09-10.md | markdown | 3248 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/09-11.md | markdown | 7880 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/09-13.md | markdown | 2058 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/09-14.md | markdown | 31357 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/09-15.md | markdown | 3299 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/09-16.md | markdown | 5946 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/09-17.md | markdown | 7710 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/09-23.md | markdown | 10745 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/10-01.md | markdown | 6521 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/10-04.md | markdown | 9001 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/10-06.md | markdown | 1411 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/10-09.md | markdown | 12322 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/11-02.md | markdown | 9209 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-01.md | markdown | 11519 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-02.md | markdown | 4650 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-05.md | markdown | 2208 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-06.md | markdown | 1639 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-07.md | markdown | 1129 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-08.md | markdown | 2425 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-10.md | markdown | 706 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-13.md | markdown | 757 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-16.md | markdown | 4030 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-17.md | markdown | 4511 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-18.md | markdown | 3966 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-19.md | markdown | 6499 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-20.md | markdown | 4944 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-21.md | markdown | 18713 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-23.md | markdown | 2653 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-24.md | markdown | 3713 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-25-bootstrap-dedup.md | markdown | 5150 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-27.md | markdown | 3163 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-28.md | markdown | 2375 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-29.md | markdown | 2548 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-30.md | markdown | 9075 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/12-31.md | markdown | 8815 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/13-03.md | markdown | 2664 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/13-04.md | markdown | 2005 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/13-05.md | markdown | 3088 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/14-01.md | markdown | 3679 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/14-02.md | markdown | 2456 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/16-01.md | markdown | 4381 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/16-05.md | markdown | 4441 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/16-06.md | markdown | 4297 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/18-02.md | markdown | 4266 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/19-01.md | markdown | 13434 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/19-05.md | markdown | 2009 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/19-06.md | markdown | 3081 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/19-07.md | markdown | 4373 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/19-08.md | markdown | 2628 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/20-03.md | markdown | 2621 | 2026-06-02T09:50:37Z | platform/shared documentation |
| shared/2026-03_month_summary.md | markdown | 1823 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/2026-03-31_14-50_chat-engine-stabilization.md | markdown | 6420 | 2026-06-02T09:50:38Z | feature documentation for chat |
| shared/2026-04-01_18-00_engine-independence-and-schema-truth.md | markdown | 11197 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | markdown | 10536 | 2026-06-02T09:50:38Z | feature documentation for chat |
| shared/2026-04-09_01-58_booking-review-identity-audit.md | markdown | 8899 | 2026-06-02T09:50:38Z | feature documentation for booking |
| shared/2026-04-10_09-15_full-platform-cache-theme-polish.md | markdown | 9730 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/2026-04-13_12-30_vport-dal-schema-migration.md | markdown | 7326 | 2026-06-02T09:50:38Z | dashboard module documentation for vport |
| shared/2026-05-14_db_booking-schema.md | markdown | 15518 | 2026-06-02T09:50:38Z | feature documentation for booking |
| shared/2026-05-14_db_feed-rls-four-tables.md | markdown | 18342 | 2026-06-02T09:50:38Z | feature documentation for feed |
| shared/2026-05-18_11-00_db_identity-governance-review.md | markdown | 31289 | 2026-06-02T09:50:38Z | feature documentation for identity |
| shared/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | markdown | 5492 | 2026-06-02T09:50:38Z | dashboard module documentation for booking |
| shared/2026-05-19_14-30_db_notifications-rls-audit.md | markdown | 14875 | 2026-06-02T09:50:38Z | feature documentation for notifications |
| shared/2026-05-19_16-00_db_vc-posts-insert-rls-gap.md | markdown | 9345 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/2026-05-23_14-00_db_reviews-schema-rls-audit.md | markdown | 29776 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| shared/2026-06-02_wolverine_ticket-0006_vcsm-source-workflow-intake.md | markdown | 2305 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/2026-06-02_wolverine_ticket-0006a_normalize-classification-drift.md | markdown | 3102 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/24-01.md | markdown | 3800 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/26-01.md | markdown | 3581 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/26-02.md | markdown | 1740 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/26-03.md | markdown | 8478 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/26-08.md | markdown | 4608 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/26-09.md | markdown | 4112 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/27-03.md | markdown | 7838 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/27-04.md | markdown | 4999 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/27-05.md | markdown | 4567 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/27-06.md | markdown | 5738 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/27-08.md | markdown | 6756 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/27-10.md | markdown | 5059 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/27-15.md | markdown | 3997 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/27-16.md | markdown | 4979 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/BOOKING_ENGINE_AUDIT_V1.md | markdown | 14619 | 2026-06-02T09:50:38Z | feature documentation for booking |
| shared/CHAT_ENGINE_AUDIT_V1.md | markdown | 14347 | 2026-06-02T09:50:38Z | feature documentation for chat |
| shared/CHAT_ENGINE_AUDIT_V2.md | markdown | 3985 | 2026-06-02T09:50:38Z | feature documentation for chat |
| shared/CHAT_ENGINE_AUDIT_V3.md | markdown | 8995 | 2026-06-02T09:50:38Z | feature documentation for chat |
| shared/CLEAN_DOCS_ARCHITECTURE_PLAN.md | markdown | 11278 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | markdown | 2458 | 2026-06-02T09:50:38Z | dashboard module documentation for reviews |
| shared/DR_STRANGE.md | markdown | 4761 | 2026-06-02T12:18:46Z | platform/shared documentation |
| shared/engines.booking.contract.md | markdown | 902 | 2026-06-02T09:50:38Z | feature documentation for booking |
| shared/engines.chat.capability.md | markdown | 3378 | 2026-06-02T09:50:38Z | feature documentation for chat |
| shared/engines.chat.contract.md | markdown | 4844 | 2026-06-02T09:50:38Z | feature documentation for chat |
| shared/engines.drift.vcsm-wentrex-pipeline-analysis.md | markdown | 16681 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/engines.identity.boundary-audit.md | markdown | 13263 | 2026-06-02T09:50:38Z | feature documentation for identity |
| shared/engines.identity.boundary.md | markdown | 6516 | 2026-06-02T09:50:38Z | feature documentation for identity |
| shared/engines.identity.contract.md | markdown | 6393 | 2026-06-02T09:50:38Z | feature documentation for identity |
| shared/engines.isolation.chat-identity-audit.md | markdown | 4944 | 2026-06-02T09:50:38Z | feature documentation for identity |
| shared/engines.media.system-architecture.md | markdown | 11378 | 2026-06-02T09:50:38Z | feature documentation for media |
| shared/engines.notifications.engine-architecture.md | markdown | 20688 | 2026-06-02T09:50:38Z | feature documentation for notifications |
| shared/engines.portfolio.contract.md | markdown | 2554 | 2026-06-02T09:50:38Z | feature documentation for portfolio |
| shared/engines.portfolio.system-architecture.md | markdown | 30387 | 2026-06-02T09:50:38Z | feature documentation for portfolio |
| shared/engines.reviews.contract.md | markdown | 3451 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| shared/engines.vcsm.architecture-inspection.md | markdown | 27673 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/FEATURE_DOCUMENTATION_INVENTORY.md | markdown | 18841 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/MEDIA_ENGINE_AUDIT_V1.md | markdown | 10682 | 2026-06-02T09:50:38Z | feature documentation for media |
| shared/NOTIFICATIONS_ENGINE_AUDIT_V1.md | markdown | 9394 | 2026-06-02T09:50:38Z | feature documentation for notifications |
| shared/p2_batch4_manifest_20260430.md | markdown | 5709 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/p2_batch7_manifest_20260430.md | markdown | 2567 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/PORTFOLIO_ENGINE_AUDIT_V1.md | markdown | 8153 | 2026-06-02T09:50:38Z | feature documentation for portfolio |
| shared/PORTFOLIO_ENGINE_AUDIT_V2.md | markdown | 11131 | 2026-06-02T09:50:38Z | feature documentation for portfolio |
| shared/ticketing.md | markdown | 1838 | 2026-06-02T09:50:38Z | platform/shared documentation |
| shared/vcsm.ui.architecture.md | markdown | 2461 | 2026-06-02T09:50:38Z | platform/shared documentation |
| skills/vcsm-contributor/SKILL.md | markdown | 11897 | 2026-06-02T09:50:38Z | platform/shared documentation |
| skills/vcsm/SKILL.md | markdown | 20572 | 2026-06-02T09:50:38Z | platform/shared documentation |
| SOURCE_WORKFLOW_INTAKE.md | markdown | 40182 | 2026-06-02T09:50:38Z | root governance registry |
| state/03-03.md | markdown | 2379 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/03-09.md | markdown | 3332 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/03-17.md | markdown | 3874 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/03-19.md | markdown | 3673 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/06-01.md | markdown | 7650 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/09-03.md | markdown | 8055 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/09-05.md | markdown | 6640 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/09-12.md | markdown | 2008 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/09-14.md | markdown | 5325 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/09-15.md | markdown | 1296 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/09-16.md | markdown | 2115 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/09-18.md | markdown | 3974 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/09-20.md | markdown | 4162 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/09-21-report.md | markdown | 33921 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/09-21.md | markdown | 19435 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/09-22.md | markdown | 6890 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/10-02.md | markdown | 12920 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/10-03.md | markdown | 6393 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/10-07.md | markdown | 4738 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/12-11.md | markdown | 841 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/12-12.md | markdown | 696 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/12-22.md | markdown | 13597 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/12-26-consents-fix.md | markdown | 2868 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/16-09.md | markdown | 8513 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/18-01.md | markdown | 4484 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/19-03.md | markdown | 14081 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/20-01.md | markdown | 3356 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/2026-05-18_00-00_db_feed-rls-four-tables.md | markdown | 18274 | 2026-06-02T09:50:38Z | feature documentation for feed |
| state/2026-05-19_12-00_db_media-assets-rls-audit.md | markdown | 15404 | 2026-06-02T09:50:38Z | feature documentation for media |
| state/2026-05-22_db_profiles-rls-coverage-audit.md | markdown | 15303 | 2026-06-02T09:50:38Z | feature documentation for profiles |
| state/2026-05-23_10-00_db_live-migration-gap-audit.md | markdown | 19314 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/2026-05-23_19-00_db_portfolio-trigger-functions.md | markdown | 4508 | 2026-06-02T09:50:38Z | feature documentation for portfolio |
| state/2026-05-26_18-00_db_migration-reconciliation.md | markdown | 56728 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | markdown | 5893 | 2026-06-02T09:50:38Z | dashboard module documentation for settings |
| state/26-02.md | markdown | 6711 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/26-03.md | markdown | 4958 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/26-11.md | markdown | 4582 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/27-07.md | markdown | 4161 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/27-14.md | markdown | 2739 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/BAT-03-04.md | markdown | 7266 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/bottom-navigation-runtime-map.md | markdown | 22300 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/DR_STRANGE.md | markdown | 5122 | 2026-06-02T12:18:46Z | platform/shared documentation |
| state/p2_batch5_manifest_20260430.md | markdown | 7204 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/p2_batch8_manifest_20260430.md | markdown | 3492 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/state-store-map.md | markdown | 4413 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/TRAZE_ANSWERS_SEO_MANIFEST_20260430-203517.md | markdown | 46912 | 2026-06-02T09:50:38Z | platform/shared documentation |
| state/vcsm-reviews-state-store-map.md | markdown | 8206 | 2026-06-02T09:50:38Z | feature documentation for reviews |
| styles/DR_STRANGE.md | markdown | 3432 | 2026-06-02T12:18:46Z | platform/shared documentation |
| styles/vcsm.theme.design-tokens.md | markdown | 13978 | 2026-06-02T09:50:38Z | platform/shared documentation |
| styles/vcsm.theme.splash-screen.md | markdown | 5881 | 2026-06-02T09:50:38Z | platform/shared documentation |

## Phase 2 - Classification

| Current Path | Classification | Action | Target Path | Risk |
| --- | --- | --- | --- | --- |
| CATEGORY_REGISTRY.md | ROOT_REGISTRY | KEEP | current | LOW |
| FEATURE_DOCUMENTATION_INDEX.md | ROOT_REGISTRY | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/actors.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/ads.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/auth.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/block.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/booking.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/chat.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/dashboard.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/explore.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/feed.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/hydration.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/identity.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/invite.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/join.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/legal.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/media.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/moderation.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/notifications.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/onboarding.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/portfolio.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/post.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/professional.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/profiles.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/public.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/README.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/reviews.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/settings.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/social.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/upload.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/vgrid.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/void.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX_RUNTIME/vport.md | RUNTIME_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/actors.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/ads.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/auth.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/block.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/booking.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/chat.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/dashboard.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/explore.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/feed.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/hydration.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/identity.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/invite.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/join.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/legal.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/media.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/moderation.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/notifications.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/onboarding.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/portfolio.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/post.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/professional.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/profiles.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/public.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/settings.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/social.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/upload.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/vgrid.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/void.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_INDEX/vport.md | FEATURE_INDEX | KEEP | current | LOW |
| FEATURE_STATUS.md | ROOT_REGISTRY | KEEP | current | LOW |
| FROZEN_FEATURE_CONTRACT.md | ROOT_REGISTRY | KEEP | current | LOW |
| frozen/learning/README.md | HISTORY_FILE | KEEP | current | LOW |
| frozen/learning/STATUS.md | HISTORY_FILE | KEEP | current | LOW |
| frozen/vgrid/README.md | HISTORY_FILE | KEEP | current | LOW |
| frozen/vgrid/STATUS.md | HISTORY_FILE | KEEP | current | LOW |
| frozen/wanderex/README.md | HISTORY_FILE | KEEP | current | LOW |
| frozen/wanderex/STATUS.md | HISTORY_FILE | KEEP | current | LOW |
| frozen/wanders/README.md | HISTORY_FILE | KEEP | current | LOW |
| frozen/wanders/STATUS.md | HISTORY_FILE | KEEP | current | LOW |
| NEEDS_TRIAGE/CONFLICT_FROM_ACTIVE_CANONICAL___CANONICAL__logan__README.md | UNKNOWN | REVIEW | unknown | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-03.md__09-03.md | STALE | REVIEW | unknown | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-06.md__09-06.md | STALE | REVIEW | unknown | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-07.md__09-07.md | STALE | REVIEW | unknown | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-08.md__09-08.md | STALE | REVIEW | unknown | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__10__10-06.md__10-06.md | STALE | REVIEW | unknown | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__19__19-01.md__19-01.md | STALE | REVIEW | unknown | HIGH |
| NEEDS_TRIAGE/DR_STRANGE.md | UNKNOWN | REVIEW | unknown | HIGH |
| OUTPUT_NAMING_CONTRACT.md | ROOT_REGISTRY | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/ARCHITECT_VERIFICATION_PASS_2.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/dead-and-spaghetti-code-report.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/engine-consumer-map.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/feature-map.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/INDEX.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.actors.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.ads.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.auth.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.block.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.booking.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.chat.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.dashboard.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.explore.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.feed.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.hydration.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.identity.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.invite.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.join.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.legal.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.media.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.moderation.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.notifications.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.onboarding.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.portfolio.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.post.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.professional.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.profiles.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.public.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.reviews.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.settings.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.social.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.upload.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.void.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.vport.architecture.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ARCHITECT/system-map.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/blackwidow/001_platform-security_blackwidow_TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/blackwidow/INDEX.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/dr-strange/001_platform-governance_dr-strange_drstrange-coverage-audit.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/dr-strange/002_platform-documentation_dr-strange_command-matrix-backfill.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/dr-strange/003_cerebro-architect-pending-audit.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/dr-strange/004_platform-documentation_dr-strange_matrix-refresh.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/dr-strange/005_platform-documentation_dr-strange_governance-realignment-platform-refresh.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/dr-strange/INDEX.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ELEKTRA/2026-06-02_elektra_flyerbuilder-write-surfaces.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ELEKTRA/2026-06-02_elektra_public-edge-functions-rpc.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/ELEKTRA/INDEX.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/logan/001_platform-documentation_logan_codex-context-build.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/logan/001_platform-documentation_logan_governance-v2-index-rebuild.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/logan/003_platform-documentation_logan_governance-realignment.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/logan/INDEX.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/scanner/001_TICKET-SCANNER-BARREL-REEXPORT-TRACE-0001_barrel-resolution-upgrade.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/sentry/001_dashboard-booking_sentry_rule9-remediation.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/sentry/INDEX.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/venom/001_platform-security_venom_TICKET-VENOM-ARCHITECT-FINDINGS-0001.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/venom/INDEX.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/wolverine/001_wolverine_dashboard_settings-doc-sync.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/wolverine/002_dashboard-settings_wolverine_venom-doc-sync.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/wolverine/003_public_wolverine_public-venom-p1-patch.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/wolverine/004_block_wolverine_ownership-completion.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/wolverine/005_platform-documentation_wolverine_drstrange-p0-backfill.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/wolverine/006_dashboard-settings_wolverine_blackwidow-doc-sync.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/wolverine/007_dashboard-settings_wolverine_blackwidow-doc-sync-formal.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/wolverine/008_platform-documentation_wolverine_drstrange-p1-backfill.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/wolverine/009_platform-documentation_wolverine_drstrange-p2-backfill.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| outputs/2026/06/02/wolverine/INDEX.md | IMMUTABLE_EVIDENCE | KEEP | current | LOW |
| platform/change-intent/27-02.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/change-intent/27-17.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/change-intent/CHANGE_INTENT.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/change-intent/DR_STRANGE.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/debuggers/DR_STRANGE.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/debuggers/vcsm.debug.architecture.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/03-13.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/03-14.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/03-15.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/09-09.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/09-13.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/09-18.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/09-20.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/10-08.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/12-03.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/12-09.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/16-02.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/16-04.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/19-04.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/2026-04-01.captain-log.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/2026-04-10.captain-log.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/2026-04-13_folder-alignment-report.md | PLATFORM_DOC | REVIEW | unknown | MEDIUM |
| platform/documentation/2026-04-13.captain-log.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/2026-04-19.captain-log.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/2026-05-10.captain-log.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/2026-05-27_architect_vport-dtab-001-duplicate-registry.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/2026-05-27_architect_vport-dtab-001-duplicate-registry.md | HIGH |
| platform/documentation/2026-05-27_architect_vport-dtab-006-adapter-boundary.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/2026-05-27_architect_vport-dtab-006-adapter-boundary.md | HIGH |
| platform/documentation/2026-05-27_carnage_book-slot-collision-proposal.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/2026-05-27_cross-root-approval_traffic-seo-routes.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/2026-05-27_venom_vport-book-tab.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/2026-05-27_venom_vport-book-tab.md | HIGH |
| platform/documentation/2026-05-27_venom_vport-gas-tab.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/gas/2026-05-27_venom_vport-gas-tab.md | MEDIUM |
| platform/documentation/2026-05-27_venom_vport-owner-tab.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/2026-05-27_venom_vport-owner-tab.md | HIGH |
| platform/documentation/2026-05-27_watcher008-dependency-review.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/2026-05-27_watcher008-dependency-review.md | MEDIUM |
| platform/documentation/2026-06-02_wolverine_dashboard-ticket-0004.md | FEATURE_DOC_MISPLACED | MOVE | features/dashboard/2026-06-02_wolverine_dashboard-ticket-0004.md | MEDIUM |
| platform/documentation/25-01.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/27-01.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/27-09.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/BAT-03-01.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/BEHAVIOR_TEMPLATE.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/bottom-navigation.graph.json | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/code-derived-app-review.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/code-derived-app-review.md | MEDIUM |
| platform/documentation/codex-context/codex-command-decision-tree.md | CODEX_CONTEXT | KEEP | current | LOW |
| platform/documentation/codex-context/codex-command-registry.md | CODEX_CONTEXT | KEEP | current | LOW |
| platform/documentation/codex-context/codex-feature-routing.md | CODEX_CONTEXT | KEEP | current | LOW |
| platform/documentation/codex-context/codex-governance-v2-rulebook.md | CODEX_CONTEXT | KEEP | current | LOW |
| platform/documentation/codex-context/codex-output-template.md | CODEX_CONTEXT | KEEP | current | LOW |
| platform/documentation/codex-context/codex-ticket-workflow.md | CODEX_CONTEXT | KEEP | current | LOW |
| platform/documentation/codex-context/CODEX.md | CODEX_CONTEXT | KEEP | current | LOW |
| platform/documentation/codex-context/prompt/360.md | CODEX_CONTEXT | KEEP | current | LOW |
| platform/documentation/codex-context/prompt/architect.md | CODEX_CONTEXT | KEEP | current | LOW |
| platform/documentation/codex-context/prompt/DR. STRANGE.md | CODEX_CONTEXT | KEEP | current | LOW |
| platform/documentation/codex-context/prompt/Engineering Reality.md | CODEX_CONTEXT | KEEP | current | LOW |
| platform/documentation/codex-context/prompt/One.md | CODEX_CONTEXT | KEEP | current | LOW |
| platform/documentation/codex-context/prompt/THOR Readiness.md | CODEX_CONTEXT | KEEP | current | LOW |
| platform/documentation/command-preflight-matrix.md | SCANNER_DOC | KEEP | current | LOW |
| platform/documentation/CURRENT_OUTPUT_CONTRACT_001.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/CURRENT_STATUS.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/dal-map.graph.json | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/database-read-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/dev-performance-code-logic.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/DOCS_MIGRATION_PLAN.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/DR_STRANGE.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/ENGINE_INDEPENDENCE_AUDIT.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/ENGINE_INDEPENDENCE_FINAL_REPORT.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/evidence/001_platform-governance_dr-strange_drstrange-coverage-audit.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/evidence/005_platform-documentation_wolverine_drstrange-p0-backfill.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/evidence/008_platform-documentation_wolverine_drstrange-p1-backfill.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/extractor.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/feature-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/feedback_ticketing_output_format.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/Founder Narrative.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/GLOBAL_DIRECTORY_ARCHITECTURE.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/GLOBAL_DIRECTORY_AUDIT_REPORT.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/HISTORY_INDEX.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/HISTORY_RELOCATION_AUDIT.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/HISTORY_RELOCATION_COVERAGE_AUDIT.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/home-feed.graph.json | FEATURE_DOC_MISPLACED | MOVE | features/feed/home-feed.graph.json | MEDIUM |
| platform/documentation/legacy-outcomes/_ACTIVE__tools__shield-visualizer/README.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/logan-cleanup-report-2026-05-11.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/mission.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/p2_batch2_manifest_20260430_212747.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/p2_batch3_manifest_20260430.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/phase3a-identity-drift-2026-05-11.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/phase3a-identity-drift-2026-05-11.md | MEDIUM |
| platform/documentation/phase3b-booking-vports-drift-2026-05-11.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/booking/phase3b-booking-vports-drift-2026-05-11.md | MEDIUM |
| platform/documentation/phase3c-chat-engines-audit-chain-2026-05-11.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/phase3c-chat-engines-audit-chain-2026-05-11.md | MEDIUM |
| platform/documentation/phase3d-runtime-mutations-drift-2026-05-11.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/phase3e-profiles-public-notifications-drift-2026-05-11.md | FEATURE_DOC_MISPLACED | MOVE | features/profiles/phase3e-profiles-public-notifications-drift-2026-05-11.md | MEDIUM |
| platform/documentation/phase3f-vport-schema-migration-scope-2026-05-11.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/phase3f-vport-schema-migration-scope-2026-05-11.md | HIGH |
| platform/documentation/Platform Principles.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/platform.performance.observability-system.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/Product Philosophy.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/README.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/remediation_phase1_20260430_191833.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/REPOSITORY_GOVERNANCE.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/repository-architecture-interpretation.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/review.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/review.md | MEDIUM |
| platform/documentation/route-tree.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/scanner-freshness-contract.md | SCANNER_DOC | KEEP | current | LOW |
| platform/documentation/scanner-output-contract.md | SCANNER_DOC | KEEP | current | LOW |
| platform/documentation/scanner-trust-contract.md | SCANNER_DOC | KEEP | current | LOW |
| platform/documentation/SOURCE_ROOT_CLASSIFICATION.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/system-map.2026-04.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/The Vibez Citizens Manifesto.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/TRAFFIC_ARCHITECTURE_REVIEW.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/TRAFFIC_ARCHITECTURE_REVIEW.md | MEDIUM |
| platform/documentation/TRAFFIC_FOLDER_ARCHITECTURE_AUDIT.md | PLATFORM_DOC | REVIEW | unknown | MEDIUM |
| platform/documentation/TRAFFIC_VPORT_INTEGRATION_AUDIT.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/TRAFFIC_VPORT_INTEGRATION_AUDIT.md | HIGH |
| platform/documentation/traffic-architecture-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/traffic-data-evolution-plan.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/traffic-performance-report.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/traffic-security-report.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/traffic.architecture-audit.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/traffic.seo.canonical-metadata-fix.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/traffic.taxonomy.naming-contract.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/traffic.traze.vcsm-funnel-audit.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/traffic.vport.directory-integration.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/traffic.vport.directory-integration.md | HIGH |
| platform/documentation/TRAZE_IMPLEMENTATION_LOG.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/vcsm-engine-consumer-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/vcsm-performance-report.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/vcsm-reviews-component-tree.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/vcsm-reviews-component-tree.md | MEDIUM |
| platform/documentation/vcsm-reviews-event-flow-map.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/vcsm-reviews-event-flow-map.md | MEDIUM |
| platform/documentation/vcsm.chat.badge-pipeline.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/vcsm.chat.badge-pipeline.md | MEDIUM |
| platform/documentation/vcsm.chat.message-flow-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/vcsm.chat.message-flow-audit.md | MEDIUM |
| platform/documentation/vcsm.dal.chat.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/vcsm.dal.chat.md | MEDIUM |
| platform/documentation/vcsm.dal.explore.md | FEATURE_DOC_MISPLACED | MOVE | features/explore/vcsm.dal.explore.md | MEDIUM |
| platform/documentation/vcsm.dal.invite.md | FEATURE_DOC_MISPLACED | MOVE | features/invite/vcsm.dal.invite.md | MEDIUM |
| platform/documentation/vcsm.explore.search-pipeline.md | FEATURE_DOC_MISPLACED | MOVE | features/explore/vcsm.explore.search-pipeline.md | MEDIUM |
| platform/documentation/vcsm.feed.profiler-system.md | FEATURE_DOC_MISPLACED | MOVE | features/feed/vcsm.feed.profiler-system.md | MEDIUM |
| platform/documentation/vcsm.i18n.phase2-string-wiring.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/vcsm.identity.actor-switch-pipeline.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/vcsm.identity.actor-switch-pipeline.md | MEDIUM |
| platform/documentation/vcsm.identity.auth-pipeline.md | FEATURE_DOC_MISPLACED | MOVE | features/auth/vcsm.identity.auth-pipeline.md | MEDIUM |
| platform/documentation/vcsm.identity.email-flows.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/vcsm.identity.email-flows.md | MEDIUM |
| platform/documentation/vcsm.identity.engine-architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/vcsm.identity.engine-architecture.md | MEDIUM |
| platform/documentation/vcsm.native.runtime-audit.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/vcsm.navigation.audit.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/vcsm.performance.known-bottlenecks.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/vcsm.performance.optimization-history.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/vcsm.performance.route-profiles.md | FEATURE_DOC_MISPLACED | MOVE | features/profiles/vcsm.performance.route-profiles.md | MEDIUM |
| platform/documentation/vcsm.platform.nav-screens-read-cache-skeleton.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/vcsm.platform.read-audit-5-surfaces.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/vcsm.platform.read-optimization-plan.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/vcsm.public.conversion-funnel.md | FEATURE_DOC_MISPLACED | MOVE | features/public/vcsm.public.conversion-funnel.md | MEDIUM |
| platform/documentation/vcsm.public.seo-infrastructure.md | FEATURE_DOC_MISPLACED | MOVE | features/public/vcsm.public.seo-infrastructure.md | MEDIUM |
| platform/documentation/vcsm.public.top-nav.md | FEATURE_DOC_MISPLACED | MOVE | features/public/vcsm.public.top-nav.md | MEDIUM |
| platform/documentation/vcsm.runtime.profile-nav-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/profiles/vcsm.runtime.profile-nav-audit.md | MEDIUM |
| platform/documentation/vcsm.runtime.settings-profile-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/profiles/vcsm.runtime.settings-profile-audit.md | MEDIUM |
| platform/documentation/vcsm.runtime.vibes-tab-audit.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/vcsm.vport.review-implementation-plan.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/vcsm.vport.review-implementation-plan.md | HIGH |
| platform/documentation/VERTICAL_PRIORITY_AUDIT.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/WENTREX_ARCHITECTURE_REVIEW.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/WENTREX_ARCHITECTURE_REVIEW.md | MEDIUM |
| platform/documentation/WENTREX_USER_CREATION_PIPELINE.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/wentrex-database-read-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/wentrex-dependency-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/wentrex-feature-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/wentrex-performance-migration-report.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/wentrex-security-report.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/wentrex-system-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/documentation/zNOTFORPRODUCTION_DISCOVERY_REPORT.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/10-05.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/11-01.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/14-approval-tracker.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/18-approval-tracker.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/2026-04-05_10-41_contracts-dead-code-i18n-audit.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | FEATURE_DOC_MISPLACED | MOVE | features/legal/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | MEDIUM |
| platform/native/24-approval-tracker.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/26-06.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/27-approval-tracker.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/AGENTS.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/auth.md | FEATURE_DOC_MISPLACED | MOVE | features/auth/auth.md | MEDIUM |
| platform/native/booking.md | FEATURE_DOC_MISPLACED | MOVE | features/booking/booking.md | MEDIUM |
| platform/native/bottom-nav-runtime.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/chat-inbox-deep-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/chat-inbox-deep-audit.md | MEDIUM |
| platform/native/chat-inbox.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/chat-inbox.md | MEDIUM |
| platform/native/composer-upload.md | FEATURE_DOC_MISPLACED | MOVE | features/upload/composer-upload.md | MEDIUM |
| platform/native/dashboard-routes.md | FEATURE_DOC_MISPLACED | MOVE | features/dashboard/dashboard-routes.md | MEDIUM |
| platform/native/dashboard-vport-deep-audit.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/dashboard-vport-deep-audit.md | HIGH |
| platform/native/DELETE_FEATURE_TRANSFER.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/DOCS_SPAGHETTI_AUDIT.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/DR_STRANGE.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/explore-search.md | FEATURE_DOC_MISPLACED | MOVE | features/explore/explore-search.md | MEDIUM |
| platform/native/falcon_chat_dal_parity_2026-05-14.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/falcon_chat_dal_parity_2026-05-14.md | MEDIUM |
| platform/native/falcon_feed-dal-parity-2026-05-14.md | FEATURE_DOC_MISPLACED | MOVE | features/feed/falcon_feed-dal-parity-2026-05-14.md | MEDIUM |
| platform/native/feed.md | FEATURE_DOC_MISPLACED | MOVE | features/feed/feed.md | MEDIUM |
| platform/native/identity.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/identity.md | MEDIUM |
| platform/native/learning.md | HISTORY_FILE | KEEP | current | LOW |
| platform/native/moderation.md | FEATURE_DOC_MISPLACED | MOVE | features/moderation/moderation.md | MEDIUM |
| platform/native/MODULE_PROMPT_TEMPLATE.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/NATIVE_COMMAND_CENTER.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/NATIVE_SYNC_COMMAND.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/notifications.md | FEATURE_DOC_MISPLACED | MOVE | features/notifications/notifications.md | MEDIUM |
| platform/native/PIPELINE_PROMPT.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/post-card.md | FEATURE_DOC_MISPLACED | MOVE | features/post/post-card.md | MEDIUM |
| platform/native/post-detail.md | FEATURE_DOC_MISPLACED | MOVE | features/post/post-detail.md | MEDIUM |
| platform/native/public-menu.md | FEATURE_DOC_MISPLACED | MOVE | features/public/public-menu.md | MEDIUM |
| platform/native/public-vport-profile.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/public-vport-profile.md | HIGH |
| platform/native/PWA_TO_NATIVE_GENERATOR.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/README.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/reviews.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/reviews.md | MEDIUM |
| platform/native/rls-authenticated-access.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/ROADTRIP_INDEX.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/ROADTRIP.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/RUN_NATIVE_SYNC.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/schema-platform.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/schema-reviews.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/schema-reviews.md | MEDIUM |
| platform/native/schema-vc.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/native/schema-vport.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/schema-vport.md | HIGH |
| platform/native/settings.md | FEATURE_DOC_MISPLACED | MOVE | features/settings/settings.md | MEDIUM |
| platform/native/social-follow.md | FEATURE_DOC_MISPLACED | MOVE | features/social/social-follow.md | MEDIUM |
| platform/native/vport-types-tabs-deep-audit.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/vport-types-tabs-deep-audit.md | HIGH |
| platform/native/wanders.md | HISTORY_FILE | KEEP | current | LOW |
| platform/security/01-04.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/03-02.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/03-04.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/03-11.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/03-18.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/03-21.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/05-16.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/09-22-report.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/10-01.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/10-04.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/10-05.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/12-22-settings-fix.md | FEATURE_DOC_MISPLACED | MOVE | features/settings/12-22-settings-fix.md | MEDIUM |
| platform/security/12-32.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/13-01.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/13-02.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/14-03.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/16-03.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/18-01.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/18-03.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/19-09.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/19-11.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/20-02.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-04-12.runtime-observability-build.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-04-25.security-headers-audit.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-03_deletion-pipeline-audit.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-09_00-00_venom_whole-project-deep.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-10_00-00_venom_vcsm-full-deep-scan.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-10_04-04_carnage_secdefiner-rls-elimination.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-10_04-04_venom_secdefiner-trust-boundaries.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-10_moderation-db-remediation-plan.md | FEATURE_DOC_MISPLACED | MOVE | features/moderation/2026-05-10_moderation-db-remediation-plan.md | MEDIUM |
| platform/security/2026-05-10_pre-push_venom_full-security-sweep.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-10.block-follow-privacy-enforcement.md | FEATURE_DOC_MISPLACED | MOVE | features/block/2026-05-10.block-follow-privacy-enforcement.md | MEDIUM |
| platform/security/2026-05-10.deleted-account-gate.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-10.post-system-quick-wins.md | FEATURE_DOC_MISPLACED | MOVE | features/post/2026-05-10.post-system-quick-wins.md | MEDIUM |
| platform/security/2026-05-10.security-hardening-full-remediation.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-11_carnage_block-friend-ranks.md | FEATURE_DOC_MISPLACED | MOVE | features/block/2026-05-11_carnage_block-friend-ranks.md | MEDIUM |
| platform/security/2026-05-14_14-00_blackwidow_vcsm-full-pass.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-14_18-45_db_vport-rls-full-schema-audit.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/2026-05-14_18-45_db_vport-rls-full-schema-audit.md | HIGH |
| platform/security/2026-05-14_carnage_booking-rls-policies.md | FEATURE_DOC_MISPLACED | MOVE | features/booking/2026-05-14_carnage_booking-rls-policies.md | MEDIUM |
| platform/security/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | FEATURE_DOC_MISPLACED | MOVE | features/auth/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | MEDIUM |
| platform/security/2026-05-14_carnage_chat-inbox-attachments-migration-history.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/2026-05-14_carnage_chat-inbox-attachments-migration-history.md | MEDIUM |
| platform/security/2026-05-14_carnage_content-pages-legacy-policy-cleanup.md | PLATFORM_DOC | REVIEW | unknown | MEDIUM |
| platform/security/2026-05-14_carnage_feed-dal-rls-verification.md | FEATURE_DOC_MISPLACED | MOVE | features/feed/2026-05-14_carnage_feed-dal-rls-verification.md | MEDIUM |
| platform/security/2026-05-14_thor_booking-availability-write-release-gate.md | FEATURE_DOC_MISPLACED | MOVE | features/booking/2026-05-14_thor_booking-availability-write-release-gate.md | MEDIUM |
| platform/security/2026-05-14_thor_booking-postfix-release-gate.md | FEATURE_DOC_MISPLACED | MOVE | features/booking/2026-05-14_thor_booking-postfix-release-gate.md | MEDIUM |
| platform/security/2026-05-18_blackwidow_feed-dal-rls-adversarial.md | FEATURE_DOC_MISPLACED | MOVE | features/feed/2026-05-18_blackwidow_feed-dal-rls-adversarial.md | MEDIUM |
| platform/security/2026-05-18_carnage_booking-rls-readiness.md | FEATURE_DOC_MISPLACED | MOVE | features/booking/2026-05-18_carnage_booking-rls-readiness.md | MEDIUM |
| platform/security/2026-05-18_carnage_consent-ip-edge-function.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-18_carnage_feed-dal-rls-delta.md | FEATURE_DOC_MISPLACED | MOVE | features/feed/2026-05-18_carnage_feed-dal-rls-delta.md | MEDIUM |
| platform/security/2026-05-18_carnage_identity-rpc-migration-ownership.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/2026-05-18_carnage_identity-rpc-migration-ownership.md | MEDIUM |
| platform/security/2026-05-18_venom_identity-provision-rpc-security.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/2026-05-18_venom_identity-provision-rpc-security.md | MEDIUM |
| platform/security/2026-05-19_11-20_db_platform-identity-security-review.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/2026-05-19_11-20_db_platform-identity-security-review.md | MEDIUM |
| platform/security/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | FEATURE_DOC_MISPLACED | MOVE | features/media/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | MEDIUM |
| platform/security/2026-05-19_13-30_thor_media-dal-release-gate.md | FEATURE_DOC_MISPLACED | MOVE | features/media/2026-05-19_13-30_thor_media-dal-release-gate.md | MEDIUM |
| platform/security/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | FEATURE_DOC_MISPLACED | MOVE | features/media/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | MEDIUM |
| platform/security/2026-05-22_10-00_carnage_vc-posts-insert-ownership-rls.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-22_carnage_vc-posts-insert-rls-cerebro-verification.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-23_17-30_db_portfolio-rls-policies.md | FEATURE_DOC_MISPLACED | MOVE | features/portfolio/2026-05-23_17-30_db_portfolio-rls-policies.md | MEDIUM |
| platform/security/2026-05-23_carnage_reviews-schema-provenance-and-rls.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/2026-05-23_carnage_reviews-schema-provenance-and-rls.md | MEDIUM |
| platform/security/2026-05-23_carnage_vport-services-rates-rls-backfill.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/services/2026-05-23_carnage_vport-services-rates-rls-backfill.md | MEDIUM |
| platform/security/2026-05-23_db_profiles-session-rls-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/profiles/2026-05-23_db_profiles-session-rls-audit.md | MEDIUM |
| platform/security/2026-05-23_db_vport-services-migration-review.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/services/2026-05-23_db_vport-services-migration-review.md | MEDIUM |
| platform/security/2026-05-23_db_vport-services-rls-security-verification.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/services/2026-05-23_db_vport-services-rls-security-verification.md | MEDIUM |
| platform/security/2026-05-23_thor_profiles-cerebro-release-gate.md | FEATURE_DOC_MISPLACED | MOVE | features/profiles/2026-05-23_thor_profiles-cerebro-release-gate.md | MEDIUM |
| platform/security/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/leads/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | MEDIUM |
| platform/security/2026-05-24_db_vport-business-card-leads.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/leads/2026-05-24_db_vport-business-card-leads.md | MEDIUM |
| platform/security/2026-05-25_09-00_db_reviews-schema-deep-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/2026-05-25_09-00_db_reviews-schema-deep-audit.md | MEDIUM |
| platform/security/2026-05-26_carnage_migration-history-registration-plan.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-26_elektra_db-drift-code-chain-review.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/2026-05-26_elektra_db-drift-code-chain-review.md | MEDIUM |
| platform/security/2026-05-26_hawkeye_db-drift-endpoint-impact.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-26_thor_db-drift-release-gate.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-26_venom_db-drift-rls-review.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/2026-05-26_venom_db-drift-rls-review.md | MEDIUM |
| platform/security/2026-05-27_03-15_ironman_vport-leads-access-policy.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/leads/2026-05-27_03-15_ironman_vport-leads-access-policy.md | MEDIUM |
| platform/security/2026-05-27_05-42_db_barber-rls-verification.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-27_06-40_thor_vport-book-tab-release-gate.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/2026-05-27_06-40_thor_vport-book-tab-release-gate.md | HIGH |
| platform/security/2026-05-27_14-00_dataengineer_gasprices-batch-c-db-constraints.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | MEDIUM |
| platform/security/2026-05-27_15-30_venom_ticket-0008-code-review.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/2026-05-27_15-30_venom_ticket-0008-code-review.md | MEDIUM |
| platform/security/2026-05-27_16-30_venom_ticket-platform-rls-001.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-27_18-30_venom_external-site.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-27_18-30_venom_tripoint.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-27_19-00_blackwidow_external-site-tripoint.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-27_20-00_elektra_external-site.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-27_carnage_team-settings-rls-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/settings/2026-05-27_carnage_team-settings-rls-audit.md | MEDIUM |
| platform/security/2026-05-27_carnage_ticket-0005-bookings-select-rls-verification.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | FEATURE_DOC_MISPLACED | MOVE | features/auth/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | MEDIUM |
| platform/security/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | FEATURE_DOC_MISPLACED | MOVE | features/profiles/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | MEDIUM |
| platform/security/2026-05-27_carnage_vport-profile-public-details-rls.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/2026-05-27_carnage_vport-profile-public-details-rls.md | HIGH |
| platform/security/2026-05-27_ticket-sub-001-subscriber-rpc-architecture.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-05-27_watcher005-ci-workflow-review.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/2026-05-27_watcher005-ci-workflow-review.md | MEDIUM |
| platform/security/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | FEATURE_DOC_MISPLACED | MOVE | features/actors/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | MEDIUM |
| platform/security/2026-05-28_elektra_tripoint.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-06-01_db_tier2-surgical-confirmations.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/2026-06-02_wolverine_ticket-0007A_current-backfill.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/24-02.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/25-01.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/25-02.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/25-03.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/26-05.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/26-12.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/27-12.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/27-13.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/27-19.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/27-20.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/27-approval-tracker-12.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/api-exposure-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/audit-status.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/auth-login.graph.json | FEATURE_DOC_MISPLACED | MOVE | features/auth/auth-login.graph.json | MEDIUM |
| platform/security/avengers-assembly-2026-05-14-booking.md | FEATURE_DOC_MISPLACED | MOVE | features/booking/avengers-assembly-2026-05-14-booking.md | MEDIUM |
| platform/security/avengers-assembly-2026-05-18-dashboard-dal.md | FEATURE_DOC_MISPLACED | MOVE | features/dashboard/avengers-assembly-2026-05-18-dashboard-dal.md | MEDIUM |
| platform/security/BAT-03-02.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/bundle-boundary-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/cerebro_venom-fix-plan.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/client-server-execution-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/COMMAND_OUTPUT_CONTRACT_PLAN.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/CURRENT_STATUS.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/database-read-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/dead-and-spaghetti-code-report.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/dead-feature-report.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/dependency-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/DR_STRANGE.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/engine-consumer-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/engine.hydration.owner.md | FEATURE_DOC_MISPLACED | MOVE | features/hydration/engine.hydration.owner.md | MEDIUM |
| platform/security/event-flow-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/explore.graph.json | FEATURE_DOC_MISPLACED | MOVE | features/explore/explore.graph.json | MEDIUM |
| platform/security/feature-ownership-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/FINAL_SUMMARY.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/governance-overlays.graph.json | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/HISTORY_INDEX.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/home-central-feed-runtime-map.md | FEATURE_DOC_MISPLACED | MOVE | features/feed/home-central-feed-runtime-map.md | MEDIUM |
| platform/security/p2_batch6_manifest_20260430.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/PROFILE_UPLOAD_WRITEBACK_20260430-222216.md | FEATURE_DOC_MISPLACED | MOVE | features/profiles/PROFILE_UPLOAD_WRITEBACK_20260430-222216.md | MEDIUM |
| platform/security/PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md | FEATURE_DOC_MISPLACED | MOVE | features/profiles/PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md | MEDIUM |
| platform/security/README.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/release-status.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/restoredMapvcsm.auth-login.runtime-map.md | FEATURE_DOC_MISPLACED | MOVE | features/auth/restoredMapvcsm.auth-login.runtime-map.md | MEDIUM |
| platform/security/rls-assumption-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/security.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/settings.graph.json | FEATURE_DOC_MISPLACED | MOVE | features/settings/settings.graph.json | MEDIUM |
| platform/security/source-imports.graph.json | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/supabase-view-dependency-tree.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/system-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/ticket_platform_rls_001.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/TRAFFIC_P0_ARCHITECTURE_REMEDIATION_20260430-205704.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | FEATURE_DOC_MISPLACED | MOVE | features/upload/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | MEDIUM |
| platform/security/vcsm-database-read-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/vcsm-dependency-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/vcsm-feature-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/vcsm-migration-risk-report.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/vcsm-module-architecture-summary.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/vcsm-reviews-api-exposure-map.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/vcsm-reviews-api-exposure-map.md | MEDIUM |
| platform/security/vcsm-reviews-bundle-client-server-map.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/vcsm-reviews-bundle-client-server-map.md | MEDIUM |
| platform/security/vcsm-reviews-database-read-map.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/vcsm-reviews-database-read-map.md | MEDIUM |
| platform/security/vcsm-reviews-dead-and-spaghetti-report.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/vcsm-reviews-dead-and-spaghetti-report.md | MEDIUM |
| platform/security/vcsm-reviews-feature-ownership-map.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/vcsm-reviews-feature-ownership-map.md | MEDIUM |
| platform/security/vcsm-reviews-governance-overlay.graph.json | FEATURE_DOC_MISPLACED | MOVE | features/reviews/vcsm-reviews-governance-overlay.graph.json | MEDIUM |
| platform/security/vcsm-reviews-rls-assumption-map.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/vcsm-reviews-rls-assumption-map.md | MEDIUM |
| platform/security/vcsm-reviews-supabase-view-tree.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/vcsm-reviews-supabase-view-tree.md | MEDIUM |
| platform/security/vcsm-security-report.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/vcsm-system-map.md | PLATFORM_DOC | KEEP | current | LOW |
| platform/security/vcsm-vport-gas-prices.graph.json | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/gas/vcsm-vport-gas-prices.graph.json | MEDIUM |
| platform/security/vcsm.ads.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/ads/vcsm.ads.architecture.md | MEDIUM |
| platform/security/vcsm.auth-login.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/auth/vcsm.auth-login.architecture.md | MEDIUM |
| platform/security/vcsm.auth.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/auth/vcsm.auth.architecture.md | MEDIUM |
| platform/security/vcsm.block.owner.md | FEATURE_DOC_MISPLACED | MOVE | features/block/vcsm.block.owner.md | MEDIUM |
| platform/security/vcsm.booking.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/booking/vcsm.booking.architecture.md | MEDIUM |
| platform/security/vcsm.bottom-nav.explore.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/explore/vcsm.bottom-nav.explore.architecture.md | MEDIUM |
| platform/security/vcsm.bottom-nav.profile.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/profiles/vcsm.bottom-nav.profile.architecture.md | MEDIUM |
| platform/security/vcsm.bottom-nav.upload.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/upload/vcsm.bottom-nav.upload.architecture.md | MEDIUM |
| platform/security/vcsm.bottom-nav.vox-chat.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/vcsm.bottom-nav.vox-chat.architecture.md | MEDIUM |
| platform/security/vcsm.dal.learning.md | HISTORY_FILE | KEEP | current | LOW |
| platform/security/vcsm.explore.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/explore/vcsm.explore.architecture.md | MEDIUM |
| platform/security/vcsm.hydration.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/hydration/vcsm.hydration.architecture.md | MEDIUM |
| platform/security/vcsm.identity.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/vcsm.identity.architecture.md | MEDIUM |
| platform/security/vcsm.identity.owner.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/vcsm.identity.owner.md | MEDIUM |
| platform/security/vcsm.legal.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/legal/vcsm.legal.architecture.md | MEDIUM |
| platform/security/vcsm.media.owner.md | FEATURE_DOC_MISPLACED | MOVE | features/media/vcsm.media.owner.md | MEDIUM |
| platform/security/vcsm.moderation.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/moderation/vcsm.moderation.architecture.md | MEDIUM |
| platform/security/vcsm.notifications.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/notifications/vcsm.notifications.architecture.md | MEDIUM |
| platform/security/vcsm.notifications.owner.md | FEATURE_DOC_MISPLACED | MOVE | features/notifications/vcsm.notifications.owner.md | MEDIUM |
| platform/security/vcsm.portfolio-card.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/portfolio/vcsm.portfolio-card.architecture.md | MEDIUM |
| platform/security/vcsm.professional.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/professional/vcsm.professional.architecture.md | MEDIUM |
| platform/security/vcsm.profiles.owner.md | FEATURE_DOC_MISPLACED | MOVE | features/profiles/vcsm.profiles.owner.md | MEDIUM |
| platform/security/vcsm.public.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/public/vcsm.public.architecture.md | MEDIUM |
| platform/security/vcsm.reviews.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/vcsm.reviews.architecture.md | MEDIUM |
| platform/security/vcsm.social.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/social/vcsm.social.architecture.md | MEDIUM |
| platform/security/vcsm.upload.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/upload/vcsm.upload.architecture.md | MEDIUM |
| platform/security/vcsm.void.architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/void/vcsm.void.architecture.md | MEDIUM |
| platform/security/vcsm.vport-availability.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/availability/vcsm.vport-availability.architecture.md | MEDIUM |
| platform/security/vcsm.vport-dashboard-leads.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/leads/vcsm.vport-dashboard-leads.architecture.md | MEDIUM |
| platform/security/vcsm.vport-dashboard.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/vcsm.vport-dashboard.architecture.md | HIGH |
| platform/security/vcsm.vport-exchange-rate-dashboard.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/exchange/vcsm.vport-exchange-rate-dashboard.architecture.md | MEDIUM |
| platform/security/vcsm.vport-gas-prices.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/gas/vcsm.vport-gas-prices.architecture.md | MEDIUM |
| platform/security/vcsm.vport-public-menu.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/menu/vcsm.vport-public-menu.architecture.md | MEDIUM |
| platform/security/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/menu/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | MEDIUM |
| platform/security/vcsm.vport-reviews-dashboard.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/reviews/vcsm.vport-reviews-dashboard.architecture.md | MEDIUM |
| platform/security/vcsm.vport-reviews.owner.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/reviews/vcsm.vport-reviews.owner.md | MEDIUM |
| platform/security/vcsm.vport-services-dashboard-card.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/services/vcsm.vport-services-dashboard-card.architecture.md | MEDIUM |
| platform/security/vcsm.wanderex.architecture.md | HISTORY_FILE | KEEP | current | LOW |
| platform/security/vcsm.wanders.architecture.md | HISTORY_FILE | KEEP | current | LOW |
| platform/security/VPORT_ARCHITECTURE_FOLDER_GAP_REPORT.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/VPORT_ARCHITECTURE_FOLDER_GAP_REPORT.md | HIGH |
| platform/security/VPORT_FOLDER_BUILD_PLAN.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/VPORT_FOLDER_BUILD_PLAN.md | HIGH |
| platform/security/VPORT_TRIAD_COVERAGE_MATRIX.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/VPORT_TRIAD_COVERAGE_MATRIX.md | HIGH |
| PROM/ARchitect.doc | UNKNOWN | REVIEW | unknown | HIGH |
| PROM/cerebro.doc | UNKNOWN | REVIEW | unknown | HIGH |
| PROM/INVESTOR.doc | UNKNOWN | REVIEW | unknown | HIGH |
| README.md | ROOT_REGISTRY | KEEP | current | LOW |
| services/03-20.md | PLATFORM_DOC | KEEP | current | LOW |
| services/12-04.md | PLATFORM_DOC | KEEP | current | LOW |
| services/12-14.md | PLATFORM_DOC | KEEP | current | LOW |
| services/12-15.md | PLATFORM_DOC | KEEP | current | LOW |
| services/12-26.md | PLATFORM_DOC | KEEP | current | LOW |
| services/18-04.md | PLATFORM_DOC | KEEP | current | LOW |
| services/19-10.md | PLATFORM_DOC | KEEP | current | LOW |
| services/2026-04_month_summary.md | PLATFORM_DOC | KEEP | current | LOW |
| services/2026-04-06_12-00_full-platform-audit-migration-hardening.md | PLATFORM_DOC | KEEP | current | LOW |
| services/2026-04-10_02-30_legal-consent-theme-unification.md | FEATURE_DOC_MISPLACED | MOVE | features/legal/2026-04-10_02-30_legal-consent-theme-unification.md | MEDIUM |
| services/2026-04-12_00-00_psl-foundation-notification-engine-migration.md | FEATURE_DOC_MISPLACED | MOVE | features/notifications/2026-04-12_00-00_psl-foundation-notification-engine-migration.md | MEDIUM |
| services/27-11.md | PLATFORM_DOC | KEEP | current | LOW |
| services/DR_STRANGE.md | PLATFORM_DOC | KEEP | current | LOW |
| services/findings.md | PLATFORM_DOC | KEEP | current | LOW |
| services/ownership.md | PLATFORM_DOC | KEEP | current | LOW |
| services/performance.md | PLATFORM_DOC | KEEP | current | LOW |
| services/README.md | PLATFORM_DOC | KEEP | current | LOW |
| services/vcsm.vport.external-site-integration.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/vcsm.vport.external-site-integration.md | HIGH |
| services/vcsm.vport.menu-pipeline.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/menu/vcsm.vport.menu-pipeline.md | MEDIUM |
| services/vcsm.vport.tripoint-integration.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/vcsm.vport.tripoint-integration.md | HIGH |
| shared/.batsignal.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/01-01.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/01-03.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/02-01.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/03-01.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/03-05.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/03-06.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/03-07.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/03-08.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/03-10.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/03-12.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/04-01.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/05-01.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/05-02.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/05-03.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/05-04.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/05-05.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/05-06.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/05-07.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/05-08.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/05-10.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/05-12.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/05-13.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/05-17.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/06-02.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/09-04.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/09-05.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/09-06.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/09-07.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/09-08.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/09-10.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/09-11.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/09-13.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/09-14.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/09-15.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/09-16.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/09-17.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/09-23.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/10-01.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/10-04.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/10-06.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/10-09.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/11-02.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-01.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-02.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-05.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-06.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-07.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-08.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-10.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-13.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-16.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-17.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-18.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-19.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-20.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-21.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-23.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-24.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-25-bootstrap-dedup.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-27.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-28.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-29.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-30.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/12-31.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/13-03.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/13-04.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/13-05.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/14-01.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/14-02.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/16-01.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/16-05.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/16-06.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/18-02.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/19-01.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/19-05.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/19-06.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/19-07.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/19-08.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/20-03.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/2026-03_month_summary.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/2026-03-31_14-50_chat-engine-stabilization.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/2026-03-31_14-50_chat-engine-stabilization.md | MEDIUM |
| shared/2026-04-01_18-00_engine-independence-and-schema-truth.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | MEDIUM |
| shared/2026-04-09_01-58_booking-review-identity-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/booking/2026-04-09_01-58_booking-review-identity-audit.md | MEDIUM |
| shared/2026-04-10_09-15_full-platform-cache-theme-polish.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/2026-04-13_12-30_vport-dal-schema-migration.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | features/dashboard/modules/vport/2026-04-13_12-30_vport-dal-schema-migration.md | HIGH |
| shared/2026-05-14_db_booking-schema.md | FEATURE_DOC_MISPLACED | MOVE | features/booking/2026-05-14_db_booking-schema.md | MEDIUM |
| shared/2026-05-14_db_feed-rls-four-tables.md | FEATURE_DOC_MISPLACED | MOVE | features/feed/2026-05-14_db_feed-rls-four-tables.md | MEDIUM |
| shared/2026-05-18_11-00_db_identity-governance-review.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/2026-05-18_11-00_db_identity-governance-review.md | MEDIUM |
| shared/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/booking/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | MEDIUM |
| shared/2026-05-19_14-30_db_notifications-rls-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/notifications/2026-05-19_14-30_db_notifications-rls-audit.md | MEDIUM |
| shared/2026-05-19_16-00_db_vc-posts-insert-rls-gap.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/2026-05-23_14-00_db_reviews-schema-rls-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/2026-05-23_14-00_db_reviews-schema-rls-audit.md | MEDIUM |
| shared/2026-06-02_wolverine_ticket-0006_vcsm-source-workflow-intake.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/2026-06-02_wolverine_ticket-0006a_normalize-classification-drift.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/24-01.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/26-01.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/26-02.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/26-03.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/26-08.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/26-09.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/27-03.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/27-04.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/27-05.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/27-06.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/27-08.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/27-10.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/27-15.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/27-16.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/BOOKING_ENGINE_AUDIT_V1.md | FEATURE_DOC_MISPLACED | MOVE | features/booking/BOOKING_ENGINE_AUDIT_V1.md | MEDIUM |
| shared/CHAT_ENGINE_AUDIT_V1.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/CHAT_ENGINE_AUDIT_V1.md | MEDIUM |
| shared/CHAT_ENGINE_AUDIT_V2.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/CHAT_ENGINE_AUDIT_V2.md | MEDIUM |
| shared/CHAT_ENGINE_AUDIT_V3.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/CHAT_ENGINE_AUDIT_V3.md | MEDIUM |
| shared/CLEAN_DOCS_ARCHITECTURE_PLAN.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/reviews/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | MEDIUM |
| shared/DR_STRANGE.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/engines.booking.contract.md | FEATURE_DOC_MISPLACED | MOVE | features/booking/engines.booking.contract.md | MEDIUM |
| shared/engines.chat.capability.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/engines.chat.capability.md | MEDIUM |
| shared/engines.chat.contract.md | FEATURE_DOC_MISPLACED | MOVE | features/chat/engines.chat.contract.md | MEDIUM |
| shared/engines.drift.vcsm-wentrex-pipeline-analysis.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/engines.identity.boundary-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/engines.identity.boundary-audit.md | MEDIUM |
| shared/engines.identity.boundary.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/engines.identity.boundary.md | MEDIUM |
| shared/engines.identity.contract.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/engines.identity.contract.md | MEDIUM |
| shared/engines.isolation.chat-identity-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/identity/engines.isolation.chat-identity-audit.md | MEDIUM |
| shared/engines.media.system-architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/media/engines.media.system-architecture.md | MEDIUM |
| shared/engines.notifications.engine-architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/notifications/engines.notifications.engine-architecture.md | MEDIUM |
| shared/engines.portfolio.contract.md | FEATURE_DOC_MISPLACED | MOVE | features/portfolio/engines.portfolio.contract.md | MEDIUM |
| shared/engines.portfolio.system-architecture.md | FEATURE_DOC_MISPLACED | MOVE | features/portfolio/engines.portfolio.system-architecture.md | MEDIUM |
| shared/engines.reviews.contract.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/engines.reviews.contract.md | MEDIUM |
| shared/engines.vcsm.architecture-inspection.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/FEATURE_DOCUMENTATION_INVENTORY.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/MEDIA_ENGINE_AUDIT_V1.md | FEATURE_DOC_MISPLACED | MOVE | features/media/MEDIA_ENGINE_AUDIT_V1.md | MEDIUM |
| shared/NOTIFICATIONS_ENGINE_AUDIT_V1.md | FEATURE_DOC_MISPLACED | MOVE | features/notifications/NOTIFICATIONS_ENGINE_AUDIT_V1.md | MEDIUM |
| shared/p2_batch4_manifest_20260430.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/p2_batch7_manifest_20260430.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/PORTFOLIO_ENGINE_AUDIT_V1.md | FEATURE_DOC_MISPLACED | MOVE | features/portfolio/PORTFOLIO_ENGINE_AUDIT_V1.md | MEDIUM |
| shared/PORTFOLIO_ENGINE_AUDIT_V2.md | FEATURE_DOC_MISPLACED | MOVE | features/portfolio/PORTFOLIO_ENGINE_AUDIT_V2.md | MEDIUM |
| shared/ticketing.md | PLATFORM_DOC | KEEP | current | LOW |
| shared/vcsm.ui.architecture.md | PLATFORM_DOC | KEEP | current | LOW |
| skills/vcsm-contributor/SKILL.md | PLATFORM_DOC | KEEP | current | LOW |
| skills/vcsm/SKILL.md | PLATFORM_DOC | KEEP | current | LOW |
| SOURCE_WORKFLOW_INTAKE.md | ROOT_REGISTRY | KEEP | current | LOW |
| state/03-03.md | PLATFORM_DOC | KEEP | current | LOW |
| state/03-09.md | PLATFORM_DOC | KEEP | current | LOW |
| state/03-17.md | PLATFORM_DOC | KEEP | current | LOW |
| state/03-19.md | PLATFORM_DOC | KEEP | current | LOW |
| state/06-01.md | PLATFORM_DOC | KEEP | current | LOW |
| state/09-03.md | PLATFORM_DOC | KEEP | current | LOW |
| state/09-05.md | PLATFORM_DOC | KEEP | current | LOW |
| state/09-12.md | PLATFORM_DOC | KEEP | current | LOW |
| state/09-14.md | PLATFORM_DOC | KEEP | current | LOW |
| state/09-15.md | PLATFORM_DOC | KEEP | current | LOW |
| state/09-16.md | PLATFORM_DOC | KEEP | current | LOW |
| state/09-18.md | PLATFORM_DOC | KEEP | current | LOW |
| state/09-20.md | PLATFORM_DOC | KEEP | current | LOW |
| state/09-21-report.md | PLATFORM_DOC | KEEP | current | LOW |
| state/09-21.md | PLATFORM_DOC | KEEP | current | LOW |
| state/09-22.md | PLATFORM_DOC | KEEP | current | LOW |
| state/10-02.md | PLATFORM_DOC | KEEP | current | LOW |
| state/10-03.md | PLATFORM_DOC | KEEP | current | LOW |
| state/10-07.md | PLATFORM_DOC | KEEP | current | LOW |
| state/12-11.md | PLATFORM_DOC | KEEP | current | LOW |
| state/12-12.md | PLATFORM_DOC | KEEP | current | LOW |
| state/12-22.md | PLATFORM_DOC | KEEP | current | LOW |
| state/12-26-consents-fix.md | PLATFORM_DOC | KEEP | current | LOW |
| state/16-09.md | PLATFORM_DOC | KEEP | current | LOW |
| state/18-01.md | PLATFORM_DOC | KEEP | current | LOW |
| state/19-03.md | PLATFORM_DOC | KEEP | current | LOW |
| state/20-01.md | PLATFORM_DOC | KEEP | current | LOW |
| state/2026-05-18_00-00_db_feed-rls-four-tables.md | FEATURE_DOC_MISPLACED | MOVE | features/feed/2026-05-18_00-00_db_feed-rls-four-tables.md | MEDIUM |
| state/2026-05-19_12-00_db_media-assets-rls-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/media/2026-05-19_12-00_db_media-assets-rls-audit.md | MEDIUM |
| state/2026-05-22_db_profiles-rls-coverage-audit.md | FEATURE_DOC_MISPLACED | MOVE | features/profiles/2026-05-22_db_profiles-rls-coverage-audit.md | MEDIUM |
| state/2026-05-23_10-00_db_live-migration-gap-audit.md | PLATFORM_DOC | KEEP | current | LOW |
| state/2026-05-23_19-00_db_portfolio-trigger-functions.md | FEATURE_DOC_MISPLACED | MOVE | features/portfolio/2026-05-23_19-00_db_portfolio-trigger-functions.md | MEDIUM |
| state/2026-05-26_18-00_db_migration-reconciliation.md | PLATFORM_DOC | KEEP | current | LOW |
| state/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | DASHBOARD_MODULE_DOC_MISPLACED | MOVE | features/dashboard/modules/settings/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | MEDIUM |
| state/26-02.md | PLATFORM_DOC | KEEP | current | LOW |
| state/26-03.md | PLATFORM_DOC | KEEP | current | LOW |
| state/26-11.md | PLATFORM_DOC | KEEP | current | LOW |
| state/27-07.md | PLATFORM_DOC | KEEP | current | LOW |
| state/27-14.md | PLATFORM_DOC | KEEP | current | LOW |
| state/BAT-03-04.md | PLATFORM_DOC | KEEP | current | LOW |
| state/bottom-navigation-runtime-map.md | PLATFORM_DOC | KEEP | current | LOW |
| state/DR_STRANGE.md | PLATFORM_DOC | KEEP | current | LOW |
| state/p2_batch5_manifest_20260430.md | PLATFORM_DOC | KEEP | current | LOW |
| state/p2_batch8_manifest_20260430.md | PLATFORM_DOC | KEEP | current | LOW |
| state/state-store-map.md | PLATFORM_DOC | KEEP | current | LOW |
| state/TRAZE_ANSWERS_SEO_MANIFEST_20260430-203517.md | PLATFORM_DOC | KEEP | current | LOW |
| state/vcsm-reviews-state-store-map.md | FEATURE_DOC_MISPLACED | MOVE | features/reviews/vcsm-reviews-state-store-map.md | MEDIUM |
| styles/DR_STRANGE.md | PLATFORM_DOC | KEEP | current | LOW |
| styles/vcsm.theme.design-tokens.md | PLATFORM_DOC | KEEP | current | LOW |
| styles/vcsm.theme.splash-screen.md | PLATFORM_DOC | KEEP | current | LOW |

## Phase 3 - Feature Routing

| File | Classification | Proposed Target | Routing Reason | Risk |
| --- | --- | --- | --- | --- |
| FEATURE_INDEX/actors.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/ads.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/auth.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/block.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/booking.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/chat.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/dashboard.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/explore.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/feed.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/hydration.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/identity.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/invite.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/join.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/legal.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/media.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/moderation.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/notifications.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/onboarding.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/portfolio.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/post.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/professional.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/profiles.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/public.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/settings.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/social.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/upload.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/vgrid.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/void.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/vport.md | FEATURE_INDEX | current | already in FEATURE_INDEX | LOW |
| platform/documentation/2026-05-27_architect_vport-dtab-001-duplicate-registry.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-27_architect_vport-dtab-001-duplicate-registry.md | candidate target folder does not exist | HIGH |
| platform/documentation/2026-05-27_architect_vport-dtab-006-adapter-boundary.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-27_architect_vport-dtab-006-adapter-boundary.md | candidate target folder does not exist | HIGH |
| platform/documentation/2026-05-27_venom_vport-book-tab.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-27_venom_vport-book-tab.md | candidate target folder does not exist | HIGH |
| platform/documentation/2026-05-27_venom_vport-gas-tab.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/gas/2026-05-27_venom_vport-gas-tab.md | dashboard module documentation for gas; target exists and no overwrite detected | MEDIUM |
| platform/documentation/2026-05-27_venom_vport-owner-tab.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-27_venom_vport-owner-tab.md | candidate target folder does not exist | HIGH |
| platform/documentation/2026-05-27_watcher008-dependency-review.md | FEATURE_DOC_MISPLACED | features/reviews/2026-05-27_watcher008-dependency-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/documentation/2026-06-02_wolverine_dashboard-ticket-0004.md | FEATURE_DOC_MISPLACED | features/dashboard/2026-06-02_wolverine_dashboard-ticket-0004.md | feature documentation for dashboard; target exists and no overwrite detected | MEDIUM |
| platform/documentation/code-derived-app-review.md | FEATURE_DOC_MISPLACED | features/reviews/code-derived-app-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/documentation/home-feed.graph.json | FEATURE_DOC_MISPLACED | features/feed/home-feed.graph.json | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/documentation/phase3a-identity-drift-2026-05-11.md | FEATURE_DOC_MISPLACED | features/identity/phase3a-identity-drift-2026-05-11.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/documentation/phase3b-booking-vports-drift-2026-05-11.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/booking/phase3b-booking-vports-drift-2026-05-11.md | dashboard module documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/documentation/phase3c-chat-engines-audit-chain-2026-05-11.md | FEATURE_DOC_MISPLACED | features/chat/phase3c-chat-engines-audit-chain-2026-05-11.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/documentation/phase3e-profiles-public-notifications-drift-2026-05-11.md | FEATURE_DOC_MISPLACED | features/profiles/phase3e-profiles-public-notifications-drift-2026-05-11.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| platform/documentation/phase3f-vport-schema-migration-scope-2026-05-11.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/phase3f-vport-schema-migration-scope-2026-05-11.md | candidate target folder does not exist | HIGH |
| platform/documentation/review.md | FEATURE_DOC_MISPLACED | features/reviews/review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/documentation/TRAFFIC_ARCHITECTURE_REVIEW.md | FEATURE_DOC_MISPLACED | features/reviews/TRAFFIC_ARCHITECTURE_REVIEW.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/documentation/TRAFFIC_VPORT_INTEGRATION_AUDIT.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/TRAFFIC_VPORT_INTEGRATION_AUDIT.md | candidate target folder does not exist | HIGH |
| platform/documentation/traffic.vport.directory-integration.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/traffic.vport.directory-integration.md | candidate target folder does not exist | HIGH |
| platform/documentation/vcsm-reviews-component-tree.md | FEATURE_DOC_MISPLACED | features/reviews/vcsm-reviews-component-tree.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm-reviews-event-flow-map.md | FEATURE_DOC_MISPLACED | features/reviews/vcsm-reviews-event-flow-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.chat.badge-pipeline.md | FEATURE_DOC_MISPLACED | features/chat/vcsm.chat.badge-pipeline.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.chat.message-flow-audit.md | FEATURE_DOC_MISPLACED | features/chat/vcsm.chat.message-flow-audit.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.dal.chat.md | FEATURE_DOC_MISPLACED | features/chat/vcsm.dal.chat.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.dal.explore.md | FEATURE_DOC_MISPLACED | features/explore/vcsm.dal.explore.md | feature documentation for explore; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.dal.invite.md | FEATURE_DOC_MISPLACED | features/invite/vcsm.dal.invite.md | feature documentation for invite; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.explore.search-pipeline.md | FEATURE_DOC_MISPLACED | features/explore/vcsm.explore.search-pipeline.md | feature documentation for explore; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.feed.profiler-system.md | FEATURE_DOC_MISPLACED | features/feed/vcsm.feed.profiler-system.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.identity.actor-switch-pipeline.md | FEATURE_DOC_MISPLACED | features/identity/vcsm.identity.actor-switch-pipeline.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.identity.auth-pipeline.md | FEATURE_DOC_MISPLACED | features/auth/vcsm.identity.auth-pipeline.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.identity.email-flows.md | FEATURE_DOC_MISPLACED | features/identity/vcsm.identity.email-flows.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.identity.engine-architecture.md | FEATURE_DOC_MISPLACED | features/identity/vcsm.identity.engine-architecture.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.performance.route-profiles.md | FEATURE_DOC_MISPLACED | features/profiles/vcsm.performance.route-profiles.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.public.conversion-funnel.md | FEATURE_DOC_MISPLACED | features/public/vcsm.public.conversion-funnel.md | feature documentation for public; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.public.seo-infrastructure.md | FEATURE_DOC_MISPLACED | features/public/vcsm.public.seo-infrastructure.md | feature documentation for public; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.public.top-nav.md | FEATURE_DOC_MISPLACED | features/public/vcsm.public.top-nav.md | feature documentation for public; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.runtime.profile-nav-audit.md | FEATURE_DOC_MISPLACED | features/profiles/vcsm.runtime.profile-nav-audit.md | feature documentation for profile; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.runtime.settings-profile-audit.md | FEATURE_DOC_MISPLACED | features/profiles/vcsm.runtime.settings-profile-audit.md | feature documentation for profile; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.vport.review-implementation-plan.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/vcsm.vport.review-implementation-plan.md | candidate target folder does not exist | HIGH |
| platform/documentation/WENTREX_ARCHITECTURE_REVIEW.md | FEATURE_DOC_MISPLACED | features/reviews/WENTREX_ARCHITECTURE_REVIEW.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/native/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | FEATURE_DOC_MISPLACED | features/legal/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | feature documentation for legal; target exists and no overwrite detected | MEDIUM |
| platform/native/auth.md | FEATURE_DOC_MISPLACED | features/auth/auth.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/native/booking.md | FEATURE_DOC_MISPLACED | features/booking/booking.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/native/chat-inbox-deep-audit.md | FEATURE_DOC_MISPLACED | features/chat/chat-inbox-deep-audit.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/native/chat-inbox.md | FEATURE_DOC_MISPLACED | features/chat/chat-inbox.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/native/composer-upload.md | FEATURE_DOC_MISPLACED | features/upload/composer-upload.md | feature documentation for upload; target exists and no overwrite detected | MEDIUM |
| platform/native/dashboard-routes.md | FEATURE_DOC_MISPLACED | features/dashboard/dashboard-routes.md | feature documentation for dashboard; target exists and no overwrite detected | MEDIUM |
| platform/native/dashboard-vport-deep-audit.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/dashboard-vport-deep-audit.md | candidate target folder does not exist | HIGH |
| platform/native/explore-search.md | FEATURE_DOC_MISPLACED | features/explore/explore-search.md | feature documentation for explore; target exists and no overwrite detected | MEDIUM |
| platform/native/falcon_chat_dal_parity_2026-05-14.md | FEATURE_DOC_MISPLACED | features/chat/falcon_chat_dal_parity_2026-05-14.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/native/falcon_feed-dal-parity-2026-05-14.md | FEATURE_DOC_MISPLACED | features/feed/falcon_feed-dal-parity-2026-05-14.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/native/feed.md | FEATURE_DOC_MISPLACED | features/feed/feed.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/native/identity.md | FEATURE_DOC_MISPLACED | features/identity/identity.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/native/moderation.md | FEATURE_DOC_MISPLACED | features/moderation/moderation.md | feature documentation for moderation; target exists and no overwrite detected | MEDIUM |
| platform/native/notifications.md | FEATURE_DOC_MISPLACED | features/notifications/notifications.md | feature documentation for notifications; target exists and no overwrite detected | MEDIUM |
| platform/native/post-card.md | FEATURE_DOC_MISPLACED | features/post/post-card.md | feature documentation for post; target exists and no overwrite detected | MEDIUM |
| platform/native/post-detail.md | FEATURE_DOC_MISPLACED | features/post/post-detail.md | feature documentation for post; target exists and no overwrite detected | MEDIUM |
| platform/native/public-menu.md | FEATURE_DOC_MISPLACED | features/public/public-menu.md | feature documentation for public; target exists and no overwrite detected | MEDIUM |
| platform/native/public-vport-profile.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/public-vport-profile.md | candidate target folder does not exist | HIGH |
| platform/native/reviews.md | FEATURE_DOC_MISPLACED | features/reviews/reviews.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/native/schema-reviews.md | FEATURE_DOC_MISPLACED | features/reviews/schema-reviews.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/native/schema-vport.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/schema-vport.md | candidate target folder does not exist | HIGH |
| platform/native/settings.md | FEATURE_DOC_MISPLACED | features/settings/settings.md | feature documentation for settings; target exists and no overwrite detected | MEDIUM |
| platform/native/social-follow.md | FEATURE_DOC_MISPLACED | features/social/social-follow.md | feature documentation for social; target exists and no overwrite detected | MEDIUM |
| platform/native/vport-types-tabs-deep-audit.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/vport-types-tabs-deep-audit.md | candidate target folder does not exist | HIGH |
| platform/security/12-22-settings-fix.md | FEATURE_DOC_MISPLACED | features/settings/12-22-settings-fix.md | feature documentation for settings; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-10_moderation-db-remediation-plan.md | FEATURE_DOC_MISPLACED | features/moderation/2026-05-10_moderation-db-remediation-plan.md | feature documentation for moderation; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-10.block-follow-privacy-enforcement.md | FEATURE_DOC_MISPLACED | features/block/2026-05-10.block-follow-privacy-enforcement.md | feature documentation for block; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-10.post-system-quick-wins.md | FEATURE_DOC_MISPLACED | features/post/2026-05-10.post-system-quick-wins.md | feature documentation for post; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-11_carnage_block-friend-ranks.md | FEATURE_DOC_MISPLACED | features/block/2026-05-11_carnage_block-friend-ranks.md | feature documentation for block; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-14_18-45_db_vport-rls-full-schema-audit.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-14_18-45_db_vport-rls-full-schema-audit.md | candidate target folder does not exist | HIGH |
| platform/security/2026-05-14_carnage_booking-rls-policies.md | FEATURE_DOC_MISPLACED | features/booking/2026-05-14_carnage_booking-rls-policies.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | FEATURE_DOC_MISPLACED | features/auth/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-14_carnage_chat-inbox-attachments-migration-history.md | FEATURE_DOC_MISPLACED | features/chat/2026-05-14_carnage_chat-inbox-attachments-migration-history.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-14_carnage_feed-dal-rls-verification.md | FEATURE_DOC_MISPLACED | features/feed/2026-05-14_carnage_feed-dal-rls-verification.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-14_thor_booking-availability-write-release-gate.md | FEATURE_DOC_MISPLACED | features/booking/2026-05-14_thor_booking-availability-write-release-gate.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-14_thor_booking-postfix-release-gate.md | FEATURE_DOC_MISPLACED | features/booking/2026-05-14_thor_booking-postfix-release-gate.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-18_blackwidow_feed-dal-rls-adversarial.md | FEATURE_DOC_MISPLACED | features/feed/2026-05-18_blackwidow_feed-dal-rls-adversarial.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-18_carnage_booking-rls-readiness.md | FEATURE_DOC_MISPLACED | features/booking/2026-05-18_carnage_booking-rls-readiness.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-18_carnage_feed-dal-rls-delta.md | FEATURE_DOC_MISPLACED | features/feed/2026-05-18_carnage_feed-dal-rls-delta.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-18_carnage_identity-rpc-migration-ownership.md | FEATURE_DOC_MISPLACED | features/identity/2026-05-18_carnage_identity-rpc-migration-ownership.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-18_venom_identity-provision-rpc-security.md | FEATURE_DOC_MISPLACED | features/identity/2026-05-18_venom_identity-provision-rpc-security.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-19_11-20_db_platform-identity-security-review.md | FEATURE_DOC_MISPLACED | features/identity/2026-05-19_11-20_db_platform-identity-security-review.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | FEATURE_DOC_MISPLACED | features/media/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-19_13-30_thor_media-dal-release-gate.md | FEATURE_DOC_MISPLACED | features/media/2026-05-19_13-30_thor_media-dal-release-gate.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | FEATURE_DOC_MISPLACED | features/media/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-23_17-30_db_portfolio-rls-policies.md | FEATURE_DOC_MISPLACED | features/portfolio/2026-05-23_17-30_db_portfolio-rls-policies.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-23_carnage_reviews-schema-provenance-and-rls.md | FEATURE_DOC_MISPLACED | features/reviews/2026-05-23_carnage_reviews-schema-provenance-and-rls.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-23_carnage_vport-services-rates-rls-backfill.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/services/2026-05-23_carnage_vport-services-rates-rls-backfill.md | dashboard module documentation for services; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-23_db_profiles-session-rls-audit.md | FEATURE_DOC_MISPLACED | features/profiles/2026-05-23_db_profiles-session-rls-audit.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-23_db_vport-services-migration-review.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/services/2026-05-23_db_vport-services-migration-review.md | dashboard module documentation for services; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-23_db_vport-services-rls-security-verification.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/services/2026-05-23_db_vport-services-rls-security-verification.md | dashboard module documentation for services; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-23_thor_profiles-cerebro-release-gate.md | FEATURE_DOC_MISPLACED | features/profiles/2026-05-23_thor_profiles-cerebro-release-gate.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/leads/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | dashboard module documentation for leads; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-24_db_vport-business-card-leads.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/leads/2026-05-24_db_vport-business-card-leads.md | dashboard module documentation for leads; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-25_09-00_db_reviews-schema-deep-audit.md | FEATURE_DOC_MISPLACED | features/reviews/2026-05-25_09-00_db_reviews-schema-deep-audit.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-26_elektra_db-drift-code-chain-review.md | FEATURE_DOC_MISPLACED | features/reviews/2026-05-26_elektra_db-drift-code-chain-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-26_venom_db-drift-rls-review.md | FEATURE_DOC_MISPLACED | features/reviews/2026-05-26_venom_db-drift-rls-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_03-15_ironman_vport-leads-access-policy.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/leads/2026-05-27_03-15_ironman_vport-leads-access-policy.md | dashboard module documentation for leads; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_06-40_thor_vport-book-tab-release-gate.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-27_06-40_thor_vport-book-tab-release-gate.md | candidate target folder does not exist | HIGH |
| platform/security/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | FEATURE_DOC_MISPLACED | features/reviews/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_15-30_venom_ticket-0008-code-review.md | FEATURE_DOC_MISPLACED | features/reviews/2026-05-27_15-30_venom_ticket-0008-code-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_carnage_team-settings-rls-audit.md | FEATURE_DOC_MISPLACED | features/settings/2026-05-27_carnage_team-settings-rls-audit.md | feature documentation for settings; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | FEATURE_DOC_MISPLACED | features/auth/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | FEATURE_DOC_MISPLACED | features/profiles/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_carnage_vport-profile-public-details-rls.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-27_carnage_vport-profile-public-details-rls.md | candidate target folder does not exist | HIGH |
| platform/security/2026-05-27_watcher005-ci-workflow-review.md | FEATURE_DOC_MISPLACED | features/reviews/2026-05-27_watcher005-ci-workflow-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | FEATURE_DOC_MISPLACED | features/actors/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | feature documentation for actor; target exists and no overwrite detected | MEDIUM |
| platform/security/auth-login.graph.json | FEATURE_DOC_MISPLACED | features/auth/auth-login.graph.json | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/security/avengers-assembly-2026-05-14-booking.md | FEATURE_DOC_MISPLACED | features/booking/avengers-assembly-2026-05-14-booking.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/security/avengers-assembly-2026-05-18-dashboard-dal.md | FEATURE_DOC_MISPLACED | features/dashboard/avengers-assembly-2026-05-18-dashboard-dal.md | feature documentation for dashboard; target exists and no overwrite detected | MEDIUM |
| platform/security/engine.hydration.owner.md | FEATURE_DOC_MISPLACED | features/hydration/engine.hydration.owner.md | feature documentation for hydration; target exists and no overwrite detected | MEDIUM |
| platform/security/explore.graph.json | FEATURE_DOC_MISPLACED | features/explore/explore.graph.json | feature documentation for explore; target exists and no overwrite detected | MEDIUM |
| platform/security/home-central-feed-runtime-map.md | FEATURE_DOC_MISPLACED | features/feed/home-central-feed-runtime-map.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/security/PROFILE_UPLOAD_WRITEBACK_20260430-222216.md | FEATURE_DOC_MISPLACED | features/profiles/PROFILE_UPLOAD_WRITEBACK_20260430-222216.md | feature documentation for profile; target exists and no overwrite detected | MEDIUM |
| platform/security/PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md | FEATURE_DOC_MISPLACED | features/profiles/PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md | feature documentation for profile; target exists and no overwrite detected | MEDIUM |
| platform/security/restoredMapvcsm.auth-login.runtime-map.md | FEATURE_DOC_MISPLACED | features/auth/restoredMapvcsm.auth-login.runtime-map.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/security/settings.graph.json | FEATURE_DOC_MISPLACED | features/settings/settings.graph.json | feature documentation for settings; target exists and no overwrite detected | MEDIUM |
| platform/security/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | FEATURE_DOC_MISPLACED | features/upload/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | feature documentation for upload; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-api-exposure-map.md | FEATURE_DOC_MISPLACED | features/reviews/vcsm-reviews-api-exposure-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-bundle-client-server-map.md | FEATURE_DOC_MISPLACED | features/reviews/vcsm-reviews-bundle-client-server-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-database-read-map.md | FEATURE_DOC_MISPLACED | features/reviews/vcsm-reviews-database-read-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-dead-and-spaghetti-report.md | FEATURE_DOC_MISPLACED | features/reviews/vcsm-reviews-dead-and-spaghetti-report.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-feature-ownership-map.md | FEATURE_DOC_MISPLACED | features/reviews/vcsm-reviews-feature-ownership-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-governance-overlay.graph.json | FEATURE_DOC_MISPLACED | features/reviews/vcsm-reviews-governance-overlay.graph.json | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-rls-assumption-map.md | FEATURE_DOC_MISPLACED | features/reviews/vcsm-reviews-rls-assumption-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-supabase-view-tree.md | FEATURE_DOC_MISPLACED | features/reviews/vcsm-reviews-supabase-view-tree.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-vport-gas-prices.graph.json | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/gas/vcsm-vport-gas-prices.graph.json | dashboard module documentation for gas; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.ads.architecture.md | FEATURE_DOC_MISPLACED | features/ads/vcsm.ads.architecture.md | feature documentation for ads; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.auth-login.architecture.md | FEATURE_DOC_MISPLACED | features/auth/vcsm.auth-login.architecture.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.auth.architecture.md | FEATURE_DOC_MISPLACED | features/auth/vcsm.auth.architecture.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.block.owner.md | FEATURE_DOC_MISPLACED | features/block/vcsm.block.owner.md | feature documentation for block; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.booking.architecture.md | FEATURE_DOC_MISPLACED | features/booking/vcsm.booking.architecture.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.bottom-nav.explore.architecture.md | FEATURE_DOC_MISPLACED | features/explore/vcsm.bottom-nav.explore.architecture.md | feature documentation for explore; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.bottom-nav.profile.architecture.md | FEATURE_DOC_MISPLACED | features/profiles/vcsm.bottom-nav.profile.architecture.md | feature documentation for profile; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.bottom-nav.upload.architecture.md | FEATURE_DOC_MISPLACED | features/upload/vcsm.bottom-nav.upload.architecture.md | feature documentation for upload; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.bottom-nav.vox-chat.architecture.md | FEATURE_DOC_MISPLACED | features/chat/vcsm.bottom-nav.vox-chat.architecture.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.explore.architecture.md | FEATURE_DOC_MISPLACED | features/explore/vcsm.explore.architecture.md | feature documentation for explore; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.hydration.architecture.md | FEATURE_DOC_MISPLACED | features/hydration/vcsm.hydration.architecture.md | feature documentation for hydration; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.identity.architecture.md | FEATURE_DOC_MISPLACED | features/identity/vcsm.identity.architecture.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.identity.owner.md | FEATURE_DOC_MISPLACED | features/identity/vcsm.identity.owner.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.legal.architecture.md | FEATURE_DOC_MISPLACED | features/legal/vcsm.legal.architecture.md | feature documentation for legal; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.media.owner.md | FEATURE_DOC_MISPLACED | features/media/vcsm.media.owner.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.moderation.architecture.md | FEATURE_DOC_MISPLACED | features/moderation/vcsm.moderation.architecture.md | feature documentation for moderation; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.notifications.architecture.md | FEATURE_DOC_MISPLACED | features/notifications/vcsm.notifications.architecture.md | feature documentation for notifications; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.notifications.owner.md | FEATURE_DOC_MISPLACED | features/notifications/vcsm.notifications.owner.md | feature documentation for notifications; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.portfolio-card.architecture.md | FEATURE_DOC_MISPLACED | features/portfolio/vcsm.portfolio-card.architecture.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.professional.architecture.md | FEATURE_DOC_MISPLACED | features/professional/vcsm.professional.architecture.md | feature documentation for professional; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.profiles.owner.md | FEATURE_DOC_MISPLACED | features/profiles/vcsm.profiles.owner.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.public.architecture.md | FEATURE_DOC_MISPLACED | features/public/vcsm.public.architecture.md | feature documentation for public; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.reviews.architecture.md | FEATURE_DOC_MISPLACED | features/reviews/vcsm.reviews.architecture.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.social.architecture.md | FEATURE_DOC_MISPLACED | features/social/vcsm.social.architecture.md | feature documentation for social; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.upload.architecture.md | FEATURE_DOC_MISPLACED | features/upload/vcsm.upload.architecture.md | feature documentation for upload; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.void.architecture.md | FEATURE_DOC_MISPLACED | features/void/vcsm.void.architecture.md | feature documentation for void; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-availability.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/availability/vcsm.vport-availability.architecture.md | dashboard module documentation for availability; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-dashboard-leads.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/leads/vcsm.vport-dashboard-leads.architecture.md | dashboard module documentation for leads; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-dashboard.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/vcsm.vport-dashboard.architecture.md | candidate target folder does not exist | HIGH |
| platform/security/vcsm.vport-exchange-rate-dashboard.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/exchange/vcsm.vport-exchange-rate-dashboard.architecture.md | dashboard module documentation for exchange; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-gas-prices.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/gas/vcsm.vport-gas-prices.architecture.md | dashboard module documentation for gas; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-public-menu.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/menu/vcsm.vport-public-menu.architecture.md | dashboard module documentation for menu; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/menu/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | dashboard module documentation for menu; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-reviews-dashboard.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/reviews/vcsm.vport-reviews-dashboard.architecture.md | dashboard module documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-reviews.owner.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/reviews/vcsm.vport-reviews.owner.md | dashboard module documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-services-dashboard-card.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/services/vcsm.vport-services-dashboard-card.architecture.md | dashboard module documentation for services; target exists and no overwrite detected | MEDIUM |
| platform/security/VPORT_ARCHITECTURE_FOLDER_GAP_REPORT.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/VPORT_ARCHITECTURE_FOLDER_GAP_REPORT.md | candidate target folder does not exist | HIGH |
| platform/security/VPORT_FOLDER_BUILD_PLAN.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/VPORT_FOLDER_BUILD_PLAN.md | candidate target folder does not exist | HIGH |
| platform/security/VPORT_TRIAD_COVERAGE_MATRIX.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/VPORT_TRIAD_COVERAGE_MATRIX.md | candidate target folder does not exist | HIGH |
| services/2026-04-10_02-30_legal-consent-theme-unification.md | FEATURE_DOC_MISPLACED | features/legal/2026-04-10_02-30_legal-consent-theme-unification.md | feature documentation for legal; target exists and no overwrite detected | MEDIUM |
| services/2026-04-12_00-00_psl-foundation-notification-engine-migration.md | FEATURE_DOC_MISPLACED | features/notifications/2026-04-12_00-00_psl-foundation-notification-engine-migration.md | feature documentation for notification; target exists and no overwrite detected | MEDIUM |
| services/vcsm.vport.external-site-integration.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/vcsm.vport.external-site-integration.md | candidate target folder does not exist | HIGH |
| services/vcsm.vport.menu-pipeline.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/menu/vcsm.vport.menu-pipeline.md | dashboard module documentation for menu; target exists and no overwrite detected | MEDIUM |
| services/vcsm.vport.tripoint-integration.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/vcsm.vport.tripoint-integration.md | candidate target folder does not exist | HIGH |
| shared/2026-03-31_14-50_chat-engine-stabilization.md | FEATURE_DOC_MISPLACED | features/chat/2026-03-31_14-50_chat-engine-stabilization.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | FEATURE_DOC_MISPLACED | features/chat/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/2026-04-09_01-58_booking-review-identity-audit.md | FEATURE_DOC_MISPLACED | features/booking/2026-04-09_01-58_booking-review-identity-audit.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| shared/2026-04-13_12-30_vport-dal-schema-migration.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-04-13_12-30_vport-dal-schema-migration.md | candidate target folder does not exist | HIGH |
| shared/2026-05-14_db_booking-schema.md | FEATURE_DOC_MISPLACED | features/booking/2026-05-14_db_booking-schema.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| shared/2026-05-14_db_feed-rls-four-tables.md | FEATURE_DOC_MISPLACED | features/feed/2026-05-14_db_feed-rls-four-tables.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| shared/2026-05-18_11-00_db_identity-governance-review.md | FEATURE_DOC_MISPLACED | features/identity/2026-05-18_11-00_db_identity-governance-review.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| shared/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/booking/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | dashboard module documentation for booking; target exists and no overwrite detected | MEDIUM |
| shared/2026-05-19_14-30_db_notifications-rls-audit.md | FEATURE_DOC_MISPLACED | features/notifications/2026-05-19_14-30_db_notifications-rls-audit.md | feature documentation for notifications; target exists and no overwrite detected | MEDIUM |
| shared/2026-05-23_14-00_db_reviews-schema-rls-audit.md | FEATURE_DOC_MISPLACED | features/reviews/2026-05-23_14-00_db_reviews-schema-rls-audit.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| shared/BOOKING_ENGINE_AUDIT_V1.md | FEATURE_DOC_MISPLACED | features/booking/BOOKING_ENGINE_AUDIT_V1.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| shared/CHAT_ENGINE_AUDIT_V1.md | FEATURE_DOC_MISPLACED | features/chat/CHAT_ENGINE_AUDIT_V1.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/CHAT_ENGINE_AUDIT_V2.md | FEATURE_DOC_MISPLACED | features/chat/CHAT_ENGINE_AUDIT_V2.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/CHAT_ENGINE_AUDIT_V3.md | FEATURE_DOC_MISPLACED | features/chat/CHAT_ENGINE_AUDIT_V3.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/reviews/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | dashboard module documentation for reviews; target exists and no overwrite detected | MEDIUM |
| shared/engines.booking.contract.md | FEATURE_DOC_MISPLACED | features/booking/engines.booking.contract.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| shared/engines.chat.capability.md | FEATURE_DOC_MISPLACED | features/chat/engines.chat.capability.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/engines.chat.contract.md | FEATURE_DOC_MISPLACED | features/chat/engines.chat.contract.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/engines.identity.boundary-audit.md | FEATURE_DOC_MISPLACED | features/identity/engines.identity.boundary-audit.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| shared/engines.identity.boundary.md | FEATURE_DOC_MISPLACED | features/identity/engines.identity.boundary.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| shared/engines.identity.contract.md | FEATURE_DOC_MISPLACED | features/identity/engines.identity.contract.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| shared/engines.isolation.chat-identity-audit.md | FEATURE_DOC_MISPLACED | features/identity/engines.isolation.chat-identity-audit.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| shared/engines.media.system-architecture.md | FEATURE_DOC_MISPLACED | features/media/engines.media.system-architecture.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| shared/engines.notifications.engine-architecture.md | FEATURE_DOC_MISPLACED | features/notifications/engines.notifications.engine-architecture.md | feature documentation for notifications; target exists and no overwrite detected | MEDIUM |
| shared/engines.portfolio.contract.md | FEATURE_DOC_MISPLACED | features/portfolio/engines.portfolio.contract.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| shared/engines.portfolio.system-architecture.md | FEATURE_DOC_MISPLACED | features/portfolio/engines.portfolio.system-architecture.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| shared/engines.reviews.contract.md | FEATURE_DOC_MISPLACED | features/reviews/engines.reviews.contract.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| shared/MEDIA_ENGINE_AUDIT_V1.md | FEATURE_DOC_MISPLACED | features/media/MEDIA_ENGINE_AUDIT_V1.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| shared/NOTIFICATIONS_ENGINE_AUDIT_V1.md | FEATURE_DOC_MISPLACED | features/notifications/NOTIFICATIONS_ENGINE_AUDIT_V1.md | feature documentation for notifications; target exists and no overwrite detected | MEDIUM |
| shared/PORTFOLIO_ENGINE_AUDIT_V1.md | FEATURE_DOC_MISPLACED | features/portfolio/PORTFOLIO_ENGINE_AUDIT_V1.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| shared/PORTFOLIO_ENGINE_AUDIT_V2.md | FEATURE_DOC_MISPLACED | features/portfolio/PORTFOLIO_ENGINE_AUDIT_V2.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| state/2026-05-18_00-00_db_feed-rls-four-tables.md | FEATURE_DOC_MISPLACED | features/feed/2026-05-18_00-00_db_feed-rls-four-tables.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| state/2026-05-19_12-00_db_media-assets-rls-audit.md | FEATURE_DOC_MISPLACED | features/media/2026-05-19_12-00_db_media-assets-rls-audit.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| state/2026-05-22_db_profiles-rls-coverage-audit.md | FEATURE_DOC_MISPLACED | features/profiles/2026-05-22_db_profiles-rls-coverage-audit.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| state/2026-05-23_19-00_db_portfolio-trigger-functions.md | FEATURE_DOC_MISPLACED | features/portfolio/2026-05-23_19-00_db_portfolio-trigger-functions.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| state/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/settings/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | dashboard module documentation for settings; target exists and no overwrite detected | MEDIUM |
| state/vcsm-reviews-state-store-map.md | FEATURE_DOC_MISPLACED | features/reviews/vcsm-reviews-state-store-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |

Frozen feature exclusions were kept in place. The frozen set used for routing safety was: wanders, wanderex, vgrid, learning.

## Phase 4 - Keep / Move / Review Plan

| File | Action | Target Path | Reason | Risk |
| --- | --- | --- | --- | --- |
| CATEGORY_REGISTRY.md | KEEP | current | canonical CURRENT root registry | LOW |
| FEATURE_DOCUMENTATION_INDEX.md | KEEP | current | canonical CURRENT root registry | LOW |
| FEATURE_INDEX_RUNTIME/actors.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/ads.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/auth.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/block.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/booking.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/chat.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/dashboard.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/explore.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/feed.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/hydration.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/identity.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/invite.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/join.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/legal.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/media.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/moderation.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/notifications.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/onboarding.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/portfolio.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/post.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/professional.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/profiles.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/public.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/README.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/reviews.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/settings.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/social.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/upload.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/vgrid.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/void.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX_RUNTIME/vport.md | KEEP | current | already in FEATURE_INDEX_RUNTIME | LOW |
| FEATURE_INDEX/actors.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/ads.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/auth.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/block.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/booking.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/chat.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/dashboard.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/explore.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/feed.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/hydration.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/identity.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/invite.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/join.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/legal.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/media.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/moderation.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/notifications.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/onboarding.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/portfolio.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/post.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/professional.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/profiles.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/public.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/settings.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/social.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/upload.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/vgrid.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/void.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_INDEX/vport.md | KEEP | current | already in FEATURE_INDEX | LOW |
| FEATURE_STATUS.md | KEEP | current | canonical CURRENT root registry | LOW |
| FROZEN_FEATURE_CONTRACT.md | KEEP | current | canonical CURRENT root registry | LOW |
| frozen/learning/README.md | KEEP | current | frozen feature material is excluded from routing | LOW |
| frozen/learning/STATUS.md | KEEP | current | frozen feature material is excluded from routing | LOW |
| frozen/vgrid/README.md | KEEP | current | frozen feature material is excluded from routing | LOW |
| frozen/vgrid/STATUS.md | KEEP | current | frozen feature material is excluded from routing | LOW |
| frozen/wanderex/README.md | KEEP | current | frozen feature material is excluded from routing | LOW |
| frozen/wanderex/STATUS.md | KEEP | current | frozen feature material is excluded from routing | LOW |
| frozen/wanders/README.md | KEEP | current | frozen feature material is excluded from routing | LOW |
| frozen/wanders/STATUS.md | KEEP | current | frozen feature material is excluded from routing | LOW |
| NEEDS_TRIAGE/CONFLICT_FROM_ACTIVE_CANONICAL___CANONICAL__logan__README.md | REVIEW | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-03.md__09-03.md | REVIEW | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-06.md__09-06.md | REVIEW | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-07.md__09-07.md | REVIEW | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-08.md__09-08.md | REVIEW | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__10__10-06.md__10-06.md | REVIEW | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__19__19-01.md__19-01.md | REVIEW | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/DR_STRANGE.md | REVIEW | unknown | triage folder requires owner confirmation before routing | HIGH |
| OUTPUT_NAMING_CONTRACT.md | KEEP | current | canonical CURRENT root registry | LOW |
| outputs/2026/06/02/ARCHITECT/ARCHITECT_VERIFICATION_PASS_2.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/dead-and-spaghetti-code-report.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/engine-consumer-map.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/feature-map.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/INDEX.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.actors.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.ads.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.auth.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.block.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.booking.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.chat.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.dashboard.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.explore.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.feed.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.hydration.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.identity.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.invite.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.join.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.legal.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.media.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.moderation.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.notifications.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.onboarding.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.portfolio.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.post.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.professional.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.profiles.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.public.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.reviews.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.settings.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.social.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.upload.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.void.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/modules/vcsm.vport.architecture.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ARCHITECT/system-map.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/blackwidow/001_platform-security_blackwidow_TICKET-BLACKWIDOW-ARCHITECT-VENOM-VERIFY-0001.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/blackwidow/INDEX.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/dr-strange/001_platform-governance_dr-strange_drstrange-coverage-audit.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/dr-strange/002_platform-documentation_dr-strange_command-matrix-backfill.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/dr-strange/003_cerebro-architect-pending-audit.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/dr-strange/004_platform-documentation_dr-strange_matrix-refresh.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/dr-strange/005_platform-documentation_dr-strange_governance-realignment-platform-refresh.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/dr-strange/INDEX.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ELEKTRA/2026-06-02_elektra_flyerbuilder-write-surfaces.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ELEKTRA/2026-06-02_elektra_public-edge-functions-rpc.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/ELEKTRA/INDEX.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/logan/001_platform-documentation_logan_codex-context-build.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/logan/001_platform-documentation_logan_governance-v2-index-rebuild.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/logan/003_platform-documentation_logan_governance-realignment.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/logan/INDEX.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/scanner/001_TICKET-SCANNER-BARREL-REEXPORT-TRACE-0001_barrel-resolution-upgrade.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/sentry/001_dashboard-booking_sentry_rule9-remediation.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/sentry/INDEX.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/venom/001_platform-security_venom_TICKET-VENOM-ARCHITECT-FINDINGS-0001.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/venom/INDEX.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/wolverine/001_wolverine_dashboard_settings-doc-sync.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/wolverine/002_dashboard-settings_wolverine_venom-doc-sync.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/wolverine/003_public_wolverine_public-venom-p1-patch.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/wolverine/004_block_wolverine_ownership-completion.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/wolverine/005_platform-documentation_wolverine_drstrange-p0-backfill.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/wolverine/006_dashboard-settings_wolverine_blackwidow-doc-sync.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/wolverine/007_dashboard-settings_wolverine_blackwidow-doc-sync-formal.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/wolverine/008_platform-documentation_wolverine_drstrange-p1-backfill.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/wolverine/009_platform-documentation_wolverine_drstrange-p2-backfill.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| outputs/2026/06/02/wolverine/INDEX.md | KEEP | current | outputs evidence is immutable by contract | LOW |
| platform/change-intent/27-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/change-intent/27-17.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/change-intent/CHANGE_INTENT.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/change-intent/DR_STRANGE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/debuggers/DR_STRANGE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/debuggers/vcsm.debug.architecture.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/03-13.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/03-14.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/03-15.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/09-09.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/09-13.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/09-18.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/09-20.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/10-08.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/12-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/12-09.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/16-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/16-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/19-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/2026-04-01.captain-log.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/2026-04-10.captain-log.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/2026-04-13_folder-alignment-report.md | REVIEW | unknown | filename suggests duplicate/legacy/stale material | MEDIUM |
| platform/documentation/2026-04-13.captain-log.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/2026-04-19.captain-log.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/2026-05-10.captain-log.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/2026-05-27_architect_vport-dtab-001-duplicate-registry.md | REVIEW | features/dashboard/modules/vport/2026-05-27_architect_vport-dtab-001-duplicate-registry.md | candidate target folder does not exist | HIGH |
| platform/documentation/2026-05-27_architect_vport-dtab-006-adapter-boundary.md | REVIEW | features/dashboard/modules/vport/2026-05-27_architect_vport-dtab-006-adapter-boundary.md | candidate target folder does not exist | HIGH |
| platform/documentation/2026-05-27_carnage_book-slot-collision-proposal.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/2026-05-27_cross-root-approval_traffic-seo-routes.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/2026-05-27_venom_vport-book-tab.md | REVIEW | features/dashboard/modules/vport/2026-05-27_venom_vport-book-tab.md | candidate target folder does not exist | HIGH |
| platform/documentation/2026-05-27_venom_vport-gas-tab.md | MOVE | features/dashboard/modules/gas/2026-05-27_venom_vport-gas-tab.md | dashboard module documentation for gas; target exists and no overwrite detected | MEDIUM |
| platform/documentation/2026-05-27_venom_vport-owner-tab.md | REVIEW | features/dashboard/modules/vport/2026-05-27_venom_vport-owner-tab.md | candidate target folder does not exist | HIGH |
| platform/documentation/2026-05-27_watcher008-dependency-review.md | MOVE | features/reviews/2026-05-27_watcher008-dependency-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/documentation/2026-06-02_wolverine_dashboard-ticket-0004.md | MOVE | features/dashboard/2026-06-02_wolverine_dashboard-ticket-0004.md | feature documentation for dashboard; target exists and no overwrite detected | MEDIUM |
| platform/documentation/25-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/27-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/27-09.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/BAT-03-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/BEHAVIOR_TEMPLATE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/bottom-navigation.graph.json | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/code-derived-app-review.md | MOVE | features/reviews/code-derived-app-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/documentation/codex-context/codex-command-decision-tree.md | KEEP | current | already in platform documentation codex context | LOW |
| platform/documentation/codex-context/codex-command-registry.md | KEEP | current | already in platform documentation codex context | LOW |
| platform/documentation/codex-context/codex-feature-routing.md | KEEP | current | already in platform documentation codex context | LOW |
| platform/documentation/codex-context/codex-governance-v2-rulebook.md | KEEP | current | already in platform documentation codex context | LOW |
| platform/documentation/codex-context/codex-output-template.md | KEEP | current | already in platform documentation codex context | LOW |
| platform/documentation/codex-context/codex-ticket-workflow.md | KEEP | current | already in platform documentation codex context | LOW |
| platform/documentation/codex-context/CODEX.md | KEEP | current | already in platform documentation codex context | LOW |
| platform/documentation/codex-context/prompt/360.md | KEEP | current | already in platform documentation codex context | LOW |
| platform/documentation/codex-context/prompt/architect.md | KEEP | current | already in platform documentation codex context | LOW |
| platform/documentation/codex-context/prompt/DR. STRANGE.md | KEEP | current | already in platform documentation codex context | LOW |
| platform/documentation/codex-context/prompt/Engineering Reality.md | KEEP | current | already in platform documentation codex context | LOW |
| platform/documentation/codex-context/prompt/One.md | KEEP | current | already in platform documentation codex context | LOW |
| platform/documentation/codex-context/prompt/THOR Readiness.md | KEEP | current | already in platform documentation codex context | LOW |
| platform/documentation/command-preflight-matrix.md | KEEP | current | platform scanner documentation belongs under platform documentation | LOW |
| platform/documentation/CURRENT_OUTPUT_CONTRACT_001.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/CURRENT_STATUS.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/dal-map.graph.json | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/database-read-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/dev-performance-code-logic.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/DOCS_MIGRATION_PLAN.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/DR_STRANGE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/ENGINE_INDEPENDENCE_AUDIT.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/ENGINE_INDEPENDENCE_FINAL_REPORT.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/evidence/001_platform-governance_dr-strange_drstrange-coverage-audit.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/evidence/005_platform-documentation_wolverine_drstrange-p0-backfill.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/evidence/008_platform-documentation_wolverine_drstrange-p1-backfill.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/extractor.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/feature-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/feedback_ticketing_output_format.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/Founder Narrative.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/GLOBAL_DIRECTORY_ARCHITECTURE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/GLOBAL_DIRECTORY_AUDIT_REPORT.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/HISTORY_INDEX.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/HISTORY_RELOCATION_AUDIT.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/HISTORY_RELOCATION_COVERAGE_AUDIT.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/home-feed.graph.json | MOVE | features/feed/home-feed.graph.json | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/documentation/legacy-outcomes/_ACTIVE__tools__shield-visualizer/README.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/logan-cleanup-report-2026-05-11.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/mission.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/p2_batch2_manifest_20260430_212747.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/p2_batch3_manifest_20260430.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/phase3a-identity-drift-2026-05-11.md | MOVE | features/identity/phase3a-identity-drift-2026-05-11.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/documentation/phase3b-booking-vports-drift-2026-05-11.md | MOVE | features/dashboard/modules/booking/phase3b-booking-vports-drift-2026-05-11.md | dashboard module documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/documentation/phase3c-chat-engines-audit-chain-2026-05-11.md | MOVE | features/chat/phase3c-chat-engines-audit-chain-2026-05-11.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/documentation/phase3d-runtime-mutations-drift-2026-05-11.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/phase3e-profiles-public-notifications-drift-2026-05-11.md | MOVE | features/profiles/phase3e-profiles-public-notifications-drift-2026-05-11.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| platform/documentation/phase3f-vport-schema-migration-scope-2026-05-11.md | REVIEW | features/dashboard/modules/vport/phase3f-vport-schema-migration-scope-2026-05-11.md | candidate target folder does not exist | HIGH |
| platform/documentation/Platform Principles.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/platform.performance.observability-system.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/Product Philosophy.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/README.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/remediation_phase1_20260430_191833.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/REPOSITORY_GOVERNANCE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/repository-architecture-interpretation.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/review.md | MOVE | features/reviews/review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/documentation/route-tree.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/scanner-freshness-contract.md | KEEP | current | platform scanner documentation belongs under platform documentation | LOW |
| platform/documentation/scanner-output-contract.md | KEEP | current | platform scanner documentation belongs under platform documentation | LOW |
| platform/documentation/scanner-trust-contract.md | KEEP | current | platform scanner documentation belongs under platform documentation | LOW |
| platform/documentation/SOURCE_ROOT_CLASSIFICATION.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/system-map.2026-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/The Vibez Citizens Manifesto.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/TRAFFIC_ARCHITECTURE_REVIEW.md | MOVE | features/reviews/TRAFFIC_ARCHITECTURE_REVIEW.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/documentation/TRAFFIC_FOLDER_ARCHITECTURE_AUDIT.md | REVIEW | unknown | filename suggests duplicate/legacy/stale material | MEDIUM |
| platform/documentation/TRAFFIC_VPORT_INTEGRATION_AUDIT.md | REVIEW | features/dashboard/modules/vport/TRAFFIC_VPORT_INTEGRATION_AUDIT.md | candidate target folder does not exist | HIGH |
| platform/documentation/traffic-architecture-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/traffic-data-evolution-plan.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/traffic-performance-report.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/traffic-security-report.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/traffic.architecture-audit.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/traffic.seo.canonical-metadata-fix.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/traffic.taxonomy.naming-contract.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/traffic.traze.vcsm-funnel-audit.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/traffic.vport.directory-integration.md | REVIEW | features/dashboard/modules/vport/traffic.vport.directory-integration.md | candidate target folder does not exist | HIGH |
| platform/documentation/TRAZE_IMPLEMENTATION_LOG.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/vcsm-engine-consumer-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/vcsm-performance-report.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/vcsm-reviews-component-tree.md | MOVE | features/reviews/vcsm-reviews-component-tree.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm-reviews-event-flow-map.md | MOVE | features/reviews/vcsm-reviews-event-flow-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.chat.badge-pipeline.md | MOVE | features/chat/vcsm.chat.badge-pipeline.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.chat.message-flow-audit.md | MOVE | features/chat/vcsm.chat.message-flow-audit.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.dal.chat.md | MOVE | features/chat/vcsm.dal.chat.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.dal.explore.md | MOVE | features/explore/vcsm.dal.explore.md | feature documentation for explore; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.dal.invite.md | MOVE | features/invite/vcsm.dal.invite.md | feature documentation for invite; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.explore.search-pipeline.md | MOVE | features/explore/vcsm.explore.search-pipeline.md | feature documentation for explore; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.feed.profiler-system.md | MOVE | features/feed/vcsm.feed.profiler-system.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.i18n.phase2-string-wiring.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/vcsm.identity.actor-switch-pipeline.md | MOVE | features/identity/vcsm.identity.actor-switch-pipeline.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.identity.auth-pipeline.md | MOVE | features/auth/vcsm.identity.auth-pipeline.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.identity.email-flows.md | MOVE | features/identity/vcsm.identity.email-flows.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.identity.engine-architecture.md | MOVE | features/identity/vcsm.identity.engine-architecture.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.native.runtime-audit.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/vcsm.navigation.audit.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/vcsm.performance.known-bottlenecks.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/vcsm.performance.optimization-history.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/vcsm.performance.route-profiles.md | MOVE | features/profiles/vcsm.performance.route-profiles.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.platform.nav-screens-read-cache-skeleton.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/vcsm.platform.read-audit-5-surfaces.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/vcsm.platform.read-optimization-plan.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/vcsm.public.conversion-funnel.md | MOVE | features/public/vcsm.public.conversion-funnel.md | feature documentation for public; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.public.seo-infrastructure.md | MOVE | features/public/vcsm.public.seo-infrastructure.md | feature documentation for public; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.public.top-nav.md | MOVE | features/public/vcsm.public.top-nav.md | feature documentation for public; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.runtime.profile-nav-audit.md | MOVE | features/profiles/vcsm.runtime.profile-nav-audit.md | feature documentation for profile; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.runtime.settings-profile-audit.md | MOVE | features/profiles/vcsm.runtime.settings-profile-audit.md | feature documentation for profile; target exists and no overwrite detected | MEDIUM |
| platform/documentation/vcsm.runtime.vibes-tab-audit.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/vcsm.vport.review-implementation-plan.md | REVIEW | features/dashboard/modules/vport/vcsm.vport.review-implementation-plan.md | candidate target folder does not exist | HIGH |
| platform/documentation/VERTICAL_PRIORITY_AUDIT.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/WENTREX_ARCHITECTURE_REVIEW.md | MOVE | features/reviews/WENTREX_ARCHITECTURE_REVIEW.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/documentation/WENTREX_USER_CREATION_PIPELINE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/wentrex-database-read-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/wentrex-dependency-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/wentrex-feature-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/wentrex-performance-migration-report.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/wentrex-security-report.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/wentrex-system-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/zNOTFORPRODUCTION_DISCOVERY_REPORT.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/10-05.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/11-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/14-approval-tracker.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/18-approval-tracker.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/2026-04-05_10-41_contracts-dead-code-i18n-audit.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | MOVE | features/legal/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | feature documentation for legal; target exists and no overwrite detected | MEDIUM |
| platform/native/24-approval-tracker.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/26-06.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/27-approval-tracker.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/AGENTS.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/auth.md | MOVE | features/auth/auth.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/native/booking.md | MOVE | features/booking/booking.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/native/bottom-nav-runtime.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/chat-inbox-deep-audit.md | MOVE | features/chat/chat-inbox-deep-audit.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/native/chat-inbox.md | MOVE | features/chat/chat-inbox.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/native/composer-upload.md | MOVE | features/upload/composer-upload.md | feature documentation for upload; target exists and no overwrite detected | MEDIUM |
| platform/native/dashboard-routes.md | MOVE | features/dashboard/dashboard-routes.md | feature documentation for dashboard; target exists and no overwrite detected | MEDIUM |
| platform/native/dashboard-vport-deep-audit.md | REVIEW | features/dashboard/modules/vport/dashboard-vport-deep-audit.md | candidate target folder does not exist | HIGH |
| platform/native/DELETE_FEATURE_TRANSFER.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/DOCS_SPAGHETTI_AUDIT.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/DR_STRANGE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/explore-search.md | MOVE | features/explore/explore-search.md | feature documentation for explore; target exists and no overwrite detected | MEDIUM |
| platform/native/falcon_chat_dal_parity_2026-05-14.md | MOVE | features/chat/falcon_chat_dal_parity_2026-05-14.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/native/falcon_feed-dal-parity-2026-05-14.md | MOVE | features/feed/falcon_feed-dal-parity-2026-05-14.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/native/feed.md | MOVE | features/feed/feed.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/native/identity.md | MOVE | features/identity/identity.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/native/learning.md | KEEP | current | references frozen feature learning; no frozen feature routing allowed | LOW |
| platform/native/moderation.md | MOVE | features/moderation/moderation.md | feature documentation for moderation; target exists and no overwrite detected | MEDIUM |
| platform/native/MODULE_PROMPT_TEMPLATE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/NATIVE_COMMAND_CENTER.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/NATIVE_SYNC_COMMAND.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/notifications.md | MOVE | features/notifications/notifications.md | feature documentation for notifications; target exists and no overwrite detected | MEDIUM |
| platform/native/PIPELINE_PROMPT.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/post-card.md | MOVE | features/post/post-card.md | feature documentation for post; target exists and no overwrite detected | MEDIUM |
| platform/native/post-detail.md | MOVE | features/post/post-detail.md | feature documentation for post; target exists and no overwrite detected | MEDIUM |
| platform/native/public-menu.md | MOVE | features/public/public-menu.md | feature documentation for public; target exists and no overwrite detected | MEDIUM |
| platform/native/public-vport-profile.md | REVIEW | features/dashboard/modules/vport/public-vport-profile.md | candidate target folder does not exist | HIGH |
| platform/native/PWA_TO_NATIVE_GENERATOR.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/README.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/reviews.md | MOVE | features/reviews/reviews.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/native/rls-authenticated-access.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/ROADTRIP_INDEX.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/ROADTRIP.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/RUN_NATIVE_SYNC.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/schema-platform.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/schema-reviews.md | MOVE | features/reviews/schema-reviews.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/native/schema-vc.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/native/schema-vport.md | REVIEW | features/dashboard/modules/vport/schema-vport.md | candidate target folder does not exist | HIGH |
| platform/native/settings.md | MOVE | features/settings/settings.md | feature documentation for settings; target exists and no overwrite detected | MEDIUM |
| platform/native/social-follow.md | MOVE | features/social/social-follow.md | feature documentation for social; target exists and no overwrite detected | MEDIUM |
| platform/native/vport-types-tabs-deep-audit.md | REVIEW | features/dashboard/modules/vport/vport-types-tabs-deep-audit.md | candidate target folder does not exist | HIGH |
| platform/native/wanders.md | KEEP | current | references frozen feature wanders; no frozen feature routing allowed | LOW |
| platform/security/01-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/03-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/03-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/03-11.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/03-18.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/03-21.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/05-16.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/09-22-report.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/10-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/10-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/10-05.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/12-22-settings-fix.md | MOVE | features/settings/12-22-settings-fix.md | feature documentation for settings; target exists and no overwrite detected | MEDIUM |
| platform/security/12-32.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/13-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/13-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/14-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/16-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/18-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/18-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/19-09.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/19-11.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/20-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-04-12.runtime-observability-build.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-04-25.security-headers-audit.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-03_deletion-pipeline-audit.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-09_00-00_venom_whole-project-deep.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-10_00-00_venom_vcsm-full-deep-scan.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-10_04-04_carnage_secdefiner-rls-elimination.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-10_04-04_venom_secdefiner-trust-boundaries.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-10_moderation-db-remediation-plan.md | MOVE | features/moderation/2026-05-10_moderation-db-remediation-plan.md | feature documentation for moderation; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-10_pre-push_venom_full-security-sweep.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-10.block-follow-privacy-enforcement.md | MOVE | features/block/2026-05-10.block-follow-privacy-enforcement.md | feature documentation for block; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-10.deleted-account-gate.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-10.post-system-quick-wins.md | MOVE | features/post/2026-05-10.post-system-quick-wins.md | feature documentation for post; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-10.security-hardening-full-remediation.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-11_carnage_block-friend-ranks.md | MOVE | features/block/2026-05-11_carnage_block-friend-ranks.md | feature documentation for block; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-14_14-00_blackwidow_vcsm-full-pass.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-14_18-45_db_vport-rls-full-schema-audit.md | REVIEW | features/dashboard/modules/vport/2026-05-14_18-45_db_vport-rls-full-schema-audit.md | candidate target folder does not exist | HIGH |
| platform/security/2026-05-14_carnage_booking-rls-policies.md | MOVE | features/booking/2026-05-14_carnage_booking-rls-policies.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | MOVE | features/auth/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-14_carnage_chat-inbox-attachments-migration-history.md | MOVE | features/chat/2026-05-14_carnage_chat-inbox-attachments-migration-history.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-14_carnage_content-pages-legacy-policy-cleanup.md | REVIEW | unknown | filename suggests duplicate/legacy/stale material | MEDIUM |
| platform/security/2026-05-14_carnage_feed-dal-rls-verification.md | MOVE | features/feed/2026-05-14_carnage_feed-dal-rls-verification.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-14_thor_booking-availability-write-release-gate.md | MOVE | features/booking/2026-05-14_thor_booking-availability-write-release-gate.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-14_thor_booking-postfix-release-gate.md | MOVE | features/booking/2026-05-14_thor_booking-postfix-release-gate.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-18_blackwidow_feed-dal-rls-adversarial.md | MOVE | features/feed/2026-05-18_blackwidow_feed-dal-rls-adversarial.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-18_carnage_booking-rls-readiness.md | MOVE | features/booking/2026-05-18_carnage_booking-rls-readiness.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-18_carnage_consent-ip-edge-function.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-18_carnage_feed-dal-rls-delta.md | MOVE | features/feed/2026-05-18_carnage_feed-dal-rls-delta.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-18_carnage_identity-rpc-migration-ownership.md | MOVE | features/identity/2026-05-18_carnage_identity-rpc-migration-ownership.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-18_venom_identity-provision-rpc-security.md | MOVE | features/identity/2026-05-18_venom_identity-provision-rpc-security.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-19_11-20_db_platform-identity-security-review.md | MOVE | features/identity/2026-05-19_11-20_db_platform-identity-security-review.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | MOVE | features/media/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-19_13-30_thor_media-dal-release-gate.md | MOVE | features/media/2026-05-19_13-30_thor_media-dal-release-gate.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | MOVE | features/media/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-22_10-00_carnage_vc-posts-insert-ownership-rls.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-22_carnage_vc-posts-insert-rls-cerebro-verification.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-23_17-30_db_portfolio-rls-policies.md | MOVE | features/portfolio/2026-05-23_17-30_db_portfolio-rls-policies.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-23_carnage_reviews-schema-provenance-and-rls.md | MOVE | features/reviews/2026-05-23_carnage_reviews-schema-provenance-and-rls.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-23_carnage_vport-services-rates-rls-backfill.md | MOVE | features/dashboard/modules/services/2026-05-23_carnage_vport-services-rates-rls-backfill.md | dashboard module documentation for services; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-23_db_profiles-session-rls-audit.md | MOVE | features/profiles/2026-05-23_db_profiles-session-rls-audit.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-23_db_vport-services-migration-review.md | MOVE | features/dashboard/modules/services/2026-05-23_db_vport-services-migration-review.md | dashboard module documentation for services; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-23_db_vport-services-rls-security-verification.md | MOVE | features/dashboard/modules/services/2026-05-23_db_vport-services-rls-security-verification.md | dashboard module documentation for services; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-23_thor_profiles-cerebro-release-gate.md | MOVE | features/profiles/2026-05-23_thor_profiles-cerebro-release-gate.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | MOVE | features/dashboard/modules/leads/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | dashboard module documentation for leads; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-24_db_vport-business-card-leads.md | MOVE | features/dashboard/modules/leads/2026-05-24_db_vport-business-card-leads.md | dashboard module documentation for leads; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-25_09-00_db_reviews-schema-deep-audit.md | MOVE | features/reviews/2026-05-25_09-00_db_reviews-schema-deep-audit.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-26_carnage_migration-history-registration-plan.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-26_elektra_db-drift-code-chain-review.md | MOVE | features/reviews/2026-05-26_elektra_db-drift-code-chain-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-26_hawkeye_db-drift-endpoint-impact.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-26_thor_db-drift-release-gate.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-26_venom_db-drift-rls-review.md | MOVE | features/reviews/2026-05-26_venom_db-drift-rls-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_03-15_ironman_vport-leads-access-policy.md | MOVE | features/dashboard/modules/leads/2026-05-27_03-15_ironman_vport-leads-access-policy.md | dashboard module documentation for leads; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_05-42_db_barber-rls-verification.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-27_06-40_thor_vport-book-tab-release-gate.md | REVIEW | features/dashboard/modules/vport/2026-05-27_06-40_thor_vport-book-tab-release-gate.md | candidate target folder does not exist | HIGH |
| platform/security/2026-05-27_14-00_dataengineer_gasprices-batch-c-db-constraints.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | MOVE | features/reviews/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_15-30_venom_ticket-0008-code-review.md | MOVE | features/reviews/2026-05-27_15-30_venom_ticket-0008-code-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_16-30_venom_ticket-platform-rls-001.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-27_18-30_venom_external-site.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-27_18-30_venom_tripoint.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-27_19-00_blackwidow_external-site-tripoint.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-27_20-00_elektra_external-site.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-27_carnage_team-settings-rls-audit.md | MOVE | features/settings/2026-05-27_carnage_team-settings-rls-audit.md | feature documentation for settings; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_carnage_ticket-0005-bookings-select-rls-verification.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | MOVE | features/auth/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | MOVE | features/profiles/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-27_carnage_vport-profile-public-details-rls.md | REVIEW | features/dashboard/modules/vport/2026-05-27_carnage_vport-profile-public-details-rls.md | candidate target folder does not exist | HIGH |
| platform/security/2026-05-27_ticket-sub-001-subscriber-rpc-architecture.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-05-27_watcher005-ci-workflow-review.md | MOVE | features/reviews/2026-05-27_watcher005-ci-workflow-review.md | feature documentation for review; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | MOVE | features/actors/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | feature documentation for actor; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-28_elektra_tripoint.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-06-01_db_tier2-surgical-confirmations.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/2026-06-02_wolverine_ticket-0007A_current-backfill.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/24-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/25-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/25-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/25-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/26-05.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/26-12.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/27-12.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/27-13.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/27-19.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/27-20.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/27-approval-tracker-12.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/api-exposure-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/audit-status.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/auth-login.graph.json | MOVE | features/auth/auth-login.graph.json | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/security/avengers-assembly-2026-05-14-booking.md | MOVE | features/booking/avengers-assembly-2026-05-14-booking.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/security/avengers-assembly-2026-05-18-dashboard-dal.md | MOVE | features/dashboard/avengers-assembly-2026-05-18-dashboard-dal.md | feature documentation for dashboard; target exists and no overwrite detected | MEDIUM |
| platform/security/BAT-03-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/bundle-boundary-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/cerebro_venom-fix-plan.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/client-server-execution-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/COMMAND_OUTPUT_CONTRACT_PLAN.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/CURRENT_STATUS.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/database-read-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/dead-and-spaghetti-code-report.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/dead-feature-report.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/dependency-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/DR_STRANGE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/engine-consumer-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/engine.hydration.owner.md | MOVE | features/hydration/engine.hydration.owner.md | feature documentation for hydration; target exists and no overwrite detected | MEDIUM |
| platform/security/event-flow-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/explore.graph.json | MOVE | features/explore/explore.graph.json | feature documentation for explore; target exists and no overwrite detected | MEDIUM |
| platform/security/feature-ownership-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/FINAL_SUMMARY.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/governance-overlays.graph.json | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/HISTORY_INDEX.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/home-central-feed-runtime-map.md | MOVE | features/feed/home-central-feed-runtime-map.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| platform/security/p2_batch6_manifest_20260430.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/PROFILE_UPLOAD_WRITEBACK_20260430-222216.md | MOVE | features/profiles/PROFILE_UPLOAD_WRITEBACK_20260430-222216.md | feature documentation for profile; target exists and no overwrite detected | MEDIUM |
| platform/security/PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md | MOVE | features/profiles/PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md | feature documentation for profile; target exists and no overwrite detected | MEDIUM |
| platform/security/README.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/release-status.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/restoredMapvcsm.auth-login.runtime-map.md | MOVE | features/auth/restoredMapvcsm.auth-login.runtime-map.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/security/rls-assumption-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/security.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/settings.graph.json | MOVE | features/settings/settings.graph.json | feature documentation for settings; target exists and no overwrite detected | MEDIUM |
| platform/security/source-imports.graph.json | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/supabase-view-dependency-tree.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/system-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/ticket_platform_rls_001.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/TRAFFIC_P0_ARCHITECTURE_REMEDIATION_20260430-205704.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | MOVE | features/upload/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | feature documentation for upload; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-database-read-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/vcsm-dependency-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/vcsm-feature-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/vcsm-migration-risk-report.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/vcsm-module-architecture-summary.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/vcsm-reviews-api-exposure-map.md | MOVE | features/reviews/vcsm-reviews-api-exposure-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-bundle-client-server-map.md | MOVE | features/reviews/vcsm-reviews-bundle-client-server-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-database-read-map.md | MOVE | features/reviews/vcsm-reviews-database-read-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-dead-and-spaghetti-report.md | MOVE | features/reviews/vcsm-reviews-dead-and-spaghetti-report.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-feature-ownership-map.md | MOVE | features/reviews/vcsm-reviews-feature-ownership-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-governance-overlay.graph.json | MOVE | features/reviews/vcsm-reviews-governance-overlay.graph.json | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-rls-assumption-map.md | MOVE | features/reviews/vcsm-reviews-rls-assumption-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-reviews-supabase-view-tree.md | MOVE | features/reviews/vcsm-reviews-supabase-view-tree.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm-security-report.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/vcsm-system-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| platform/security/vcsm-vport-gas-prices.graph.json | MOVE | features/dashboard/modules/gas/vcsm-vport-gas-prices.graph.json | dashboard module documentation for gas; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.ads.architecture.md | MOVE | features/ads/vcsm.ads.architecture.md | feature documentation for ads; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.auth-login.architecture.md | MOVE | features/auth/vcsm.auth-login.architecture.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.auth.architecture.md | MOVE | features/auth/vcsm.auth.architecture.md | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.block.owner.md | MOVE | features/block/vcsm.block.owner.md | feature documentation for block; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.booking.architecture.md | MOVE | features/booking/vcsm.booking.architecture.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.bottom-nav.explore.architecture.md | MOVE | features/explore/vcsm.bottom-nav.explore.architecture.md | feature documentation for explore; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.bottom-nav.profile.architecture.md | MOVE | features/profiles/vcsm.bottom-nav.profile.architecture.md | feature documentation for profile; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.bottom-nav.upload.architecture.md | MOVE | features/upload/vcsm.bottom-nav.upload.architecture.md | feature documentation for upload; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.bottom-nav.vox-chat.architecture.md | MOVE | features/chat/vcsm.bottom-nav.vox-chat.architecture.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.dal.learning.md | KEEP | current | references frozen feature learning; no frozen feature routing allowed | LOW |
| platform/security/vcsm.explore.architecture.md | MOVE | features/explore/vcsm.explore.architecture.md | feature documentation for explore; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.hydration.architecture.md | MOVE | features/hydration/vcsm.hydration.architecture.md | feature documentation for hydration; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.identity.architecture.md | MOVE | features/identity/vcsm.identity.architecture.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.identity.owner.md | MOVE | features/identity/vcsm.identity.owner.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.legal.architecture.md | MOVE | features/legal/vcsm.legal.architecture.md | feature documentation for legal; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.media.owner.md | MOVE | features/media/vcsm.media.owner.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.moderation.architecture.md | MOVE | features/moderation/vcsm.moderation.architecture.md | feature documentation for moderation; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.notifications.architecture.md | MOVE | features/notifications/vcsm.notifications.architecture.md | feature documentation for notifications; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.notifications.owner.md | MOVE | features/notifications/vcsm.notifications.owner.md | feature documentation for notifications; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.portfolio-card.architecture.md | MOVE | features/portfolio/vcsm.portfolio-card.architecture.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.professional.architecture.md | MOVE | features/professional/vcsm.professional.architecture.md | feature documentation for professional; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.profiles.owner.md | MOVE | features/profiles/vcsm.profiles.owner.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.public.architecture.md | MOVE | features/public/vcsm.public.architecture.md | feature documentation for public; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.reviews.architecture.md | MOVE | features/reviews/vcsm.reviews.architecture.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.social.architecture.md | MOVE | features/social/vcsm.social.architecture.md | feature documentation for social; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.upload.architecture.md | MOVE | features/upload/vcsm.upload.architecture.md | feature documentation for upload; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.void.architecture.md | MOVE | features/void/vcsm.void.architecture.md | feature documentation for void; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-availability.architecture.md | MOVE | features/dashboard/modules/availability/vcsm.vport-availability.architecture.md | dashboard module documentation for availability; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-dashboard-leads.architecture.md | MOVE | features/dashboard/modules/leads/vcsm.vport-dashboard-leads.architecture.md | dashboard module documentation for leads; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-dashboard.architecture.md | REVIEW | features/dashboard/modules/vport/vcsm.vport-dashboard.architecture.md | candidate target folder does not exist | HIGH |
| platform/security/vcsm.vport-exchange-rate-dashboard.architecture.md | MOVE | features/dashboard/modules/exchange/vcsm.vport-exchange-rate-dashboard.architecture.md | dashboard module documentation for exchange; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-gas-prices.architecture.md | MOVE | features/dashboard/modules/gas/vcsm.vport-gas-prices.architecture.md | dashboard module documentation for gas; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-public-menu.architecture.md | MOVE | features/dashboard/modules/menu/vcsm.vport-public-menu.architecture.md | dashboard module documentation for menu; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | MOVE | features/dashboard/modules/menu/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | dashboard module documentation for menu; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-reviews-dashboard.architecture.md | MOVE | features/dashboard/modules/reviews/vcsm.vport-reviews-dashboard.architecture.md | dashboard module documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-reviews.owner.md | MOVE | features/dashboard/modules/reviews/vcsm.vport-reviews.owner.md | dashboard module documentation for reviews; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.vport-services-dashboard-card.architecture.md | MOVE | features/dashboard/modules/services/vcsm.vport-services-dashboard-card.architecture.md | dashboard module documentation for services; target exists and no overwrite detected | MEDIUM |
| platform/security/vcsm.wanderex.architecture.md | KEEP | current | references frozen feature wanderex; no frozen feature routing allowed | LOW |
| platform/security/vcsm.wanders.architecture.md | KEEP | current | references frozen feature wanders; no frozen feature routing allowed | LOW |
| platform/security/VPORT_ARCHITECTURE_FOLDER_GAP_REPORT.md | REVIEW | features/dashboard/modules/vport/VPORT_ARCHITECTURE_FOLDER_GAP_REPORT.md | candidate target folder does not exist | HIGH |
| platform/security/VPORT_FOLDER_BUILD_PLAN.md | REVIEW | features/dashboard/modules/vport/VPORT_FOLDER_BUILD_PLAN.md | candidate target folder does not exist | HIGH |
| platform/security/VPORT_TRIAD_COVERAGE_MATRIX.md | REVIEW | features/dashboard/modules/vport/VPORT_TRIAD_COVERAGE_MATRIX.md | candidate target folder does not exist | HIGH |
| PROM/ARchitect.doc | REVIEW | unknown | folder is outside known CURRENT placement contract | HIGH |
| PROM/cerebro.doc | REVIEW | unknown | folder is outside known CURRENT placement contract | HIGH |
| PROM/INVESTOR.doc | REVIEW | unknown | folder is outside known CURRENT placement contract | HIGH |
| README.md | KEEP | current | canonical CURRENT root registry | LOW |
| services/03-20.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/12-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/12-14.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/12-15.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/12-26.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/18-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/19-10.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/2026-04_month_summary.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/2026-04-06_12-00_full-platform-audit-migration-hardening.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/2026-04-10_02-30_legal-consent-theme-unification.md | MOVE | features/legal/2026-04-10_02-30_legal-consent-theme-unification.md | feature documentation for legal; target exists and no overwrite detected | MEDIUM |
| services/2026-04-12_00-00_psl-foundation-notification-engine-migration.md | MOVE | features/notifications/2026-04-12_00-00_psl-foundation-notification-engine-migration.md | feature documentation for notification; target exists and no overwrite detected | MEDIUM |
| services/27-11.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/DR_STRANGE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/findings.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/ownership.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/performance.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/README.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| services/vcsm.vport.external-site-integration.md | REVIEW | features/dashboard/modules/vport/vcsm.vport.external-site-integration.md | candidate target folder does not exist | HIGH |
| services/vcsm.vport.menu-pipeline.md | MOVE | features/dashboard/modules/menu/vcsm.vport.menu-pipeline.md | dashboard module documentation for menu; target exists and no overwrite detected | MEDIUM |
| services/vcsm.vport.tripoint-integration.md | REVIEW | features/dashboard/modules/vport/vcsm.vport.tripoint-integration.md | candidate target folder does not exist | HIGH |
| shared/.batsignal.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/01-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/01-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/02-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/03-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/03-05.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/03-06.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/03-07.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/03-08.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/03-10.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/03-12.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/04-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/05-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/05-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/05-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/05-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/05-05.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/05-06.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/05-07.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/05-08.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/05-10.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/05-12.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/05-13.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/05-17.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/06-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/09-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/09-05.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/09-06.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/09-07.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/09-08.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/09-10.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/09-11.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/09-13.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/09-14.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/09-15.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/09-16.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/09-17.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/09-23.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/10-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/10-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/10-06.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/10-09.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/11-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-05.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-06.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-07.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-08.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-10.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-13.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-16.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-17.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-18.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-19.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-20.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-21.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-23.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-24.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-25-bootstrap-dedup.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-27.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-28.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-29.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-30.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/12-31.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/13-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/13-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/13-05.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/14-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/14-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/16-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/16-05.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/16-06.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/18-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/19-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/19-05.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/19-06.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/19-07.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/19-08.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/20-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/2026-03_month_summary.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/2026-03-31_14-50_chat-engine-stabilization.md | MOVE | features/chat/2026-03-31_14-50_chat-engine-stabilization.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/2026-04-01_18-00_engine-independence-and-schema-truth.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | MOVE | features/chat/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/2026-04-09_01-58_booking-review-identity-audit.md | MOVE | features/booking/2026-04-09_01-58_booking-review-identity-audit.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| shared/2026-04-10_09-15_full-platform-cache-theme-polish.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/2026-04-13_12-30_vport-dal-schema-migration.md | REVIEW | features/dashboard/modules/vport/2026-04-13_12-30_vport-dal-schema-migration.md | candidate target folder does not exist | HIGH |
| shared/2026-05-14_db_booking-schema.md | MOVE | features/booking/2026-05-14_db_booking-schema.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| shared/2026-05-14_db_feed-rls-four-tables.md | MOVE | features/feed/2026-05-14_db_feed-rls-four-tables.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| shared/2026-05-18_11-00_db_identity-governance-review.md | MOVE | features/identity/2026-05-18_11-00_db_identity-governance-review.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| shared/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | MOVE | features/dashboard/modules/booking/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | dashboard module documentation for booking; target exists and no overwrite detected | MEDIUM |
| shared/2026-05-19_14-30_db_notifications-rls-audit.md | MOVE | features/notifications/2026-05-19_14-30_db_notifications-rls-audit.md | feature documentation for notifications; target exists and no overwrite detected | MEDIUM |
| shared/2026-05-19_16-00_db_vc-posts-insert-rls-gap.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/2026-05-23_14-00_db_reviews-schema-rls-audit.md | MOVE | features/reviews/2026-05-23_14-00_db_reviews-schema-rls-audit.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| shared/2026-06-02_wolverine_ticket-0006_vcsm-source-workflow-intake.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/2026-06-02_wolverine_ticket-0006a_normalize-classification-drift.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/24-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/26-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/26-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/26-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/26-08.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/26-09.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/27-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/27-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/27-05.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/27-06.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/27-08.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/27-10.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/27-15.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/27-16.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/BOOKING_ENGINE_AUDIT_V1.md | MOVE | features/booking/BOOKING_ENGINE_AUDIT_V1.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| shared/CHAT_ENGINE_AUDIT_V1.md | MOVE | features/chat/CHAT_ENGINE_AUDIT_V1.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/CHAT_ENGINE_AUDIT_V2.md | MOVE | features/chat/CHAT_ENGINE_AUDIT_V2.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/CHAT_ENGINE_AUDIT_V3.md | MOVE | features/chat/CHAT_ENGINE_AUDIT_V3.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/CLEAN_DOCS_ARCHITECTURE_PLAN.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | MOVE | features/dashboard/modules/reviews/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | dashboard module documentation for reviews; target exists and no overwrite detected | MEDIUM |
| shared/DR_STRANGE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/engines.booking.contract.md | MOVE | features/booking/engines.booking.contract.md | feature documentation for booking; target exists and no overwrite detected | MEDIUM |
| shared/engines.chat.capability.md | MOVE | features/chat/engines.chat.capability.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/engines.chat.contract.md | MOVE | features/chat/engines.chat.contract.md | feature documentation for chat; target exists and no overwrite detected | MEDIUM |
| shared/engines.drift.vcsm-wentrex-pipeline-analysis.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/engines.identity.boundary-audit.md | MOVE | features/identity/engines.identity.boundary-audit.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| shared/engines.identity.boundary.md | MOVE | features/identity/engines.identity.boundary.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| shared/engines.identity.contract.md | MOVE | features/identity/engines.identity.contract.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| shared/engines.isolation.chat-identity-audit.md | MOVE | features/identity/engines.isolation.chat-identity-audit.md | feature documentation for identity; target exists and no overwrite detected | MEDIUM |
| shared/engines.media.system-architecture.md | MOVE | features/media/engines.media.system-architecture.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| shared/engines.notifications.engine-architecture.md | MOVE | features/notifications/engines.notifications.engine-architecture.md | feature documentation for notifications; target exists and no overwrite detected | MEDIUM |
| shared/engines.portfolio.contract.md | MOVE | features/portfolio/engines.portfolio.contract.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| shared/engines.portfolio.system-architecture.md | MOVE | features/portfolio/engines.portfolio.system-architecture.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| shared/engines.reviews.contract.md | MOVE | features/reviews/engines.reviews.contract.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| shared/engines.vcsm.architecture-inspection.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/FEATURE_DOCUMENTATION_INVENTORY.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/MEDIA_ENGINE_AUDIT_V1.md | MOVE | features/media/MEDIA_ENGINE_AUDIT_V1.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| shared/NOTIFICATIONS_ENGINE_AUDIT_V1.md | MOVE | features/notifications/NOTIFICATIONS_ENGINE_AUDIT_V1.md | feature documentation for notifications; target exists and no overwrite detected | MEDIUM |
| shared/p2_batch4_manifest_20260430.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/p2_batch7_manifest_20260430.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/PORTFOLIO_ENGINE_AUDIT_V1.md | MOVE | features/portfolio/PORTFOLIO_ENGINE_AUDIT_V1.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| shared/PORTFOLIO_ENGINE_AUDIT_V2.md | MOVE | features/portfolio/PORTFOLIO_ENGINE_AUDIT_V2.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| shared/ticketing.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| shared/vcsm.ui.architecture.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| skills/vcsm-contributor/SKILL.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| skills/vcsm/SKILL.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| SOURCE_WORKFLOW_INTAKE.md | KEEP | current | canonical CURRENT root registry | LOW |
| state/03-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/03-09.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/03-17.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/03-19.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/06-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/09-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/09-05.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/09-12.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/09-14.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/09-15.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/09-16.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/09-18.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/09-20.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/09-21-report.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/09-21.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/09-22.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/10-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/10-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/10-07.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/12-11.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/12-12.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/12-22.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/12-26-consents-fix.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/16-09.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/18-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/19-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/20-01.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/2026-05-18_00-00_db_feed-rls-four-tables.md | MOVE | features/feed/2026-05-18_00-00_db_feed-rls-four-tables.md | feature documentation for feed; target exists and no overwrite detected | MEDIUM |
| state/2026-05-19_12-00_db_media-assets-rls-audit.md | MOVE | features/media/2026-05-19_12-00_db_media-assets-rls-audit.md | feature documentation for media; target exists and no overwrite detected | MEDIUM |
| state/2026-05-22_db_profiles-rls-coverage-audit.md | MOVE | features/profiles/2026-05-22_db_profiles-rls-coverage-audit.md | feature documentation for profiles; target exists and no overwrite detected | MEDIUM |
| state/2026-05-23_10-00_db_live-migration-gap-audit.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/2026-05-23_19-00_db_portfolio-trigger-functions.md | MOVE | features/portfolio/2026-05-23_19-00_db_portfolio-trigger-functions.md | feature documentation for portfolio; target exists and no overwrite detected | MEDIUM |
| state/2026-05-26_18-00_db_migration-reconciliation.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | MOVE | features/dashboard/modules/settings/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | dashboard module documentation for settings; target exists and no overwrite detected | MEDIUM |
| state/26-02.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/26-03.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/26-11.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/27-07.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/27-14.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/BAT-03-04.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/bottom-navigation-runtime-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/DR_STRANGE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/p2_batch5_manifest_20260430.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/p2_batch8_manifest_20260430.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/state-store-map.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/TRAZE_ANSWERS_SEO_MANIFEST_20260430-203517.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| state/vcsm-reviews-state-store-map.md | MOVE | features/reviews/vcsm-reviews-state-store-map.md | feature documentation for reviews; target exists and no overwrite detected | MEDIUM |
| styles/DR_STRANGE.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| styles/vcsm.theme.design-tokens.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |
| styles/vcsm.theme.splash-screen.md | KEEP | current | non-feature platform/shared documentation should remain where it is | LOW |

## Phase 5 - Safety Checks

Safety rules applied before recommending any MOVE: target folder must exist, target filename must not already exist, frozen features must not be routed, immutable outputs must not be moved, and root registries must stay at CURRENT root.

| File | Target Path | Target Folder Exists | Target File Already Exists | Frozen Target | Immutable Output |
| --- | --- | --- | --- | --- | --- |
| platform/documentation/2026-05-27_venom_vport-gas-tab.md | features/dashboard/modules/gas/2026-05-27_venom_vport-gas-tab.md | YES | NO | NO | NO |
| platform/documentation/2026-05-27_watcher008-dependency-review.md | features/reviews/2026-05-27_watcher008-dependency-review.md | YES | NO | NO | NO |
| platform/documentation/2026-06-02_wolverine_dashboard-ticket-0004.md | features/dashboard/2026-06-02_wolverine_dashboard-ticket-0004.md | YES | NO | NO | NO |
| platform/documentation/code-derived-app-review.md | features/reviews/code-derived-app-review.md | YES | NO | NO | NO |
| platform/documentation/home-feed.graph.json | features/feed/home-feed.graph.json | YES | NO | NO | NO |
| platform/documentation/phase3a-identity-drift-2026-05-11.md | features/identity/phase3a-identity-drift-2026-05-11.md | YES | NO | NO | NO |
| platform/documentation/phase3b-booking-vports-drift-2026-05-11.md | features/dashboard/modules/booking/phase3b-booking-vports-drift-2026-05-11.md | YES | NO | NO | NO |
| platform/documentation/phase3c-chat-engines-audit-chain-2026-05-11.md | features/chat/phase3c-chat-engines-audit-chain-2026-05-11.md | YES | NO | NO | NO |
| platform/documentation/phase3e-profiles-public-notifications-drift-2026-05-11.md | features/profiles/phase3e-profiles-public-notifications-drift-2026-05-11.md | YES | NO | NO | NO |
| platform/documentation/review.md | features/reviews/review.md | YES | NO | NO | NO |
| platform/documentation/TRAFFIC_ARCHITECTURE_REVIEW.md | features/reviews/TRAFFIC_ARCHITECTURE_REVIEW.md | YES | NO | NO | NO |
| platform/documentation/vcsm-reviews-component-tree.md | features/reviews/vcsm-reviews-component-tree.md | YES | NO | NO | NO |
| platform/documentation/vcsm-reviews-event-flow-map.md | features/reviews/vcsm-reviews-event-flow-map.md | YES | NO | NO | NO |
| platform/documentation/vcsm.chat.badge-pipeline.md | features/chat/vcsm.chat.badge-pipeline.md | YES | NO | NO | NO |
| platform/documentation/vcsm.chat.message-flow-audit.md | features/chat/vcsm.chat.message-flow-audit.md | YES | NO | NO | NO |
| platform/documentation/vcsm.dal.chat.md | features/chat/vcsm.dal.chat.md | YES | NO | NO | NO |
| platform/documentation/vcsm.dal.explore.md | features/explore/vcsm.dal.explore.md | YES | NO | NO | NO |
| platform/documentation/vcsm.dal.invite.md | features/invite/vcsm.dal.invite.md | YES | NO | NO | NO |
| platform/documentation/vcsm.explore.search-pipeline.md | features/explore/vcsm.explore.search-pipeline.md | YES | NO | NO | NO |
| platform/documentation/vcsm.feed.profiler-system.md | features/feed/vcsm.feed.profiler-system.md | YES | NO | NO | NO |
| platform/documentation/vcsm.identity.actor-switch-pipeline.md | features/identity/vcsm.identity.actor-switch-pipeline.md | YES | NO | NO | NO |
| platform/documentation/vcsm.identity.auth-pipeline.md | features/auth/vcsm.identity.auth-pipeline.md | YES | NO | NO | NO |
| platform/documentation/vcsm.identity.email-flows.md | features/identity/vcsm.identity.email-flows.md | YES | NO | NO | NO |
| platform/documentation/vcsm.identity.engine-architecture.md | features/identity/vcsm.identity.engine-architecture.md | YES | NO | NO | NO |
| platform/documentation/vcsm.performance.route-profiles.md | features/profiles/vcsm.performance.route-profiles.md | YES | NO | NO | NO |
| platform/documentation/vcsm.public.conversion-funnel.md | features/public/vcsm.public.conversion-funnel.md | YES | NO | NO | NO |
| platform/documentation/vcsm.public.seo-infrastructure.md | features/public/vcsm.public.seo-infrastructure.md | YES | NO | NO | NO |
| platform/documentation/vcsm.public.top-nav.md | features/public/vcsm.public.top-nav.md | YES | NO | NO | NO |
| platform/documentation/vcsm.runtime.profile-nav-audit.md | features/profiles/vcsm.runtime.profile-nav-audit.md | YES | NO | NO | NO |
| platform/documentation/vcsm.runtime.settings-profile-audit.md | features/profiles/vcsm.runtime.settings-profile-audit.md | YES | NO | NO | NO |
| platform/documentation/WENTREX_ARCHITECTURE_REVIEW.md | features/reviews/WENTREX_ARCHITECTURE_REVIEW.md | YES | NO | NO | NO |
| platform/native/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | features/legal/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | YES | NO | NO | NO |
| platform/native/auth.md | features/auth/auth.md | YES | NO | NO | NO |
| platform/native/booking.md | features/booking/booking.md | YES | NO | NO | NO |
| platform/native/chat-inbox-deep-audit.md | features/chat/chat-inbox-deep-audit.md | YES | NO | NO | NO |
| platform/native/chat-inbox.md | features/chat/chat-inbox.md | YES | NO | NO | NO |
| platform/native/composer-upload.md | features/upload/composer-upload.md | YES | NO | NO | NO |
| platform/native/dashboard-routes.md | features/dashboard/dashboard-routes.md | YES | NO | NO | NO |
| platform/native/explore-search.md | features/explore/explore-search.md | YES | NO | NO | NO |
| platform/native/falcon_chat_dal_parity_2026-05-14.md | features/chat/falcon_chat_dal_parity_2026-05-14.md | YES | NO | NO | NO |
| platform/native/falcon_feed-dal-parity-2026-05-14.md | features/feed/falcon_feed-dal-parity-2026-05-14.md | YES | NO | NO | NO |
| platform/native/feed.md | features/feed/feed.md | YES | NO | NO | NO |
| platform/native/identity.md | features/identity/identity.md | YES | NO | NO | NO |
| platform/native/moderation.md | features/moderation/moderation.md | YES | NO | NO | NO |
| platform/native/notifications.md | features/notifications/notifications.md | YES | NO | NO | NO |
| platform/native/post-card.md | features/post/post-card.md | YES | NO | NO | NO |
| platform/native/post-detail.md | features/post/post-detail.md | YES | NO | NO | NO |
| platform/native/public-menu.md | features/public/public-menu.md | YES | NO | NO | NO |
| platform/native/reviews.md | features/reviews/reviews.md | YES | NO | NO | NO |
| platform/native/schema-reviews.md | features/reviews/schema-reviews.md | YES | NO | NO | NO |
| platform/native/settings.md | features/settings/settings.md | YES | NO | NO | NO |
| platform/native/social-follow.md | features/social/social-follow.md | YES | NO | NO | NO |
| platform/security/12-22-settings-fix.md | features/settings/12-22-settings-fix.md | YES | NO | NO | NO |
| platform/security/2026-05-10_moderation-db-remediation-plan.md | features/moderation/2026-05-10_moderation-db-remediation-plan.md | YES | NO | NO | NO |
| platform/security/2026-05-10.block-follow-privacy-enforcement.md | features/block/2026-05-10.block-follow-privacy-enforcement.md | YES | NO | NO | NO |
| platform/security/2026-05-10.post-system-quick-wins.md | features/post/2026-05-10.post-system-quick-wins.md | YES | NO | NO | NO |
| platform/security/2026-05-11_carnage_block-friend-ranks.md | features/block/2026-05-11_carnage_block-friend-ranks.md | YES | NO | NO | NO |
| platform/security/2026-05-14_carnage_booking-rls-policies.md | features/booking/2026-05-14_carnage_booking-rls-policies.md | YES | NO | NO | NO |
| platform/security/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | features/auth/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | YES | NO | NO | NO |
| platform/security/2026-05-14_carnage_chat-inbox-attachments-migration-history.md | features/chat/2026-05-14_carnage_chat-inbox-attachments-migration-history.md | YES | NO | NO | NO |
| platform/security/2026-05-14_carnage_feed-dal-rls-verification.md | features/feed/2026-05-14_carnage_feed-dal-rls-verification.md | YES | NO | NO | NO |
| platform/security/2026-05-14_thor_booking-availability-write-release-gate.md | features/booking/2026-05-14_thor_booking-availability-write-release-gate.md | YES | NO | NO | NO |
| platform/security/2026-05-14_thor_booking-postfix-release-gate.md | features/booking/2026-05-14_thor_booking-postfix-release-gate.md | YES | NO | NO | NO |
| platform/security/2026-05-18_blackwidow_feed-dal-rls-adversarial.md | features/feed/2026-05-18_blackwidow_feed-dal-rls-adversarial.md | YES | NO | NO | NO |
| platform/security/2026-05-18_carnage_booking-rls-readiness.md | features/booking/2026-05-18_carnage_booking-rls-readiness.md | YES | NO | NO | NO |
| platform/security/2026-05-18_carnage_feed-dal-rls-delta.md | features/feed/2026-05-18_carnage_feed-dal-rls-delta.md | YES | NO | NO | NO |
| platform/security/2026-05-18_carnage_identity-rpc-migration-ownership.md | features/identity/2026-05-18_carnage_identity-rpc-migration-ownership.md | YES | NO | NO | NO |
| platform/security/2026-05-18_venom_identity-provision-rpc-security.md | features/identity/2026-05-18_venom_identity-provision-rpc-security.md | YES | NO | NO | NO |
| platform/security/2026-05-19_11-20_db_platform-identity-security-review.md | features/identity/2026-05-19_11-20_db_platform-identity-security-review.md | YES | NO | NO | NO |
| platform/security/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | features/media/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | YES | NO | NO | NO |
| platform/security/2026-05-19_13-30_thor_media-dal-release-gate.md | features/media/2026-05-19_13-30_thor_media-dal-release-gate.md | YES | NO | NO | NO |
| platform/security/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | features/media/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | YES | NO | NO | NO |
| platform/security/2026-05-23_17-30_db_portfolio-rls-policies.md | features/portfolio/2026-05-23_17-30_db_portfolio-rls-policies.md | YES | NO | NO | NO |
| platform/security/2026-05-23_carnage_reviews-schema-provenance-and-rls.md | features/reviews/2026-05-23_carnage_reviews-schema-provenance-and-rls.md | YES | NO | NO | NO |
| platform/security/2026-05-23_carnage_vport-services-rates-rls-backfill.md | features/dashboard/modules/services/2026-05-23_carnage_vport-services-rates-rls-backfill.md | YES | NO | NO | NO |
| platform/security/2026-05-23_db_profiles-session-rls-audit.md | features/profiles/2026-05-23_db_profiles-session-rls-audit.md | YES | NO | NO | NO |
| platform/security/2026-05-23_db_vport-services-migration-review.md | features/dashboard/modules/services/2026-05-23_db_vport-services-migration-review.md | YES | NO | NO | NO |
| platform/security/2026-05-23_db_vport-services-rls-security-verification.md | features/dashboard/modules/services/2026-05-23_db_vport-services-rls-security-verification.md | YES | NO | NO | NO |
| platform/security/2026-05-23_thor_profiles-cerebro-release-gate.md | features/profiles/2026-05-23_thor_profiles-cerebro-release-gate.md | YES | NO | NO | NO |
| platform/security/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | features/dashboard/modules/leads/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | YES | NO | NO | NO |
| platform/security/2026-05-24_db_vport-business-card-leads.md | features/dashboard/modules/leads/2026-05-24_db_vport-business-card-leads.md | YES | NO | NO | NO |
| platform/security/2026-05-25_09-00_db_reviews-schema-deep-audit.md | features/reviews/2026-05-25_09-00_db_reviews-schema-deep-audit.md | YES | NO | NO | NO |
| platform/security/2026-05-26_elektra_db-drift-code-chain-review.md | features/reviews/2026-05-26_elektra_db-drift-code-chain-review.md | YES | NO | NO | NO |
| platform/security/2026-05-26_venom_db-drift-rls-review.md | features/reviews/2026-05-26_venom_db-drift-rls-review.md | YES | NO | NO | NO |
| platform/security/2026-05-27_03-15_ironman_vport-leads-access-policy.md | features/dashboard/modules/leads/2026-05-27_03-15_ironman_vport-leads-access-policy.md | YES | NO | NO | NO |
| platform/security/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | features/reviews/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | YES | NO | NO | NO |
| platform/security/2026-05-27_15-30_venom_ticket-0008-code-review.md | features/reviews/2026-05-27_15-30_venom_ticket-0008-code-review.md | YES | NO | NO | NO |
| platform/security/2026-05-27_carnage_team-settings-rls-audit.md | features/settings/2026-05-27_carnage_team-settings-rls-audit.md | YES | NO | NO | NO |
| platform/security/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | features/auth/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | YES | NO | NO | NO |
| platform/security/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | features/profiles/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | YES | NO | NO | NO |
| platform/security/2026-05-27_watcher005-ci-workflow-review.md | features/reviews/2026-05-27_watcher005-ci-workflow-review.md | YES | NO | NO | NO |
| platform/security/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | features/actors/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | YES | NO | NO | NO |
| platform/security/auth-login.graph.json | features/auth/auth-login.graph.json | YES | NO | NO | NO |
| platform/security/avengers-assembly-2026-05-14-booking.md | features/booking/avengers-assembly-2026-05-14-booking.md | YES | NO | NO | NO |
| platform/security/avengers-assembly-2026-05-18-dashboard-dal.md | features/dashboard/avengers-assembly-2026-05-18-dashboard-dal.md | YES | NO | NO | NO |
| platform/security/engine.hydration.owner.md | features/hydration/engine.hydration.owner.md | YES | NO | NO | NO |
| platform/security/explore.graph.json | features/explore/explore.graph.json | YES | NO | NO | NO |
| platform/security/home-central-feed-runtime-map.md | features/feed/home-central-feed-runtime-map.md | YES | NO | NO | NO |
| platform/security/PROFILE_UPLOAD_WRITEBACK_20260430-222216.md | features/profiles/PROFILE_UPLOAD_WRITEBACK_20260430-222216.md | YES | NO | NO | NO |
| platform/security/PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md | features/profiles/PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md | YES | NO | NO | NO |
| platform/security/restoredMapvcsm.auth-login.runtime-map.md | features/auth/restoredMapvcsm.auth-login.runtime-map.md | YES | NO | NO | NO |
| platform/security/settings.graph.json | features/settings/settings.graph.json | YES | NO | NO | NO |
| platform/security/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | features/upload/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | YES | NO | NO | NO |
| platform/security/vcsm-reviews-api-exposure-map.md | features/reviews/vcsm-reviews-api-exposure-map.md | YES | NO | NO | NO |
| platform/security/vcsm-reviews-bundle-client-server-map.md | features/reviews/vcsm-reviews-bundle-client-server-map.md | YES | NO | NO | NO |
| platform/security/vcsm-reviews-database-read-map.md | features/reviews/vcsm-reviews-database-read-map.md | YES | NO | NO | NO |
| platform/security/vcsm-reviews-dead-and-spaghetti-report.md | features/reviews/vcsm-reviews-dead-and-spaghetti-report.md | YES | NO | NO | NO |
| platform/security/vcsm-reviews-feature-ownership-map.md | features/reviews/vcsm-reviews-feature-ownership-map.md | YES | NO | NO | NO |
| platform/security/vcsm-reviews-governance-overlay.graph.json | features/reviews/vcsm-reviews-governance-overlay.graph.json | YES | NO | NO | NO |
| platform/security/vcsm-reviews-rls-assumption-map.md | features/reviews/vcsm-reviews-rls-assumption-map.md | YES | NO | NO | NO |
| platform/security/vcsm-reviews-supabase-view-tree.md | features/reviews/vcsm-reviews-supabase-view-tree.md | YES | NO | NO | NO |
| platform/security/vcsm-vport-gas-prices.graph.json | features/dashboard/modules/gas/vcsm-vport-gas-prices.graph.json | YES | NO | NO | NO |
| platform/security/vcsm.ads.architecture.md | features/ads/vcsm.ads.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.auth-login.architecture.md | features/auth/vcsm.auth-login.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.auth.architecture.md | features/auth/vcsm.auth.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.block.owner.md | features/block/vcsm.block.owner.md | YES | NO | NO | NO |
| platform/security/vcsm.booking.architecture.md | features/booking/vcsm.booking.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.bottom-nav.explore.architecture.md | features/explore/vcsm.bottom-nav.explore.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.bottom-nav.profile.architecture.md | features/profiles/vcsm.bottom-nav.profile.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.bottom-nav.upload.architecture.md | features/upload/vcsm.bottom-nav.upload.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.bottom-nav.vox-chat.architecture.md | features/chat/vcsm.bottom-nav.vox-chat.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.explore.architecture.md | features/explore/vcsm.explore.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.hydration.architecture.md | features/hydration/vcsm.hydration.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.identity.architecture.md | features/identity/vcsm.identity.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.identity.owner.md | features/identity/vcsm.identity.owner.md | YES | NO | NO | NO |
| platform/security/vcsm.legal.architecture.md | features/legal/vcsm.legal.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.media.owner.md | features/media/vcsm.media.owner.md | YES | NO | NO | NO |
| platform/security/vcsm.moderation.architecture.md | features/moderation/vcsm.moderation.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.notifications.architecture.md | features/notifications/vcsm.notifications.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.notifications.owner.md | features/notifications/vcsm.notifications.owner.md | YES | NO | NO | NO |
| platform/security/vcsm.portfolio-card.architecture.md | features/portfolio/vcsm.portfolio-card.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.professional.architecture.md | features/professional/vcsm.professional.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.profiles.owner.md | features/profiles/vcsm.profiles.owner.md | YES | NO | NO | NO |
| platform/security/vcsm.public.architecture.md | features/public/vcsm.public.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.reviews.architecture.md | features/reviews/vcsm.reviews.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.social.architecture.md | features/social/vcsm.social.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.upload.architecture.md | features/upload/vcsm.upload.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.void.architecture.md | features/void/vcsm.void.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.vport-availability.architecture.md | features/dashboard/modules/availability/vcsm.vport-availability.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.vport-dashboard-leads.architecture.md | features/dashboard/modules/leads/vcsm.vport-dashboard-leads.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.vport-exchange-rate-dashboard.architecture.md | features/dashboard/modules/exchange/vcsm.vport-exchange-rate-dashboard.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.vport-gas-prices.architecture.md | features/dashboard/modules/gas/vcsm.vport-gas-prices.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.vport-public-menu.architecture.md | features/dashboard/modules/menu/vcsm.vport-public-menu.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | features/dashboard/modules/menu/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.vport-reviews-dashboard.architecture.md | features/dashboard/modules/reviews/vcsm.vport-reviews-dashboard.architecture.md | YES | NO | NO | NO |
| platform/security/vcsm.vport-reviews.owner.md | features/dashboard/modules/reviews/vcsm.vport-reviews.owner.md | YES | NO | NO | NO |
| platform/security/vcsm.vport-services-dashboard-card.architecture.md | features/dashboard/modules/services/vcsm.vport-services-dashboard-card.architecture.md | YES | NO | NO | NO |
| services/2026-04-10_02-30_legal-consent-theme-unification.md | features/legal/2026-04-10_02-30_legal-consent-theme-unification.md | YES | NO | NO | NO |
| services/2026-04-12_00-00_psl-foundation-notification-engine-migration.md | features/notifications/2026-04-12_00-00_psl-foundation-notification-engine-migration.md | YES | NO | NO | NO |
| services/vcsm.vport.menu-pipeline.md | features/dashboard/modules/menu/vcsm.vport.menu-pipeline.md | YES | NO | NO | NO |
| shared/2026-03-31_14-50_chat-engine-stabilization.md | features/chat/2026-03-31_14-50_chat-engine-stabilization.md | YES | NO | NO | NO |
| shared/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | features/chat/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | YES | NO | NO | NO |
| shared/2026-04-09_01-58_booking-review-identity-audit.md | features/booking/2026-04-09_01-58_booking-review-identity-audit.md | YES | NO | NO | NO |
| shared/2026-05-14_db_booking-schema.md | features/booking/2026-05-14_db_booking-schema.md | YES | NO | NO | NO |
| shared/2026-05-14_db_feed-rls-four-tables.md | features/feed/2026-05-14_db_feed-rls-four-tables.md | YES | NO | NO | NO |
| shared/2026-05-18_11-00_db_identity-governance-review.md | features/identity/2026-05-18_11-00_db_identity-governance-review.md | YES | NO | NO | NO |
| shared/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | features/dashboard/modules/booking/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | YES | NO | NO | NO |
| shared/2026-05-19_14-30_db_notifications-rls-audit.md | features/notifications/2026-05-19_14-30_db_notifications-rls-audit.md | YES | NO | NO | NO |
| shared/2026-05-23_14-00_db_reviews-schema-rls-audit.md | features/reviews/2026-05-23_14-00_db_reviews-schema-rls-audit.md | YES | NO | NO | NO |
| shared/BOOKING_ENGINE_AUDIT_V1.md | features/booking/BOOKING_ENGINE_AUDIT_V1.md | YES | NO | NO | NO |
| shared/CHAT_ENGINE_AUDIT_V1.md | features/chat/CHAT_ENGINE_AUDIT_V1.md | YES | NO | NO | NO |
| shared/CHAT_ENGINE_AUDIT_V2.md | features/chat/CHAT_ENGINE_AUDIT_V2.md | YES | NO | NO | NO |
| shared/CHAT_ENGINE_AUDIT_V3.md | features/chat/CHAT_ENGINE_AUDIT_V3.md | YES | NO | NO | NO |
| shared/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | features/dashboard/modules/reviews/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | YES | NO | NO | NO |
| shared/engines.booking.contract.md | features/booking/engines.booking.contract.md | YES | NO | NO | NO |
| shared/engines.chat.capability.md | features/chat/engines.chat.capability.md | YES | NO | NO | NO |
| shared/engines.chat.contract.md | features/chat/engines.chat.contract.md | YES | NO | NO | NO |
| shared/engines.identity.boundary-audit.md | features/identity/engines.identity.boundary-audit.md | YES | NO | NO | NO |
| shared/engines.identity.boundary.md | features/identity/engines.identity.boundary.md | YES | NO | NO | NO |
| shared/engines.identity.contract.md | features/identity/engines.identity.contract.md | YES | NO | NO | NO |
| shared/engines.isolation.chat-identity-audit.md | features/identity/engines.isolation.chat-identity-audit.md | YES | NO | NO | NO |
| shared/engines.media.system-architecture.md | features/media/engines.media.system-architecture.md | YES | NO | NO | NO |
| shared/engines.notifications.engine-architecture.md | features/notifications/engines.notifications.engine-architecture.md | YES | NO | NO | NO |
| shared/engines.portfolio.contract.md | features/portfolio/engines.portfolio.contract.md | YES | NO | NO | NO |
| shared/engines.portfolio.system-architecture.md | features/portfolio/engines.portfolio.system-architecture.md | YES | NO | NO | NO |
| shared/engines.reviews.contract.md | features/reviews/engines.reviews.contract.md | YES | NO | NO | NO |
| shared/MEDIA_ENGINE_AUDIT_V1.md | features/media/MEDIA_ENGINE_AUDIT_V1.md | YES | NO | NO | NO |
| shared/NOTIFICATIONS_ENGINE_AUDIT_V1.md | features/notifications/NOTIFICATIONS_ENGINE_AUDIT_V1.md | YES | NO | NO | NO |
| shared/PORTFOLIO_ENGINE_AUDIT_V1.md | features/portfolio/PORTFOLIO_ENGINE_AUDIT_V1.md | YES | NO | NO | NO |
| shared/PORTFOLIO_ENGINE_AUDIT_V2.md | features/portfolio/PORTFOLIO_ENGINE_AUDIT_V2.md | YES | NO | NO | NO |
| state/2026-05-18_00-00_db_feed-rls-four-tables.md | features/feed/2026-05-18_00-00_db_feed-rls-four-tables.md | YES | NO | NO | NO |
| state/2026-05-19_12-00_db_media-assets-rls-audit.md | features/media/2026-05-19_12-00_db_media-assets-rls-audit.md | YES | NO | NO | NO |
| state/2026-05-22_db_profiles-rls-coverage-audit.md | features/profiles/2026-05-22_db_profiles-rls-coverage-audit.md | YES | NO | NO | NO |
| state/2026-05-23_19-00_db_portfolio-trigger-functions.md | features/portfolio/2026-05-23_19-00_db_portfolio-trigger-functions.md | YES | NO | NO | NO |
| state/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | features/dashboard/modules/settings/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | YES | NO | NO | NO |
| state/vcsm-reviews-state-store-map.md | features/reviews/vcsm-reviews-state-store-map.md | YES | NO | NO | NO |

## Files Needing Review

| File | Classification | Proposed Target | Reason | Risk |
| --- | --- | --- | --- | --- |
| NEEDS_TRIAGE/CONFLICT_FROM_ACTIVE_CANONICAL___CANONICAL__logan__README.md | UNKNOWN | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-03.md__09-03.md | STALE | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-06.md__09-06.md | STALE | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-07.md__09-07.md | STALE | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-08.md__09-08.md | STALE | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__10__10-06.md__10-06.md | STALE | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__19__19-01.md__19-01.md | STALE | unknown | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/DR_STRANGE.md | UNKNOWN | unknown | triage folder requires owner confirmation before routing | HIGH |
| platform/documentation/2026-04-13_folder-alignment-report.md | PLATFORM_DOC | unknown | filename suggests duplicate/legacy/stale material | MEDIUM |
| platform/documentation/2026-05-27_architect_vport-dtab-001-duplicate-registry.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-27_architect_vport-dtab-001-duplicate-registry.md | candidate target folder does not exist | HIGH |
| platform/documentation/2026-05-27_architect_vport-dtab-006-adapter-boundary.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-27_architect_vport-dtab-006-adapter-boundary.md | candidate target folder does not exist | HIGH |
| platform/documentation/2026-05-27_venom_vport-book-tab.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-27_venom_vport-book-tab.md | candidate target folder does not exist | HIGH |
| platform/documentation/2026-05-27_venom_vport-owner-tab.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-27_venom_vport-owner-tab.md | candidate target folder does not exist | HIGH |
| platform/documentation/phase3f-vport-schema-migration-scope-2026-05-11.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/phase3f-vport-schema-migration-scope-2026-05-11.md | candidate target folder does not exist | HIGH |
| platform/documentation/TRAFFIC_FOLDER_ARCHITECTURE_AUDIT.md | PLATFORM_DOC | unknown | filename suggests duplicate/legacy/stale material | MEDIUM |
| platform/documentation/TRAFFIC_VPORT_INTEGRATION_AUDIT.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/TRAFFIC_VPORT_INTEGRATION_AUDIT.md | candidate target folder does not exist | HIGH |
| platform/documentation/traffic.vport.directory-integration.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/traffic.vport.directory-integration.md | candidate target folder does not exist | HIGH |
| platform/documentation/vcsm.vport.review-implementation-plan.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/vcsm.vport.review-implementation-plan.md | candidate target folder does not exist | HIGH |
| platform/native/dashboard-vport-deep-audit.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/dashboard-vport-deep-audit.md | candidate target folder does not exist | HIGH |
| platform/native/public-vport-profile.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/public-vport-profile.md | candidate target folder does not exist | HIGH |
| platform/native/schema-vport.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/schema-vport.md | candidate target folder does not exist | HIGH |
| platform/native/vport-types-tabs-deep-audit.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/vport-types-tabs-deep-audit.md | candidate target folder does not exist | HIGH |
| platform/security/2026-05-14_18-45_db_vport-rls-full-schema-audit.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-14_18-45_db_vport-rls-full-schema-audit.md | candidate target folder does not exist | HIGH |
| platform/security/2026-05-14_carnage_content-pages-legacy-policy-cleanup.md | PLATFORM_DOC | unknown | filename suggests duplicate/legacy/stale material | MEDIUM |
| platform/security/2026-05-27_06-40_thor_vport-book-tab-release-gate.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-27_06-40_thor_vport-book-tab-release-gate.md | candidate target folder does not exist | HIGH |
| platform/security/2026-05-27_carnage_vport-profile-public-details-rls.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-05-27_carnage_vport-profile-public-details-rls.md | candidate target folder does not exist | HIGH |
| platform/security/vcsm.vport-dashboard.architecture.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/vcsm.vport-dashboard.architecture.md | candidate target folder does not exist | HIGH |
| platform/security/VPORT_ARCHITECTURE_FOLDER_GAP_REPORT.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/VPORT_ARCHITECTURE_FOLDER_GAP_REPORT.md | candidate target folder does not exist | HIGH |
| platform/security/VPORT_FOLDER_BUILD_PLAN.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/VPORT_FOLDER_BUILD_PLAN.md | candidate target folder does not exist | HIGH |
| platform/security/VPORT_TRIAD_COVERAGE_MATRIX.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/VPORT_TRIAD_COVERAGE_MATRIX.md | candidate target folder does not exist | HIGH |
| PROM/ARchitect.doc | UNKNOWN | unknown | folder is outside known CURRENT placement contract | HIGH |
| PROM/cerebro.doc | UNKNOWN | unknown | folder is outside known CURRENT placement contract | HIGH |
| PROM/INVESTOR.doc | UNKNOWN | unknown | folder is outside known CURRENT placement contract | HIGH |
| services/vcsm.vport.external-site-integration.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/vcsm.vport.external-site-integration.md | candidate target folder does not exist | HIGH |
| services/vcsm.vport.tripoint-integration.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/vcsm.vport.tripoint-integration.md | candidate target folder does not exist | HIGH |
| shared/2026-04-13_12-30_vport-dal-schema-migration.md | DASHBOARD_MODULE_DOC_MISPLACED | features/dashboard/modules/vport/2026-04-13_12-30_vport-dal-schema-migration.md | candidate target folder does not exist | HIGH |

## Duplicate / Stale Candidates

| File | Classification | Action | Reason | Risk |
| --- | --- | --- | --- | --- |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-03.md__09-03.md | STALE | REVIEW | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-06.md__09-06.md | STALE | REVIEW | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-07.md__09-07.md | STALE | REVIEW | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-08.md__09-08.md | STALE | REVIEW | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__10__10-06.md__10-06.md | STALE | REVIEW | triage folder requires owner confirmation before routing | HIGH |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__19__19-01.md__19-01.md | STALE | REVIEW | triage folder requires owner confirmation before routing | HIGH |
| platform/documentation/2026-04-13_folder-alignment-report.md | PLATFORM_DOC | REVIEW | filename suggests duplicate/legacy/stale material | MEDIUM |
| platform/documentation/2026-05-27_architect_vport-dtab-001-duplicate-registry.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | candidate target folder does not exist | HIGH |
| platform/documentation/legacy-outcomes/_ACTIVE__tools__shield-visualizer/README.md | PLATFORM_DOC | KEEP | non-feature platform/shared documentation should remain where it is | LOW |
| platform/documentation/TRAFFIC_FOLDER_ARCHITECTURE_AUDIT.md | PLATFORM_DOC | REVIEW | filename suggests duplicate/legacy/stale material | MEDIUM |
| platform/security/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | FEATURE_DOC_MISPLACED | MOVE | feature documentation for auth; target exists and no overwrite detected | MEDIUM |
| platform/security/2026-05-14_carnage_content-pages-legacy-policy-cleanup.md | PLATFORM_DOC | REVIEW | filename suggests duplicate/legacy/stale material | MEDIUM |
| platform/security/VPORT_ARCHITECTURE_FOLDER_GAP_REPORT.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | candidate target folder does not exist | HIGH |
| platform/security/VPORT_FOLDER_BUILD_PLAN.md | DASHBOARD_MODULE_DOC_MISPLACED | REVIEW | candidate target folder does not exist | HIGH |
| shared/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | FEATURE_DOC_MISPLACED | MOVE | feature documentation for chat; target exists and no overwrite detected | MEDIUM |

## Risks

- Filename-based routing can identify likely misplaced feature documents, but final movement should confirm document content ownership before execution.
- Several root or triage files are outside the strict placement taxonomy and require human confirmation before relocation.
- Immutable command outputs must remain in place even when their contents discuss feature ownership.
- Frozen feature documents were excluded from routing by rule.

## Required Approval

No move plan may be executed until a second explicit approval prompt says: EXECUTE_MOVE_PLAN.

Final Verdict: CURRENT_ROOT_FILE_CLASSIFICATION_COMPLETE
