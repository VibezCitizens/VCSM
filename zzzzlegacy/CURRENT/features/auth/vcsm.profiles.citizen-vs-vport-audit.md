CITIZEN VS VPORT PROFILE SYSTEM AUDIT
=========================================

Date: 2026-04-05
Method: Full-stack codebase + schema inspection across database, DAL, hydration, UI, feed, chat, search, notifications, privacy, and ownership


1. ACTOR KINDS IN THE SYSTEM
===============================

Only TWO actor kinds exist:

  kind = 'user'   → Citizen profile (personal identity)
  kind = 'vport'  → VPORT profile (business/service storefront)

Enforced at database level:
  vc.actors CHECK (kind = ANY (ARRAY['user'::text, 'vport'::text]))

Additional structural constraint:
  vc.actors CHECK actors_profile_or_vport:
    (profile_id IS NOT NULL AND vport_id IS NULL AND kind='user')
    OR
    (profile_id IS NULL AND vport_id IS NOT NULL AND kind='vport')

This means:
  - A user actor MUST have a profile_id and MUST NOT have a vport_id
  - A vport actor MUST have a vport_id and MUST NOT have a profile_id
  - No actor can be both
  - No actor can be neither

Where actor kind is checked in code:
  vcsmActorHydrator.js:35,47              → Hydration routing
  identitySelectors.js:1-2                → isUserActor, isVportActor
  profileKindRegistry.js:6-8             → UI screen dispatch
  assertActorOwnsVportActor.controller.js:24 → Only 'user' can own vports
  feedRowVisibility.model.js:49,59        → Different feed visibility rules
  memberActorPresentation.js:14,43        → Chat display routing
  PrivacyTab.view.jsx:15,31               → Privacy label differences
  vports.read.dal.js:60                   → Filter owned vport actors
  getProfileActorId.controller.js:9       → Find citizen actor among owned actors


2. DATABASE TABLES USED BY CITIZEN PROFILES
=============================================

TABLE: public.profiles
  Purpose:  Stores personal identity data for citizen users
  PK:       id (uuid)
  Columns:
    id              uuid        NOT NULL  (= auth.users.id)
    display_name    text        nullable
    username        text        nullable  UNIQUE + trigram indexed
    email           text        nullable
    birthdate       date        nullable
    age             integer     nullable
    sex             text        nullable
    is_adult        boolean     NOT NULL  default false
    bio             text        NOT NULL  default ''
    photo_url       text        NOT NULL  default '/avatar.jpg'
    banner_url      text        NOT NULL  default '/default-banner.jpg'
    created_at      timestamptz nullable  default now()
    updated_at      timestamptz nullable  default now()
    last_seen       timestamptz nullable
    follower_count  integer     NOT NULL  default 0
    following_count integer     NOT NULL  default 0
    discoverable    boolean     NOT NULL  default false
    publish         boolean     NOT NULL  default false

  RLS:
    profiles_public_read      → SELECT: true (anyone can read)
    profiles_insert_self      → INSERT: id = auth.uid()
    profiles_update_self      → UPDATE: id = auth.uid()

  Indexes:
    profiles_pkey                 UNIQUE on id
    profiles_username_unique      UNIQUE on username
    profiles_username_lower_key   UNIQUE on lower(username)
    idx_profiles_username_trgm    GIN trigram on username
    idx_profiles_display_name_trgm GIN trigram on display_name

TABLE: vc.actors (kind='user' rows)
  Purpose:  Actor record linking to profile
  Columns used for citizen:
    id              uuid
    kind            'user'
    profile_id      uuid → public.profiles.id (1:1 UNIQUE)
    vport_id        NULL (enforced by CHECK)
    is_void         boolean
    user_app_account_id  uuid → platform.user_app_accounts.id

TABLE: vc.actor_privacy_settings
  Purpose:  Privacy flag for the actor
  PK:       actor_id
  Columns:
    actor_id    uuid → vc.actors.id
    is_private  boolean  NOT NULL default false
    created_at  timestamptz
    updated_at  timestamptz

TABLE: vc.realms
  Purpose:  Organizational realm assignment
  PK:       id
  Columns:
    id          uuid
    name        text UNIQUE
    is_void     boolean
    created_at  timestamp


3. DATABASE TABLES USED BY VPORT PROFILES
============================================

TABLE: vc.vports
  Purpose:  Business/service storefront data
  PK:       id (uuid)
  Columns:
    id              uuid        NOT NULL  default gen_random_uuid()
    owner_user_id   uuid        nullable  → public.profiles.id
    name            text        NOT NULL  CHECK length(trim(name)) > 0
    slug            text        nullable  UNIQUE
    avatar_url      text        nullable
    bio             text        nullable
    banner_url      text        nullable
    is_active       boolean     NOT NULL  default true
    created_at      timestamptz NOT NULL  default now()
    updated_at      timestamptz nullable
    vport_type      text        NOT NULL  default 'other'
                    CHECK (vport_type IN ('artist','creator','dj','event planner',
                    'musician','photographer','public figure','videographer',
                    'barber','esthetician','fitness instructor','hairstylist',
                    'makeup artist','massage therapist','nail technician',
                    'yoga instructor','babysitter','caregiver','counselor',
                    'elder care','nanny','teacher','therapist','tutor',
                    'baker','bartender','caterer','chef','cook','restaurant',
                    'server','chiropractor','dentist','doctor','nurse',
                    'nutritionist','carpenter','cleaning service','contractor',
                    'electrician','gardener','handyman','landscaper','mechanic',
                    'painter','plumber','accountant','bookkeeper','business',
                    'consultant','designer','developer','engineer','lawyer',
                    'marketer','notary','organization','real estate','nonprofit',
                    'shop','vendor','athlete','coach','trainer','courier',
                    'delivery','driver','mover','rideshare','towing',
                    'truck driver','dog walker','pet sitter','gas station',
                    'exchange','other'))

  RLS:
    vports_public_read       → SELECT: is_active = true
    vports_owner_read        → SELECT: vc.is_vport_owner(id)
    vports_owner_update      → UPDATE: vc.is_vport_owner(id)
    vports_no_direct_insert  → INSERT: false (only via RPC)

TABLE: vc.actors (kind='vport' rows)
  Columns used for vport:
    id              uuid
    kind            'vport'
    profile_id      NULL (enforced by CHECK)
    vport_id        uuid → vc.vports.id (1:1 UNIQUE)
    is_void         boolean
    user_app_account_id  uuid

TABLE: vc.actor_owners
  Purpose:  Links actors to their owning auth user
  PK:       (actor_id, user_id) composite
  Columns:
    actor_id    uuid → vc.actors.id
    user_id     uuid → auth.users.id
    is_primary  boolean  NOT NULL default false
    is_void     boolean  NOT NULL default false
    created_at  timestamptz

  RLS:
    actor_owners_read_own    → SELECT: user_id = auth.uid()
    actor_owners_insert_self → INSERT: user_id = auth.uid()

  Constraint:
    one_void_per_user: UNIQUE(user_id) WHERE is_void = true

TABLE: vc.actor_privacy_settings (same as citizen)
TABLE: vc.realms (same as citizen)


4. CITIZEN HYDRATION PIPELINE
================================

Entry: hydrateVcsmActor() when actor.kind === 'user'
File:  apps/VCSM/src/features/hydration/vcsmActorHydrator.js:35-44

  actorId
    │
    ▼
  readIdentityActorByIdDAL(actorId)
    → vc.actors: id, kind, profile_id, vport_id, is_void
    │
    ├─► readProfileIdentityDAL(actor.profile_id)              ┐
    │   → public.profiles: 16 columns                        │ PARALLEL
    │                                                         │
    ├─► readActorPrivacyDAL(actor.id)                        │
    │   → vc.actor_privacy_settings: is_private              ┘
    │
    ├─► resolveRealmId(actor)
    │   → vc.realms: id, created_at (WHERE is_void = actor.is_void)
    │
    └─► mapProfileActor(actor, profile, realmId)

  OUTPUT SHAPE:
  {
    actorId:      actor.id
    kind:         'user'
    realmId:      resolved realm UUID
    isVoid:       actor.is_void
    displayName:  profile.display_name
    username:     profile.username
    email:        profile.email
    avatar:       profile.photo_url
    banner:       profile.banner_url
    bio:          profile.bio
    birthdate:    profile.birthdate
    age:          profile.age
    sex:          profile.sex
    isAdult:      profile.is_adult
    discoverable: profile.discoverable
    publish:      profile.publish
    lastSeen:     profile.last_seen
    createdAt:    profile.created_at
    updatedAt:    profile.updated_at
    private:      actor_privacy_settings.is_private
  }

  FILES INVOLVED:
    apps/VCSM/src/features/hydration/vcsmActorHydrator.js
    apps/VCSM/src/state/identity/identity.read.dal.js
    apps/VCSM/src/state/identity/identity.controller.js (mapProfileActor, resolveRealmId)

  QUERIES: 4 (1 sequential + 2 parallel + 1 sequential)
  TABLES:  vc.actors, public.profiles, vc.actor_privacy_settings, vc.realms


5. VPORT HYDRATION PIPELINE
===============================

Entry: hydrateVcsmActor() when actor.kind === 'vport'
File:  apps/VCSM/src/features/hydration/vcsmActorHydrator.js:47-66

  actorId
    │
    ▼
  readIdentityActorByIdDAL(actorId)
    → vc.actors: id, kind, profile_id, vport_id, is_void
    │
    ├─► readVportIdentityDAL(actor.vport_id)                 ┐
    │   → vc.vports: 11 columns                             │
    │                                                        │ PARALLEL
    ├─► readActorPrivacyDAL(actor.id)                       │
    │   → vc.actor_privacy_settings: is_private             │
    │                                                        │
    ├─► readActorOwnerUserDAL(actor.id)                     ┘
    │   → vc.actor_owners: user_id
    │
    ├─► readUserActorByProfileIdDAL(ownerRow.user_id)  (CONDITIONAL — only if owner found)
    │   → vc.actors: id (WHERE profile_id = ? AND kind = 'user')
    │
    ├─► resolveRealmId(actor)
    │   → vc.realms: id, created_at
    │
    └─► mapVportActor(actor, vport, realmId)

  OUTPUT SHAPE:
  {
    actorId:      actor.id
    kind:         'vport'
    realmId:      resolved realm UUID
    isVoid:       actor.is_void
    displayName:  vport.name
    username:     vport.slug
    avatar:       vport.avatar_url
    banner:       vport.banner_url
    bio:          vport.bio
    isActive:     vport.is_active
    vportType:    vport.vport_type
    createdAt:    vport.created_at
    updatedAt:    vport.updated_at
    private:      actor_privacy_settings.is_private
    ownerActorId: owner's user-kind actor UUID (or null)
  }

  FILES INVOLVED:
    apps/VCSM/src/features/hydration/vcsmActorHydrator.js
    apps/VCSM/src/state/identity/identity.read.dal.js
    apps/VCSM/src/state/identity/identity.controller.js (mapVportActor, resolveRealmId)

  QUERIES: 5-6 (1 seq + 3 parallel + 1 conditional seq + 1 seq)
  TABLES:  vc.actors (x2), vc.vports, vc.actor_privacy_settings, vc.actor_owners, vc.realms


6. ACTOR SUMMARY SOURCES
============================

A. RPC: vc.get_actor_summaries(p_actor_ids uuid[])

  Type:     SECURITY DEFINER, STABLE
  Purpose:  Batch fetch denormalized actor display data for both kinds
  Used by:  Feed comments, friend lists, notification senders, chat hydration

  SQL logic:
    SELECT
      a.id as actor_id,
      a.kind,
      CASE WHEN a.kind='user' THEN p.display_name WHEN a.kind='vport' THEN v.name END as display_name,
      CASE WHEN a.kind='user' THEN p.username     WHEN a.kind='vport' THEN v.slug END as username,
      CASE WHEN a.kind='user' THEN p.photo_url    WHEN a.kind='vport' THEN v.avatar_url END as photo_url,
      CASE WHEN a.kind='user' THEN p.banner_url   WHEN a.kind='vport' THEN v.banner_url END as banner_url,
      CASE WHEN a.kind='user' THEN p.bio          WHEN a.kind='vport' THEN v.bio END as bio,
      v.name as vport_name,
      v.slug as vport_slug,
      v.avatar_url as vport_avatar_url,
      v.banner_url as vport_banner_url
    FROM vc.actors a
      LEFT JOIN public.profiles p ON a.kind='user' AND p.id = a.profile_id
      LEFT JOIN vc.vports v ON a.kind='vport' AND v.id = a.vport_id
    WHERE a.id = ANY(p_actor_ids) AND coalesce(a.is_void, false) = false

  For CITIZEN:
    display_name = profiles.display_name
    username     = profiles.username
    photo_url    = profiles.photo_url
    banner_url   = profiles.banner_url
    bio          = profiles.bio
    vport_*      = all NULL

  For VPORT:
    display_name = vports.name
    username     = vports.slug
    photo_url    = vports.avatar_url
    banner_url   = vports.banner_url
    bio          = vports.bio
    vport_name   = vports.name
    vport_slug   = vports.slug
    vport_avatar_url = vports.avatar_url
    vport_banner_url = vports.banner_url

B. VIEW: vc.actor_presentation

  Purpose:  Pre-joined denormalized view for inline FK joins
  Security: security_invoker=true (respects caller's RLS)

  Definition:
    SELECT
      a.id AS actor_id,
      a.kind,
      COALESCE(p.display_name, p.username, v.name, 'Unknown') AS display_name,
      p.username,
      COALESCE(p.photo_url, v.avatar_url, '/avatar.jpg') AS photo_url,
      COALESCE(p.banner_url, v.banner_url, '/default-banner.jpg') AS banner_url,
      v.name AS vport_name,
      v.slug AS vport_slug,
      v.avatar_url AS vport_avatar_url,
      v.banner_url AS vport_banner_url,
      p.id AS profile_id,
      v.id AS vport_id
    FROM vc.actors a
      LEFT JOIN public.profiles p ON p.id = a.profile_id
      LEFT JOIN vc.vports v ON v.id = a.vport_id

  KEY DIFFERENCE from RPC:
    - RPC uses CASE to set display_name/photo_url per kind (clean separation)
    - View uses COALESCE (cascading fallback across both kinds)
    - View always populates display_name (falls back to username → vport name → 'Unknown')
    - RPC keeps NULLs where the kind doesn't match

  Used by:  15+ DAL files via nested FK joins in:
    feed posts, inbox entries, conversation members, search, mentions, notifications

C. Zustand Actor Store (in-memory cache)

  File:  apps/VCSM/src/state/actors/actorStore.js
  Shape per actor:
    {
      id, kind,
      displayName, username, photoUrl, bannerUrl, bio,       ← canonical camelCase
      display_name, photo_url, banner_url,                   ← legacy snake_case
      vportName, vportSlug, vportAvatarUrl, vportBannerUrl,  ← vport fields
    }


7. UI SCREENS RENDERING EACH PROFILE TYPE
=============================================

ROUTING DISPATCH:
  /profile/:actorId → ActorProfileScreen.jsx → useActorKind(actorId)
    → kind='user'  → PROFILE_KIND_REGISTRY['user']  → ActorProfileViewScreen
    → kind='vport' → PROFILE_KIND_REGISTRY['vport'] → VportProfileKindScreen

CITIZEN PROFILE SCREENS:

  Main screen:
    features/profiles/screens/views/ActorProfileViewScreen.jsx
  Header:
    features/profiles/screens/views/ActorProfileHeader.jsx
  Tabs:
    features/profiles/screens/views/ActorProfileTabs.jsx
      → Photos, Videos, Vibes, Tags (citizen-only), Friends

  Fields displayed:
    displayName, username, avatarUrl, bannerUrl, bio,
    followerCount, followingCount, private, discoverable, publish

  Citizen-exclusive features:
    - Tags tab
    - Friends tab
    - Email visible in settings
    - discoverable / publish toggles

VPORT PROFILE SCREENS:

  Kind dispatcher:
    features/profiles/kinds/vport/screens/VportProfileKindScreen.jsx
      → Determines vport_type → selects tab layout
  Main screen:
    features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx
  Header:
    features/profiles/kinds/vport/ui/vportprofileheader/VportProfileHeader.jsx
  Tabs (vary by vport_type):
    features/profiles/kinds/vport/ui/tabs/VportProfileTabs.jsx

  Tab layouts by vport_type:

    DEFAULT (other):        Portfolio, About, Reviews, Vibes, Photos, Subscribers
    BEAUTY & WELLNESS:      Portfolio, Services, Reviews, About, Vibes, Photos, Subscribers
    BARBER:                 Portfolio, Book, Services, Reviews, About, Photos, Vibes, Subscribers
    FOOD & HOSPITALITY:     Menu, Portfolio, Reviews, About, Services, Photos, Vibes, Subscribers
    GAS STATION:            Gas, Services, About, Reviews, Photos, Vibes, Subscribers
    EXCHANGE:               Rates, Services, Reviews, About, Photos, Vibes, Subscribers

  Owner-only tab:           Owner (dashboard + settings links)

  Fields displayed:
    displayName (=name), username (=slug), avatarUrl, bannerUrl, bio,
    vportType, isActive, followerCount

  Vport-exclusive features:
    - About tab (hours, contact, location, languages, payment methods)
    - Services tab
    - Reviews tab
    - Portfolio tab
    - Menu tab (food vports)
    - Gas prices tab (gas station vports)
    - Rates tab (exchange vports)
    - Booking/calendar tab (barber vports)
    - Owner dashboard tab

SETTINGS SCREENS:

  Dispatcher:
    features/settings/profile/adapter/ProfileTab.jsx
      → mode='vport' ? VportProfileTab : UserProfileTab

  Citizen settings:
    features/settings/profile/adapter/UserProfileTab.jsx
      → display_name, username (locked), bio, avatar, banner, email (locked)

  Vport settings:
    features/settings/profile/adapter/VportProfileTab.jsx
      → name, slug (locked), bio, avatar, banner (NO email field)


8. FEED BEHAVIOR FOR EACH PROFILE TYPE
==========================================

File: features/feed/model/feedRowVisibility.model.js

CITIZEN POSTS (actor.kind='user'):
  Visibility determined by:
    1. Block check (blocked → hidden)
    2. Profile exists? (missing → hidden)
    3. Privacy check:
       - is_private = false → VISIBLE
       - is_private = true AND is_owner → VISIBLE
       - is_private = true AND is_following → VISIBLE
       - is_private = true AND NOT following → HIDDEN
  Reason codes: "visible_user" or "private_not_following"

VPORT POSTS (actor.vport_id exists):
  Visibility determined by:
    1. Block check (blocked → hidden)
    2. is_active check only:
       - vport.is_active = true → VISIBLE
       - vport.is_active = false → HIDDEN
    3. NO privacy check (is_private not evaluated for vport feed posts)
  Reason codes: "visible_vport" or "inactive_vport"

AUTHOR DISPLAY IN FEED:
  File: features/feed/dal/feed.posts.dal.js
  File: state/actors/useActorSummary.js

  For citizen: display_name, username, photo_url from profiles
  For vport:   vport_name, vport_slug, vport_avatar_url from vports

  The useActorSummary hook uses cascading fallback:
    displayName: actor.displayName → actor.vportName → actor.username
    username:    actor.username → actor.vportSlug
    avatar:      actor.photoUrl → actor.vportAvatarUrl → '/avatar.jpg'


9. CHAT BEHAVIOR FOR EACH PROFILE TYPE
==========================================

CONVERSATION MEMBER MODEL:
  File: features/chat/conversation/model/ConversationMember.model.js

  Stores BOTH sets of fields for every member:
    kind, displayName, username, photoUrl              ← user fields
    vportName, vportSlug, vportAvatarUrl               ← vport fields

MEMBER ACTOR PRESENTATION:
  File: features/chat/conversation/lib/memberActorPresentation.js

  mapActorSummaryRow(summary):
    IF kind='vport':
      display_name = displayName ?? vportName
      username     = username ?? vportSlug
      photo_url    = photoUrl ?? vportAvatarUrl
    ELSE (user):
      display_name = displayName
      username     = username
      photo_url    = photoUrl

  actorNeedsFallback(actor):
    IF kind='vport':
      needs fallback if NONE of: vport_name, display_name, vport_slug, username, vport_avatar_url, photo_url
    ELSE:
      needs fallback if NONE of: display_name, username, photo_url

INBOX ENTRY:
  File: features/chat/inbox/model/InboxEntry.model.js

  Partner display uses fallback chain:
    displayName: a.display_name ?? a.vport_name
    username:    a.username ?? a.vport_slug
    photoUrl:    a.photo_url ?? a.vport_avatar_url ?? '/avatar.jpg'

CHAT HEADER:
  File: features/chat/conversation/components/ChatHeader.jsx

  Renders partner as ActorLink:
    displayName: partnerActor.displayName || partnerActor.username || 'User'
    avatar:      partnerActor.photoUrl || '/avatar.jpg'
    route:       /profile/{actorId}  (same route for both kinds)

CHAT SEARCH (new conversation):
  File: features/chat/start/dal/read/searchActors.dal.js

  Queries vc.actor_presentation with:
    WHERE username ILIKE exact
       OR display_name ILIKE pattern
       OR vport_name ILIKE pattern
       OR vport_slug ILIKE pattern

  Results show kind badge in StartConversationModal.jsx:
    kind='user'  → "Citizen"
    kind='vport' → "Vport"


10. SEARCH BEHAVIOR FOR EACH PROFILE TYPE
=============================================

ACTOR SEARCH (global):
  File: features/actors/dal/searchActors.dal.js

  Source: vc.actor_presentation
  Select: actor_id, kind, display_name, username, photo_url,
          vport_name, vport_slug, vport_avatar_url

  Result normalization (searchActors.model.js):
    displayName: row.vport_name ?? row.display_name ?? row.username ?? "Unknown"
    username:    row.vport_slug ?? row.username
    avatarUrl:   row.vport_avatar_url ?? row.photo_url

  NOTE: Vport fields take PRIORITY over user fields in search normalization.
  This means the model is optimized for vport display, with user as fallback.

CHAT START SEARCH:
  File: features/chat/start/controllers/searchDirectory.controller.js

  Normalization:
    username: a.username ?? a.vport_slug ?? null  (conditional fallback)

  UI badge:
    kind='user'  → "Citizen"
    kind='vport' → "Vport"

USERNAME → ACTOR RESOLUTION:
  File: features/profiles/dal/readActorIdByUsername.dal.js

  Source: vc.actor_presentation
  Only resolves by username (profile username), NOT by vport slug
  This means: /u/some-slug does NOT resolve vports through this path


11. OWNERSHIP MODEL
======================

CITIZEN OWNS VPORT — The ownership chain:

  auth.users (Supabase auth user)
    ↓ id
  public.profiles (citizen profile, id = auth.uid())
    ↓ id = vc.actors.profile_id
  vc.actors (kind='user', the citizen's actor)
    ↓ (shared user_id in actor_owners)
  vc.actor_owners (actor_id = vport_actor.id, user_id = auth.uid())
    ↓ actor_id
  vc.actors (kind='vport', the vport's actor)
    ↓ vport_id
  vc.vports (the business entity)

KEY RULES:
  - Only kind='user' actors can own vport actors
    (enforced in assertActorOwnsVportActor.controller.js:24)
  - A citizen can own MULTIPLE vports
    (actor_owners PK is (actor_id, user_id), one row per vport owned)
  - A vport can only have ONE owner
    (vports.owner_user_id is single FK)
  - actor_owners.is_primary indicates the primary ownership link
  - Vports cannot be directly inserted (RLS: vports_no_direct_insert → false)
    Must be created via vc.create_vport RPC

VPORT CREATION:
  File: features/vport/dal/vport.core.dal.js
  RPC:  vc.create_vport(p_name, p_slug, p_avatar_url, p_bio, p_banner_url, p_vport_type)
  Returns: { vport_id, actor_id, actor_link_id, user_app_account_id, slug, handle, name, vport_type }
  The RPC atomically:
    1. Creates vc.vports row
    2. Creates vc.actors row (kind='vport')
    3. Creates vc.actor_owners row
    4. Creates platform.user_app_actor_links row
    5. Creates vc.actor_privacy_settings row

OWNERSHIP VERIFICATION:
  File: features/booking/controller/assertActorOwnsVportActor.controller.js
    1. Verify requester is kind='user'
    2. Get requester's profile_id from vc.actors
    3. Query actor_owners for (target_actor_id, requester_profile_id)
    4. Return { ok: true, mode, ownerLink } or throw

SWITCHING BETWEEN CITIZEN AND VPORT:
  File: state/identity/identityContext.jsx → switchActor(actorId)
    1. resolveAuthenticatedContext → gets all actor links from platform
    2. Find target link in ctx.availableActors
    3. engineSwitchActiveActor → updates platform.user_app_preferences.active_actor_link_id
    4. loadIdentityForActorId(actorId) → full hydration
    5. setIdentity(nextIdentity) → React context update


12. PRIVACY MODEL
====================

SHARED PRIVACY TABLE:
  vc.actor_privacy_settings applies to BOTH citizen and vport actors
  Single field: is_private (boolean)

CITIZEN PRIVACY:
  actor_privacy_settings.is_private → controls profile visibility
  profiles.discoverable → controls search discoverability
  profiles.publish → controls publishing permission

  RLS function: vc.can_view_actor(p_actor_id)
    Logic:
      1. If current user owns the actor → true
      2. If is_private = false → true
      3. If current user follows the actor → true
      4. Otherwise → false (private + not following)

    CRITICAL BUG: If actor_privacy_settings row is MISSING,
    the function returns NULL (not false), which causes the
    vc.actors SELECT RLS policy to deny the read entirely.

  Feed privacy:
    feedRowVisibility.model.js enforces:
      private + not following → hidden
      private + following → visible
      public → visible

VPORT PRIVACY:
  actor_privacy_settings.is_private → controls vport visibility
  SAME can_view_actor function applies

  Feed visibility for vports:
    feedRowVisibility.model.js DOES NOT check is_private for vports
    Only checks vport.is_active
    This means: a private vport's posts are STILL visible in feed if is_active=true

  THIS IS A DISCREPANCY:
    Citizen posts: is_private gates feed visibility
    Vport posts:   is_private does NOT gate feed visibility (only is_active does)

PRIVACY UI:
  File: features/settings/privacy/ui/PrivacyTab.view.jsx
  Citizen: "Profile visibility" label
  Vport:   "VPORT visibility" label
  Same underlying dalSetActorPrivacy function


13. PROFILE FEATURE MATRIX
==============================

┌─────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│ Feature                     │ Citizen Profile              │ VPORT Profile                │
├─────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ Database table              │ public.profiles              │ vc.vports                    │
│ Actor kind                  │ 'user'                       │ 'vport'                      │
│ Display name source         │ profiles.display_name        │ vports.name                  │
│ Handle/username source      │ profiles.username            │ vports.slug                  │
│ Avatar source               │ profiles.photo_url           │ vports.avatar_url            │
│ Banner source               │ profiles.banner_url          │ vports.banner_url            │
│ Bio source                  │ profiles.bio                 │ vports.bio                   │
│ Email                       │ profiles.email               │ NONE                         │
│ Birthdate/age/sex           │ profiles.birthdate/age/sex   │ NONE                         │
│ is_adult                    │ profiles.is_adult            │ NONE                         │
│ Business type               │ NONE                         │ vports.vport_type (80+ types)│
│ Active status               │ N/A (always active)          │ vports.is_active             │
│ Owner                       │ Self (auth.uid)              │ Citizen via actor_owners      │
│ Created via                 │ Auth signup + trigger         │ vc.create_vport RPC          │
│ Privacy flag                │ actor_privacy_settings       │ actor_privacy_settings        │
│ Discoverable flag           │ profiles.discoverable        │ NONE                         │
│ Publish flag                │ profiles.publish             │ NONE                         │
│ Follower count (cached)     │ profiles.follower_count      │ NOT cached on vports table   │
│ Following count (cached)    │ profiles.following_count     │ NOT cached on vports table   │
│ Last seen                   │ profiles.last_seen           │ NONE                         │
│ Void state                  │ actor.is_void                │ actor.is_void                │
│                             │                              │                              │
│ FEED VISIBILITY             │                              │                              │
│ Post visibility gate        │ is_private + follow check    │ is_active only               │
│ Privacy blocks posts        │ YES                          │ NO (discrepancy)             │
│                             │                              │                              │
│ CHAT DISPLAY                │                              │                              │
│ Name field                  │ display_name                 │ vport_name (fallback chain)  │
│ Handle field                │ username                     │ vport_slug (fallback chain)  │
│ Avatar field                │ photo_url                    │ vport_avatar_url (fallback)  │
│                             │                              │                              │
│ SEARCH                      │                              │                              │
│ Searchable fields           │ username, display_name       │ vport_name, vport_slug       │
│ Kind badge                  │ "Citizen"                    │ "Vport"                      │
│                             │                              │                              │
│ PROFILE TABS                │                              │                              │
│ Photos                      │ YES                          │ YES                          │
│ Videos                      │ YES                          │ NO (in tab config)           │
│ Vibes (posts)               │ YES                          │ YES                          │
│ Tags                        │ YES (citizen-only)           │ NO                           │
│ Friends                     │ YES                          │ NO                           │
│ About                       │ NO                           │ YES (hours, contact, etc.)   │
│ Services                    │ NO                           │ YES                          │
│ Reviews                     │ NO                           │ YES                          │
│ Portfolio                   │ NO                           │ YES                          │
│ Booking                     │ NO                           │ YES (barber types)           │
│ Menu                        │ NO                           │ YES (food types)             │
│ Gas prices                  │ NO                           │ YES (gas station)            │
│ FX Rates                    │ NO                           │ YES (exchange)               │
│ Owner dashboard             │ NO                           │ YES (owner-only)             │
│ Subscribers                 │ NO (has followers list)      │ YES                          │
│                             │                              │                              │
│ HYDRATION                   │                              │                              │
│ Tables queried              │ 4                            │ 5-6                          │
│ Owner resolution            │ N/A                          │ actor_owners → actors         │
│ Realm resolution            │ YES                          │ YES                          │
│ Output fields               │ 20                           │ 15                           │
│                             │                              │                              │
│ IDENTITY OBJECT             │                              │                              │
│ email                       │ YES                          │ NO                           │
│ birthdate/age/sex           │ YES                          │ NO                           │
│ isAdult                     │ YES                          │ NO                           │
│ discoverable                │ YES                          │ NO                           │
│ publish                     │ YES                          │ NO                           │
│ lastSeen                    │ YES                          │ NO                           │
│ isActive                    │ NO                           │ YES                          │
│ vportType                   │ NO                           │ YES                          │
│ ownerActorId                │ NO                           │ YES                          │
└─────────────────────────────┴──────────────────────────────┴──────────────────────────────┘


14. SHARED VS UNIQUE FIELDS
===============================

SHARED (present in both profile types):
  actorId           (vc.actors.id)
  kind              (vc.actors.kind)
  realmId           (resolved from vc.realms)
  isVoid            (vc.actors.is_void)
  displayName       (profiles.display_name / vports.name)
  username          (profiles.username / vports.slug)
  avatar            (profiles.photo_url / vports.avatar_url)
  banner            (profiles.banner_url / vports.banner_url)
  bio               (profiles.bio / vports.bio)
  private           (actor_privacy_settings.is_private)
  createdAt         (profiles.created_at / vports.created_at)
  updatedAt         (profiles.updated_at / vports.updated_at)

CITIZEN-ONLY:
  email             (profiles.email)
  birthdate         (profiles.birthdate)
  age               (profiles.age)
  sex               (profiles.sex)
  isAdult           (profiles.is_adult)
  discoverable      (profiles.discoverable)
  publish           (profiles.publish)
  lastSeen          (profiles.last_seen)
  followerCount     (profiles.follower_count — cached on table)
  followingCount    (profiles.following_count — cached on table)

VPORT-ONLY:
  isActive          (vports.is_active)
  vportType         (vports.vport_type)
  ownerActorId      (resolved via actor_owners → actors)
  ownerUserId       (vports.owner_user_id)


15. RUNTIME RISKS CAUSED BY DIFFERENCES
==========================================

RISK 1: Feed privacy discrepancy
  Citizen posts: gated by is_private + follow state
  Vport posts:   NOT gated by is_private (only is_active)
  Impact: A private vport's posts remain visible in feed to non-followers
  File:   feedRowVisibility.model.js:49-60

RISK 2: can_view_actor returns NULL for missing privacy rows
  Both kinds affected equally
  Impact: Actor read blocked entirely by RLS, identity fails
  Status: Known DB fix pending

RISK 3: Vport follower/following counts not cached on table
  Citizen: profiles.follower_count / following_count cached
  Vport:   No equivalent columns on vc.vports
  Impact:  Vport subscriber counts must be computed at query time

RISK 4: Username-based routing doesn't resolve vport slugs
  readActorIdByUsername queries actor_presentation by username field only
  The username column in actor_presentation comes from profiles.username
  Vport slugs are in a separate column (vport_slug)
  Impact: /u/{vport-slug} may not resolve through this path

RISK 5: Search result normalization prioritizes vport fields
  searchActors.model.js: displayName = row.vport_name ?? row.display_name
  For citizen actors, vport_name is NULL, so display_name is used (correct)
  But if both are populated somehow, vport_name wins
  Impact: Minor — only a concern if data model assumptions break

RISK 6: Chat member fallback can produce mixed-kind display
  InboxEntry.model.js: displayName = a.display_name ?? a.vport_name
  If a vport actor has no vport_name but the view returns a display_name (via COALESCE),
  the vport may display as if it were a citizen
  Impact: "Unknown" displayed correctly via COALESCE, but kind context lost

RISK 7: actor_presentation view COALESCE vs RPC CASE logic difference
  View: COALESCE(p.display_name, p.username, v.name, 'Unknown') — mixes sources
  RPC:  CASE WHEN kind='user' THEN p.display_name — strict per-kind
  Impact: If a user actor somehow has a vport_id (impossible by CHECK, but worth noting),
  the view would leak cross-kind data. The RPC would not.

RISK 8: Settings email field absent for vport identity
  Citizen: email shown (locked) in profile settings
  Vport:   no email field at all
  Impact: Vport owners must switch to citizen to see/manage email


16. FINAL STRUCTURAL DIFFERENCES SUMMARY
============================================

The VCSM system implements a DUAL-IDENTITY architecture where:

ONE AUTH USER can control MULTIPLE ACTORS:
  - Exactly ONE citizen actor (kind='user', profile_id → public.profiles)
  - ZERO OR MORE vport actors (kind='vport', vport_id → vc.vports)

CITIZEN is the BASE IDENTITY:
  - Created automatically at signup (via database trigger)
  - Always primary (is_primary=true in actor links)
  - Owns all vport actors through vc.actor_owners
  - Has personal fields (email, birthdate, age, sex, last_seen)
  - Has social flags (discoverable, publish)
  - Has privacy-gated feed visibility

VPORT is a BUSINESS EXTENSION:
  - Created on-demand via RPC (vc.create_vport)
  - Never primary (is_primary=false)
  - Switchable (is_switchable=true)
  - Has business fields (vport_type, is_active)
  - Has type-specific tab layouts (80+ categories)
  - Has business features (services, booking, menu, gas prices, rates, reviews)
  - Feed visibility gated by is_active only (NOT privacy)

BOTH KINDS SHARE:
  - vc.actors as the universal identity anchor
  - vc.actor_privacy_settings for privacy flag
  - vc.realms for realm assignment
  - Same hydration engine pipeline (dispatched by kind)
  - Same actor store for display data
  - Same search surface (vc.actor_presentation view)
  - Same chat display pipeline (with kind-aware fallbacks)
  - Same notification sender display
  - Same /profile/:actorId route (dispatched by kind at UI layer)

THE SYSTEM IS UNIFIED BY:
  1. vc.actors table (single source of truth for all actor IDs)
  2. vc.actor_presentation view (denormalized display for both kinds)
  3. vc.get_actor_summaries RPC (batch summary with kind-aware CASE logic)
  4. Hydration engine (dispatches to kind-specific enrichment paths)
  5. Zustand actor store (caches both kinds in same shape with dual field sets)
  6. PROFILE_KIND_REGISTRY (dispatches to kind-specific UI screens)


APPENDIX A — SYSTEM DATA FLOW DIAGRAMS
==========================================

(Consolidated from former CITIZEN_VS_VPORT_DATA_MODEL_DIAGRAM.md)

A.1 CORE TABLE RELATIONSHIP DIAGRAM

                              ┌──────────────┐
                              │  auth.users   │
                              │  PK: id       │
                              └──────┬───────┘
                                     │
                           id = auth.uid()
                                     │
                 ┌───────────────────┼───────────────────┐
                 │                   │                   │
                 ▼                   ▼                   ▼
       ┌─────────────────┐  ┌──────────────┐   ┌──────────────────┐
       │ public.profiles  │  │vc.actor_owners│   │platform.user_app_│
       │ PK: id = uid()   │  │PK:(actor,user)│   │  accounts        │
       │                  │  │user_id=uid() │   │                  │
       │ display_name     │  │actor_id ─────┤   │ → preferences    │
       │ username         │  │is_primary    │   │ → actor_links    │
       │ email            │  │is_void       │   │ → state          │
       │ photo_url        │  └──────┬───────┘   └────────┬─────────┘
       │ banner_url       │         │                    │
       │ bio              │         │           active_actor_link_id
       │ birthdate, age   │         │                    │
       │ sex, is_adult    │         │                    ▼
       │ discoverable     │         │          ┌──────────────────────┐
       │ publish          │         │          │platform.user_app_    │
       │ last_seen        │         │          │  actor_links         │
       │ follower_count   │         │          │ actor_id             │
       │ following_count  │         │          │ actor_kind           │
       └────────┬─────────┘         │          │ actor_source='vc'    │
                │                   │          │ is_primary           │
      profile_id (1:1 UNIQUE)      │          │ is_switchable        │
                │                   │          │ display_name_snapshot│
                ▼                   ▼          │ avatar_url_snapshot  │
       ┌─────────────────────────────────┐     └──────────────────────┘
       │          vc.actors              │
       │  PK: id (uuid)                 │
       │  kind: 'user' | 'vport'        │
       │  profile_id → profiles (user)  │
       │  vport_id → vports (vport)     │
       │  is_void                       │
       │  user_app_account_id           │
       │                                │
       │  CHECK: kind='user' XOR        │
       │    profile_id/vport_id         │
       └──┬──────────┬──────────┬───────┘
          │          │          │
          │          │          │ vport_id (1:1 UNIQUE, vport only)
          │          │          │
          │          │          ▼
          │          │  ┌─────────���─────────┐
          │          │  │    vc.vports       │
          │          │  │  PK: id            │
          │          │  │  owner_user_id     │
          │          │  │  name              │
          │          │  │  slug (UNIQUE)     │
          │          │  │  avatar_url        │
          │          │  │  banner_url        │
          │          │  │  bio               │
          │          │  │  is_active         │
          │          │  │  vport_type        │
          │          │  └───────────────────┘
          │          │
          │          │ actor_id (1:1)
          │          ▼
          │  ┌──────────────────────────┐
          │  │vc.actor_privacy_settings │
          │  │  PK: actor_id            │
          │  │  is_private (boolean)    │
          │  └──────────────────────────┘
          │
          │ is_void → match
          ▼
   ┌──────────────┐
   │  vc.realms    │
   │  PK: id       │
   │  is_void      │
   │  name         │
   └──────────────┘


A.2 DENORMALIZED ACCESS PATH DIAGRAMS

  vc.actor_presentation (VIEW — security_invoker)
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  actors ──LEFT JOIN── profiles ──LEFT JOIN── vports                     │
  │                                                                         │
  │  CITIZEN ROW:                        VPORT ROW:                         │
  │  actor_id    = actors.id             actor_id    = actors.id            │
  │  kind        = 'user'                kind        = 'vport'             │
  │  display_name= profiles.display_name display_name= COALESCE(→vports.name)│
  │  username    = profiles.username     username    = NULL                  │
  │  photo_url   = profiles.photo_url    photo_url   = vports.avatar_url    │
  │  vport_name  = NULL                  vport_name  = vports.name          │
  │  vport_slug  = NULL                  vport_slug  = vports.slug          │
  │  profile_id  = profiles.id           profile_id  = NULL                 │
  │  vport_id    = NULL                  vport_id    = vports.id            │
  └──────────────────────────────────────────────────────────────────────────┘

  vc.get_actor_summaries (RPC — SECURITY DEFINER)
  ┌──────────────────────────────────────────────────────────────────────────┐
  │  actors ──LEFT JOIN── profiles (ON kind='user')                         │
  │         ──LEFT JOIN── vports   (ON kind='vport')                        │
  │                                                                         │
  │  CITIZEN:                            VPORT:                             │
  │  display_name= profiles.display_name display_name= vports.name         │
  │  username    = profiles.username     username    = vports.slug          │
  │  photo_url   = profiles.photo_url    photo_url   = vports.avatar_url   │
  │  vport_*     = NULL, NULL, NULL, NULL vport_name  = vports.name        │
  │                                      vport_slug  = vports.slug          │
  │                                      vport_avatar= vports.avatar_url   │
  └──────────────────────────────────────────────────────────────────────────┘


A.3 HYDRATION PIPELINE DIAGRAMS

  CITIZEN HYDRATION (4 queries):
  ┌��───────────────────────────────────────────────────────────┐
  │ readIdentityActorByIdDAL(actorId)                          │
  │   → vc.actors: id, kind, profile_id, vport_id, is_void    │
  │                                                            │
  │ ┌─ PARALLEL ────────────────────────────────────────────┐  │
  │ │ readProfileIdentityDAL(profile_id)                    │  │
  │ │   → public.profiles: 16 fields                        │  │
  │ │ readActorPrivacyDAL(actorId)                          │  │
  │ │   → vc.actor_privacy_settings: is_private             │  │
  │ └───────────────────────────────────────────────────────┘  │
  │                                                            │
  │ resolveRealmId(actor)                                      │
  │   → vc.realms: id (WHERE is_void = actor.is_void)         │
  │                                                            │
  │ mapProfileActor(actor, profile, realmId)                   │
  │   → 20-field identity object                               │
  └────────────────────────────────────────────────────────────┘

  VPORT HYDRATION (5-6 queries):
  ┌────────────────────────────────────────────────────────────┐
  │ readIdentityActorByIdDAL(actorId)                          │
  │   → vc.actors: id, kind, profile_id, vport_id, is_void    │
  │                                                            │
  │ ┌─ PARALLEL ────────────────────────────────────────────┐  │
  │ │ readVportIdentityDAL(vport_id)                        │  │
  │ │   → vc.vports: 11 fields                              │  │
  │ │ readActorPrivacyDAL(actorId)                          │  │
  │ │   → vc.actor_privacy_settings: is_private             │  │
  │ │ readActorOwnerUserDAL(actorId)                        │  │
  │ │   → vc.actor_owners: user_id                          │  │
  │ └───────────────────────────────────────────────────────┘  │
  │                                                            │
  │ readUserActorByProfileIdDAL(owner.user_id) (conditional)   │
  │   → vc.actors: id (WHERE profile_id=user_id, kind='user') │
  │                                                            │
  │ resolveRealmId(actor)                                      │
  │   → vc.realms: id                                          │
  │                                                            │
  │ mapVportActor(actor, vport, realmId)                       │
  │   → 15-field identity object + ownerActorId                │
  └────────────────────────────────────────────────────────────┘


A.4 UI CONSUMPTION LAYER DIAGRAM

  ┌──────────────────────────┐
  │     IDENTITY CONTEXT     │
  │   (useIdentity() hook)   │─────── Full hydrated object
  │   identityContext.jsx    │        Used by: header, settings, upload, gated routes
  └──────────┬───────────────┘
             │
             ▼
  ┌───────────────────���──────┐     ┌──────────────────────────┐
  │     PROFILE PAGE         │     │     ACTOR STORE          │
  │   ActorProfileScreen.jsx │     │   useActorSummary hook   │─── Lightweight summary
  │   → kind dispatch:       │     │   actorStore.js          │    Used by: feed, chat,
  │     user → citizen tabs  │     └──────────┬───────────────┘    comments, friends,
  │     vport → business tabs│                │                    notifications, search
  └──────────────────────────┘                ▼
                                   ┌──────────────────────────┐
                                   │   ALL LIST SURFACES      │
                                   │                          │
                                   │   Feed author card       │── displayName → vportName → username → 'User'
                                   │   Chat header            │── displayName || username || 'User'
                                   │   Inbox entry            │── display_name ?? vport_name
                                   │   Search result          │── vport_name ?? display_name ?? 'Unknown'
                                   │   Notification sender    │── explicit kind branch: user vs vport
                                   └──────────────────────────┘


A.5 RLS / PRIVACY LAYER DIAGRAMS

  vc.can_view_actor(p_actor_id) — SECURITY DEFINER, row_security OFF
  ┌──────────────────────────────────────────────────────────────┐
  │ FROM vc.actor_privacy_settings WHERE actor_id = p_actor_id   │
  │                                                              │
  │ CASE                                                         │
  │   is_actor_owner(p_actor_id)       → TRUE                   │
  │   is_private = FALSE               → TRUE                   │
  │   exists(active follow by viewer)  → TRUE                   │
  │   ELSE                             → FALSE                  │
  │ END                                                          │
  │                                                              │
  │ CRITICAL: If no privacy row exists → returns NULL → RLS      │
  │           treats as DENY. Actor read fails entirely.          │
  └──────────────────────────────────────────────────────────────┘

  vc.is_actor_owner(p_actor_id) — SECURITY DEFINER, row_security OFF
  ┌──────────────────────────────────────────────────────────────┐
  │ EXISTS (                                                      │
  │   FROM vc.actor_owners                                        │
  │   WHERE actor_id = p_actor_id                                 │
  │     AND user_id = auth.uid()                                  │
  │     AND is_void = false                                       │
  │ )                                                              │
  │                                                                │
  │ Works for BOTH citizen and vport actors.                       │
  │ Citizen: auth.uid() owns their own user-kind actor.            │
  │ Vport:   auth.uid() owns vport-kind actors they created.       │
  └──────────────────────────────────────────────────────────────┘

  FEED VISIBILITY (application-layer, NOT RLS):
  ┌──────────────────────────────────────────────────────────────┐
  │ feedRowVisibility.model.js                                    │
  │                                                                │
  │ CITIZEN: blocked? → hidden                                     │
  │          profile missing? → hidden                             │
  │          is_private=true AND NOT following AND NOT owner → hidden│
  │          else → visible                                        │
  │                                                                │
  │ VPORT:   blocked? → hidden                                     │
  │          is_active=false → hidden                              │
  │          else → visible                                        │
  │          (is_private NOT CHECKED for vport posts)              │
  └──────────────────────────────────────────────────────────────┘


A.6 STRUCTURAL BREAKPOINTS

BREAKPOINT 1: Missing actor_privacy_settings row → can_view_actor returns NULL → RLS DENY.  CRITICAL.
BREAKPOINT 2: readIdentityActorByIdDAL uses .single() → PGRST116 on RLS denial.  HIGH.
BREAKPOINT 3: readProfileIdentityDAL uses .single() → crash on deleted profile.  MEDIUM.
BREAKPOINT 4: Feed privacy asymmetry — vport posts NOT gated by is_private.  MEDIUM.
BREAKPOINT 5: actor_presentation VIEW username NULL for vports.  LOW-MEDIUM.
BREAKPOINT 6: Dual ownership paths could desync.  LOW.
BREAKPOINT 7: No cached follower counts on vc.vports.  LOW.
BREAKPOINT 8: Actor store fallback not kind-guarded.  VERY LOW.
