# ARCHITECT — Supabase View Dependency Tree
Generated: 2026-05-09

---

## public_traze_provider_index_v

Purpose: Public provider index for Traffic acquisition — city/service/slug/geo data
Consumer Count: HIGH (3 separate DAL consumers)
Risk: HIGH-FANOUT — single view drives all Traffic page generation

```
public_traze_provider_index_v
  ├── vportDataset.read.dal.js
  │     ↓
  │   vportDataset.controller.js
  │     ↓
  │   unifiedDataset.js / vportDataset.js (connectors)
  │     ↓
  │   staticParams.repo.js
  │     ↓
  │   generateStaticParams() → /[city], /[city]/[segment], /[city]/[segment]/[service]
  │
  ├── vportHomepage.read.dal.js
  │     ↓
  │   vportHomepage.connector.js
  │     ↓
  │   homepage.repo.js
  │     ↓
  │   HomepageTopProvidersSection → /
  │
  └── trazeCategories.read.dal.js
        ↓
      taxonomyParams.repo.js
        ↓
      category.repo.js
        ↓
      generateStaticParams() → /[city]/categories, /[city]/[segment]
```

DUPLICATE CONSUMER WARNING:
All three DAL consumers read from the same view.
During build, these may execute as independent Supabase queries rather than a single cached read.
Recommend: single cached provider dataset load at build-time that feeds all three consumers.

DEAD VIEW CHECK: View is ACTIVE — confirmed used by 3 DAL files.

---

## public_traze_portfolio_v

Purpose: Provider portfolio/profile data for provider detail pages
Consumer Count: 1

```
public_traze_portfolio_v
  ↓
providerProfile.read.dal.js
  ↓
provider.repo.js
  ↓
/pro/[providerSlug] page.jsx
```

DEAD VIEW CHECK: View is ACTIVE.

---

## VCSM — RPC Functions Used as Views

### readVportPublicDetails (RPC)
Purpose: Returns vport public details as a structured payload
Consumer: readVportPublicDetails.rpc.dal.js

```
readVportPublicDetails (RPC)
  ↓
readVportPublicDetails.rpc.dal.js (features/public/vportMenu/dal/)
  ↓
getVportPublicDetails.controller.js
  ↓
VportPublicMenuScreen (or VportBusinessCard)
```

ALSO consumed by:
- profiles/kinds/vport/dal/rates/readVportRatesByActor.dal.js (separate path)
- settings/profile/dal/vportPublicDetails.read.dal.js (separate path)
- dashboard/vport/dal/read/vportProfile.read.dal.js (separate path)

HIGH-FANOUT RPC: vport public details is read from 4+ separate DAL paths.
Likely hitting the same underlying tables each time. Cache at controller level is critical.

### readVportPublicMenu (RPC)
Purpose: Returns vport menu categories and items
Consumer: readVportPublicMenu.rpc.dal.js

```
readVportPublicMenu (RPC)
  ↓
readVportPublicMenu.rpc.dal.js (features/public/vportMenu/dal/)
  ↓
getVportPublicMenu.controller.js
  ↓
VportPublicMenuScreen
```

DEAD VIEW CHECK: ACTIVE.

---

## VCSM — Tables Accessed by Multiple DAL Consumers

### vc.actors
Accessed by: actorGetByProfile, readActorProfile, readActorKind, readActorIdByUsername, readActorType, resolveActorSlug, getActorSummariesByIds, searchActors, identity engine (actorLinks), chat engine (actorRealm), hydration engine
Risk: MOST-READ TABLE — central identity record. Cache (actorStore.js) should absorb repeated reads.

### vc.blocks
Accessed by: block.read.dal.js (VCSM block feature) AND blockRelations.read.dal.js (chat engine)
Both read the same table independently. If a user opens chat from the feed, both paths may fire.

### vc.post_reactions
Accessed by: feed.read.reactionCounts.dal.js, feed.read.viewerReactions.dal.js, postReactions.read.dal.js, listPostReactions.dal.js (profiles/photos)
Four separate DAL files read reaction data. Consolidation opportunity.

### vc.vports
Accessed by: vport.core.dal.js, readVportPublicDetails.rpc, vportProfile.read.dal, actorVport.read.dal, vportBusinessCard.read.dal
Five separate access paths.

---

## Views Present But Not Confirmed Active

These view names were not found in a DAL read in this scan pass and may be dead or not yet wired:

- Any views related to wanderex public discovery (wanderexPublic.read.dal reads a table — view name not confirmed)
- Any views related to ads delivery
- Fuel price history views (gas feature DAL reads specific tables)

Full DB-side view inventory should be cross-checked via /DB command.
