ACTOR HYDRATION DATA AUDIT RESULT
====================================

Date: 2026-04-06 (updated after hydration engine consolidation)
Updated: 2026-05-02 — commitIdentity now seeds useActorStore
Method: Full codebase trace — every hydration file, function, table, field, and call chain


1. HYDRATION ENTRY POINTS
============================

There are TWO distinct hydration systems in VCSM, plus one in Wentrex:

SYSTEM A — Identity Hydration (single actor, full enrichment)
  Entry:    identity.controller.js → hydrateIdentityActor(actor) / loadIdentityForActorId(actorId)
  Engine:   engines/hydration/ dispatches to app-registered hydrator
  Hydrator: apps/VCSM/src/features/hydration/vcsmActorHydrator.js
  Purpose:  Build the full identity object for useIdentity() — login, switch, session restore
  Queries:  4-7 sequential/parallel reads across 5-6 tables
  Output:   Rich identity object with 15-20 fields

SYSTEM B — Batch Actor Summary (many actors, lightweight) — NOW CONSOLIDATED IN engines/hydration/
  Entry:    hydrateActorsFromRows(rows) / hydrateActorsByIds(actorIds) from @hydration
  DAL:      engines/hydration/src/dal.js → RPC vc.get_actor_summaries
  Normalize: engines/hydration/src/normalize.js (single canonical function)
  Store:    engines/hydration/src/store.js (Zustand) — global actor cache with freshness metadata
  Consumer: engines/hydration/src/useActorSummary.js — exposes missing/stale flags
  Purpose:  Populate actor avatars/names for feed, comments, friends, chat, notifications
  Queries:  1 RPC call (denormalized, server-side join), skips fresh actors (5min TTL)
  Output:   Lightweight summary object with 10 fields + _hydratedAt metadata
  
  CONSOLIDATION NOTE (2026-04-06):
  - Old duplicate files (state/actors/hydrateActors.js, features/actors/controllers/hydrateActors.controller.js) now re-export from @hydration
  - Store has safe merge semantics (no null overwrites)
  - Chat DI now also writes to global store via hydrateAndReturnSummaries
  - Feed pipeline runs background canonical hydration after its fast upsert path

SYSTEM C — Wentrex Actor Hydration (no formal hydration engine)
  Entry:    getActorSummariesByIdsDAL(actorIds) in chat setup
  DAL:      Direct query to learning.actor_profiles
  Purpose:  Chat participant names/avatars only
  Queries:  1 table read
  Output:   { actor_id, display_name, photo_url, kind: 'user' }

Additionally, there is a THIRD read pattern used by feed/content:

SYSTEM D — actor_presentation View (inline FK joins)
  Entry:    Various DALs that join actor_presentation as nested select
  Source:   vc.actor_presentation (database view, pre-joined)
  Purpose:  Inline actor data in posts, inbox entries, conversation members
  Queries:  No separate call — embedded in parent query via FK join
  Output:   actor_id, kind, display_name, username, photo_url, vport_name, vport_slug, vport_avatar_url


2. HYDRATION FILES INVOLVED
==============================

ENGINE FILES:
  engines/hydration/index.js                               — Public re-export
  engines/hydration/src/config.js                          — configureHydrationEngine, getHydrator
  engines/hydration/src/controller/hydrateActor.controller.js — Dispatch to app hydrator
  engines/hydration/src/adapters/index.js                  — Public API surface

VCSM IDENTITY HYDRATION FILES:
  apps/VCSM/src/features/hydration/setup.js                — Register hydrateVcsmActor
  apps/VCSM/src/features/hydration/vcsmActorHydrator.js    — VCSM domain hydrator (user + vport)
  apps/VCSM/src/state/identity/identity.controller.js      — mapProfileActor, mapVportActor, resolveRealmId, hydrateIdentityActor, loadDefaultIdentityForUser
  apps/VCSM/src/state/identity/identity.read.dal.js        — 7 DAL functions for identity tables
  apps/VCSM/src/state/identity/identityContext.jsx         — React context, switchActor, version/ownership guards
  apps/VCSM/src/state/identity/identityStorage.js          — localStorage cache per userId

VCSM BATCH HYDRATION FILES:
  apps/VCSM/src/features/actors/controllers/hydrateActors.controller.js    — hydrateActorsFromRows
  apps/VCSM/src/features/profiles/controller/friends/hydrateActorsIntoStore.controller.js — hydrateActorsIntoStore
  apps/VCSM/src/features/actors/dal/getActorSummariesByIds.dal.js          — RPC call
  apps/VCSM/src/features/actors/model/extractActorIdsForHydration.model.js — ID extractor
  apps/VCSM/src/state/actors/actorStore.js                                 — Zustand store

VCSM FEED BUNDLE (ALTERNATIVE PATTERN):
  apps/VCSM/src/features/feed/dal/feed.read.actorsBundle.dal.js — Multi-table bundle read

VCSM ACTOR_PRESENTATION CONSUMERS:
  apps/VCSM/src/features/chat/inbox/dal/inbox.read.dal.js              — Nested in inbox entries
  apps/VCSM/src/features/chat/conversation/dal/read/members.read.dal.js — Nested in members
  apps/VCSM/src/features/chat/conversation/dal/members.read.dal.js     — Nested in members
  apps/VCSM/src/features/chat/start/dal/read/searchActors.dal.js       — Direct query
  apps/VCSM/src/features/feed/dal/feed.posts.dal.js                    — Nested in posts
  apps/VCSM/src/features/feed/dal/listActorPostsByActor.dal.js         — Nested in posts
  apps/VCSM/src/features/post/postcard/dal/post.read.dal.js            — Nested in post detail
  apps/VCSM/src/features/post/postcard/dal/post.write.dal.js           — Handle resolution
  apps/VCSM/src/features/post/postcard/dal/postMentions.read.dal.js    — Mention resolution
  apps/VCSM/src/features/feed/dal/feed.mentions.dal.js                 — Mention resolution
  apps/VCSM/src/features/upload/dal/searchMentionSuggestions.js         — @mention search
  apps/VCSM/src/features/notifications/inbox/dal/senders.read.dal.js   — Notification senders
  apps/VCSM/src/features/profiles/dal/readActorIdByUsername.dal.js     — Username→actorId
  apps/VCSM/src/features/actors/dal/searchActors.dal.js                — Actor search
  apps/VCSM/src/features/settings/privacy/dal/blocks.dal.js            — Block list display

WENTREX FILES:
  apps/wentrex/src/features/actors/dal/getActorSummariesByIds.dal.js   — learning.actor_profiles query
  apps/wentrex/src/features/communication/setup.js                     — Chat engine config
  apps/wentrex/src/features/identity/resolvers/wentrexIdentity.resolver.js — Identity resolver


3. VCSM USER ACTOR HYDRATION PATH
====================================

Starting input: actorId (UUID from active actor link)

STEP 1 — Actor row read
  File:     identity.read.dal.js:62-72
  Function: readIdentityActorByIdDAL(actorId)
  Table:    vc.actors
  Select:   id, kind, profile_id, vport_id, is_void
  Gate:     RLS via can_view_actor() — BREAKS if actor_privacy_settings row missing

STEP 2 — Profile read (parallel with Step 3)
  File:     identity.read.dal.js:79-90
  Function: readProfileIdentityDAL(actor.profile_id)
  Table:    public.profiles
  Select:   id, display_name, username, email, photo_url, banner_url, bio,
            birthdate, age, sex, is_adult, discoverable, publish, last_seen,
            created_at, updated_at
  Fields:   16 total

STEP 3 — Privacy read (parallel with Step 2)
  File:     identity.read.dal.js:92-103
  Function: readActorPrivacyDAL(actorId)
  Table:    vc.actor_privacy_settings
  Select:   is_private
  Fields:   1

STEP 4 — Realm resolution (sequential before map)
  File:     identity.controller.js:54-75
  Function: resolveRealmId(actor)
  Table:    vc.realms
  Select:   id, created_at
  Logic:    WHERE is_void = actor.is_void, ORDER BY created_at ASC, LIMIT 1
  Fallback: First realm by created_at if no match

STEP 5 — Map to identity object
  File:     identity.controller.js:12-33
  Function: mapProfileActor(actor, profile, realmId)
  Output:   {
              actorId, kind: 'user', realmId, isVoid,
              displayName, username, email, avatar, banner, bio,
              birthdate, age, sex, isAdult, discoverable, publish,
              lastSeen, createdAt, updatedAt, private
            }

TOTAL QUERIES: 4 (1 sequential + 2 parallel + 1 sequential)
TABLES HIT:   vc.actors, public.profiles, vc.actor_privacy_settings, vc.realms


4. VCSM VPORT ACTOR HYDRATION PATH
=====================================

Starting input: actorId (UUID from active actor link)

STEP 1 — Actor row read (same as user)
  Table:    vc.actors
  Select:   id, kind, profile_id, vport_id, is_void

STEP 2 — Vport read (parallel with Steps 3, 4)
  File:     identity.read.dal.js:105-116
  Function: readVportIdentityDAL(actor.vport_id)
  Table:    vc.vports
  Select:   id, owner_user_id, name, slug, avatar_url, bio, is_active,
            banner_url, created_at, updated_at, vport_type
  Fields:   11 total

STEP 3 — Privacy read (parallel with Steps 2, 4)
  Table:    vc.actor_privacy_settings
  Select:   is_private

STEP 4 — Owner lookup (parallel with Steps 2, 3)
  File:     identity.read.dal.js:118-129
  Function: readActorOwnerUserDAL(actorId)
  Table:    vc.actor_owners
  Select:   user_id
  Fields:   1

STEP 5 — Owner actor resolution (sequential, only if owner found)
  File:     identity.read.dal.js:131-143
  Function: readUserActorByProfileIdDAL(ownerRow.user_id)
  Table:    vc.actors
  Select:   id
  Filter:   WHERE profile_id = ? AND kind = 'user'
  Purpose:  Get ownerActorId for the vport

STEP 6 — Realm resolution (same as user)
  Table:    vc.realms
  Select:   id, created_at

STEP 7 — Map to identity object
  File:     identity.controller.js:36-52
  Function: mapVportActor(actor, vport, realmId)
  Output:   {
              actorId, kind: 'vport', realmId, isVoid,
              displayName, username (=slug), avatar, banner, bio,
              isActive, vportType, createdAt, updatedAt,
              private, ownerActorId
            }

TOTAL QUERIES: 5-6 (1 seq + 3 parallel + 1 conditional seq + 1 seq)
TABLES HIT:   vc.actors (x2), vc.vports, vc.actor_privacy_settings, vc.actor_owners, vc.realms


5. WENTREX ACTOR HYDRATION PATH
==================================

Wentrex does NOT use the shared hydration engine for identity.
Wentrex does NOT have a hydrateActor-style pipeline.

Identity resolution returns: { actorId, organizationId, roleKeys, isSuspended }
No display_name/avatar/email enrichment happens during identity resolution.

Chat participant hydration (only hydration in Wentrex):

STEP 1 — Actor profile read
  File:     apps/wentrex/src/features/actors/dal/getActorSummariesByIds.dal.js
  Function: getActorSummariesByIdsDAL(actorIds)
  Table:    learning.actor_profiles
  Select:   actor_id, full_name, display_name, avatar_url
  Output:   { actor_id, display_name: (display_name || full_name), photo_url: avatar_url, kind: 'user' }

Admin member hydration:

STEP 1 — Actor read
  Table:    learning.actors
  Select:   id, user_id

STEP 2 — Profile read
  Table:    public.profiles (via user_id → profile lookup)
  Select:   id, display_name, username, email

TOTAL QUERIES: 1 (chat) or 2 (admin)
TABLES HIT:   learning.actor_profiles (chat) OR learning.actors + public.profiles (admin)


6. TABLES QUERIED DURING HYDRATION
=====================================

IDENTITY HYDRATION (System A):
  ┌─────────────────────────────┬────────────┬──────────────────────────────────────────┐
  │ Table                       │ Schema     │ Selected Fields                          │
  ├─────────────────────────────┼────────────┼──────────────────────────────────────────┤
  │ actors                      │ vc         │ id, kind, profile_id, vport_id, is_void  │
  │ profiles                    │ public     │ id, display_name, username, email,        │
  │                             │            │ photo_url, banner_url, bio, birthdate,    │
  │                             │            │ age, sex, is_adult, discoverable,         │
  │                             │            │ publish, last_seen, created_at, updated_at│
  │ vports                      │ vc         │ id, owner_user_id, name, slug, avatar_url,│
  │                             │            │ bio, is_active, banner_url, created_at,   │
  │                             │            │ updated_at, vport_type                    │
  │ actor_privacy_settings      │ vc         │ is_private                               │
  │ actor_owners                │ vc         │ user_id                                  │
  │ realms                      │ vc         │ id, created_at                           │
  └─────────────────────────────┴────────────┴──────────────────────────────────────────┘

BATCH SUMMARY RPC (System B):
  ┌─────────────────────────────┬────────────┬──────────────────────────────────────────┐
  │ Source                      │ Schema     │ Output Fields                            │
  ├─────────────────────────────┼────────────┼──────────────────────────────────────────┤
  │ get_actor_summaries RPC     │ vc         │ actor_id, kind, display_name, username,   │
  │                             │            │ photo_url, banner_url, bio, vport_name,   │
  │                             │            │ vport_slug, vport_avatar_url,             │
  │                             │            │ vport_banner_url                          │
  └─────────────────────────────┴────────────┴──────────────────────────────────────────┘
  (RPC internally joins actors + profiles + vports — single round-trip)

FEED BUNDLE (System D variant):
  ┌─────────────────────────────┬────────────┬──────────────────────────────────────────┐
  │ Table                       │ Schema     │ Selected Fields                          │
  ├─────────────────────────────┼────────────┼──────────────────────────────────────────┤
  │ actors                      │ vc         │ id, kind, profile_id, vport_id           │
  │ profiles                    │ public     │ id, display_name, username, photo_url    │
  │ actor_privacy_settings      │ vc         │ actor_id, is_private                     │
  │ vports                      │ vc         │ id, name, slug, avatar_url, is_active    │
  └─────────────────────────────┴────────────┴──────────────────────────────────────────┘

ACTOR_PRESENTATION VIEW (System D):
  ┌─────────────────────────────┬────────────┬──────────────────────────────────────────┐
  │ View                        │ Schema     │ Fields exposed                           │
  ├─────────────────────────────┼────────────┼──────────────────────────────────────────┤
  │ actor_presentation          │ vc         │ actor_id, kind, display_name, username,   │
  │                             │            │ photo_url, vport_name, vport_slug,        │
  │                             │            │ vport_avatar_url, vport_banner_url        │
  └─────────────────────────────┴────────────┴──────────────────────────────────────────┘

WENTREX:
  ┌─────────────────────────────┬────────────┬──────────────────────────────────────────┐
  │ Table                       │ Schema     │ Selected Fields                          │
  ├─────────────────────────────┼────────────┼──────────────────────────────────────────┤
  │ actor_profiles              │ learning   │ actor_id, full_name, display_name,        │
  │                             │            │ avatar_url                               │
  │ actors                      │ learning   │ id, user_id                              │
  │ profiles                    │ public     │ id, display_name, username, email         │
  └─────────────────────────────┴────────────┴──────────────────────────────────────────┘


7. FIELDS USED FROM EACH TABLE
=================================

vc.actors:
  ┌──────────────┬──────────────────────────────────────────────────────┐
  │ Field        │ Consumed by                                         │
  ├──────────────┼──────────────────────────────────────────────────────┤
  │ id           │ actorId in identity object, all lookups              │
  │ kind         │ Branching: user vs vport hydration path              │
  │ profile_id   │ FK to public.profiles (user actors)                  │
  │ vport_id     │ FK to vc.vports (vport actors)                       │
  │ is_void      │ Realm resolution, identity.isVoid                    │
  └──────────────┴──────────────────────────────────────────────────────┘
  ALL 5 FIELDS USED.

public.profiles:
  ┌──────────────┬──────────────────────────────────────────────────────┐
  │ Field        │ Consumed by                                         │
  ├──────────────┼──────────────────────────────────────────────────────┤
  │ id           │ Identity key (not exposed in final object)           │
  │ display_name │ identity.displayName, actor store, chat header       │
  │ username     │ identity.username, profile URL, @mentions            │
  │ email        │ identity.email (shown in settings)                   │
  │ photo_url    │ identity.avatar, actor store, chat avatar            │
  │ banner_url   │ identity.banner (profile banner image)               │
  │ bio          │ identity.bio (profile bio)                           │
  │ birthdate    │ identity.birthdate (age verification)                │
  │ age          │ identity.age (display only)                          │
  │ sex          │ identity.sex (display only)                          │
  │ is_adult     │ identity.isAdult (content gating)                    │
  │ discoverable │ identity.discoverable (search visibility)            │
  │ publish      │ identity.publish (profile public flag)               │
  │ last_seen    │ identity.lastSeen (online indicator)                 │
  │ created_at   │ identity.createdAt                                   │
  │ updated_at   │ identity.updatedAt                                   │
  └──────────────┴──────────────────────────────────────────────────────┘
  ALL 16 FIELDS USED (but some only in full identity, not batch).

vc.vports:
  ┌──────────────┬──────────────────────────────────────────────────────┐
  │ Field        │ Consumed by                                         │
  ├──────────────┼──────────────────────────────────────────────────────┤
  │ id           │ Internal key (not exposed in final object)           │
  │ owner_user_id│ NOT used by hydrator (owner resolved via actor_owners)│
  │ name         │ identity.displayName                                 │
  │ slug         │ identity.username (mapped as slug → username)        │
  │ avatar_url   │ identity.avatar                                      │
  │ bio          │ identity.bio                                         │
  │ is_active    │ identity.isActive                                    │
  │ banner_url   │ identity.banner                                      │
  │ created_at   │ identity.createdAt                                   │
  │ updated_at   │ identity.updatedAt                                   │
  │ vport_type   │ identity.vportType                                   │
  └──────────────┴──────────────────────────────────────────────────────┘
  10 of 11 USED. owner_user_id is SELECTED BUT NOT USED by the hydrator
  (owner is resolved through vc.actor_owners instead).

vc.actor_privacy_settings:
  ┌──────────────┬──────────────────────────────────────────────────────┐
  │ Field        │ Consumed by                                         │
  ├──────────────┼──────────────────────────────────────────────────────┤
  │ is_private   │ identity.private (true/false flag)                   │
  └──────────────┴──────────────────────────────────────────────────────┘
  1 FIELD USED. Also gates RLS via can_view_actor().

vc.actor_owners:
  ┌──────────────┬──────────────────────────────────────────────────────┐
  │ Field        │ Consumed by                                         │
  ├──────────────┼──────────────────────────────────────────────────────┤
  │ user_id      │ FK to find owner's vc.actors row → ownerActorId     │
  └──────────────┴──────────────────────────────────────────────────────┘
  1 FIELD USED. Vport hydration only.

vc.realms:
  ┌──────────────┬──────────────────────────────────────────────────────┐
  │ Field        │ Consumed by                                         │
  ├──────────────┼──────────────────────────────────────────────────────┤
  │ id           │ identity.realmId                                     │
  │ created_at   │ Sort key (ORDER BY ascending, pick first)            │
  └──────────────┴──────────────────────────────────────────────────────┘
  2 FIELDS USED.


8. REQUIRED VS OPTIONAL TABLES
==================================

VCSM USER ACTOR:
  ┌─────────────────────────────────┬────────────────────────────────────┐
  │ Table                           │ Classification                     │
  ├─────────────────────────────────┼────────────────────────────────────┤
  │ vc.actors                       │ REQUIRED_FOR_BASE_HYDRATION        │
  │ public.profiles                 │ REQUIRED_FOR_DISPLAY               │
  │ vc.actor_privacy_settings       │ OPTIONAL_ENRICHMENT*               │
  │ vc.realms                       │ OPTIONAL_ENRICHMENT                │
  └─────────────────────────────────┴────────────────────────────────────┘

  * actor_privacy_settings is optional for the HYDRATED OBJECT (defaults false),
    but REQUIRED for RLS to allow reading vc.actors in the first place.
    This is the known can_view_actor bug — a row MUST exist or the
    actor read in Step 1 fails.

VCSM VPORT ACTOR:
  ┌─────────────────────────────────┬────────────────────────────────────┐
  │ Table                           │ Classification                     │
  ├─────────────────────────────────┼────────────────────────────────────┤
  │ vc.actors                       │ REQUIRED_FOR_BASE_HYDRATION        │
  │ vc.vports                       │ REQUIRED_FOR_DISPLAY               │
  │ vc.actor_privacy_settings       │ OPTIONAL_ENRICHMENT*               │
  │ vc.actor_owners                 │ OPTIONAL_ENRICHMENT                │
  │ vc.actors (2nd read for owner)  │ OPTIONAL_ENRICHMENT                │
  │ vc.realms                       │ OPTIONAL_ENRICHMENT                │
  └─────────────────────────────────┴────────────────────────────────────┘

  * Same RLS dependency as above.

WENTREX ACTOR (chat):
  ┌─────────────────────────────────┬────────────────────────────────────┐
  │ Table                           │ Classification                     │
  ├─────────────────────────────────┼────────────────────────────────────┤
  │ learning.actor_profiles         │ REQUIRED_FOR_DISPLAY               │
  └─────────────────────────────────┴────────────────────────────────────┘


9. REDUNDANT OR DUPLICATED QUERIES
=====================================

FINDING 1: vc.vports.owner_user_id is SELECTED but NOT USED
  File:     identity.read.dal.js:23-35 (VPORT_COLUMNS)
  Issue:    readVportIdentityDAL selects owner_user_id, but vcsmActorHydrator.js
            resolves the owner through vc.actor_owners → vc.actors instead.
  Impact:   Wasted field in select. Minor — no extra round-trip.

FINDING 2: Duplicate actor data paths for the SAME actor
  Scenario: When the feed loads posts, it uses actor_presentation (inline FK join)
            to get author name/avatar. Then hydrateActorsFromRows() is called
            separately, hitting get_actor_summaries RPC for the SAME actorIds.
  Files:    feed.posts.dal.js (inline join) + hydrateActors.controller.js (RPC call)
  Impact:   Double read of the same actor display data.
  Why:      Feed pipeline fetches posts with embedded actor, then separately
            hydrates the actor store. The store doesn't check if data already
            exists from the inline join.

FINDING 3: readActorsBundle duplicates what get_actor_summaries RPC does
  File:     feed.read.actorsBundle.dal.js
  Issue:    This DAL manually joins vc.actors + public.profiles + vc.vports +
            vc.actor_privacy_settings using 4 separate queries.
            The get_actor_summaries RPC does the same join server-side in 1 call.
  Impact:   4 round-trips vs 1 RPC call for the same data.
  Context:  readActorsBundle appears to be a legacy pattern predating the RPC.

FINDING 4: Multiple actor_presentation query patterns
  Files:    15+ DAL files query vc.actor_presentation directly or via FK join
  Issue:    Each file independently selects a different subset of fields.
            No shared constant or pattern for which fields are selected.
  Impact:   Maintenance risk — adding a field to actor_presentation requires
            updating 15+ select statements.

FINDING 5: Notification senders use BOTH get_actor_summaries AND actor_presentation
  File:     notifications/inbox/dal/senders.read.dal.js
  Issue:    Has three alternative functions:
            - listActorSummaryRowsByIdsDAL → RPC get_actor_summaries
            - listActorPresentationRowsByIdsDAL → actor_presentation view
            - listActorIdentityRowsByIdsDAL → actors table
  Impact:   Three ways to get the same data in one file.

FINDING 6: Identity hydration reads vc.actors twice for vport owner resolution
  Path:     readIdentityActorByIdDAL(actorId) [Step 1]
            readActorOwnerUserDAL(actorId) → readUserActorByProfileIdDAL(user_id) [Step 5]
  Issue:    Second vc.actors read is only to get the owner's actor ID.
            If the first read returned the owner relationship (or actor_owners
            already had actor_id), this could be avoided.
  Impact:   1 extra query per vport hydration.


10. MINIMUM TABLE SET REQUIRED FOR HYDRATION
===============================================

A. IDENTITY COMMIT (minimum to store in useIdentity):

  USER ACTOR:
    MUST HAVE: vc.actors (kind, is_void) + public.profiles (display_name, username, photo_url)
    CAN SKIP:  vc.actor_privacy_settings (default false), vc.realms (nullable)
    MINIMUM:   2 tables, 2 queries

  VPORT ACTOR:
    MUST HAVE: vc.actors (kind, is_void) + vc.vports (name, slug, avatar_url)
    CAN SKIP:  vc.actor_privacy_settings, vc.actor_owners, vc.realms
    MINIMUM:   2 tables, 2 queries

B. HEADER/AVATAR/NAME DISPLAY:

  USER:  displayName + username + avatar → public.profiles only (3 fields)
  VPORT: displayName + username + avatar → vc.vports only (name, slug, avatar_url)

C. FEED VIEWER CONTEXT:

  Needs: actorId + kind + realmId + isVoid + private
  Tables: vc.actors + vc.realms + vc.actor_privacy_settings
  MINIMUM: 3 tables

D. CHAT PARTICIPANT DISPLAY:

  Already handled by actor_presentation view or get_actor_summaries RPC.
  No identity hydration needed — uses System B or D.
  MINIMUM: 1 query (RPC or view join)


11. FINAL HYDRATION DEPENDENCY GRAPH
=======================================

LOGIN / SESSION RESTORE:

  AuthProvider.onAuthStateChange(INITIAL_SESSION | SIGNED_IN)
    │
    ▼
  IdentityProvider useEffect
    │
    ▼
  loadDefaultIdentityForUser()
    │
    ├──► resolveAuthenticatedContext()                    [ENGINE]
    │    ├──► dalGetCurrentUser()                         → auth.users
    │    ├──► dalGetAppByKey('vcsm')                      → platform.apps
    │    ├──► resolveUserAppAccess()                      → platform.user_app_access
    │    ├──► resolveUserAppAccount()                     → platform.user_app_accounts
    │    ├──► dalGetStateForAccount()                     → platform.user_app_state
    │    ├──► dalGetPreferencesForAccount()               → platform.user_app_preferences
    │    ├──► vcsmAppContextResolver()                    → platform.user_app_actor_links
    │    └──► resolveActiveActor()                        (in-memory selection)
    │
    ├──► readIdentityActorByIdDAL(activeActor.actorId)    → vc.actors
    │
    ├──► hydrateIdentityActor(actorRow)
    │    │
    │    ▼
    │    hydrateActor() [ENGINE]
    │    │
    │    ▼
    │    getHydrator('vcsm', 'vc') → hydrateVcsmActor
    │    │
    │    ├── IF kind='user':
    │    │   ├──► readProfileIdentityDAL(profile_id)      → public.profiles    ┐
    │    │   ├──► readActorPrivacyDAL(actorId)            → vc.actor_privacy   ├ PARALLEL
    │    │   ├──► resolveRealmId(actor)                   → vc.realms          ┘
    │    │   └──► mapProfileActor()                       → final object
    │    │
    │    └── IF kind='vport':
    │        ├──► readVportIdentityDAL(vport_id)          → vc.vports          ┐
    │        ├──► readActorPrivacyDAL(actorId)            → vc.actor_privacy   ├ PARALLEL
    │        ├──► readActorOwnerUserDAL(actorId)          → vc.actor_owners    ┘
    │        ├──► readUserActorByProfileIdDAL(user_id)    → vc.actors (2nd)    SEQUENTIAL
    │        ├──► resolveRealmId(actor)                   → vc.realms
    │        └──► mapVportActor()                         → final object
    │
    ├──► attach _engineMeta { userId, userAppAccountId, actorLinkId }
    │
    ├──► VERSION GUARD (myVersion === _resolveVersion)
    ├──► OWNERSHIP GUARD (_engineMeta.userId === user.id)
    │
    └──► commitIdentity(hydratedIdentity)                 → React context
         ├── setPublicIdentity(toPublicIdentity(...))     → { actorId, kind, ownerActorId }
         └── useActorStore.getState().upsertActors([...]) → seeds batch store
             (display_name, username, photo_url, banner_url, kind, vport_* fields)
             This ensures ActorPill and useActorSummary render real data on first
             mount without waiting for a separate batch hydration event.


BATCH HYDRATION (comments, friends, feed, notifications):

  feature hook (e.g., useCommentThread, useFriendLists)
    │
    ├──► hydrateActorsFromRows(rows)
    │    ├──► extractActorIdsForHydration(rows)           (in-memory ID extraction)
    │    ├──► getActorSummariesByIdsDAL({ actorIds })     → vc.get_actor_summaries RPC
    │    └──► useActorStore.upsertActors(normalized)      → Zustand store
    │
    └──► Components read from useActorStore.actors[actorId]


12. HIGHEST-RISK HYDRATION BREAKPOINTS
=========================================

RISK 1: can_view_actor RLS blocks actor read if privacy row missing
  Severity: CRITICAL — entire identity fails, app shows blank
  Location: readIdentityActorByIdDAL → vc.actors (Step 1)
  Trigger:  New actor without actor_privacy_settings row
  Status:   KNOWN BUG — database fix pending

RISK 2: .single() on readIdentityActorByIdDAL throws on RLS denial
  Severity: HIGH — PGRST116 crash instead of graceful null
  Location: identity.read.dal.js:62-72
  Impact:   .single() expects exactly 1 row. If RLS blocks the read,
            0 rows returned → PGRST116 → unhandled error

RISK 3: readProfileIdentityDAL fails if profile row deleted
  Severity: MEDIUM — no profile → null fields everywhere
  Location: identity.read.dal.js:79-90
  Impact:   .single() throws if 0 rows. Should be .maybeSingle()

RISK 4: resolveRealmId fails silently → realmId = null
  Severity: LOW — features that need realmId may degrade
  Location: identity.controller.js:54-75
  Impact:   Realm-scoped queries fail or return wrong data

RISK 5: readActorsBundle is 4 round-trips for what 1 RPC does
  Severity: LOW (performance) — no functional risk
  Location: feed.read.actorsBundle.dal.js
  Impact:   Slower feed load, more database connections consumed

RISK 6: No actor store cache check before batch hydration
  Severity: LOW (performance)
  Location: hydrateActorsFromRows / hydrateActorsIntoStore
  Impact:   Same actors re-fetched on every feature load.
            No deduplication against already-cached actors in store.


SUMMARY
=========

Total tables involved in VCSM actor hydration: 6
  vc.actors, public.profiles, vc.vports, vc.actor_privacy_settings, vc.actor_owners, vc.realms

Total tables involved in batch hydration: 1 (via RPC that joins internally)
  vc.get_actor_summaries → actors + profiles + vports

Total tables in feed bundle (legacy): 4
  vc.actors, public.profiles, vc.actor_privacy_settings, vc.vports

Minimum for user identity:  2 (vc.actors + public.profiles)
Minimum for vport identity: 2 (vc.actors + vc.vports)
Minimum for display only:   1 (actor_presentation view or get_actor_summaries RPC)

Redundant patterns found: 6
Critical RLS risk: 1 (actor_privacy_settings missing row)
