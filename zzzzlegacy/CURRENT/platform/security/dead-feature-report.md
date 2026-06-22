# ARCHITECT — Dead Feature Report
Generated: 2026-05-09

ARCHITECT does not delete anything. This report classifies only.

---

## Classification Key

- LIKELY DEAD — No routes, no DAL consumers, no active imports detected
- POSSIBLY LEGACY — Has files but may be superseded by a newer implementation
- EXPERIMENTAL — Partial layer stack, no screen wired up
- STILL REFERENCED — Active, not dead

---

## VCSM

### engines/feed/
Classification: POSSIBLY LEGACY
Evidence: Engine directory exists at engines/feed/ but no app imports it. VCSM has its own feed feature at apps/VCSM/src/features/feed/ with a complete DAL + controller stack. The engine may be an early extraction attempt that was never completed.
Action: Verify if engines/feed/ has any code or is empty. If empty, safe to remove. If it has code, determine if it was intended to replace the app-level feed.

### features/vgrid/
Classification: EXPERIMENTAL or POSSIBLY LEGACY
Evidence: Directory exists at apps/VCSM/src/features/vgrid/ but no DAL or controller was detected in this scan pass. No screen named VgridScreen found.
Action: Inspect vgrid/ for contents. If UI-only with no routes, verify if it is still consumed anywhere.

### features/void/
Classification: LIKELY DEAD or PLACEHOLDER
Evidence: Directory exists at apps/VCSM/src/features/void/ but no files or consumers were detected.
Action: Inspect void/. If empty or a stub, safe to remove.

### features/debug/loginDebug.store.js
Classification: DEV-ONLY — must not reach production
Evidence: Explicitly a debug store. Not dead but must be gated to dev environment.
Action: Verify build process strips or gates this store from production bundles.

### apps/VCSM/src/debuggers-stub/
Classification: DEV-ONLY stub
Evidence: identity/useActorConsistencyCheck.js detected. These are debug probes.
Action: Must never be imported by production code paths. Verify isolation.

### feed.read.debugPrivacyRows.dal.js
Classification: DEV-ONLY — should not run in production
Evidence: DAL named "debug" reads privacy rows. Controller getDebugPrivacyRows.controller.js drives it.
Action: Verify this controller is gated behind a dev/debug environment flag. If not gated, it is a production data leak risk.

### features/profiles/screens/views/tabs/*/controller/ and */dal/
Classification: POSSIBLY LEGACY (layer violation)
Evidence: Controllers and DAL files duplicated inside screen folder hierarchy. The canonical equivalents exist at features/profiles/controller/ and features/profiles/dal/.
These screen-nested files are either:
a) The original location before a refactor that moved them (originals never deleted)
b) Intentionally separate (but this violates layer rules)
Action: Audit whether screen-nested controllers/DAL are actually imported anywhere. If not imported, they are dead code.

---

## TRAFFIC

### apps/Traffic/src/data/connectors/mockDataset.js (DELETED)
Classification: CONFIRMED DELETED
Evidence: Git status shows D (deleted): mockDataset.js, mockProviders.a.js, mockProviders.b.js, mockProviders.c.js, vportDataset.model.js, vportToProvider.model.js

### apps/Traffic/src/data/mappers/vportDataset.model.js (DELETED)
Classification: CONFIRMED DELETED

### apps/Traffic/src/data/mappers/vportToProvider.model.js (DELETED)
Classification: CONFIRMED DELETED

These deletions are expected — the mock layer was replaced with live Supabase connections.
Verify: No remaining imports reference these deleted files.

### apps/Traffic/src/data/traffic/
Classification: UNKNOWN — directory exists but contents not scanned
Action: Inspect apps/Traffic/src/data/traffic/ to determine contents and purpose.

### apps/Traffic/src/lib/geo/
Classification: STILL REFERENCED (geo/reverse-geocode feature)
Evidence: Directory exists, geo features are referenced in Traffic architecture.

---

## WENTREX

Full dead feature scan for Wentrex requires a dedicated pass.
Known: Wentrex has multiple learning domain directories. Some may be experimental or incomplete.

---

## Orphaned DAL Files (Possible)

These DAL files have unusual naming or paths that suggest they may be orphaned:

### features/profiles/dal/friends/friendRanks.reconcile.dal.js
AND
### features/profiles/screens/views/tabs/friends/dal/friendRanks.reconcile.dal.js
Same file name in two locations. One is a duplicate. The non-canonical one (screen-nested) is likely unused.

### features/profiles/dal/friends/friendRanks.write.dal.js
AND
### features/profiles/screens/views/tabs/friends/dal/friendRanks.write.dal.js
Same pattern — duplicate at screen level.

---

## Unused CSS (Inferred)

Full CSS dead code scan requires a dedicated grep pass (not done in this scan).
Candidates: any CSS files in features that have been removed or significantly refactored.
Action: Run a grep for CSS class names to identify unused rules.
