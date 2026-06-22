Engine Isolation Audit — Chat + Identity
==========================================

Date: 2026-04-05
Method: Full import scan + schema query audit + DI boundary verification


CHAT ENGINE ISOLATION AUDIT
==============================

Location: engines/chat/src/
Files: 110 .js files

1. App-specific imports:         ZERO
2. @alias imports to apps:       ZERO
3. "vcsm"/"wentrex" in code:     ZERO (only in comments)
4. Schema queries:               ONLY chat.* (67/67 schema() calls)
5. vc.* queries:                 ZERO (replaced by DI)
6. learning.* queries:           ZERO
7. Route paths in engine:        ZERO
8. UI/React components:          ZERO

DI Dependencies (13 injectable):
  REQUIRED: supabaseClient, getActorSummariesByIds, resolveRealm
  OPTIONAL: canModerateConversation, resolveConversationPolicy,
            normalizeHandleTerm, toContainsPattern, isUuid,
            defaultActorSource, legacyChatBridge, searchActors,
            resolveActorRealmContext, checkBlockRelation

Previously hardcoded queries now fully delegated:
  vc.actor_presentation → getActorSummariesByIds (injected)
  moderation.blocks        → checkBlockRelation (injected)
  vc.actors             → resolveActorRealmContext (injected)

Vport handling: generic actor kind in presentation layer, not hardcoded.
  vport_name/vport_slug/vport_avatar_url are optional fields
  populated by app-injected getActorSummariesByIds.

VERDICT: FULLY ISOLATED


IDENTITY ENGINE ISOLATION AUDIT
=================================

Location: engines/identity/src/
Files: 32 .js files

1. App-specific imports:         ZERO
2. @alias imports to apps:       ZERO
3. "vcsm"/"wentrex" in code:     ZERO (only in JSDoc/comments)
4. Schema queries:               ONLY platform.* and auth.*
5. vc.* queries:                 ZERO
6. learning.* queries:           ZERO
7. Route paths in engine:        ZERO
8. UI/React components:          ZERO

DI Dependencies (configureIdentityEngine):
  REQUIRED: supabaseClient
  OPTIONAL: resolveAppContext, enrichActorLinks, debugReporter

DAL schema audit (11 DAL files):
  platform.apps                    → app.read.dal.js
  platform.user_app_access         → access.read.dal.js
  platform.user_app_accounts       → account.read.dal.js
  platform.v_user_app_context      → account.read.dal.js
  platform.user_app_preferences    → preferences.read.dal.js + actorLinks.write.dal.js
  platform.user_app_state          → state.read.dal.js + state.write.dal.js
  platform.user_app_actor_links    → actorLinks.read.dal.js
  platform.app_roles               → roles.read.dal.js
  platform.capabilities            → capabilities.read.dal.js
  supabase.auth                    → session.read.dal.js

All 11 DAL files query ONLY platform.* or auth.* — ZERO app schema leakage.

App-specific resolution: injected via resolveAppContext callback
  VCSM injects: createVcsmAppContextResolver (queries vc.actor_links)
  Wentrex injects: createWentrexAppContextResolver (queries learning.*)
  Engine core does not know which schema the resolver queries.

VERDICT: FULLY ISOLATED


HYDRATION ENGINE ISOLATION AUDIT
===================================

Location: engines/hydration/src/
Files: 3 .js files (config, controller, adapters/index)

1. App-specific imports:         ZERO
2. Schema queries:               ZERO (pure adapter dispatch)
3. App logic:                    ZERO

Design: pure callback dispatcher.
  Apps register hydrators at startup:
    configureHydrationEngine({ hydrators: { vcsm: { ... }, wentrex: { ... } } })
  Engine dispatches by (appKey, actorSource) to the registered callback.
  Engine has zero knowledge of what the hydrator queries.

VERDICT: FULLY ISOLATED


DEPENDENCY DIRECTION (ALL THREE ENGINES)
==========================================

  CORRECT (clean):
    apps/VCSM → engines/identity (via @identity alias)
    apps/VCSM → engines/chat (via @chat alias)
    apps/VCSM → engines/hydration (via @hydration alias)
    apps/wentrex → engines/identity (via @identity alias)
    apps/wentrex → engines/chat (via @chat alias)

  NEVER (verified zero occurrences):
    engines/identity → apps/VCSM
    engines/identity → apps/wentrex
    engines/chat → apps/VCSM
    engines/chat → apps/wentrex
    engines/hydration → apps/VCSM
    engines/hydration → apps/wentrex

  App-to-engine contract:
    1. App calls configureXxxEngine() at startup with DI callbacks
    2. App imports public API from engine adapters
    3. Engine calls app-provided callbacks during resolution
    4. Engine never imports app code directly


ISOLATION BREACHES FOUND
===========================

  NONE.

  All three engines (identity, chat, hydration) are fully isolated.
  App-specific concerns are handled through dependency injection.
  No import, query, or string literal in engine core references app code.
  Comments mentioning "vcsm" or "wentrex" are documentation only.
