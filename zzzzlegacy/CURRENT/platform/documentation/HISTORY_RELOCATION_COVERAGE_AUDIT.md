# History Relocation Coverage Audit

**Date:** 2026-06-02
**Ticket:** TICKET-0007 — Coverage Validation Pass
**Prior artifact:** `HISTORY_RELOCATION_AUDIT.md`
**Scope:** Documentation only — no source code, engines, or app roots touched
**Boundary contract enforced:** `_CANONICAL/zcontract/PROJECT_BOUNDARY_ISOLATION_CONTRACT.md`
**Scope label:** VCSM (documentation governance only)

---

## PHASE 1 — CURRENT COVERAGE VALIDATION

### Governance System Architecture (Context)

The CURRENT governance system has two layers:

**Layer 1 — Feature Status Registry**
`CURRENT/FEATURE_STATUS.md` — canonical feature list with ACTIVE/FROZEN/PLANNED/etc. status.

**Layer 2 — Per-Module Governance Folders**
`_CANONICAL/logan/marvel/architect/VPORT/DASHBOARD/modules/*/audit-status.md`
`_CANONICAL/logan/marvel/architect/VPORT/TABS/tabs/*/audit-status.md`
These are the living governance records. Every completed audit updates the `audit-status.md` in the corresponding module folder. This IS the CURRENT state.

**DR. STRANGE compatibility rule:** DR. STRANGE reads `CURRENT/FEATURE_STATUS.md` + `CURRENT/features/[feature]/`. It does NOT read `_ACTIVE/audits/`. Moving an audit report to HISTORY is safe only if the audit outcome is already captured in a `_CANONICAL` module `audit-status.md`, or if DR. STRANGE does not need to answer questions about that feature's current security state.

---

### Coverage Table — VPORT Module Audits (CANONICAL home exists)

All the following MOVE_TO_HISTORY candidates have a living `audit-status.md` in `_CANONICAL`. The completed status from these audit reports has already been transcribed into the module governance files. Moving the source reports to HISTORY preserves the CURRENT record.

| Source Artifact | CURRENT Equivalent Exists | Path | Safe To Move | Notes |
|---|---|---|---|---|
| `audits/security/2026-05-23_15-00_venom_vport-dashboard-cards.md` | YES | `_CANONICAL/.../dashboard-cards/audit-status.md` | YES | Findings captured in audit-status |
| `audits/security/2026-05-23_17-00_venom_portfolio-card.md` | YES | `_CANONICAL/.../portfolio/audit-status.md` | YES | Status captured |
| `audits/security/2026-05-23_venom_vport-services-dashboard-card.md` | YES | `_CANONICAL/.../services/audit-status.md` | YES | Status captured |
| `audits/security/2026-05-24_venom_vport-dashboard-leads.md` | YES | `_CANONICAL/.../leads/audit-status.md` | YES | Status captured |
| `audits/security/2026-05-25_venom_vport-gas-prices.md` | YES | `_CANONICAL/.../gas/audit-status.md` | YES | VENOM COMPLETE recorded |
| `audits/security/2026-05-27_venom_vport-dashboard-team-card.md` | YES | `_CANONICAL/.../team/audit-status.md` | YES | Status captured |
| `audits/security/2026-05-27_venom_vport-dashboard-settings-card.md` | YES | `_CANONICAL/.../settings/audit-status.md` | YES | Status captured |
| `audits/security/2026-05-27_venom_sentry_vport-dashboard-calendar-card.md` | YES | `_CANONICAL/.../calendar/audit-status.md` | YES | Status captured |
| `audits/security/2026-05-27_venom_architect_vport-dashboard-schedule-card.md` | YES | `_CANONICAL/.../schedule/audit-status.md` | YES | Status captured |
| `audits/security/2026-05-27_05-42_elektra_barber-vport-patch-advisory.md` | YES | `_CANONICAL/.../barber/audit-status.md` | YES | ELEKTRA advisory captured |
| `audits/security/2026-05-27_14-30_elektra_barbershop-vport.md` | YES | `_CANONICAL/.../barbershop/audit-status.md` | YES | Status captured |
| `audits/security/2026-05-28_elektra_*.md` (9 files) | YES | Respective module `audit-status.md` files | YES | All ELEKTRA pass results captured in module audit-status files |
| `audits/security/2026-05-27_18-30_venom_content-pages.md` | YES | `_CANONICAL/.../content-pages/audit-status.md` | YES | Status captured |
| `audits/security/2026-05-27_18-30_venom_delete-lifecycle.md` | YES | `_CANONICAL/.../delete-lifecycle/audit-status.md` | YES | Status captured |
| `audits/security/2026-05-27_18-30_venom_external-site.md` | YES | `_CANONICAL/.../external-site/audit-status.md` | YES | Status captured |
| `audits/security/2026-05-27_18-30_venom_tripoint.md` | YES | `_CANONICAL/.../tripoint/audit-status.md` | YES | Status captured |
| `audits/security/2026-05-27_18-30_venom_tab-classification.md` | YES | `_CANONICAL/.../tab-classification/audit-status.md` | YES | Status captured |
| `audits/redteam/2026-05-27_*_blackwidow_*.md` (VPORT-specific) | YES | Respective module `audit-status.md` files | YES | BLACKWIDOW status captured |
| `audits/release/2026-05-27_06-40_thor_vport-book-tab-release-gate.md` | YES | `_CANONICAL/.../TABS/tabs/booking/audit-status.md` | YES | THOR RELEASE APPROVED captured |
| `audits/release/2026-05-27_thor_gas-module-deferred-gate.md` | YES | `_CANONICAL/.../gas/audit-status.md` | YES | THOR CAUTION captured |
| `audits/release/2026-05-27_thor_reviews-module-deferred-gate.md` | YES | `_CANONICAL/.../reviews/audit-status.md` | YES | Deferred status captured |
| `audits/performance/2026-05-27_06-30_kraven_vport-book-tab.md` | YES | `_CANONICAL/.../TABS/tabs/booking/audit-status.md` | YES | KRAVEN COMPLETE + findings captured |
| `audits/compliance/2026-05-27_06-30_sentry_vport-book-tab.md` | YES | `_CANONICAL/.../TABS/tabs/booking/audit-status.md` | YES | SENTRY COMPLETE captured |
| `audits/security/venom_reviews_module_2026-05-23.md` | YES | `_CANONICAL/.../reviews/audit-status.md` | YES | VENOM status captured |
| `audits/compliance/sentry_reviews_module_2026-05-23.md` | YES | `_CANONICAL/.../reviews/audit-status.md` | YES | SENTRY status captured |
| `audits/redteam/blackwidow_reviews_module_2026-05-23.md` | YES | `_CANONICAL/.../reviews/audit-status.md` | YES | BLACKWIDOW status captured |
| All `_ACTIVE/planning/april/**` and `_ACTIVE/planning/may/**` | YES (indirect) | `_CANONICAL` module files contain outcomes | YES | Session planning logs — outcomes transcribed to _CANONICAL. Raw session logs are historical artifacts. |

**Estimated VPORT-covered audit files safe to move: ~120**

---

### Coverage Table — Non-VPORT Feature Audits (NO CANONICAL home)

These audit reports cover platform features listed as ACTIVE in `FEATURE_STATUS.md`, but there is **no dedicated module folder in `_CANONICAL`** and **no CURRENT governance file** capturing the audit outcome. Moving these to HISTORY without backfilling CURRENT would leave these features with **no accessible governance record**.

| Source Artifact | CURRENT Equivalent Exists | Path | Safe To Move | Notes |
|---|---|---|---|---|
| `audits/security/2026-05-09_venom_whole-project-deep.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Project-wide VENOM. No module absorbs this. Findings may reference open issues. |
| `audits/security/2026-05-10_venom_vcsm-full-deep-scan.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Full platform scan. No CANONICAL module covers this. |
| `audits/security/2026-05-10_venom_vcsm-full-scan-remediation.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Remediation record — full platform. |
| `audits/security/2026-05-10_venom_friend-subscribe-private-profile-review.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Social feature (subscribe/follow). No CANONICAL module. |
| `audits/security/2026-05-11_venom_auth-login-trust-boundaries.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | `auth` is ACTIVE CRITICAL. No audit-status.md in _CANONICAL for auth. |
| `audits/security/2026-05-11_sentry_auth-login-wolverine-fixes.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Auth SENTRY compliance record. No home. |
| `audits/security/2026-05-14_venom_auth-login-full-surface.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Auth full surface audit. No CANONICAL home. |
| `audits/security/2026-05-18_venom_identity-provision-rpc-security.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | `identity` is ACTIVE CRITICAL. No CANONICAL module for identity. |
| `audits/security/2026-05-18_venom_legal-dal-finding-resolution.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | `legal` is ACTIVE HIGH. No CANONICAL module. |
| `audits/security/2026-05-19_venom_media-dal-trust-boundary.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | `media` is ACTIVE MEDIUM. No CANONICAL module. |
| `audits/security/2026-05-19_venom_post-dal-trust-surfaces.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | `post` is ACTIVE MEDIUM. No CANONICAL module. |
| `audits/security/venom_notifications-dal_2026-05-19.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | `notifications` is ACTIVE MEDIUM. No CANONICAL module. |
| `audits/security/2026-05-22_venom_profiles-trust-boundaries.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | `profiles` is ACTIVE HIGH. No CANONICAL module. |
| `audits/security/2026-05-23_14-00_venom_login-recovery-surface.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Auth login recovery. No CANONICAL module. |
| `audits/security/2026-05-10_venom_post-system-deep.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Post system full audit. No CANONICAL module. |
| `audits/security/2026-05-10_venom_private-block-profile-logic.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | `block` is ACTIVE HIGH. No CANONICAL module. |
| `audits/security/2026-05-10_venom_terms-of-service-logic.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | `legal` / terms. No CANONICAL module. |
| `audits/security/2026-05-10_04-04_venom_secdefiner-trust-boundaries.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Platform-wide secdefiner audit. No single module absorbs this. |
| `audits/runtime/2026-05-18_loki_identity-resolution-trace.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Identity feature. No CANONICAL module. |
| `audits/runtime/2026-05-14_loki_chat-badge-bootstrap-trace.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | `chat` is ACTIVE HIGH. No CANONICAL module. |
| `audits/runtime/2026-05-19_loki_media-dal-runtime-trace.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Media. No CANONICAL module. |
| `audits/runtime/loki_notifications-dal_2026-05-19.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Notifications. No CANONICAL module. |
| `audits/runtime/2026-05-22_loki_profiles-runtime-trace.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Profiles. No CANONICAL module. |
| `audits/compliance/2026-05-14_sentry_chat-dal-lib-permissions.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Chat. No CANONICAL module. |
| `audits/compliance/2026-05-14_sentry_booking-availability-boundary-review.md` | PARTIAL | DASHBOARD/modules/booking covers some | **CONDITIONAL** | Booking feature (not tab) — some overlap with tab coverage but DAL-level findings may lack a home. |
| `audits/compliance/2026-05-18_sentry_dashboard-dal-layer-boundary-violations.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Cross-cutting DAL boundary finding. No single module absorbs. |
| `audits/documentation/phase3*` (6 files) | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Documentation drift audits. No CURRENT equivalent to track their findings. |
| `audits/moderation/2026-05-10_moderation-system-review.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | `moderation` is ACTIVE HIGH. No CANONICAL module. |
| `audits/ownership/2026-05-14_ironman_chat-feature-ownership.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Chat. No CANONICAL module. |
| `audits/ownership/2026-05-18_ironman_identity-feature-ownership.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Identity. No CANONICAL module. |
| `audits/ownership/2026-05-19_ironman_media-feature-ownership.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Media. No CANONICAL module. |
| `audits/ownership/2026-05-19_ironman_notifications.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Notifications. No CANONICAL module. |
| `audits/ownership/2026-05-22_ironman_profiles-feature-ownership.md` | NO | — | **NO — HOLD_FOR_CURRENT_BACKFILL** | Profiles. No CANONICAL module. |

**Estimated non-VPORT audit files that must be held: ~132**

---

## PHASE 2 — AUDIT COVERAGE GAP DETECTION

The following ACTIVE features (per `FEATURE_STATUS.md`) have completed audit reports in `_ACTIVE/` but **no living `audit-status.md` in `_CANONICAL`**. Moving their audit reports to HISTORY would create permanent governance blind spots.

| Audit Type | Feature | History Audit Exists | CURRENT Governance Exists | Action Required |
|---|---|---|---|---|
| VENOM + SENTRY + LOKI + IRONMAN | `auth` (CRITICAL) | YES — `2026-05-11`, `2026-05-14`, `2026-05-23` | **NO** | Create `_CANONICAL/.../features/auth/audit-status.md` before move |
| VENOM + ARCHITECT + LOKI + IRONMAN + CARNAGE | `identity` (CRITICAL) | YES — `2026-05-18` | **NO** | Create `_CANONICAL/.../features/identity/audit-status.md` before move |
| VENOM + SENTRY + LOKI + IRONMAN + KRAVEN + CARNAGE | `chat` (HIGH) | YES — `2026-05-14` | **NO** | Create `_CANONICAL/.../features/chat/audit-status.md` before move |
| VENOM + LOKI + IRONMAN + CARNAGE + THOR | `media` (MEDIUM) | YES — `2026-05-19` | **NO** | Create `_CANONICAL/.../features/media/audit-status.md` before move |
| VENOM + LOKI + SENTRY + IRONMAN + KRAVEN | `notifications` (MEDIUM) | YES — `2026-05-19` | **NO** | Create `_CANONICAL/.../features/notifications/audit-status.md` before move |
| VENOM + SENTRY + LOKI + IRONMAN + KRAVEN + CARNAGE + THOR | `profiles` (HIGH) | YES — `2026-05-22`, `2026-05-23` | **NO** | Create `_CANONICAL/.../features/profiles/audit-status.md` before move |
| VENOM + SENTRY + KRAVEN + LOKI | `post` (MEDIUM) | YES — `2026-05-10`, `2026-05-19` | **NO** | Create `_CANONICAL/.../features/post/audit-status.md` before move |
| VENOM + SENTRY + ARCHITECT + KRAVEN | `feed` (MEDIUM) | YES — `2026-05-14` | **NO** | Create `_CANONICAL/.../features/feed/audit-status.md` before move |
| VENOM + LOKI + SENTRY + CARNAGE | `block` (HIGH) | YES — `2026-05-11`, `2026-05-14` | **NO** | Create `_CANONICAL/.../features/block/audit-status.md` before move |
| VENOM + ARCHITECT | `social` / subscribe / friend (MEDIUM) | YES — `2026-05-10`, `2026-05-27` | **NO** | Create `_CANONICAL/.../features/social/audit-status.md` before move |
| VENOM + CARNAGE (full review) | `moderation` (HIGH) | YES — `2026-05-10` | **NO** | Create `_CANONICAL/.../features/moderation/audit-status.md` before move |
| VENOM + SENTRY | `legal` (HIGH) | YES — `2026-05-10`, `2026-05-18` | **NO** | Create `_CANONICAL/.../features/legal/audit-status.md` before move |
| LOGAN (drift detection) | Platform-wide documentation | YES — `2026-05-11` phase3a-3f | **NO** | Drift findings have no CURRENT destination — require CURRENT doc coverage file |
| VENOM + ARCHITECT | Platform-wide (full-deep, secdefiner) | YES — `2026-05-09`, `2026-05-10` | **NO** | Full-platform findings require a platform-level governance home |

**Gap count: 14 features with completed audits but no CURRENT governance home.**

These 14 coverage gaps must be resolved (by creating the missing `audit-status.md` files in `_CANONICAL`) before the non-VPORT audit reports can safely move to HISTORY.

---

## PHASE 3 — NATIVE OWNERSHIP REVIEW

| Folder / File | Status | Evidence | Recommended Action |
|---|---|---|---|
| `native/ROADTRIP.md` | **PAUSED** | Created 2026-05-03. 73KB plan document for PWA→Native transfer. No activity since May 2026. No FALCON command output or native app module references post-May 11. | KEEP_IN_PLACE — not historical (plan is paused, not complete) |
| `native/NATIVE_COMMAND_CENTER.md` | **PAUSED** | Defines the `/falcon` command native workflow. The Falcon command is ACTIVE in governance, but native transfer work itself shows no evidence of activity since May 2026. | KEEP_IN_PLACE — command reference doc, not historical |
| `native/NATIVE_SYNC_COMMAND.md` | **PAUSED** | Companion sync command definition. | KEEP_IN_PLACE — command reference |
| `native/RUN_NATIVE_SYNC.md` | **PAUSED** | One-page run instruction for native sync pipeline. | KEEP_IN_PLACE — operational reference |
| `native/AGENTS.md` | **PAUSED** | Agent definitions for native transfer pipeline. | KEEP_IN_PLACE — pipeline reference |
| `native/prompts/*.md` (4 files) | **PAUSED** | Generator prompt templates: DELETE_FEATURE_TRANSFER, MODULE_PROMPT_TEMPLATE, PIPELINE_PROMPT, PWA_TO_NATIVE_GENERATOR. Active prompts for when native transfer resumes. | KEEP_IN_PLACE — reusable operational assets |
| `native/native-transfer/README.md` | **PAUSED** | Transfer system overview. | KEEP_IN_PLACE |
| `native/native-transfer/ROADTRIP_INDEX.md` | **PAUSED** | Module-level index of transfer state. 21KB. Last updated 2026-05-14. | KEEP_IN_PLACE — active index if work resumes |
| `native/native-transfer/modules/*.md` (27 module files) | **PAUSED** | Per-feature transfer analysis: auth, booking, bottom-nav-runtime, chat-inbox, composer-upload, dashboard-routes, explore-search, feed, identity, learning, moderation, notifications, post-card, post-detail, public-menu, public-vport-profile, reviews, rls-authenticated-access, schema-platform, schema-reviews, schema-vc, schema-vport, settings, social-follow, vport-types-tabs-deep-audit, wanders. All created 2026-05-02 to 2026-05-14. | KEEP_IN_PLACE — reference data for future native sprint. Moving loses context for every feature module. |
| `native/falcon_chat_dal_parity_2026-05-14.md` | **HISTORICAL** | Completed Falcon parity report — dated 2026-05-14. No open action items implied by filename. | MOVE_TO_HISTORY → `HISTORY/2026/05/commands/falcon/` |
| `native/falcon_feed-dal-parity-2026-05-14.md` | **HISTORICAL** | Completed Falcon parity report — dated 2026-05-14. | MOVE_TO_HISTORY → `HISTORY/2026/05/commands/falcon/` |

**Native summary:** 39 files are PAUSED (not historical, not active sprint work). 2 files are HISTORICAL and safe to move.
**Recommended:** Keep all native/ except the 2 falcon reports until FALCON/owner explicitly confirms the native transfer work is closed or superseded.

---

## PHASE 4 — MIGRATION OWNERSHIP REVIEW

### _ACTIVE/migrations/*.sql (13 files)

| Migration | Status | Evidence | Safe To Archive |
|---|---|---|---|
| `2026-05-10_secdef_a_search_path_hardening.sql` | **LIKELY APPLIED** | Part of the May 10 security hardening sprint. The THOR release report `2026-05-10_01-30_thor_vcsm-engine-release-readiness.md` covers this sprint and shows release approval. The sprint is referenced as complete in subsequent audits. | **CONDITIONAL** — archive after DB confirmation |
| `2026-05-10_secdef_b_zero_policy_tables.sql` | **LIKELY APPLIED** | Same sprint as secdef_a. | **CONDITIONAL** |
| `2026-05-10_secdef_c_rls_disabled_tables.sql` | **LIKELY APPLIED** | Same sprint as secdef_a. | **CONDITIONAL** |
| `2026-05-10_step1_revoke_dangerous_execute.sql` | **LIKELY APPLIED** | Part of CARNAGE migration plan from May 10 — `2026-05-10_04-04_carnage_secdefiner-rls-elimination.md` details this series as executed. | **CONDITIONAL** |
| `2026-05-10_step2_rls_policy_repairs.sql` | **LIKELY APPLIED** | Same CARNAGE series. | **CONDITIONAL** |
| `2026-05-10_step4_drop_dead_functions.sql` | **LIKELY APPLIED** | Same CARNAGE series. | **CONDITIONAL** |
| `2026-05-10_step5_harden_security_definer.sql` | **LIKELY APPLIED** | Same CARNAGE series. | **CONDITIONAL** |
| `2026-05-10_step5b_trigger_and_wanders_search_path.sql` | **LIKELY APPLIED** | Same CARNAGE series. | **CONDITIONAL** |
| `2026-05-10_fix_vport_create_rpc_overload_ambiguity.sql` | **LIKELY APPLIED** | Targeted fix from May 10 sprint. | **CONDITIONAL** |
| `2026-05-10_fix_fuel_price_submissions_grants.sql` | **LIKELY APPLIED** | Fuel price grant fix. The gas VENOM audit references this fix as applied. | **CONDITIONAL** |
| `2026-05-27_add_payload_to_posts.sql` | **LIKELY APPLIED** | Posts payload column — referenced in the May 27 feed/dashboard sprint. The WATCHER provenance report covers this sprint. | **CONDITIONAL** |
| `2026-05-27_gasprices_batch_c.sql` | **LIKELY APPLIED** | DataEngineer report `2026-05-27_14-00_dataengineer_gasprices-batch-c-db-constraints.md` documents this migration. Gas THOR gate shows CAUTION (deferred items, not blockers). Batch C appears applied. | **CONDITIONAL** |
| `preflight_actor_can_manage_profile_legacy_branch.sql` | **UNKNOWN** | Named "preflight" — this is almost certainly a verification/diagnostic query, not an executable migration. May be PENDING as a pre-condition check. No evidence it was run. | **HOLD — NOT SAFE TO ARCHIVE** — must clarify before move |

**Note:** "LIKELY APPLIED" does not equal confirmed. DB audit required before these can be safely archived. If any are PENDING and get moved to HISTORY, they become inaccessible to migration execution flows.

### _ACTIVE/planning/carnage_migrations/ (5 files)

| Migration | Status | Evidence | Safe To Archive |
|---|---|---|---|
| `20260510_01_user_consents_immutability_and_grant.sql` | **UNKNOWN** | Consents migration proposal from May 10. The carnage migration audit `2026-05-10_04-04_carnage_secdefiner-rls-elimination.md` covers secdefiner work but consent-specific status is unclear. | **HOLD — UNKNOWN** |
| `20260510_02_age_verification_consent_type.sql` | **UNKNOWN** | Age verification consent type addition. No evidence this was applied in available audit trails. | **HOLD — UNKNOWN** |
| `20260510_03_accepted_at_server_default.sql` | **UNKNOWN** | Server default for accepted_at column. No evidence of application. | **HOLD — UNKNOWN** |
| `reviews/A_track_vc_is_actor_owner.sql` | **UNKNOWN** | Reviews ownership tracking RLS. Created 2026-05-23 alongside the reviews module VENOM audit. No CARNAGE migration report for reviews confirms this was applied. | **HOLD — UNKNOWN** |
| `reviews/B_track_reviews_write_rls.sql` | **UNKNOWN** | Reviews write RLS. Same as above. | **HOLD — UNKNOWN** |

### _ACTIVE/planning/moderation-db-remediation/ (7 files)

| Migration / File | Status | Evidence | Safe To Archive |
|---|---|---|---|
| `2026-05-10_moderation-db-remediation-plan.md` | **HISTORICAL (plan only)** | File header states: "Mode: Read-only analysis. SQL proposals only. Nothing executed. Nothing modified." The plan document is historical — its SQL proposals are in the sql-proposals/ subfolder. | **CONDITIONAL** — can archive the plan doc; SQLs require separate review |
| `sql-proposals/batch1_20260510070000_fix_moderation_can_manage_domain.sql` | **UNKNOWN** | Moderation can_manage domain fix. No evidence of application in available audit trails. The moderation audit exists but does not confirm DB execution. | **HOLD — UNKNOWN** |
| `sql-proposals/batch2_20260510080000_report_events_insert_self_policy.sql` | **UNKNOWN** | Report events insert policy. Same — no confirmation. | **HOLD — UNKNOWN** |
| `sql-proposals/batch3_20260510090000_create_moderation_moderators.sql` | **UNKNOWN** | Moderators table creation. No evidence this was applied. | **HOLD — UNKNOWN** |
| `sql-proposals/batch4_20260510100000_fix_block_actor_bidirectional_follows.sql` | **UNKNOWN** | Block/follow bidirectionality fix. Block audit exists (2026-05-11, 2026-05-14) but does not confirm DB migration execution. | **HOLD — UNKNOWN** |
| `sql-proposals/batch5_20260510110000_force_rls_moderation_tables.sql` | **UNKNOWN** | Force RLS on moderation tables. No confirmation. | **HOLD — UNKNOWN** |
| `sql-proposals/batch6_20260510120000_moderation_dashboard_indexes.sql` | **UNKNOWN** | Moderation dashboard indexes. No confirmation. | **HOLD — UNKNOWN** |

**Migration summary:** 12 SQL files are LIKELY APPLIED but require DB confirmation. 1 file (`preflight_actor_can_manage_profile_legacy_branch.sql`) is a diagnostic query, not a migration — hold until clarified. All carnage_migrations and moderation sql-proposals are UNKNOWN — hold until DB confirms.

---

## PHASE 5 — BACKUP ARCHIVAL REVIEW

### Backup Folder Inventory

All 13 backup folders are from **2026-04-30** (33+ days old). All have naming conventions that include timestamps or descriptive names.

| Backup Folder | Restorable | Unique | Recommended Action |
|---|---|---|---|
| `VCSM-backup-20260430-165037/` | **YES** — Has `BACKUP_MANIFEST.md` with full file list, original paths, violation being fixed, and contracts applied. Structured and complete. | YES — covers auth hooks, settings hooks, dashboard screens, public menu screen, portfolio hook | **ARCHIVE_TO_HISTORY** → `HISTORY/2026/04/backups/` |
| `phase6-screen-splits-backup/` | **PARTIAL** — 6 .jsx files with no manifest. Original paths unclear without reading the files. | Likely unique (screen splits) but not verifiable without manifest | **REVIEW_REQUIRED** — no manifest; determine original paths before archiving |
| `booking-split-backup-20260430/` | **PARTIAL** — 1 .bak file (`VportPublicBookingFlow.jsx.bak`). No manifest. | Single file backup — minimal unique value | **ARCHIVE_TO_HISTORY** → `HISTORY/2026/04/backups/` — single .bak with clear purpose |
| `backups-nested-20260430/` | **UNKNOWN** | Contains nested backup structure from April 30 — contains a Traffic SEO backup subfolder. Contents may include backups-within-backups. | **REVIEW_REQUIRED** — nested structure; verify no orphaned critical files |
| `batch-e-mechanical-cleanup-backup-20260430-184558/` | UNKNOWN (no manifest inspected) | Named for a specific cleanup batch | **ARCHIVE_TO_HISTORY** — named cleanup backup; likely safe to archive |
| `chat-unread-badge-backup-20260430-175747/` | UNKNOWN | Feature-specific backup | **ARCHIVE_TO_HISTORY** — clear feature scope, timestamp, safe for archival |
| `deferred-cleanup-backup-20260430-172611/` | UNKNOWN | Deferred cleanup backup | **ARCHIVE_TO_HISTORY** — named for deferred items; work is now historical |
| `high-risk-architecture-backup-20260430-182421/` | UNKNOWN | High-risk change backup | **REVIEW_REQUIRED** — "high-risk" designation warrants manual review before archiving |
| `hooks-dal-backup-20260430-171232/` | UNKNOWN | Hook/DAL backup from April 30 sprint | **ARCHIVE_TO_HISTORY** — specific scope, safe for archival |
| `media-engine-v1-backup-20260430-182430/` | UNKNOWN | Media engine backup | **ARCHIVE_TO_HISTORY** — versioned backup; media-engine-v1 is historical |
| `upload_writeback_debug_20260430-220835/` | UNKNOWN | Debug backup from upload writeback fix | **ARCHIVE_TO_HISTORY** — debug state snapshot; historical |
| `view-split-backup-20260430-175529/` | UNKNOWN | View split backup | **ARCHIVE_TO_HISTORY** — named scope, historical |
| `vport-reviews-hook-split-backup-20260430-174317/` | UNKNOWN | VPort reviews hook split | **ARCHIVE_TO_HISTORY** — named scope, historical |

**Backup summary:**
- ARCHIVE_TO_HISTORY (9 folders): Clear scope, named, old enough
- REVIEW_REQUIRED (3 folders): Missing manifest or unusual structure (`phase6-screen-splits-backup`, `backups-nested-20260430`, `high-risk-architecture-backup-20260430-182421`)
- DO NOT DELETE any backup — only move

---

## PHASE 6 — FINAL APPROVAL MATRIX

| Group | File Count | Approval Status | Reason |
|---|---|---|---|
| **Planning — april/ + may/ + batman/** | 290 | **APPROVED** | Historical session logs. Outcomes captured in _CANONICAL module audit-status.md files. DR. STRANGE does not need these to answer feature status questions. |
| **Audits — VPORT-covered modules** | ~120 | **APPROVED** | Completed audits for barber, barbershop, locksmith, restaurant, gas, exchange, booking-tab, qr, menu, subscribers, content-pages, delete-lifecycle, tripoint, external-site, portfolio, leads, reviews-VPORT-tab, settings, schedule, calendar, team, tab-classification. All findings captured in per-module audit-status.md in _CANONICAL. |
| **Audits — Non-VPORT features (14 features)** | ~132 | **HOLD — CURRENT_BACKFILL_REQUIRED** | Auth, chat, identity, media, notifications, profiles, post, feed, block, social, moderation, legal, platform-wide scans, and documentation drift audits have NO _CANONICAL audit-status.md home. Moving these destroys governance coverage for ACTIVE CRITICAL/HIGH features. |
| **Native — falcon reports** | 2 | **APPROVED** | Completed dated reports. Status absorbed by Falcon governance chain. |
| **Language-audit JSON snapshots** | 9 | **APPROVED** | Static generated data, not governance records. No DR. STRANGE dependency. |
| **Migrations — _ACTIVE/migrations/*.sql** | 12 | **HOLD — DB_CONFIRMATION_REQUIRED** | LIKELY APPLIED but not confirmed. Cannot safely archive until DB audit confirms applied status. 1 file (`preflight_*`) is not a migration — HOLD pending clarification. |
| **Migrations — carnage_migrations/** | 5 | **HOLD — DB_CONFIRMATION_REQUIRED** | ALL UNKNOWN applied status. Cannot archive pending DB confirmation. |
| **Migrations — moderation-db-remediation/plan** | 1 | **CONDITIONAL** | Plan document is historical — safe. SQL proposals must remain held separately. |
| **Migrations — moderation sql-proposals/** | 6 | **HOLD — DB_CONFIRMATION_REQUIRED** | ALL UNKNOWN applied status. |
| **Backups — 9 clear-scope folders** | ~260 | **ARCHIVE_TO_HISTORY (pending human confirmation)** | Named, dated, old enough. No manifests means exact restore verification impossible without reading each file. Human spot-check recommended before final move. |
| **Backups — 3 review-required folders** | ~38 | **REVIEW_REQUIRED** | `phase6-screen-splits-backup`, `backups-nested-20260430`, `high-risk-architecture-backup-20260430-182421` need manifest review. |

---

## PHASE 7 — EXECUTION READINESS

### Decision

**NOT APPROVED FOR MOVE** *(full set)*

A partial subset is APPROVED. The full set is blocked by three categories of findings.

---

### Blockers

**BLOCKER 1 — Non-VPORT Feature Audits Have No CURRENT Home (~132 files)**

14 ACTIVE features (auth, chat, identity, media, notifications, profiles, post, feed, block, social, moderation, legal, platform-wide, documentation-drift) have completed VENOM/ELEKTRA/ARCHITECT/BLACKWIDOW/LOKI/KRAVEN/SENTRY/IRONMAN audit reports in `_ACTIVE/audits/` but have **no corresponding `audit-status.md` in `_CANONICAL`**.

Moving these ~132 files to HISTORY before creating CURRENT governance homes for these features would:
- Permanently remove the only accessible record of their security audit status
- Leave 14 ACTIVE features — including 2 CRITICAL-tier (`auth`, `identity`) — with no queryable governance coverage
- Make DR. STRANGE unable to answer "has auth been VENOM-audited?" (answer: YES, but the record would be in HISTORY with no pointer)

**Resolution required before move:** Create `audit-status.md` files in `_CANONICAL` for each of the 14 affected features, capturing the findings and statuses from the historical audit reports.

---

**BLOCKER 2 — Migration Applied Status Unknown (24 SQL files)**

The 13 `_ACTIVE/migrations/*.sql` files and the 11 SQL files in `carnage_migrations/` and `moderation-db-remediation/sql-proposals/` cannot be archived until their application status is confirmed.

- If PENDING and moved to HISTORY: migration execution is broken (files become inaccessible)
- If APPLIED and left in _ACTIVE: no harm, just clutter

**Resolution required before move:** DB audit command confirming which migrations were applied vs. pending. Applied → archive. Pending → keep in `_ACTIVE/migrations/`.

---

**BLOCKER 3 — `preflight_actor_can_manage_profile_legacy_branch.sql` Classification Unknown**

The file named `preflight_*` may be a diagnostic query (safe to archive) or a pending pre-flight check required before a migration runs (must stay in _ACTIVE). Classification required.

---

### What CAN Be Moved Now (Partial Approval)

The following groups are cleared for relocation without further resolution:

| Group | Files | Status |
|---|---|---|
| `_ACTIVE/planning/april/**` | 156 | CLEARED |
| `_ACTIVE/planning/may/**` | 109 | CLEARED |
| `_ACTIVE/planning/batman/**` | 1 | CLEARED |
| `_ACTIVE/planning/2026-05/11/**` | 1 | CLEARED |
| `_ACTIVE/audits/` — VPORT-covered modules only | ~120 | CLEARED |
| `_ACTIVE/native/falcon_*.md` (2 files) | 2 | CLEARED |
| `_ACTIVE/tools/language-audit/*.json` (9 files) | 9 | CLEARED |
| **Partial total** | **~398 files** | **CLEARED FOR MOVE** |

These 398 files can be safely relocated to HISTORY without risking governance coverage loss.

---

### Resolution Path to Full Approval

1. **Create 14 missing `_CANONICAL` feature audit-status.md files** (one per non-VPORT feature with completed audits). This unblocks the ~132 held audit files.
2. **Run DB audit** to confirm which SQL files in `_ACTIVE/migrations/` and `carnage_migrations/` are applied vs. pending. This unblocks up to 24 SQL files.
3. **Clarify `preflight_actor_can_manage_profile_legacy_branch.sql`** — diagnostic query vs. pending migration.
4. After those three steps: re-run Phase 7. Full approval is likely achievable.

---

## Confirmation

- No files were moved.
- No files were deleted.
- No files were renamed.
- No application source code was touched.
- No engine code was touched.
- Only this audit document was created.

---

**NOT APPROVED FOR MOVE — PARTIAL APPROVAL: 398 files cleared; 3 blockers remain for full execution**
