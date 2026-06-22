# Block Feature — History Index

All audit evidence for the block feature in chronological order.

---

## Audit Records

| Date | Command | Type | Report Path |
|---|---|---|---|
| 2026-05-11 | VENOM | Security | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-11_venom_block-feature.md` |
| 2026-05-11 | SENTRY | Compliance / Architecture | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-11_sentry_block-dal.md` |
| 2026-05-14 | LOKI | Runtime | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_loki_block-dal-status-read.md` |
| 2026-05-14 | THOR | Release Gate | `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_thor_block-feature-governance.md` |

---

## Canonical Documentation

- `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/dal/vcsm.dal.block.md`

---

## Notes

- VENOM and SENTRY ran 2026-05-11; LOKI and THOR ran 2026-05-14 in a follow-up pass
- All SENTRY findings (SF-01, SF-02, SF-03) resolved 2026-05-14 — SENTRY is PASS
- VENOM VF-01 (friend_ranks cleanup) remains OPEN — blocked on batch4 migration
- THOR issued BLOCKED for iOS Native and Android; CAUTION for PWA; 3 FALCON P0 gaps must close before native release
- Prior VENOM report (2026-04-13) predates RISK-5/6/7 discovery and is superseded by the 2026-05-11 focused re-run
- KRAVEN has NOT run on this feature as of the last recorded audit

---

## Phase 2 References — Added 2026-06-02

| Artifact | Type | Date | Path | Description |
|---|---|---|---|---|
| `2026-05-10_venom_private-block-profile-logic.md` | VENOM audit | 2026-05-10 | `zNOTFORPRODUCTION/_ACTIVE/audits/security/2026-05-10_venom_private-block-profile-logic.md` | Originating finding that triggered block investigation |
| `2026-05-23_venom_profiles-block-reverification.md` | VENOM audit | 2026-05-23 | `zNOTFORPRODUCTION/_ACTIVE/audits/security/2026-05-23_venom_profiles-block-reverification.md` | Post-remediation block enforcement re-audit |
| `2026-05-23_sentry_profiles-block-reverification.md` | SENTRY audit | 2026-05-23 | `zNOTFORPRODUCTION/_ACTIVE/audits/compliance/2026-05-23_sentry_profiles-block-reverification.md` | Post-remediation SENTRY compliance reverification |
| `2026-05-10_architect_private-block-profile-logic.md` | ARCHITECT audit | 2026-05-10 | `zNOTFORPRODUCTION/_ACTIVE/audits/architecture/2026-05-10_architect_private-block-profile-logic.md` | Private profile and block access logic architecture audit |
| `2026-05-10_kraven_private-block-profile-logic.md` | KRAVEN audit | 2026-05-10 | `zNOTFORPRODUCTION/_ACTIVE/audits/performance/2026-05-10_kraven_private-block-profile-logic.md` | Feed cache, dual-index, and checkBlockStatus cache performance audit |
| `2026-05-11_carnage_block-friend-ranks.md` | CARNAGE migration | 2026-05-11 | `zNOTFORPRODUCTION/_ACTIVE/audits/migrations/2026-05-11_carnage_block-friend-ranks.md` | batch4 friend_ranks migration plan |
| `vcsm.moderation.block-pipeline.md` | Canonical doc | — | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/moderation/vcsm.moderation.block-pipeline.md` | Block moderation pipeline flow |
| `vcsm.block.architecture.md` | Canonical doc | — | `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/architect/modules/vcsm.block.architecture.md` | ARCHITECT module map for the block feature architecture |
| `vcsm.block.owner.md` | Canonical doc | — | `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/ironman/vcsm.block.owner.md` | IRONMAN full ownership matrix and layer map |
| `2026-05-10.block-follow-privacy-enforcement.md` | Wolverine planning | 2026-05-10 | `zNOTFORPRODUCTION/_CANONICAL/logan/marvel/wolverine/2026-05-10.block-follow-privacy-enforcement.md` | Originating planning doc for 2026-05-10 audit sprint |
| `vcsm.identity.vport-access-block.md` | Canonical doc | — | `zNOTFORPRODUCTION/_CANONICAL/logan/vcsm/identity/vcsm.identity.vport-access-block.md` | VPORT access block control layer identity doc |
| `2026-06-02_wolverine_ticket-0007A_current-backfill.md` | Wolverine planning | 2026-06-02 | `zNOTFORPRODUCTION/_HISTORY/2026/06/commands/wolverine/2026-06-02_wolverine_ticket-0007A_current-backfill.md` | Provenance record for CURRENT/ governance folder creation (path not verified) |
| `TICKET-BLOCK-ARCHITECT-0001` | ARCHITECT audit | 2026-06-02 | Session / attachment context | `ARCHITECT_BLOCK_COMPLETE`; block flow, boundary, blocker, and test posture propagated into CURRENT |

---

## CURRENT Output Links — Added 2026-06-02

| Artifact | Type | Date | Path | Description |
|---|---|---|---|---|
| `004_block_wolverine_ownership-completion.md` | WOLVERINE output | 2026-06-02 | `CURRENT/outputs/2026/06/02/wolverine/004_block_wolverine_ownership-completion.md` | Block ownership completion output routed into CURRENT evidence/linkage |
