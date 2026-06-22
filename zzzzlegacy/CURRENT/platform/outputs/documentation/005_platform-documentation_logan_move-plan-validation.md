# CURRENT Move Plan Validation

```yaml
ticket: TICKET-CURRENT-MOVE-PLAN-VALIDATION-0002
command: logan
category: platform-documentation
status: COMPLETE
generated_at: 2026-06-02T00:00:00-07:00
input_report: 004_platform-documentation_logan_current-root-file-classification.md
mode: validation_only_no_moves
```

## Executive Summary

- Proposed moves reviewed: 186
- SAFE_MOVE: 113
- REVIEW_REQUIRED: 21
- DO_NOT_MOVE: 52
- Duplicate/stale candidates reviewed: 15
- Frozen feature validation: PASS
- No files were moved, renamed, deleted, or rewritten.

## Phase 1 - Loaded Proposed Moves

| File | Current Location | Proposed Target |
| --- | --- | --- |
| 2026-05-27_venom_vport-gas-tab.md | platform/documentation | features/dashboard/modules/gas/2026-05-27_venom_vport-gas-tab.md |
| 2026-05-27_watcher008-dependency-review.md | platform/documentation | features/reviews/2026-05-27_watcher008-dependency-review.md |
| 2026-06-02_wolverine_dashboard-ticket-0004.md | platform/documentation | features/dashboard/2026-06-02_wolverine_dashboard-ticket-0004.md |
| code-derived-app-review.md | platform/documentation | features/reviews/code-derived-app-review.md |
| home-feed.graph.json | platform/documentation | features/feed/home-feed.graph.json |
| phase3a-identity-drift-2026-05-11.md | platform/documentation | features/identity/phase3a-identity-drift-2026-05-11.md |
| phase3b-booking-vports-drift-2026-05-11.md | platform/documentation | features/dashboard/modules/booking/phase3b-booking-vports-drift-2026-05-11.md |
| phase3c-chat-engines-audit-chain-2026-05-11.md | platform/documentation | features/chat/phase3c-chat-engines-audit-chain-2026-05-11.md |
| phase3e-profiles-public-notifications-drift-2026-05-11.md | platform/documentation | features/profiles/phase3e-profiles-public-notifications-drift-2026-05-11.md |
| review.md | platform/documentation | features/reviews/review.md |
| TRAFFIC_ARCHITECTURE_REVIEW.md | platform/documentation | features/reviews/TRAFFIC_ARCHITECTURE_REVIEW.md |
| vcsm-reviews-component-tree.md | platform/documentation | features/reviews/vcsm-reviews-component-tree.md |
| vcsm-reviews-event-flow-map.md | platform/documentation | features/reviews/vcsm-reviews-event-flow-map.md |
| vcsm.chat.badge-pipeline.md | platform/documentation | features/chat/vcsm.chat.badge-pipeline.md |
| vcsm.chat.message-flow-audit.md | platform/documentation | features/chat/vcsm.chat.message-flow-audit.md |
| vcsm.dal.chat.md | platform/documentation | features/chat/vcsm.dal.chat.md |
| vcsm.dal.explore.md | platform/documentation | features/explore/vcsm.dal.explore.md |
| vcsm.dal.invite.md | platform/documentation | features/invite/vcsm.dal.invite.md |
| vcsm.explore.search-pipeline.md | platform/documentation | features/explore/vcsm.explore.search-pipeline.md |
| vcsm.feed.profiler-system.md | platform/documentation | features/feed/vcsm.feed.profiler-system.md |
| vcsm.identity.actor-switch-pipeline.md | platform/documentation | features/identity/vcsm.identity.actor-switch-pipeline.md |
| vcsm.identity.auth-pipeline.md | platform/documentation | features/auth/vcsm.identity.auth-pipeline.md |
| vcsm.identity.email-flows.md | platform/documentation | features/identity/vcsm.identity.email-flows.md |
| vcsm.identity.engine-architecture.md | platform/documentation | features/identity/vcsm.identity.engine-architecture.md |
| vcsm.performance.route-profiles.md | platform/documentation | features/profiles/vcsm.performance.route-profiles.md |
| vcsm.public.conversion-funnel.md | platform/documentation | features/public/vcsm.public.conversion-funnel.md |
| vcsm.public.seo-infrastructure.md | platform/documentation | features/public/vcsm.public.seo-infrastructure.md |
| vcsm.public.top-nav.md | platform/documentation | features/public/vcsm.public.top-nav.md |
| vcsm.runtime.profile-nav-audit.md | platform/documentation | features/profiles/vcsm.runtime.profile-nav-audit.md |
| vcsm.runtime.settings-profile-audit.md | platform/documentation | features/profiles/vcsm.runtime.settings-profile-audit.md |
| WENTREX_ARCHITECTURE_REVIEW.md | platform/documentation | features/reviews/WENTREX_ARCHITECTURE_REVIEW.md |
| 2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | platform/native | features/legal/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md |
| auth.md | platform/native | features/auth/auth.md |
| booking.md | platform/native | features/booking/booking.md |
| chat-inbox-deep-audit.md | platform/native | features/chat/chat-inbox-deep-audit.md |
| chat-inbox.md | platform/native | features/chat/chat-inbox.md |
| composer-upload.md | platform/native | features/upload/composer-upload.md |
| dashboard-routes.md | platform/native | features/dashboard/dashboard-routes.md |
| explore-search.md | platform/native | features/explore/explore-search.md |
| falcon_chat_dal_parity_2026-05-14.md | platform/native | features/chat/falcon_chat_dal_parity_2026-05-14.md |
| falcon_feed-dal-parity-2026-05-14.md | platform/native | features/feed/falcon_feed-dal-parity-2026-05-14.md |
| feed.md | platform/native | features/feed/feed.md |
| identity.md | platform/native | features/identity/identity.md |
| moderation.md | platform/native | features/moderation/moderation.md |
| notifications.md | platform/native | features/notifications/notifications.md |
| post-card.md | platform/native | features/post/post-card.md |
| post-detail.md | platform/native | features/post/post-detail.md |
| public-menu.md | platform/native | features/public/public-menu.md |
| reviews.md | platform/native | features/reviews/reviews.md |
| schema-reviews.md | platform/native | features/reviews/schema-reviews.md |
| settings.md | platform/native | features/settings/settings.md |
| social-follow.md | platform/native | features/social/social-follow.md |
| 12-22-settings-fix.md | platform/security | features/settings/12-22-settings-fix.md |
| 2026-05-10_moderation-db-remediation-plan.md | platform/security | features/moderation/2026-05-10_moderation-db-remediation-plan.md |
| 2026-05-10.block-follow-privacy-enforcement.md | platform/security | features/block/2026-05-10.block-follow-privacy-enforcement.md |
| 2026-05-10.post-system-quick-wins.md | platform/security | features/post/2026-05-10.post-system-quick-wins.md |
| 2026-05-11_carnage_block-friend-ranks.md | platform/security | features/block/2026-05-11_carnage_block-friend-ranks.md |
| 2026-05-14_carnage_booking-rls-policies.md | platform/security | features/booking/2026-05-14_carnage_booking-rls-policies.md |
| 2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | platform/security | features/auth/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md |
| 2026-05-14_carnage_chat-inbox-attachments-migration-history.md | platform/security | features/chat/2026-05-14_carnage_chat-inbox-attachments-migration-history.md |
| 2026-05-14_carnage_feed-dal-rls-verification.md | platform/security | features/feed/2026-05-14_carnage_feed-dal-rls-verification.md |
| 2026-05-14_thor_booking-availability-write-release-gate.md | platform/security | features/booking/2026-05-14_thor_booking-availability-write-release-gate.md |
| 2026-05-14_thor_booking-postfix-release-gate.md | platform/security | features/booking/2026-05-14_thor_booking-postfix-release-gate.md |
| 2026-05-18_blackwidow_feed-dal-rls-adversarial.md | platform/security | features/feed/2026-05-18_blackwidow_feed-dal-rls-adversarial.md |
| 2026-05-18_carnage_booking-rls-readiness.md | platform/security | features/booking/2026-05-18_carnage_booking-rls-readiness.md |
| 2026-05-18_carnage_feed-dal-rls-delta.md | platform/security | features/feed/2026-05-18_carnage_feed-dal-rls-delta.md |
| 2026-05-18_carnage_identity-rpc-migration-ownership.md | platform/security | features/identity/2026-05-18_carnage_identity-rpc-migration-ownership.md |
| 2026-05-18_venom_identity-provision-rpc-security.md | platform/security | features/identity/2026-05-18_venom_identity-provision-rpc-security.md |
| 2026-05-19_11-20_db_platform-identity-security-review.md | platform/security | features/identity/2026-05-19_11-20_db_platform-identity-security-review.md |
| 2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | platform/security | features/media/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md |
| 2026-05-19_13-30_thor_media-dal-release-gate.md | platform/security | features/media/2026-05-19_13-30_thor_media-dal-release-gate.md |
| 2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | platform/security | features/media/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md |
| 2026-05-23_17-30_db_portfolio-rls-policies.md | platform/security | features/portfolio/2026-05-23_17-30_db_portfolio-rls-policies.md |
| 2026-05-23_carnage_reviews-schema-provenance-and-rls.md | platform/security | features/reviews/2026-05-23_carnage_reviews-schema-provenance-and-rls.md |
| 2026-05-23_carnage_vport-services-rates-rls-backfill.md | platform/security | features/dashboard/modules/services/2026-05-23_carnage_vport-services-rates-rls-backfill.md |
| 2026-05-23_db_profiles-session-rls-audit.md | platform/security | features/profiles/2026-05-23_db_profiles-session-rls-audit.md |
| 2026-05-23_db_vport-services-migration-review.md | platform/security | features/dashboard/modules/services/2026-05-23_db_vport-services-migration-review.md |
| 2026-05-23_db_vport-services-rls-security-verification.md | platform/security | features/dashboard/modules/services/2026-05-23_db_vport-services-rls-security-verification.md |
| 2026-05-23_thor_profiles-cerebro-release-gate.md | platform/security | features/profiles/2026-05-23_thor_profiles-cerebro-release-gate.md |
| 2026-05-24_carnage_vport-business-card-leads-security-hardening.md | platform/security | features/dashboard/modules/leads/2026-05-24_carnage_vport-business-card-leads-security-hardening.md |
| 2026-05-24_db_vport-business-card-leads.md | platform/security | features/dashboard/modules/leads/2026-05-24_db_vport-business-card-leads.md |
| 2026-05-25_09-00_db_reviews-schema-deep-audit.md | platform/security | features/reviews/2026-05-25_09-00_db_reviews-schema-deep-audit.md |
| 2026-05-26_elektra_db-drift-code-chain-review.md | platform/security | features/reviews/2026-05-26_elektra_db-drift-code-chain-review.md |
| 2026-05-26_venom_db-drift-rls-review.md | platform/security | features/reviews/2026-05-26_venom_db-drift-rls-review.md |
| 2026-05-27_03-15_ironman_vport-leads-access-policy.md | platform/security | features/dashboard/modules/leads/2026-05-27_03-15_ironman_vport-leads-access-policy.md |
| 2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | platform/security | features/reviews/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md |
| 2026-05-27_15-30_venom_ticket-0008-code-review.md | platform/security | features/reviews/2026-05-27_15-30_venom_ticket-0008-code-review.md |
| 2026-05-27_carnage_team-settings-rls-audit.md | platform/security | features/settings/2026-05-27_carnage_team-settings-rls-audit.md |
| 2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | platform/security | features/auth/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md |
| 2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | platform/security | features/profiles/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md |
| 2026-05-27_watcher005-ci-workflow-review.md | platform/security | features/reviews/2026-05-27_watcher005-ci-workflow-review.md |
| 2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | platform/security | features/actors/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md |
| auth-login.graph.json | platform/security | features/auth/auth-login.graph.json |
| avengers-assembly-2026-05-14-booking.md | platform/security | features/booking/avengers-assembly-2026-05-14-booking.md |
| avengers-assembly-2026-05-18-dashboard-dal.md | platform/security | features/dashboard/avengers-assembly-2026-05-18-dashboard-dal.md |
| engine.hydration.owner.md | platform/security | features/hydration/engine.hydration.owner.md |
| explore.graph.json | platform/security | features/explore/explore.graph.json |
| home-central-feed-runtime-map.md | platform/security | features/feed/home-central-feed-runtime-map.md |
| PROFILE_UPLOAD_WRITEBACK_20260430-222216.md | platform/security | features/profiles/PROFILE_UPLOAD_WRITEBACK_20260430-222216.md |
| PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md | platform/security | features/profiles/PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md |
| restoredMapvcsm.auth-login.runtime-map.md | platform/security | features/auth/restoredMapvcsm.auth-login.runtime-map.md |
| settings.graph.json | platform/security | features/settings/settings.graph.json |
| UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | platform/security | features/upload/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md |
| vcsm-reviews-api-exposure-map.md | platform/security | features/reviews/vcsm-reviews-api-exposure-map.md |
| vcsm-reviews-bundle-client-server-map.md | platform/security | features/reviews/vcsm-reviews-bundle-client-server-map.md |
| vcsm-reviews-database-read-map.md | platform/security | features/reviews/vcsm-reviews-database-read-map.md |
| vcsm-reviews-dead-and-spaghetti-report.md | platform/security | features/reviews/vcsm-reviews-dead-and-spaghetti-report.md |
| vcsm-reviews-feature-ownership-map.md | platform/security | features/reviews/vcsm-reviews-feature-ownership-map.md |
| vcsm-reviews-governance-overlay.graph.json | platform/security | features/reviews/vcsm-reviews-governance-overlay.graph.json |
| vcsm-reviews-rls-assumption-map.md | platform/security | features/reviews/vcsm-reviews-rls-assumption-map.md |
| vcsm-reviews-supabase-view-tree.md | platform/security | features/reviews/vcsm-reviews-supabase-view-tree.md |
| vcsm-vport-gas-prices.graph.json | platform/security | features/dashboard/modules/gas/vcsm-vport-gas-prices.graph.json |
| vcsm.ads.architecture.md | platform/security | features/ads/vcsm.ads.architecture.md |
| vcsm.auth-login.architecture.md | platform/security | features/auth/vcsm.auth-login.architecture.md |
| vcsm.auth.architecture.md | platform/security | features/auth/vcsm.auth.architecture.md |
| vcsm.block.owner.md | platform/security | features/block/vcsm.block.owner.md |
| vcsm.booking.architecture.md | platform/security | features/booking/vcsm.booking.architecture.md |
| vcsm.bottom-nav.explore.architecture.md | platform/security | features/explore/vcsm.bottom-nav.explore.architecture.md |
| vcsm.bottom-nav.profile.architecture.md | platform/security | features/profiles/vcsm.bottom-nav.profile.architecture.md |
| vcsm.bottom-nav.upload.architecture.md | platform/security | features/upload/vcsm.bottom-nav.upload.architecture.md |
| vcsm.bottom-nav.vox-chat.architecture.md | platform/security | features/chat/vcsm.bottom-nav.vox-chat.architecture.md |
| vcsm.explore.architecture.md | platform/security | features/explore/vcsm.explore.architecture.md |
| vcsm.hydration.architecture.md | platform/security | features/hydration/vcsm.hydration.architecture.md |
| vcsm.identity.architecture.md | platform/security | features/identity/vcsm.identity.architecture.md |
| vcsm.identity.owner.md | platform/security | features/identity/vcsm.identity.owner.md |
| vcsm.legal.architecture.md | platform/security | features/legal/vcsm.legal.architecture.md |
| vcsm.media.owner.md | platform/security | features/media/vcsm.media.owner.md |
| vcsm.moderation.architecture.md | platform/security | features/moderation/vcsm.moderation.architecture.md |
| vcsm.notifications.architecture.md | platform/security | features/notifications/vcsm.notifications.architecture.md |
| vcsm.notifications.owner.md | platform/security | features/notifications/vcsm.notifications.owner.md |
| vcsm.portfolio-card.architecture.md | platform/security | features/portfolio/vcsm.portfolio-card.architecture.md |
| vcsm.professional.architecture.md | platform/security | features/professional/vcsm.professional.architecture.md |
| vcsm.profiles.owner.md | platform/security | features/profiles/vcsm.profiles.owner.md |
| vcsm.public.architecture.md | platform/security | features/public/vcsm.public.architecture.md |
| vcsm.reviews.architecture.md | platform/security | features/reviews/vcsm.reviews.architecture.md |
| vcsm.social.architecture.md | platform/security | features/social/vcsm.social.architecture.md |
| vcsm.upload.architecture.md | platform/security | features/upload/vcsm.upload.architecture.md |
| vcsm.void.architecture.md | platform/security | features/void/vcsm.void.architecture.md |
| vcsm.vport-availability.architecture.md | platform/security | features/dashboard/modules/availability/vcsm.vport-availability.architecture.md |
| vcsm.vport-dashboard-leads.architecture.md | platform/security | features/dashboard/modules/leads/vcsm.vport-dashboard-leads.architecture.md |
| vcsm.vport-exchange-rate-dashboard.architecture.md | platform/security | features/dashboard/modules/exchange/vcsm.vport-exchange-rate-dashboard.architecture.md |
| vcsm.vport-gas-prices.architecture.md | platform/security | features/dashboard/modules/gas/vcsm.vport-gas-prices.architecture.md |
| vcsm.vport-public-menu.architecture.md | platform/security | features/dashboard/modules/menu/vcsm.vport-public-menu.architecture.md |
| vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | platform/security | features/dashboard/modules/menu/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md |
| vcsm.vport-reviews-dashboard.architecture.md | platform/security | features/dashboard/modules/reviews/vcsm.vport-reviews-dashboard.architecture.md |
| vcsm.vport-reviews.owner.md | platform/security | features/dashboard/modules/reviews/vcsm.vport-reviews.owner.md |
| vcsm.vport-services-dashboard-card.architecture.md | platform/security | features/dashboard/modules/services/vcsm.vport-services-dashboard-card.architecture.md |
| 2026-04-10_02-30_legal-consent-theme-unification.md | services | features/legal/2026-04-10_02-30_legal-consent-theme-unification.md |
| 2026-04-12_00-00_psl-foundation-notification-engine-migration.md | services | features/notifications/2026-04-12_00-00_psl-foundation-notification-engine-migration.md |
| vcsm.vport.menu-pipeline.md | services | features/dashboard/modules/menu/vcsm.vport.menu-pipeline.md |
| 2026-03-31_14-50_chat-engine-stabilization.md | shared | features/chat/2026-03-31_14-50_chat-engine-stabilization.md |
| 2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | shared | features/chat/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md |
| 2026-04-09_01-58_booking-review-identity-audit.md | shared | features/booking/2026-04-09_01-58_booking-review-identity-audit.md |
| 2026-05-14_db_booking-schema.md | shared | features/booking/2026-05-14_db_booking-schema.md |
| 2026-05-14_db_feed-rls-four-tables.md | shared | features/feed/2026-05-14_db_feed-rls-four-tables.md |
| 2026-05-18_11-00_db_identity-governance-review.md | shared | features/identity/2026-05-18_11-00_db_identity-governance-review.md |
| 2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | shared | features/dashboard/modules/booking/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md |
| 2026-05-19_14-30_db_notifications-rls-audit.md | shared | features/notifications/2026-05-19_14-30_db_notifications-rls-audit.md |
| 2026-05-23_14-00_db_reviews-schema-rls-audit.md | shared | features/reviews/2026-05-23_14-00_db_reviews-schema-rls-audit.md |
| BOOKING_ENGINE_AUDIT_V1.md | shared | features/booking/BOOKING_ENGINE_AUDIT_V1.md |
| CHAT_ENGINE_AUDIT_V1.md | shared | features/chat/CHAT_ENGINE_AUDIT_V1.md |
| CHAT_ENGINE_AUDIT_V2.md | shared | features/chat/CHAT_ENGINE_AUDIT_V2.md |
| CHAT_ENGINE_AUDIT_V3.md | shared | features/chat/CHAT_ENGINE_AUDIT_V3.md |
| DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | shared | features/dashboard/modules/reviews/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md |
| engines.booking.contract.md | shared | features/booking/engines.booking.contract.md |
| engines.chat.capability.md | shared | features/chat/engines.chat.capability.md |
| engines.chat.contract.md | shared | features/chat/engines.chat.contract.md |
| engines.identity.boundary-audit.md | shared | features/identity/engines.identity.boundary-audit.md |
| engines.identity.boundary.md | shared | features/identity/engines.identity.boundary.md |
| engines.identity.contract.md | shared | features/identity/engines.identity.contract.md |
| engines.isolation.chat-identity-audit.md | shared | features/identity/engines.isolation.chat-identity-audit.md |
| engines.media.system-architecture.md | shared | features/media/engines.media.system-architecture.md |
| engines.notifications.engine-architecture.md | shared | features/notifications/engines.notifications.engine-architecture.md |
| engines.portfolio.contract.md | shared | features/portfolio/engines.portfolio.contract.md |
| engines.portfolio.system-architecture.md | shared | features/portfolio/engines.portfolio.system-architecture.md |
| engines.reviews.contract.md | shared | features/reviews/engines.reviews.contract.md |
| MEDIA_ENGINE_AUDIT_V1.md | shared | features/media/MEDIA_ENGINE_AUDIT_V1.md |
| NOTIFICATIONS_ENGINE_AUDIT_V1.md | shared | features/notifications/NOTIFICATIONS_ENGINE_AUDIT_V1.md |
| PORTFOLIO_ENGINE_AUDIT_V1.md | shared | features/portfolio/PORTFOLIO_ENGINE_AUDIT_V1.md |
| PORTFOLIO_ENGINE_AUDIT_V2.md | shared | features/portfolio/PORTFOLIO_ENGINE_AUDIT_V2.md |
| 2026-05-18_00-00_db_feed-rls-four-tables.md | state | features/feed/2026-05-18_00-00_db_feed-rls-four-tables.md |
| 2026-05-19_12-00_db_media-assets-rls-audit.md | state | features/media/2026-05-19_12-00_db_media-assets-rls-audit.md |
| 2026-05-22_db_profiles-rls-coverage-audit.md | state | features/profiles/2026-05-22_db_profiles-rls-coverage-audit.md |
| 2026-05-23_19-00_db_portfolio-trigger-functions.md | state | features/portfolio/2026-05-23_19-00_db_portfolio-trigger-functions.md |
| 2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | state | features/dashboard/modules/settings/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md |
| vcsm-reviews-state-store-map.md | state | features/reviews/vcsm-reviews-state-store-map.md |

## Phase 2 - Safety Validation

| File | Target Folder Exists | Target File Exists | Governance Conflict | Frozen Target | Immutable Evidence | Index/Runtime | Final Classification | Reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| platform/documentation/2026-05-27_venom_vport-gas-tab.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | unambiguous dashboard module ownership for gas |
| platform/documentation/2026-05-27_watcher008-dependency-review.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/documentation/2026-06-02_wolverine_dashboard-ticket-0004.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | dashboard root ownership needs manual confirmation |
| platform/documentation/code-derived-app-review.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/documentation/home-feed.graph.json | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/phase3a-identity-drift-2026-05-11.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/phase3b-booking-vports-drift-2026-05-11.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | unambiguous dashboard module ownership for booking |
| platform/documentation/phase3c-chat-engines-audit-chain-2026-05-11.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/phase3e-profiles-public-notifications-drift-2026-05-11.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/review.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/documentation/TRAFFIC_ARCHITECTURE_REVIEW.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/documentation/vcsm-reviews-component-tree.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm-reviews-event-flow-map.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.chat.badge-pipeline.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.chat.message-flow-audit.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.dal.chat.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.dal.explore.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.dal.invite.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.explore.search-pipeline.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.feed.profiler-system.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.identity.actor-switch-pipeline.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.identity.auth-pipeline.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.identity.email-flows.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.identity.engine-architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.performance.route-profiles.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.public.conversion-funnel.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.public.seo-infrastructure.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.public.top-nav.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.runtime.profile-nav-audit.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | feature ownership plausible but not obvious enough for automated move approval |
| platform/documentation/vcsm.runtime.settings-profile-audit.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | feature ownership plausible but not obvious enough for automated move approval |
| platform/documentation/WENTREX_ARCHITECTURE_REVIEW.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/native/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/auth.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/booking.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/chat-inbox-deep-audit.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/chat-inbox.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/composer-upload.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/dashboard-routes.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/explore-search.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/falcon_chat_dal_parity_2026-05-14.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/falcon_feed-dal-parity-2026-05-14.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/feed.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/identity.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/moderation.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/notifications.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/post-card.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/post-detail.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/public-menu.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/reviews.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/schema-reviews.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/settings.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/social-follow.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/security/12-22-settings-fix.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-10_moderation-db-remediation-plan.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-10.block-follow-privacy-enforcement.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-10.post-system-quick-wins.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-11_carnage_block-friend-ranks.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-14_carnage_booking-rls-policies.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-14_carnage_chat-inbox-attachments-migration-history.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-14_carnage_feed-dal-rls-verification.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-14_thor_booking-availability-write-release-gate.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-14_thor_booking-postfix-release-gate.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-18_blackwidow_feed-dal-rls-adversarial.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-18_carnage_booking-rls-readiness.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-18_carnage_feed-dal-rls-delta.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-18_carnage_identity-rpc-migration-ownership.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-18_venom_identity-provision-rpc-security.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-19_11-20_db_platform-identity-security-review.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-19_13-30_thor_media-dal-release-gate.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-23_17-30_db_portfolio-rls-policies.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-23_carnage_reviews-schema-provenance-and-rls.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-23_carnage_vport-services-rates-rls-backfill.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | dashboard module has competing ownership terms: rates |
| platform/security/2026-05-23_db_profiles-session-rls-audit.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-23_db_vport-services-migration-review.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | unambiguous dashboard module ownership for services |
| platform/security/2026-05-23_db_vport-services-rls-security-verification.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | unambiguous dashboard module ownership for services |
| platform/security/2026-05-23_thor_profiles-cerebro-release-gate.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | unambiguous dashboard module ownership for leads |
| platform/security/2026-05-24_db_vport-business-card-leads.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | unambiguous dashboard module ownership for leads |
| platform/security/2026-05-25_09-00_db_reviews-schema-deep-audit.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-26_elektra_db-drift-code-chain-review.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-26_venom_db-drift-rls-review.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-27_03-15_ironman_vport-leads-access-policy.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | unambiguous dashboard module ownership for leads |
| platform/security/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-27_15-30_venom_ticket-0008-code-review.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-27_carnage_team-settings-rls-audit.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-27_watcher005-ci-workflow-review.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/auth-login.graph.json | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/avengers-assembly-2026-05-14-booking.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/avengers-assembly-2026-05-18-dashboard-dal.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | dashboard root ownership needs manual confirmation |
| platform/security/engine.hydration.owner.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/explore.graph.json | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | feature ownership plausible but not obvious enough for automated move approval |
| platform/security/home-central-feed-runtime-map.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/PROFILE_UPLOAD_WRITEBACK_20260430-222216.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | feature ownership plausible but not obvious enough for automated move approval |
| platform/security/PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | feature ownership plausible but not obvious enough for automated move approval |
| platform/security/restoredMapvcsm.auth-login.runtime-map.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/settings.graph.json | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | feature ownership plausible but not obvious enough for automated move approval |
| platform/security/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-api-exposure-map.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-bundle-client-server-map.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-database-read-map.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-dead-and-spaghetti-report.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-feature-ownership-map.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-governance-overlay.graph.json | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-rls-assumption-map.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-supabase-view-tree.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-vport-gas-prices.graph.json | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | dashboard module has competing ownership terms: gas-prices |
| platform/security/vcsm.ads.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.auth-login.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.auth.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.block.owner.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.booking.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.bottom-nav.explore.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.bottom-nav.profile.architecture.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | feature ownership plausible but not obvious enough for automated move approval |
| platform/security/vcsm.bottom-nav.upload.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.bottom-nav.vox-chat.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.explore.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.hydration.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.identity.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.identity.owner.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.legal.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.media.owner.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.moderation.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.notifications.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.notifications.owner.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.portfolio-card.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.professional.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.profiles.owner.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.public.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.reviews.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.social.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.upload.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.void.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.vport-availability.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | unambiguous dashboard module ownership for availability |
| platform/security/vcsm.vport-dashboard-leads.architecture.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard |
| platform/security/vcsm.vport-exchange-rate-dashboard.architecture.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard |
| platform/security/vcsm.vport-gas-prices.architecture.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | dashboard module has competing ownership terms: gas-prices |
| platform/security/vcsm.vport-public-menu.architecture.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | unambiguous dashboard module ownership for menu |
| platform/security/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard, qrcode, restaurant |
| platform/security/vcsm.vport-reviews-dashboard.architecture.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard |
| platform/security/vcsm.vport-reviews.owner.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | dashboard module has competing ownership terms: owner |
| platform/security/vcsm.vport-services-dashboard-card.architecture.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard |
| services/2026-04-10_02-30_legal-consent-theme-unification.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| services/2026-04-12_00-00_psl-foundation-notification-engine-migration.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | feature ownership plausible but not obvious enough for automated move approval |
| services/vcsm.vport.menu-pipeline.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | unambiguous dashboard module ownership for menu |
| shared/2026-03-31_14-50_chat-engine-stabilization.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/2026-04-09_01-58_booking-review-identity-audit.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/2026-05-14_db_booking-schema.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/2026-05-14_db_feed-rls-four-tables.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/2026-05-18_11-00_db_identity-governance-review.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard |
| shared/2026-05-19_14-30_db_notifications-rls-audit.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/2026-05-23_14-00_db_reviews-schema-rls-audit.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/BOOKING_ENGINE_AUDIT_V1.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/CHAT_ENGINE_AUDIT_V1.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/CHAT_ENGINE_AUDIT_V2.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/CHAT_ENGINE_AUDIT_V3.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | unambiguous dashboard module ownership for reviews |
| shared/engines.booking.contract.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.chat.capability.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.chat.contract.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.identity.boundary-audit.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.identity.boundary.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.identity.contract.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.isolation.chat-identity-audit.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.media.system-architecture.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.notifications.engine-architecture.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.portfolio.contract.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.portfolio.system-architecture.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.reviews.contract.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/MEDIA_ENGINE_AUDIT_V1.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/NOTIFICATIONS_ENGINE_AUDIT_V1.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/PORTFOLIO_ENGINE_AUDIT_V1.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/PORTFOLIO_ENGINE_AUDIT_V2.md | YES | NO | NO | NO | NO | NO | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| state/2026-05-18_00-00_db_feed-rls-four-tables.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| state/2026-05-19_12-00_db_media-assets-rls-audit.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| state/2026-05-22_db_profiles-rls-coverage-audit.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| state/2026-05-23_19-00_db_portfolio-trigger-functions.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |
| state/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | YES | NO | NO | NO | NO | NO | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard |
| state/vcsm-reviews-state-store-map.md | YES | NO | NO | NO | NO | NO | SAFE_MOVE | ownership obvious; target valid; no overwrite or governance conflict detected |

## Phase 3 - Classification

| File | Proposed Target | Classification | Confidence | Reason |
| --- | --- | --- | --- | --- |
| platform/documentation/2026-05-27_venom_vport-gas-tab.md | features/dashboard/modules/gas/2026-05-27_venom_vport-gas-tab.md | SAFE_MOVE | HIGH | unambiguous dashboard module ownership for gas |
| platform/documentation/2026-05-27_watcher008-dependency-review.md | features/reviews/2026-05-27_watcher008-dependency-review.md | DO_NOT_MOVE | HIGH | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/documentation/2026-06-02_wolverine_dashboard-ticket-0004.md | features/dashboard/2026-06-02_wolverine_dashboard-ticket-0004.md | REVIEW_REQUIRED | MEDIUM | dashboard root ownership needs manual confirmation |
| platform/documentation/code-derived-app-review.md | features/reviews/code-derived-app-review.md | DO_NOT_MOVE | HIGH | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/documentation/home-feed.graph.json | features/feed/home-feed.graph.json | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/phase3a-identity-drift-2026-05-11.md | features/identity/phase3a-identity-drift-2026-05-11.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/phase3b-booking-vports-drift-2026-05-11.md | features/dashboard/modules/booking/phase3b-booking-vports-drift-2026-05-11.md | SAFE_MOVE | HIGH | unambiguous dashboard module ownership for booking |
| platform/documentation/phase3c-chat-engines-audit-chain-2026-05-11.md | features/chat/phase3c-chat-engines-audit-chain-2026-05-11.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/phase3e-profiles-public-notifications-drift-2026-05-11.md | features/profiles/phase3e-profiles-public-notifications-drift-2026-05-11.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/review.md | features/reviews/review.md | DO_NOT_MOVE | HIGH | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/documentation/TRAFFIC_ARCHITECTURE_REVIEW.md | features/reviews/TRAFFIC_ARCHITECTURE_REVIEW.md | DO_NOT_MOVE | HIGH | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/documentation/vcsm-reviews-component-tree.md | features/reviews/vcsm-reviews-component-tree.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm-reviews-event-flow-map.md | features/reviews/vcsm-reviews-event-flow-map.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.chat.badge-pipeline.md | features/chat/vcsm.chat.badge-pipeline.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.chat.message-flow-audit.md | features/chat/vcsm.chat.message-flow-audit.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.dal.chat.md | features/chat/vcsm.dal.chat.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.dal.explore.md | features/explore/vcsm.dal.explore.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.dal.invite.md | features/invite/vcsm.dal.invite.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.explore.search-pipeline.md | features/explore/vcsm.explore.search-pipeline.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.feed.profiler-system.md | features/feed/vcsm.feed.profiler-system.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.identity.actor-switch-pipeline.md | features/identity/vcsm.identity.actor-switch-pipeline.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.identity.auth-pipeline.md | features/auth/vcsm.identity.auth-pipeline.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.identity.email-flows.md | features/identity/vcsm.identity.email-flows.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.identity.engine-architecture.md | features/identity/vcsm.identity.engine-architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.performance.route-profiles.md | features/profiles/vcsm.performance.route-profiles.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.public.conversion-funnel.md | features/public/vcsm.public.conversion-funnel.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.public.seo-infrastructure.md | features/public/vcsm.public.seo-infrastructure.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.public.top-nav.md | features/public/vcsm.public.top-nav.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/documentation/vcsm.runtime.profile-nav-audit.md | features/profiles/vcsm.runtime.profile-nav-audit.md | REVIEW_REQUIRED | MEDIUM | feature ownership plausible but not obvious enough for automated move approval |
| platform/documentation/vcsm.runtime.settings-profile-audit.md | features/profiles/vcsm.runtime.settings-profile-audit.md | REVIEW_REQUIRED | MEDIUM | feature ownership plausible but not obvious enough for automated move approval |
| platform/documentation/WENTREX_ARCHITECTURE_REVIEW.md | features/reviews/WENTREX_ARCHITECTURE_REVIEW.md | DO_NOT_MOVE | HIGH | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/native/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | features/legal/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/auth.md | features/auth/auth.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/booking.md | features/booking/booking.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/chat-inbox-deep-audit.md | features/chat/chat-inbox-deep-audit.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/chat-inbox.md | features/chat/chat-inbox.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/composer-upload.md | features/upload/composer-upload.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/dashboard-routes.md | features/dashboard/dashboard-routes.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/explore-search.md | features/explore/explore-search.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/falcon_chat_dal_parity_2026-05-14.md | features/chat/falcon_chat_dal_parity_2026-05-14.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/falcon_feed-dal-parity-2026-05-14.md | features/feed/falcon_feed-dal-parity-2026-05-14.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/feed.md | features/feed/feed.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/identity.md | features/identity/identity.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/moderation.md | features/moderation/moderation.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/notifications.md | features/notifications/notifications.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/post-card.md | features/post/post-card.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/post-detail.md | features/post/post-detail.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/public-menu.md | features/public/public-menu.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/reviews.md | features/reviews/reviews.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/schema-reviews.md | features/reviews/schema-reviews.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/settings.md | features/settings/settings.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/social-follow.md | features/social/social-follow.md | DO_NOT_MOVE | HIGH | platform/native is a registered platform-native category; feature move would erase native context |
| platform/security/12-22-settings-fix.md | features/settings/12-22-settings-fix.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-10_moderation-db-remediation-plan.md | features/moderation/2026-05-10_moderation-db-remediation-plan.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-10.block-follow-privacy-enforcement.md | features/block/2026-05-10.block-follow-privacy-enforcement.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-10.post-system-quick-wins.md | features/post/2026-05-10.post-system-quick-wins.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-11_carnage_block-friend-ranks.md | features/block/2026-05-11_carnage_block-friend-ranks.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-14_carnage_booking-rls-policies.md | features/booking/2026-05-14_carnage_booking-rls-policies.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | features/auth/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-14_carnage_chat-inbox-attachments-migration-history.md | features/chat/2026-05-14_carnage_chat-inbox-attachments-migration-history.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-14_carnage_feed-dal-rls-verification.md | features/feed/2026-05-14_carnage_feed-dal-rls-verification.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-14_thor_booking-availability-write-release-gate.md | features/booking/2026-05-14_thor_booking-availability-write-release-gate.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-14_thor_booking-postfix-release-gate.md | features/booking/2026-05-14_thor_booking-postfix-release-gate.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-18_blackwidow_feed-dal-rls-adversarial.md | features/feed/2026-05-18_blackwidow_feed-dal-rls-adversarial.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-18_carnage_booking-rls-readiness.md | features/booking/2026-05-18_carnage_booking-rls-readiness.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-18_carnage_feed-dal-rls-delta.md | features/feed/2026-05-18_carnage_feed-dal-rls-delta.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-18_carnage_identity-rpc-migration-ownership.md | features/identity/2026-05-18_carnage_identity-rpc-migration-ownership.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-18_venom_identity-provision-rpc-security.md | features/identity/2026-05-18_venom_identity-provision-rpc-security.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-19_11-20_db_platform-identity-security-review.md | features/identity/2026-05-19_11-20_db_platform-identity-security-review.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | features/media/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-19_13-30_thor_media-dal-release-gate.md | features/media/2026-05-19_13-30_thor_media-dal-release-gate.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | features/media/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-23_17-30_db_portfolio-rls-policies.md | features/portfolio/2026-05-23_17-30_db_portfolio-rls-policies.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-23_carnage_reviews-schema-provenance-and-rls.md | features/reviews/2026-05-23_carnage_reviews-schema-provenance-and-rls.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-23_carnage_vport-services-rates-rls-backfill.md | features/dashboard/modules/services/2026-05-23_carnage_vport-services-rates-rls-backfill.md | REVIEW_REQUIRED | MEDIUM | dashboard module has competing ownership terms: rates |
| platform/security/2026-05-23_db_profiles-session-rls-audit.md | features/profiles/2026-05-23_db_profiles-session-rls-audit.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-23_db_vport-services-migration-review.md | features/dashboard/modules/services/2026-05-23_db_vport-services-migration-review.md | SAFE_MOVE | HIGH | unambiguous dashboard module ownership for services |
| platform/security/2026-05-23_db_vport-services-rls-security-verification.md | features/dashboard/modules/services/2026-05-23_db_vport-services-rls-security-verification.md | SAFE_MOVE | HIGH | unambiguous dashboard module ownership for services |
| platform/security/2026-05-23_thor_profiles-cerebro-release-gate.md | features/profiles/2026-05-23_thor_profiles-cerebro-release-gate.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | features/dashboard/modules/leads/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | SAFE_MOVE | HIGH | unambiguous dashboard module ownership for leads |
| platform/security/2026-05-24_db_vport-business-card-leads.md | features/dashboard/modules/leads/2026-05-24_db_vport-business-card-leads.md | SAFE_MOVE | HIGH | unambiguous dashboard module ownership for leads |
| platform/security/2026-05-25_09-00_db_reviews-schema-deep-audit.md | features/reviews/2026-05-25_09-00_db_reviews-schema-deep-audit.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-26_elektra_db-drift-code-chain-review.md | features/reviews/2026-05-26_elektra_db-drift-code-chain-review.md | DO_NOT_MOVE | HIGH | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-26_venom_db-drift-rls-review.md | features/reviews/2026-05-26_venom_db-drift-rls-review.md | DO_NOT_MOVE | HIGH | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-27_03-15_ironman_vport-leads-access-policy.md | features/dashboard/modules/leads/2026-05-27_03-15_ironman_vport-leads-access-policy.md | SAFE_MOVE | HIGH | unambiguous dashboard module ownership for leads |
| platform/security/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | features/reviews/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | DO_NOT_MOVE | HIGH | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-27_15-30_venom_ticket-0008-code-review.md | features/reviews/2026-05-27_15-30_venom_ticket-0008-code-review.md | DO_NOT_MOVE | HIGH | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-27_carnage_team-settings-rls-audit.md | features/settings/2026-05-27_carnage_team-settings-rls-audit.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | features/auth/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | features/profiles/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/2026-05-27_watcher005-ci-workflow-review.md | features/reviews/2026-05-27_watcher005-ci-workflow-review.md | DO_NOT_MOVE | HIGH | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | features/actors/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/auth-login.graph.json | features/auth/auth-login.graph.json | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/avengers-assembly-2026-05-14-booking.md | features/booking/avengers-assembly-2026-05-14-booking.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/avengers-assembly-2026-05-18-dashboard-dal.md | features/dashboard/avengers-assembly-2026-05-18-dashboard-dal.md | REVIEW_REQUIRED | MEDIUM | dashboard root ownership needs manual confirmation |
| platform/security/engine.hydration.owner.md | features/hydration/engine.hydration.owner.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/explore.graph.json | features/explore/explore.graph.json | REVIEW_REQUIRED | MEDIUM | feature ownership plausible but not obvious enough for automated move approval |
| platform/security/home-central-feed-runtime-map.md | features/feed/home-central-feed-runtime-map.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/PROFILE_UPLOAD_WRITEBACK_20260430-222216.md | features/profiles/PROFILE_UPLOAD_WRITEBACK_20260430-222216.md | REVIEW_REQUIRED | MEDIUM | feature ownership plausible but not obvious enough for automated move approval |
| platform/security/PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md | features/profiles/PROFILE_UPLOAD_WRITEBACK_ALIGN_20260430-223635.md | REVIEW_REQUIRED | MEDIUM | feature ownership plausible but not obvious enough for automated move approval |
| platform/security/restoredMapvcsm.auth-login.runtime-map.md | features/auth/restoredMapvcsm.auth-login.runtime-map.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/settings.graph.json | features/settings/settings.graph.json | REVIEW_REQUIRED | MEDIUM | feature ownership plausible but not obvious enough for automated move approval |
| platform/security/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | features/upload/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-api-exposure-map.md | features/reviews/vcsm-reviews-api-exposure-map.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-bundle-client-server-map.md | features/reviews/vcsm-reviews-bundle-client-server-map.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-database-read-map.md | features/reviews/vcsm-reviews-database-read-map.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-dead-and-spaghetti-report.md | features/reviews/vcsm-reviews-dead-and-spaghetti-report.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-feature-ownership-map.md | features/reviews/vcsm-reviews-feature-ownership-map.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-governance-overlay.graph.json | features/reviews/vcsm-reviews-governance-overlay.graph.json | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-rls-assumption-map.md | features/reviews/vcsm-reviews-rls-assumption-map.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-reviews-supabase-view-tree.md | features/reviews/vcsm-reviews-supabase-view-tree.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm-vport-gas-prices.graph.json | features/dashboard/modules/gas/vcsm-vport-gas-prices.graph.json | REVIEW_REQUIRED | MEDIUM | dashboard module has competing ownership terms: gas-prices |
| platform/security/vcsm.ads.architecture.md | features/ads/vcsm.ads.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.auth-login.architecture.md | features/auth/vcsm.auth-login.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.auth.architecture.md | features/auth/vcsm.auth.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.block.owner.md | features/block/vcsm.block.owner.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.booking.architecture.md | features/booking/vcsm.booking.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.bottom-nav.explore.architecture.md | features/explore/vcsm.bottom-nav.explore.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.bottom-nav.profile.architecture.md | features/profiles/vcsm.bottom-nav.profile.architecture.md | REVIEW_REQUIRED | MEDIUM | feature ownership plausible but not obvious enough for automated move approval |
| platform/security/vcsm.bottom-nav.upload.architecture.md | features/upload/vcsm.bottom-nav.upload.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.bottom-nav.vox-chat.architecture.md | features/chat/vcsm.bottom-nav.vox-chat.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.explore.architecture.md | features/explore/vcsm.explore.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.hydration.architecture.md | features/hydration/vcsm.hydration.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.identity.architecture.md | features/identity/vcsm.identity.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.identity.owner.md | features/identity/vcsm.identity.owner.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.legal.architecture.md | features/legal/vcsm.legal.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.media.owner.md | features/media/vcsm.media.owner.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.moderation.architecture.md | features/moderation/vcsm.moderation.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.notifications.architecture.md | features/notifications/vcsm.notifications.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.notifications.owner.md | features/notifications/vcsm.notifications.owner.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.portfolio-card.architecture.md | features/portfolio/vcsm.portfolio-card.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.professional.architecture.md | features/professional/vcsm.professional.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.profiles.owner.md | features/profiles/vcsm.profiles.owner.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.public.architecture.md | features/public/vcsm.public.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.reviews.architecture.md | features/reviews/vcsm.reviews.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.social.architecture.md | features/social/vcsm.social.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.upload.architecture.md | features/upload/vcsm.upload.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.void.architecture.md | features/void/vcsm.void.architecture.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| platform/security/vcsm.vport-availability.architecture.md | features/dashboard/modules/availability/vcsm.vport-availability.architecture.md | SAFE_MOVE | HIGH | unambiguous dashboard module ownership for availability |
| platform/security/vcsm.vport-dashboard-leads.architecture.md | features/dashboard/modules/leads/vcsm.vport-dashboard-leads.architecture.md | REVIEW_REQUIRED | MEDIUM | dashboard module has competing ownership terms: dashboard |
| platform/security/vcsm.vport-exchange-rate-dashboard.architecture.md | features/dashboard/modules/exchange/vcsm.vport-exchange-rate-dashboard.architecture.md | REVIEW_REQUIRED | MEDIUM | dashboard module has competing ownership terms: dashboard |
| platform/security/vcsm.vport-gas-prices.architecture.md | features/dashboard/modules/gas/vcsm.vport-gas-prices.architecture.md | REVIEW_REQUIRED | MEDIUM | dashboard module has competing ownership terms: gas-prices |
| platform/security/vcsm.vport-public-menu.architecture.md | features/dashboard/modules/menu/vcsm.vport-public-menu.architecture.md | SAFE_MOVE | HIGH | unambiguous dashboard module ownership for menu |
| platform/security/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | features/dashboard/modules/menu/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | REVIEW_REQUIRED | MEDIUM | dashboard module has competing ownership terms: dashboard, qrcode, restaurant |
| platform/security/vcsm.vport-reviews-dashboard.architecture.md | features/dashboard/modules/reviews/vcsm.vport-reviews-dashboard.architecture.md | REVIEW_REQUIRED | MEDIUM | dashboard module has competing ownership terms: dashboard |
| platform/security/vcsm.vport-reviews.owner.md | features/dashboard/modules/reviews/vcsm.vport-reviews.owner.md | REVIEW_REQUIRED | MEDIUM | dashboard module has competing ownership terms: owner |
| platform/security/vcsm.vport-services-dashboard-card.architecture.md | features/dashboard/modules/services/vcsm.vport-services-dashboard-card.architecture.md | REVIEW_REQUIRED | MEDIUM | dashboard module has competing ownership terms: dashboard |
| services/2026-04-10_02-30_legal-consent-theme-unification.md | features/legal/2026-04-10_02-30_legal-consent-theme-unification.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| services/2026-04-12_00-00_psl-foundation-notification-engine-migration.md | features/notifications/2026-04-12_00-00_psl-foundation-notification-engine-migration.md | REVIEW_REQUIRED | MEDIUM | feature ownership plausible but not obvious enough for automated move approval |
| services/vcsm.vport.menu-pipeline.md | features/dashboard/modules/menu/vcsm.vport.menu-pipeline.md | SAFE_MOVE | HIGH | unambiguous dashboard module ownership for menu |
| shared/2026-03-31_14-50_chat-engine-stabilization.md | features/chat/2026-03-31_14-50_chat-engine-stabilization.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | features/chat/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/2026-04-09_01-58_booking-review-identity-audit.md | features/booking/2026-04-09_01-58_booking-review-identity-audit.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/2026-05-14_db_booking-schema.md | features/booking/2026-05-14_db_booking-schema.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/2026-05-14_db_feed-rls-four-tables.md | features/feed/2026-05-14_db_feed-rls-four-tables.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/2026-05-18_11-00_db_identity-governance-review.md | features/identity/2026-05-18_11-00_db_identity-governance-review.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | features/dashboard/modules/booking/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | REVIEW_REQUIRED | MEDIUM | dashboard module has competing ownership terms: dashboard |
| shared/2026-05-19_14-30_db_notifications-rls-audit.md | features/notifications/2026-05-19_14-30_db_notifications-rls-audit.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/2026-05-23_14-00_db_reviews-schema-rls-audit.md | features/reviews/2026-05-23_14-00_db_reviews-schema-rls-audit.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| shared/BOOKING_ENGINE_AUDIT_V1.md | features/booking/BOOKING_ENGINE_AUDIT_V1.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/CHAT_ENGINE_AUDIT_V1.md | features/chat/CHAT_ENGINE_AUDIT_V1.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/CHAT_ENGINE_AUDIT_V2.md | features/chat/CHAT_ENGINE_AUDIT_V2.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/CHAT_ENGINE_AUDIT_V3.md | features/chat/CHAT_ENGINE_AUDIT_V3.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | features/dashboard/modules/reviews/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | SAFE_MOVE | HIGH | unambiguous dashboard module ownership for reviews |
| shared/engines.booking.contract.md | features/booking/engines.booking.contract.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.chat.capability.md | features/chat/engines.chat.capability.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.chat.contract.md | features/chat/engines.chat.contract.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.identity.boundary-audit.md | features/identity/engines.identity.boundary-audit.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.identity.boundary.md | features/identity/engines.identity.boundary.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.identity.contract.md | features/identity/engines.identity.contract.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.isolation.chat-identity-audit.md | features/identity/engines.isolation.chat-identity-audit.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.media.system-architecture.md | features/media/engines.media.system-architecture.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.notifications.engine-architecture.md | features/notifications/engines.notifications.engine-architecture.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.portfolio.contract.md | features/portfolio/engines.portfolio.contract.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.portfolio.system-architecture.md | features/portfolio/engines.portfolio.system-architecture.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.reviews.contract.md | features/reviews/engines.reviews.contract.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/MEDIA_ENGINE_AUDIT_V1.md | features/media/MEDIA_ENGINE_AUDIT_V1.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/NOTIFICATIONS_ENGINE_AUDIT_V1.md | features/notifications/NOTIFICATIONS_ENGINE_AUDIT_V1.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/PORTFOLIO_ENGINE_AUDIT_V1.md | features/portfolio/PORTFOLIO_ENGINE_AUDIT_V1.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/PORTFOLIO_ENGINE_AUDIT_V2.md | features/portfolio/PORTFOLIO_ENGINE_AUDIT_V2.md | DO_NOT_MOVE | HIGH | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| state/2026-05-18_00-00_db_feed-rls-four-tables.md | features/feed/2026-05-18_00-00_db_feed-rls-four-tables.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| state/2026-05-19_12-00_db_media-assets-rls-audit.md | features/media/2026-05-19_12-00_db_media-assets-rls-audit.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| state/2026-05-22_db_profiles-rls-coverage-audit.md | features/profiles/2026-05-22_db_profiles-rls-coverage-audit.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| state/2026-05-23_19-00_db_portfolio-trigger-functions.md | features/portfolio/2026-05-23_19-00_db_portfolio-trigger-functions.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |
| state/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | features/dashboard/modules/settings/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | REVIEW_REQUIRED | MEDIUM | dashboard module has competing ownership terms: dashboard |
| state/vcsm-reviews-state-store-map.md | features/reviews/vcsm-reviews-state-store-map.md | SAFE_MOVE | HIGH | ownership obvious; target valid; no overwrite or governance conflict detected |

## Phase 4 - Feature Ownership Review

| File | Owner | Target |
| --- | --- | --- |
| platform/documentation/2026-05-27_venom_vport-gas-tab.md | dashboard/modules/gas | features/dashboard/modules/gas/2026-05-27_venom_vport-gas-tab.md |
| platform/documentation/home-feed.graph.json | feed | features/feed/home-feed.graph.json |
| platform/documentation/phase3a-identity-drift-2026-05-11.md | identity | features/identity/phase3a-identity-drift-2026-05-11.md |
| platform/documentation/phase3b-booking-vports-drift-2026-05-11.md | dashboard/modules/booking | features/dashboard/modules/booking/phase3b-booking-vports-drift-2026-05-11.md |
| platform/documentation/phase3c-chat-engines-audit-chain-2026-05-11.md | chat | features/chat/phase3c-chat-engines-audit-chain-2026-05-11.md |
| platform/documentation/phase3e-profiles-public-notifications-drift-2026-05-11.md | profiles | features/profiles/phase3e-profiles-public-notifications-drift-2026-05-11.md |
| platform/documentation/vcsm-reviews-component-tree.md | reviews | features/reviews/vcsm-reviews-component-tree.md |
| platform/documentation/vcsm-reviews-event-flow-map.md | reviews | features/reviews/vcsm-reviews-event-flow-map.md |
| platform/documentation/vcsm.chat.badge-pipeline.md | chat | features/chat/vcsm.chat.badge-pipeline.md |
| platform/documentation/vcsm.chat.message-flow-audit.md | chat | features/chat/vcsm.chat.message-flow-audit.md |
| platform/documentation/vcsm.dal.chat.md | chat | features/chat/vcsm.dal.chat.md |
| platform/documentation/vcsm.dal.explore.md | explore | features/explore/vcsm.dal.explore.md |
| platform/documentation/vcsm.dal.invite.md | invite | features/invite/vcsm.dal.invite.md |
| platform/documentation/vcsm.explore.search-pipeline.md | explore | features/explore/vcsm.explore.search-pipeline.md |
| platform/documentation/vcsm.feed.profiler-system.md | feed | features/feed/vcsm.feed.profiler-system.md |
| platform/documentation/vcsm.identity.actor-switch-pipeline.md | identity | features/identity/vcsm.identity.actor-switch-pipeline.md |
| platform/documentation/vcsm.identity.auth-pipeline.md | auth | features/auth/vcsm.identity.auth-pipeline.md |
| platform/documentation/vcsm.identity.email-flows.md | identity | features/identity/vcsm.identity.email-flows.md |
| platform/documentation/vcsm.identity.engine-architecture.md | identity | features/identity/vcsm.identity.engine-architecture.md |
| platform/documentation/vcsm.performance.route-profiles.md | profiles | features/profiles/vcsm.performance.route-profiles.md |
| platform/documentation/vcsm.public.conversion-funnel.md | public | features/public/vcsm.public.conversion-funnel.md |
| platform/documentation/vcsm.public.seo-infrastructure.md | public | features/public/vcsm.public.seo-infrastructure.md |
| platform/documentation/vcsm.public.top-nav.md | public | features/public/vcsm.public.top-nav.md |
| platform/security/12-22-settings-fix.md | settings | features/settings/12-22-settings-fix.md |
| platform/security/2026-05-10_moderation-db-remediation-plan.md | moderation | features/moderation/2026-05-10_moderation-db-remediation-plan.md |
| platform/security/2026-05-10.block-follow-privacy-enforcement.md | block | features/block/2026-05-10.block-follow-privacy-enforcement.md |
| platform/security/2026-05-10.post-system-quick-wins.md | post | features/post/2026-05-10.post-system-quick-wins.md |
| platform/security/2026-05-11_carnage_block-friend-ranks.md | block | features/block/2026-05-11_carnage_block-friend-ranks.md |
| platform/security/2026-05-14_carnage_booking-rls-policies.md | booking | features/booking/2026-05-14_carnage_booking-rls-policies.md |
| platform/security/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | auth | features/auth/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md |
| platform/security/2026-05-14_carnage_chat-inbox-attachments-migration-history.md | chat | features/chat/2026-05-14_carnage_chat-inbox-attachments-migration-history.md |
| platform/security/2026-05-14_carnage_feed-dal-rls-verification.md | feed | features/feed/2026-05-14_carnage_feed-dal-rls-verification.md |
| platform/security/2026-05-14_thor_booking-availability-write-release-gate.md | booking | features/booking/2026-05-14_thor_booking-availability-write-release-gate.md |
| platform/security/2026-05-14_thor_booking-postfix-release-gate.md | booking | features/booking/2026-05-14_thor_booking-postfix-release-gate.md |
| platform/security/2026-05-18_blackwidow_feed-dal-rls-adversarial.md | feed | features/feed/2026-05-18_blackwidow_feed-dal-rls-adversarial.md |
| platform/security/2026-05-18_carnage_booking-rls-readiness.md | booking | features/booking/2026-05-18_carnage_booking-rls-readiness.md |
| platform/security/2026-05-18_carnage_feed-dal-rls-delta.md | feed | features/feed/2026-05-18_carnage_feed-dal-rls-delta.md |
| platform/security/2026-05-18_carnage_identity-rpc-migration-ownership.md | identity | features/identity/2026-05-18_carnage_identity-rpc-migration-ownership.md |
| platform/security/2026-05-18_venom_identity-provision-rpc-security.md | identity | features/identity/2026-05-18_venom_identity-provision-rpc-security.md |
| platform/security/2026-05-19_11-20_db_platform-identity-security-review.md | identity | features/identity/2026-05-19_11-20_db_platform-identity-security-review.md |
| platform/security/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md | media | features/media/2026-05-19_12-30_carnage_media-assets-rls-and-schema.md |
| platform/security/2026-05-19_13-30_thor_media-dal-release-gate.md | media | features/media/2026-05-19_13-30_thor_media-dal-release-gate.md |
| platform/security/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md | media | features/media/2026-05-19_15-00_thor_media-dal-plan-b-release-gate.md |
| platform/security/2026-05-23_17-30_db_portfolio-rls-policies.md | portfolio | features/portfolio/2026-05-23_17-30_db_portfolio-rls-policies.md |
| platform/security/2026-05-23_carnage_reviews-schema-provenance-and-rls.md | reviews | features/reviews/2026-05-23_carnage_reviews-schema-provenance-and-rls.md |
| platform/security/2026-05-23_db_profiles-session-rls-audit.md | profiles | features/profiles/2026-05-23_db_profiles-session-rls-audit.md |
| platform/security/2026-05-23_db_vport-services-migration-review.md | dashboard/modules/services | features/dashboard/modules/services/2026-05-23_db_vport-services-migration-review.md |
| platform/security/2026-05-23_db_vport-services-rls-security-verification.md | dashboard/modules/services | features/dashboard/modules/services/2026-05-23_db_vport-services-rls-security-verification.md |
| platform/security/2026-05-23_thor_profiles-cerebro-release-gate.md | profiles | features/profiles/2026-05-23_thor_profiles-cerebro-release-gate.md |
| platform/security/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | dashboard/modules/leads | features/dashboard/modules/leads/2026-05-24_carnage_vport-business-card-leads-security-hardening.md |
| platform/security/2026-05-24_db_vport-business-card-leads.md | dashboard/modules/leads | features/dashboard/modules/leads/2026-05-24_db_vport-business-card-leads.md |
| platform/security/2026-05-25_09-00_db_reviews-schema-deep-audit.md | reviews | features/reviews/2026-05-25_09-00_db_reviews-schema-deep-audit.md |
| platform/security/2026-05-27_03-15_ironman_vport-leads-access-policy.md | dashboard/modules/leads | features/dashboard/modules/leads/2026-05-27_03-15_ironman_vport-leads-access-policy.md |
| platform/security/2026-05-27_carnage_team-settings-rls-audit.md | settings | features/settings/2026-05-27_carnage_team-settings-rls-audit.md |
| platform/security/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md | auth | features/auth/2026-05-27_carnage_ticket-0006-subscribers-rpc-auth-model.md |
| platform/security/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md | profiles | features/profiles/2026-05-27_carnage_ticket-0007-drop-profiles-select-by-owner-user.md |
| platform/security/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md | actors | features/actors/2026-05-28_carnage_actor-social-settings-owner-delegation-rls.md |
| platform/security/auth-login.graph.json | auth | features/auth/auth-login.graph.json |
| platform/security/avengers-assembly-2026-05-14-booking.md | booking | features/booking/avengers-assembly-2026-05-14-booking.md |
| platform/security/engine.hydration.owner.md | hydration | features/hydration/engine.hydration.owner.md |
| platform/security/home-central-feed-runtime-map.md | feed | features/feed/home-central-feed-runtime-map.md |
| platform/security/restoredMapvcsm.auth-login.runtime-map.md | auth | features/auth/restoredMapvcsm.auth-login.runtime-map.md |
| platform/security/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md | upload | features/upload/UPLOAD_WRITEBACK_DEBUG_20260430-220835.md |
| platform/security/vcsm-reviews-api-exposure-map.md | reviews | features/reviews/vcsm-reviews-api-exposure-map.md |
| platform/security/vcsm-reviews-bundle-client-server-map.md | reviews | features/reviews/vcsm-reviews-bundle-client-server-map.md |
| platform/security/vcsm-reviews-database-read-map.md | reviews | features/reviews/vcsm-reviews-database-read-map.md |
| platform/security/vcsm-reviews-dead-and-spaghetti-report.md | reviews | features/reviews/vcsm-reviews-dead-and-spaghetti-report.md |
| platform/security/vcsm-reviews-feature-ownership-map.md | reviews | features/reviews/vcsm-reviews-feature-ownership-map.md |
| platform/security/vcsm-reviews-governance-overlay.graph.json | reviews | features/reviews/vcsm-reviews-governance-overlay.graph.json |
| platform/security/vcsm-reviews-rls-assumption-map.md | reviews | features/reviews/vcsm-reviews-rls-assumption-map.md |
| platform/security/vcsm-reviews-supabase-view-tree.md | reviews | features/reviews/vcsm-reviews-supabase-view-tree.md |
| platform/security/vcsm.ads.architecture.md | ads | features/ads/vcsm.ads.architecture.md |
| platform/security/vcsm.auth-login.architecture.md | auth | features/auth/vcsm.auth-login.architecture.md |
| platform/security/vcsm.auth.architecture.md | auth | features/auth/vcsm.auth.architecture.md |
| platform/security/vcsm.block.owner.md | block | features/block/vcsm.block.owner.md |
| platform/security/vcsm.booking.architecture.md | booking | features/booking/vcsm.booking.architecture.md |
| platform/security/vcsm.bottom-nav.explore.architecture.md | explore | features/explore/vcsm.bottom-nav.explore.architecture.md |
| platform/security/vcsm.bottom-nav.upload.architecture.md | upload | features/upload/vcsm.bottom-nav.upload.architecture.md |
| platform/security/vcsm.bottom-nav.vox-chat.architecture.md | chat | features/chat/vcsm.bottom-nav.vox-chat.architecture.md |
| platform/security/vcsm.explore.architecture.md | explore | features/explore/vcsm.explore.architecture.md |
| platform/security/vcsm.hydration.architecture.md | hydration | features/hydration/vcsm.hydration.architecture.md |
| platform/security/vcsm.identity.architecture.md | identity | features/identity/vcsm.identity.architecture.md |
| platform/security/vcsm.identity.owner.md | identity | features/identity/vcsm.identity.owner.md |
| platform/security/vcsm.legal.architecture.md | legal | features/legal/vcsm.legal.architecture.md |
| platform/security/vcsm.media.owner.md | media | features/media/vcsm.media.owner.md |
| platform/security/vcsm.moderation.architecture.md | moderation | features/moderation/vcsm.moderation.architecture.md |
| platform/security/vcsm.notifications.architecture.md | notifications | features/notifications/vcsm.notifications.architecture.md |
| platform/security/vcsm.notifications.owner.md | notifications | features/notifications/vcsm.notifications.owner.md |
| platform/security/vcsm.portfolio-card.architecture.md | portfolio | features/portfolio/vcsm.portfolio-card.architecture.md |
| platform/security/vcsm.professional.architecture.md | professional | features/professional/vcsm.professional.architecture.md |
| platform/security/vcsm.profiles.owner.md | profiles | features/profiles/vcsm.profiles.owner.md |
| platform/security/vcsm.public.architecture.md | public | features/public/vcsm.public.architecture.md |
| platform/security/vcsm.reviews.architecture.md | reviews | features/reviews/vcsm.reviews.architecture.md |
| platform/security/vcsm.social.architecture.md | social | features/social/vcsm.social.architecture.md |
| platform/security/vcsm.upload.architecture.md | upload | features/upload/vcsm.upload.architecture.md |
| platform/security/vcsm.void.architecture.md | void | features/void/vcsm.void.architecture.md |
| platform/security/vcsm.vport-availability.architecture.md | dashboard/modules/availability | features/dashboard/modules/availability/vcsm.vport-availability.architecture.md |
| platform/security/vcsm.vport-public-menu.architecture.md | dashboard/modules/menu | features/dashboard/modules/menu/vcsm.vport-public-menu.architecture.md |
| services/2026-04-10_02-30_legal-consent-theme-unification.md | legal | features/legal/2026-04-10_02-30_legal-consent-theme-unification.md |
| services/vcsm.vport.menu-pipeline.md | dashboard/modules/menu | features/dashboard/modules/menu/vcsm.vport.menu-pipeline.md |
| shared/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | chat | features/chat/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md |
| shared/2026-04-09_01-58_booking-review-identity-audit.md | booking | features/booking/2026-04-09_01-58_booking-review-identity-audit.md |
| shared/2026-05-14_db_booking-schema.md | booking | features/booking/2026-05-14_db_booking-schema.md |
| shared/2026-05-14_db_feed-rls-four-tables.md | feed | features/feed/2026-05-14_db_feed-rls-four-tables.md |
| shared/2026-05-18_11-00_db_identity-governance-review.md | identity | features/identity/2026-05-18_11-00_db_identity-governance-review.md |
| shared/2026-05-19_14-30_db_notifications-rls-audit.md | notifications | features/notifications/2026-05-19_14-30_db_notifications-rls-audit.md |
| shared/2026-05-23_14-00_db_reviews-schema-rls-audit.md | reviews | features/reviews/2026-05-23_14-00_db_reviews-schema-rls-audit.md |
| shared/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | dashboard/modules/reviews | features/dashboard/modules/reviews/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md |
| state/2026-05-18_00-00_db_feed-rls-four-tables.md | feed | features/feed/2026-05-18_00-00_db_feed-rls-four-tables.md |
| state/2026-05-19_12-00_db_media-assets-rls-audit.md | media | features/media/2026-05-19_12-00_db_media-assets-rls-audit.md |
| state/2026-05-22_db_profiles-rls-coverage-audit.md | profiles | features/profiles/2026-05-22_db_profiles-rls-coverage-audit.md |
| state/2026-05-23_19-00_db_portfolio-trigger-functions.md | portfolio | features/portfolio/2026-05-23_19-00_db_portfolio-trigger-functions.md |
| state/vcsm-reviews-state-store-map.md | reviews | features/reviews/vcsm-reviews-state-store-map.md |

## Phase 5 - Dashboard Special Review

| File | Dashboard Scope | Confidence | Classification | Reason |
| --- | --- | --- | --- | --- |
| platform/documentation/2026-05-27_venom_vport-gas-tab.md | dashboard module: gas | HIGH | SAFE_MOVE | unambiguous dashboard module ownership for gas |
| platform/documentation/2026-06-02_wolverine_dashboard-ticket-0004.md | dashboard root: dashboard | MEDIUM | REVIEW_REQUIRED | dashboard root ownership needs manual confirmation |
| platform/documentation/phase3b-booking-vports-drift-2026-05-11.md | dashboard module: booking | HIGH | SAFE_MOVE | unambiguous dashboard module ownership for booking |
| platform/native/dashboard-routes.md | dashboard root: dashboard | HIGH | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/security/2026-05-23_carnage_vport-services-rates-rls-backfill.md | dashboard module: services | MEDIUM | REVIEW_REQUIRED | dashboard module has competing ownership terms: rates |
| platform/security/2026-05-23_db_vport-services-migration-review.md | dashboard module: services | HIGH | SAFE_MOVE | unambiguous dashboard module ownership for services |
| platform/security/2026-05-23_db_vport-services-rls-security-verification.md | dashboard module: services | HIGH | SAFE_MOVE | unambiguous dashboard module ownership for services |
| platform/security/2026-05-24_carnage_vport-business-card-leads-security-hardening.md | dashboard module: leads | HIGH | SAFE_MOVE | unambiguous dashboard module ownership for leads |
| platform/security/2026-05-24_db_vport-business-card-leads.md | dashboard module: leads | HIGH | SAFE_MOVE | unambiguous dashboard module ownership for leads |
| platform/security/2026-05-27_03-15_ironman_vport-leads-access-policy.md | dashboard module: leads | HIGH | SAFE_MOVE | unambiguous dashboard module ownership for leads |
| platform/security/avengers-assembly-2026-05-18-dashboard-dal.md | dashboard root: dashboard | MEDIUM | REVIEW_REQUIRED | dashboard root ownership needs manual confirmation |
| platform/security/vcsm-vport-gas-prices.graph.json | dashboard module: gas | MEDIUM | REVIEW_REQUIRED | dashboard module has competing ownership terms: gas-prices |
| platform/security/vcsm.vport-availability.architecture.md | dashboard module: availability | HIGH | SAFE_MOVE | unambiguous dashboard module ownership for availability |
| platform/security/vcsm.vport-dashboard-leads.architecture.md | dashboard module: leads | MEDIUM | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard |
| platform/security/vcsm.vport-exchange-rate-dashboard.architecture.md | dashboard module: exchange | MEDIUM | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard |
| platform/security/vcsm.vport-gas-prices.architecture.md | dashboard module: gas | MEDIUM | REVIEW_REQUIRED | dashboard module has competing ownership terms: gas-prices |
| platform/security/vcsm.vport-public-menu.architecture.md | dashboard module: menu | HIGH | SAFE_MOVE | unambiguous dashboard module ownership for menu |
| platform/security/vcsm.vport-restaurant-dashboard-menu-qr.architecture.md | dashboard module: menu | MEDIUM | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard, qrcode, restaurant |
| platform/security/vcsm.vport-reviews-dashboard.architecture.md | dashboard module: reviews | MEDIUM | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard |
| platform/security/vcsm.vport-reviews.owner.md | dashboard module: reviews | MEDIUM | REVIEW_REQUIRED | dashboard module has competing ownership terms: owner |
| platform/security/vcsm.vport-services-dashboard-card.architecture.md | dashboard module: services | MEDIUM | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard |
| services/vcsm.vport.menu-pipeline.md | dashboard module: menu | HIGH | SAFE_MOVE | unambiguous dashboard module ownership for menu |
| shared/2026-05-18_cerebro-dashboard-dal-booking-governance-closure.md | dashboard module: booking | MEDIUM | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard |
| shared/DELETE_DEAD_VPORT_REVIEWS_DAL_20260430-222005.md | dashboard module: reviews | HIGH | SAFE_MOVE | unambiguous dashboard module ownership for reviews |
| state/2026-06-02_wolverine_ticket-0009_dashboard-settings-security-backfill.md | dashboard module: settings | MEDIUM | REVIEW_REQUIRED | dashboard module has competing ownership terms: dashboard |

## Phase 6 - Duplicate / Stale Review

| File | Classification | Canonical File |
| --- | --- | --- |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-03.md__09-03.md | STALE | unknown |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-06.md__09-06.md | STALE | unknown |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-07.md__09-07.md | STALE | unknown |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__09__09-08.md__09-08.md | STALE | unknown |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__10__10-06.md__10-06.md | STALE | unknown |
| NEEDS_TRIAGE/CONFLICT_FROM_LEGACY___ACTIVE__planning__may__19__19-01.md__19-01.md | STALE | unknown |
| platform/documentation/2026-04-13_folder-alignment-report.md | STALE | unknown |
| platform/documentation/2026-05-27_architect_vport-dtab-001-duplicate-registry.md | DUPLICATE | unknown |
| platform/documentation/legacy-outcomes/_ACTIVE__tools__shield-visualizer/README.md | REVIEW_REQUIRED | unknown |
| platform/documentation/TRAFFIC_FOLDER_ARCHITECTURE_AUDIT.md | REVIEW_REQUIRED | unknown |
| platform/security/2026-05-14_carnage_bookings-insert-owner-legacy-auth.md | STALE | unknown |
| platform/security/2026-05-14_carnage_content-pages-legacy-policy-cleanup.md | STALE | unknown |
| platform/security/VPORT_ARCHITECTURE_FOLDER_GAP_REPORT.md | REVIEW_REQUIRED | unknown |
| platform/security/VPORT_FOLDER_BUILD_PLAN.md | STALE | unknown |
| shared/2026-04-06_05-45_chat-audit-legacy-cleanup-moderation-migration.md | STALE | unknown |

## Phase 7 - Frozen Feature Review

Result: PASS

| Frozen File Or Reference | Prior Classification | Prior Action | Prior Target |
| --- | --- | --- | --- |
| FEATURE_INDEX_RUNTIME/vgrid.md | RUNTIME_INDEX | KEEP | current |
| FEATURE_INDEX/vgrid.md | FEATURE_INDEX | KEEP | current |
| frozen/learning/README.md | HISTORY_FILE | KEEP | current |
| frozen/learning/STATUS.md | HISTORY_FILE | KEEP | current |
| frozen/vgrid/README.md | HISTORY_FILE | KEEP | current |
| frozen/vgrid/STATUS.md | HISTORY_FILE | KEEP | current |
| frozen/wanderex/README.md | HISTORY_FILE | KEEP | current |
| frozen/wanderex/STATUS.md | HISTORY_FILE | KEEP | current |
| frozen/wanders/README.md | HISTORY_FILE | KEEP | current |
| frozen/wanders/STATUS.md | HISTORY_FILE | KEEP | current |
| platform/native/learning.md | HISTORY_FILE | KEEP | current |
| platform/native/wanders.md | HISTORY_FILE | KEEP | current |
| platform/security/vcsm.dal.learning.md | HISTORY_FILE | KEEP | current |
| platform/security/vcsm.wanderex.architecture.md | HISTORY_FILE | KEEP | current |
| platform/security/vcsm.wanders.architecture.md | HISTORY_FILE | KEEP | current |

## Phase 8 - Move Execution Readiness

| Classification | Count |
| --- | --- |
| SAFE_MOVE | 113 |
| REVIEW_REQUIRED | 21 |
| DO_NOT_MOVE | 52 |

### Highest-Risk Move Candidates

| File | Proposed Target | Classification | Reason |
| --- | --- | --- | --- |
| platform/documentation/2026-05-27_watcher008-dependency-review.md | features/reviews/2026-05-27_watcher008-dependency-review.md | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/documentation/code-derived-app-review.md | features/reviews/code-derived-app-review.md | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/documentation/review.md | features/reviews/review.md | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/documentation/TRAFFIC_ARCHITECTURE_REVIEW.md | features/reviews/TRAFFIC_ARCHITECTURE_REVIEW.md | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/documentation/WENTREX_ARCHITECTURE_REVIEW.md | features/reviews/WENTREX_ARCHITECTURE_REVIEW.md | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/native/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | features/legal/2026-04-10_06-15_legal-theme-portfolio-mobile-polish.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/auth.md | features/auth/auth.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/booking.md | features/booking/booking.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/chat-inbox-deep-audit.md | features/chat/chat-inbox-deep-audit.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/chat-inbox.md | features/chat/chat-inbox.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/composer-upload.md | features/upload/composer-upload.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/dashboard-routes.md | features/dashboard/dashboard-routes.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/explore-search.md | features/explore/explore-search.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/falcon_chat_dal_parity_2026-05-14.md | features/chat/falcon_chat_dal_parity_2026-05-14.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/falcon_feed-dal-parity-2026-05-14.md | features/feed/falcon_feed-dal-parity-2026-05-14.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/feed.md | features/feed/feed.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/identity.md | features/identity/identity.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/moderation.md | features/moderation/moderation.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/notifications.md | features/notifications/notifications.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/post-card.md | features/post/post-card.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/post-detail.md | features/post/post-detail.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/public-menu.md | features/public/public-menu.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/reviews.md | features/reviews/reviews.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/schema-reviews.md | features/reviews/schema-reviews.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/settings.md | features/settings/settings.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/native/social-follow.md | features/social/social-follow.md | DO_NOT_MOVE | platform/native is a registered platform-native category; feature move would erase native context |
| platform/security/2026-05-26_elektra_db-drift-code-chain-review.md | features/reviews/2026-05-26_elektra_db-drift-code-chain-review.md | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-26_venom_db-drift-rls-review.md | features/reviews/2026-05-26_venom_db-drift-rls-review.md | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | features/reviews/2026-05-27_15-00_venom_ticket-0008-remaining-policy-review.md | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-27_15-30_venom_ticket-0008-code-review.md | features/reviews/2026-05-27_15-30_venom_ticket-0008-code-review.md | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| platform/security/2026-05-27_watcher005-ci-workflow-review.md | features/reviews/2026-05-27_watcher005-ci-workflow-review.md | DO_NOT_MOVE | generic command/repository review false-positive; reviews feature ownership is not established |
| shared/2026-03-31_14-50_chat-engine-stabilization.md | features/chat/2026-03-31_14-50_chat-engine-stabilization.md | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/BOOKING_ENGINE_AUDIT_V1.md | features/booking/BOOKING_ENGINE_AUDIT_V1.md | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/CHAT_ENGINE_AUDIT_V1.md | features/chat/CHAT_ENGINE_AUDIT_V1.md | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/CHAT_ENGINE_AUDIT_V2.md | features/chat/CHAT_ENGINE_AUDIT_V2.md | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/CHAT_ENGINE_AUDIT_V3.md | features/chat/CHAT_ENGINE_AUDIT_V3.md | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.booking.contract.md | features/booking/engines.booking.contract.md | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.chat.capability.md | features/chat/engines.chat.capability.md | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.chat.contract.md | features/chat/engines.chat.contract.md | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |
| shared/engines.identity.boundary-audit.md | features/identity/engines.identity.boundary-audit.md | DO_NOT_MOVE | shared engine/contract documentation should not be collapsed into a feature folder without an engine-doc migration ticket |

## Recommended Execution Strategy

1. Execute no moves from this validation report until a separate approval explicitly authorizes movement.
2. If movement is later approved, execute only SAFE_MOVE rows first and re-run the classification/index audit afterward.
3. Keep all DO_NOT_MOVE rows in place unless a future ticket changes the governing category or creates an engine/native documentation migration path.
4. Send REVIEW_REQUIRED rows through manual ownership review, with dashboard module/tab files reviewed separately from feature-root files.
5. Do not move frozen feature references, immutable outputs, root registries, FEATURE_INDEX, or FEATURE_INDEX_RUNTIME artifacts.

Final Verdict: CURRENT_MOVE_PLAN_VALIDATION_COMPLETE
