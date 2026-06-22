# Actor Directory Projection Pipeline

Updated: 2026-04-06

## Overview

`identity.actor_directory` is a materialized projection table that stores searchable, presentation-ready actor data from multiple source schemas (vc, learning). It serves as the single source of truth for:

- Explore / search results (via `identity.search_actor_directory` RPC)
- Actor discovery across apps
- Unified actor presentation data (display_name, avatar, username, bio, privacy, visibility)

## Architecture

```
Source Tables (writes)                     Projection Table
─────────────────────                     ─────────────────
vc.actors                  ──┐
public.profiles            ──┤
vc.vports                  ──┤──→  identity.actor_directory
vc.actor_privacy_settings  ──┤       (refreshed on source mutation)
learning.actors            ──┤
learning.actor_profiles    ──┘

Search Consumers (reads)
─────────────────────────
VCSM Explore Screen  ──→  identity.search_actor_directory(RPC)
                               ↓
                           identity.actor_directory
                               ↓
                           moderation.blocks (server-side filter)
                               ↓
                           ranked, deduplicated, block-filtered results
```

## Refresh Strategy

### When to refresh
The projection is refreshed via `identity.refresh_actor_directory_row(p_actor_domain, p_actor_id)` immediately after a successful source-of-truth mutation.

### VCSM refresh points (implemented)

| Mutation | File | Actor type | Trigger |
|----------|------|------------|---------|
| Profile edit (user) | `Profile.controller.core.js` | user | After `updateProfile()` succeeds |
| Profile edit (vport) | `Profile.controller.core.js` | vport | After `updateProfile()` succeeds |
| Privacy toggle | `actorPrivacy.controller.js` | user | After `dalSetActorPrivacy()` succeeds |
| Vport creation | `vport.core.dal.js` | vport | After `create_vport` RPC succeeds |
| Vport edit | `vport.core.dal.js` | vport | After vport update succeeds |
| User actor creation | `createUserActor.controller.js` | user | After actor + ownership created |

### Wentrex refresh points (implemented)

| Mutation | File | Actor type | Trigger |
|----------|------|------------|---------|
| Student registration | `RegisterStudentScreen.jsx` | learning | After actor_profiles upsert |
| Parent profile edit | `ParentSettingsScreen.jsx` | learning | After actor_profiles upsert |

### Remaining (not yet wired — server-side edge functions)

| Mutation | Location | Notes |
|----------|----------|-------|
| create-student edge function | `supabase/functions/create-student/` | Server-side; should call refresh RPC directly in SQL |
| create-parent edge function | `supabase/functions/create-parent/` | Server-side; should call refresh RPC directly in SQL |
| create-org-member edge function | `supabase/functions/create-org-member/` | Server-side; should call refresh RPC directly in SQL |

Recommended: add `SELECT identity.refresh_actor_directory_row('learning', v_actor_id)` at the end of each edge function after actor creation succeeds.

## Search RPC

### identity.search_actor_directory

Single unified search endpoint. Replaces:
- `vc.search_directory` (old user search)
- `vc.search_vports` (old vport search)
- Client-side privacy filtering via `vc.actor_privacy_settings`
- Client-side block filtering via `moderation.blocks`
- Client-side actor bridge via `vc.actors` (profile_id → actor_id resolution)

Server-side enforcement:
- Only returns `is_active = true`, `is_void = false`, `is_hydratable = true`
- Only returns `is_listable_in_app = true`, `discoverable = true`, `publish = true`
- Excludes private actors (`is_private = false`)
- Excludes blocked actors (bidirectional check against `moderation.blocks`)
- Trigram-powered fuzzy matching via `pg_trgm` with ranked scoring
- Results ordered by rank (exact match > prefix > fuzzy), then alphabetical

### Parameters

```
p_viewer_domain text     — 'vc' or 'learning'
p_viewer_actor_id uuid   — current user's active actor ID
p_query text             — search string
p_filter text            — 'all' | 'users' | 'vports'
p_limit integer          — max results (default 20)
p_offset integer         — pagination offset (default 0)
```

### Result shape

```
result_type text         — always 'actor'
actor_domain text        — 'vc' or 'learning'
actor_id uuid
actor_kind text          — 'user' or 'vport'
display_name text
username text
avatar_url text
banner_url text
bio text
is_private boolean
is_listable_in_app boolean
discoverable boolean
publish boolean
rank double precision    — relevance score (higher = better match)
```

## Frontend Integration

### VCSM search flow

```
SearchScreen.view.jsx
  → 300ms debounce
  → useSearchTabsActor({ query, filter, viewerActorId })
    → ctrlSearchTabs({ query, filter, viewerActorId })
      → searchDal routes by filter
        → search.actors() / search.users() / search.vports()
          → supabase.schema('identity').rpc('search_actor_directory', {...})
          → normalize to frontend shape
          → background hydrate via @hydration engine
  → ResultList renders FeaturedResultCard + ActorSearchResultRow
  → click → /profile/{actorId}
```

### Reusable DAL helpers

**VCSM:** `apps/VCSM/src/features/identity/dal/refreshActorDirectory.dal.js`
- `refreshActorDirectoryRow(actorDomain, actorId)` — generic
- `refreshVcActorDirectory(actorId)` — convenience for VC

**Wentrex:** `apps/wentrex/src/features/identity/dal/refreshActorDirectory.dal.js`
- `refreshActorDirectoryRow(actorDomain, actorId)` — generic
- `refreshLearningActorDirectory(actorId)` — convenience for learning

Both helpers:
- Call `identity.refresh_actor_directory_row` RPC
- Non-fatal (log failure, don't block primary operation)
- DEV-gated console warnings

## Database Objects

| Object | Schema | Purpose |
|--------|--------|---------|
| `identity.actor_directory` | identity | Materialized projection table |
| `identity.search_actor_directory()` | identity | Search RPC with trigram ranking + block filtering |
| `identity.refresh_actor_directory_row()` | identity | Upsert single actor row from source tables |
| `pg_trgm` extension | public | Trigram similarity for fuzzy search |

### Indexes

- `actor_directory_display_name_trgm_idx` — GIN trigram on display_name
- `actor_directory_username_trgm_idx` — GIN trigram on username
- `actor_directory_search_flags_idx` — composite B-tree on visibility flags
- `blocks_lookup_idx` — composite on blocker → blocked
- `blocks_reverse_lookup_idx` — composite on blocked → blocker
