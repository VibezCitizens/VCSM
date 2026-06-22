---
# public — OWNERSHIP.md
# Last Updated: 2026-06-02
# Ticket: TICKET-DOCS-CLEANUP-001
# Ownership Status: NOT_AUDITED — IRONMAN has not run on this feature
# Status: CURRENT SOURCE OF TRUTH

Ownership map for the public feature.
IRONMAN has not audited features/public/. All ownership entries below are inferred from canonical
module architecture documents and adjacent ownership audits — not from a formal IRONMAN run.

---

## IRONMAN Coverage

NOT_AUDITED — IRONMAN has not audited this feature.
Recommended action: Run IRONMAN on features/public/ before next release gate.

Adjacent IRONMAN runs that inform partial context:
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-26_ironman_vport-dashboard-cards-settings-ownership.md`
  — Confirmed vport.profile_public_details ownership to saveVportPublicDetailsByActorId.controller.js; directory_visible sync via syncDirectoryVisibleToPublicDetailsDAL. businessCardSettings.model.js consumed directly by VportSettingsBusinessCard without adapter wrapper (flagged LOW risk).
- `zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-22_ironman_profiles-feature-ownership.md`
  — Profiles feature adjacent; does not cover features/public/ directly.

---

## Feature Ownership (Inferred)

| Area | Owner | Confidence | Notes |
|---|---|---|---|
| features/public/ root | VPORT public surfaces team | LOW | Declared in canonical module docs — no individual or team assignment confirmed |
| vportMenu sub-module | VPORT public surfaces team | LOW | Same declaration — IRONMAN not run |
| vportBusinessCard sub-module | VPORT public surfaces team | LOW | Same declaration — IRONMAN not run |
| business_card_leads write path | vportBusinessCardLead.write.dal.js | MEDIUM | Ownership inferred from DAL file name + migration audit |
| vport.profile_public_details | saveVportPublicDetailsByActorId.controller.js | HIGH | IRONMAN confirmed in settings ownership audit (adjacent) |
| businessCardSettings.model.js | public/vportBusinessCard/model/ | MEDIUM | IRONMAN confirmed consumed by VportSettingsBusinessCard without adapter; flagged LOW risk |

---

## Write Ownership Register

| Surface | Write Type | Ownership Gate | Risk |
|---|---|---|---|
| public/vportBusinessCard/controller/ | PROFILE_MUTATION | NONE | HIGH |
| public/vportMenu/controller/ | MENU_WRITE | NONE | HIGH |

No controller-layer ownership assertion confirmed on either write surface. This is the P0 security concern for this feature.

---

## Cross-Feature Ownership Conflicts

### Duplicate Menu Implementation
The route `/actor/:actorId/menu` is owned by `VportActorMenuPublicScreen` in the profiles feature — NOT in features/public/. This creates a split ownership where two teams may independently modify parallel implementations of the same user-facing surface.

### Duplicate Hook
`features/profiles/kinds/vport/hooks/useVportPublicDetails.js` has a different data shape from the canonical hook in features/public/. Owner of this duplicate hook is not confirmed.

---

## Data Ownership (Inferred)

| Table / View | Read Owner | Write Owner | Notes |
|---|---|---|---|
| vport.public_menu_read_model_v | vportMenu DAL | N/A (read-only view) | Schema provenance NOT tracked by CARNAGE |
| vport.public_actor_seo_v | vportMenu DAL | N/A | Schema provenance NOT tracked |
| reviews.public_vport_reviews_v | vportMenu DAL | N/A | Schema provenance NOT tracked |
| reviews.public_vport_review_summary_v | vportMenu DAL | N/A | CREATE VIEW not in migration history |
| reviews.public_vport_review_dimensions_v | vportMenu DAL | N/A | Schema provenance NOT tracked |
| vport.business_card_leads | vportBusinessCard DAL | vportBusinessCardLead.write.dal.js | Migration VL-001–VL-005 PENDING |

---

## Pending

IRONMAN has not run on features/public/.

When IRONMAN runs, this file must be replaced with the full ownership record.
Recommended: run IRONMAN as part of the same sprint as VENOM + ELEKTRA on features/public/.
---
