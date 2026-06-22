VCSM vs Wentrex — Full Pipeline Drift Analysis
=================================================

Side-by-side runtime comparison. All code working as of 2026-04-05.


1. VCSM User Creation Pipeline
---------------------------------

  Register:
    features/auth/controllers/register.controller.js
    → supabase.auth.signUp OR auth.updateUser (anonymous upgrade)
    → upsert public.profiles
    → mirrors Wanders session if applicable

  Onboarding:
    features/auth/controllers/onboarding.controller.js
    → validate displayName + username + birthdate
    → generateUsernameDAL() → deterministic handle
    → createUserActorForProfile() → INSERT vc.actors + vc.actor_owners
    → ensureVcsmPlatformBootstrap() → platform.provision_vcsm_identity RPC

  Provision RPC creates:
    platform.user_app_access
    platform.user_app_accounts
    platform.user_app_preferences
    platform.user_app_state
    (NOTE: does NOT create actor links — those come from vc.create_vport or self-heal)


2. Wentrex User Creation Pipeline
------------------------------------

  Admin registers student:
    learning/administration/screens/RegisterStudentScreen.jsx
    → INSERT learning.actors (user_id, organization_id, is_active)
    → INSERT learning.actor_access (can_access_learning_center)

  First login triggers provisioning:
    features/identity/controller/provisionWentrexIdentity.controller.js
    → resolveWentrexActorForProvisioning() → finds learning.actors row
    → dalProvisionWentrexIdentity({ actorId, organizationId })
    → platform.provision_wentrex_identity RPC (SECURITY DEFINER)

  Provision RPC creates:
    platform.user_app_access
    platform.user_app_accounts
    platform.user_app_preferences (with active_actor_link_id SET)
    platform.user_app_state (with onboarding_status, destination, organization_id)
    platform.user_app_actor_links (with meta.organization_id)


3. User Creation Drift Points
-------------------------------

  | Aspect                     | VCSM                          | Wentrex                        |
  |----------------------------|-------------------------------|--------------------------------|
  | Who creates the user?      | User self-registers           | Admin creates via dashboard    |
  | Actor schema               | vc.actors + vc.actor_owners   | learning.actors                |
  | Actor kind                 | 'user' or 'vport'             | learning_actor (single kind)   |
  | Provision trigger          | Onboarding + self-heal        | First login                    |
  | Actor links at provision   | NOT created by RPC            | Created by RPC with org meta   |
  | Prefs set at provision     | Empty (no active link)        | Set with active_actor_link_id  |
  | State at provision         | Default (pending onboarding)  | Completed with destination     |
  | Anonymous upgrade          | YES (Wanders path)            | NO                             |
  | Privacy row created        | NO (known RLS gap)            | N/A (no privacy concept)       |

  CRITICAL DRIFT: Wentrex provision RPC is MORE COMPLETE.
  It creates actor links AND sets preferences in one atomic call.
  VCSM provision creates the account shell but leaves links and prefs empty.


4. VCSM Login Pipeline
-------------------------

  LoginScreen → useLogin → signInWithPassword → supabase.auth
  → hydrateAuthSession (getSession)
  → ensureProfileDiscoverable
  → navigate('/feed') ← BEFORE identity resolves
  → AuthProvider onAuthStateChange fires
  → IdentityProvider effect: setIdentity(null) + resolve
  → resolveAuthenticatedContext({ appKey: 'vcsm' })
  → vcsmIdentity.resolver reads ALL active vc actor links (array)
  → engine resolveActiveActor (prefs → state → primary → first)
  → readIdentityActorByIdDAL (vc.actors — RLS gated)
  → hydrateIdentityActor (profiles/vports + realm)
  → ownership guard + version guard
  → setIdentity(hydratedIdentity)


5. Wentrex Login Pipeline
----------------------------

  LoginScreen → useLogin → signInWithPassword → supabase.auth
  → WentrexIdentityContext subscription catches SIGNED_IN
  → provisionWentrexIdentity() runs (provision + resolve in one call)
  → resolveAuthenticatedContext({ appKey: 'wentrex' })
  → wentrexIdentity.resolver reads actor links + roles + memberships
  → engine resolveActiveActor
  → context returned with roleKeys → role-based destination
  → navigate to role destination ← AFTER identity resolves


6. Login Drift Points
-----------------------

  | Aspect                     | VCSM                          | Wentrex                        |
  |----------------------------|-------------------------------|--------------------------------|
  | Redirect timing            | BEFORE identity resolves      | AFTER identity resolves        |
  | Provision on login         | Only via self-heal fallback   | Always (provisionWentrexIdentity) |
  | Identity provider          | React effect on [user?.id]    | Auth state subscription        |
  | Role-based routing         | No (always /feed)             | Yes (admin/teacher/student/parent) |
  | Session verification       | getUser() (network)           | getSession() then provision    |
  | Self-heal                  | Yes (complex multi-step)      | Built into provision call      |

  CRITICAL DRIFT: VCSM redirects BEFORE identity.
  Wentrex waits for identity before navigating.


7. VCSM Identity Resolution Pipeline
---------------------------------------

  Engine: resolveAuthenticatedContext (shared)
  App resolver: vcsmIdentity.resolver.js
    → queries platform.user_app_actor_links WHERE actor_source='vc', status='active'
    → returns ALL links as array
    → engine resolveActiveActor picks winner
  Hydration: hydrateActor via vcsmActorHydrator
    → vc.actors → public.profiles OR vc.vports → realm
  Actor kinds: 'user' (citizen) or 'vport' (business)
  Role system: NONE (empty roleKeys)
  Multi-actor: YES (citizen + vport switching)


8. Wentrex Identity Resolution Pipeline
------------------------------------------

  Engine: resolveAuthenticatedContext (shared)
  App resolver: wentrexIdentity.resolver.js
    → queries platform.user_app_actor_links (usually 1 link)
    → queries learning.actor_access (suspended check)
    → queries learning.organization_memberships (roles)
    → queries learning.parent_student_links (parent check)
    → queries learning.course_memberships (student check)
    → returns 1 link + computed roleKeys
  Hydration: built into resolver (returns actor context directly)
  Actor kinds: learning_actor (single kind)
  Role system: admin, teacher, staff, parent, student
  Multi-actor: NO (single actor per account)


9. Identity Drift Points
---------------------------

  | Aspect                     | VCSM                          | Wentrex                        |
  |----------------------------|-------------------------------|--------------------------------|
  | Resolver complexity        | Simple (just reads links)     | Complex (5+ queries for roles) |
  | Actor count per account    | 1-N (citizen + vports)        | 1 (single learning actor)      |
  | Role keys                  | Always empty                  | Computed from memberships      |
  | Capabilities               | Always empty                  | Always empty                   |
  | Default destination        | /feed (always)                | Role-based (/dashboard, etc.)  |
  | Suspended check            | Platform state only           | Platform + learning.actor_access |
  | Hydration source           | vc.actors + profiles/vports   | Inline in resolver             |
  | Active actor selection     | Engine prefs/state/fallback   | Usually only 1 link            |

  CRITICAL DRIFT: VCSM resolver is simpler but multi-actor.
  Wentrex resolver is complex (role computation) but single-actor.


10. VCSM Chat Full Pipeline
------------------------------

  Setup: features/chat/setup.js → configureChatEngine
    supabaseClient, getActorSummariesByIds (vc.get_actor_summaries RPC),
    resolveRealm, searchActors (vc.actor_presentation), checkBlockRelation

  Start conversation:
    useStartConversation → startDirectConversation (engine)
    → resolvePickedActor → resolveRealm → checkBlock
    → getOrCreateDirectConversation RPC (chat.get_or_create_direct_conversation)
    → openConversation → navigate

  Inbox: useInbox → engine → chat.inbox_entries
  Conversation: useConversation + useConversationMessages + useConversationMembers (engine)
  Send: engine sendMessageController → chat.send_message_atomic RPC
  Partner name: resolvePartnerActor → member.vportName / member.displayName

  Actor summaries source: vc.get_actor_summaries RPC
  Block check: moderation.blocks (bidirectional)
  Search: vc.actor_presentation view


11. Wentrex Chat Full Pipeline
---------------------------------

  Setup: features/communication/setup.js → configureChatEngine
    supabaseClient, getActorSummariesByIds (learning.actor_profiles query),
    resolveRealm, resolveConversationPolicy (LMS messaging rules),
    defaultActorSource: 'learning',
    searchActors (learning.actor_profiles), resolveActorRealmContext: () => null,
    checkBlockRelation: () => false

  Start conversation:
    InboxScreen → learning.get_messageable_contacts RPC → policy check
    → startDirectConversation (engine) → navigate

  Inbox: useInbox → engine → chat.inbox_entries
  Conversation: useConversation + useConversationMessages + useConversationMembers (engine)
  Send: engine sendMessageController → chat.send_message_atomic RPC
  Partner name: members → exclude self → member.displayName

  Actor summaries source: learning.actor_profiles table
  Block check: always false (no blocking in LMS)
  Search: learning.actor_profiles
  Policy: LMS role-based (admin↔staff, staff↔parent, student↔staff, student↔parent)


12. Chat Drift Points
------------------------

  | Aspect                     | VCSM                          | Wentrex                        |
  |----------------------------|-------------------------------|--------------------------------|
  | Actor summary source       | vc.get_actor_summaries RPC    | learning.actor_profiles table  |
  | Actor source tag            | 'vc'                          | 'learning'                     |
  | Block system               | Bidirectional moderation.blocks  | None (always false)            |
  | Messaging policy           | None (anyone can message)     | LMS role-based restrictions    |
  | Contact search             | vc.actor_presentation view    | learning.actor_profiles        |
  | Realm resolution           | resolveRealm(isVoid)          | () => null (default realm)     |
  | Partner display for vport  | vportName / vportSlug fields  | N/A (no vports)                |
  | Conversation creation RPC  | chat.get_or_create_direct_conv | Same engine path               |
  | Messageable contacts       | Search anyone                 | RPC: learning.get_messageable_contacts |

  CRITICAL DRIFT: VCSM has vport-specific display fields and block checking.
  Wentrex has LMS role-based messaging policy and no blocks.


13. VCSM Logout Pipeline
---------------------------

  AuthProvider.logout():
    setSession(null), setUser(null)
    localStorage: remove actor_kind, actor_vport_id
    clearAllIdentityStorage() → remove all vc.identity.actorId.* keys
    sessionStorage: clear debug stores
    dispatch actor:changed event
    navigate('/login')
    supabase.auth.signOut({ scope: 'local' })
    remove all Supabase realtime channels


14. Wentrex Logout Pipeline
------------------------------

  TopBar → handleLogout():
    logoutCleanup() → engine logoutCleanup controller
    supabase.auth.signOut()
    WentrexIdentityContext subscription catches SIGNED_OUT
    Context clears: { loading: false, context: null, error: null }
    Navigate to '/'


15. Logout Drift Points
--------------------------

  | Aspect                     | VCSM                          | Wentrex                        |
  |----------------------------|-------------------------------|--------------------------------|
  | Local cache cleared        | Actor + identity + debug      | Auth session only              |
  | Debug state cleared        | Yes (sessionStorage)          | No debug stores                |
  | Realtime channels          | Explicitly removed            | Not explicitly removed         |
  | Custom events dispatched   | actor:changed event           | None                           |
  | Navigate timing            | Before signOut (optimistic)   | After context clears           |
  | Identity storage cleared   | All userId-scoped keys        | N/A                            |

  CRITICAL DRIFT: VCSM logout is more thorough.
  Wentrex relies on context null-out via subscription.


16. Shared Engines Used by Both Apps
---------------------------------------

  engines/identity/ — resolveAuthenticatedContext, switchActiveActor, logoutCleanup
  engines/chat/     — useInbox, useConversation, useConversationMessages, sendMessage, etc.
  engines/hydration/ — hydrateActor (VCSM only — Wentrex hydrates inline)


17. App-Specific Resolver/Hydration Differences
---------------------------------------------------

  VCSM:
    Resolver: reads platform actor links only, returns array, no roles
    Hydration: separate engine (vcsmActorHydrator → vc.actors → profiles/vports)
    Actor enrichment: vc.get_actor_summaries RPC

  Wentrex:
    Resolver: reads links + 4 learning tables for roles, returns 1 link + roleKeys
    Hydration: inline in resolver (no separate hydration engine call)
    Actor enrichment: learning.actor_profiles table query


18. Database Tables Touched by Each App
------------------------------------------

  SHARED (both apps):
    platform.apps, platform.user_app_access, platform.user_app_accounts,
    platform.user_app_preferences, platform.user_app_state,
    platform.user_app_actor_links,
    chat.conversations, chat.conversation_members, chat.messages,
    chat.inbox_entries, chat.outbox_events

  VCSM only:
    vc.actors, vc.actor_owners, vc.vports, vc.actor_privacy_settings,
    vc.actor_presentation, moderation.blocks, vc.realms,
    public.profiles

  Wentrex only:
    learning.actors, learning.actor_access, learning.actor_profiles,
    learning.organization_memberships, learning.parent_student_links,
    learning.course_memberships, learning.organizations


19. Exact Files Where Drift Begins
-------------------------------------

  Identity setup:
    VCSM: apps/VCSM/src/features/identity/setup.js
    Wentrex: apps/wentrex/src/features/identity/setup.js

  App resolver:
    VCSM: apps/VCSM/src/features/identity/resolvers/vcsmIdentity.resolver.js
    Wentrex: apps/wentrex/src/features/identity/resolvers/wentrexIdentity.resolver.js

  Chat setup:
    VCSM: apps/VCSM/src/features/chat/setup.js
    Wentrex: apps/wentrex/src/features/communication/setup.js

  Provision RPC:
    VCSM: platform.provision_vcsm_identity (account shell only)
    Wentrex: platform.provision_wentrex_identity (full provisioning including links)

  Partner display:
    VCSM: features/chat/conversation/lib/resolvePartnerActor.js (vport-aware)
    Wentrex: inline member.displayName (no vport concept)


20. Highest-Risk Drift Points Likely Causing Bugs
----------------------------------------------------

  1. VCSM provision RPC does NOT create actor links
     Wentrex provision RPC DOES create actor links
     → VCSM accounts can have zero links after provision
     → Fix: update provision_vcsm_identity to match Wentrex pattern

  2. VCSM redirects BEFORE identity resolves
     Wentrex redirects AFTER identity resolves
     → VCSM users see loading state on /feed
     → Risk of rendering with null identity

  3. VCSM can_view_actor RLS returns NULL for missing privacy rows
     Wentrex has no equivalent RLS function (learning.actors has simpler RLS)
     → VCSM actors without privacy rows are invisible to client
     → Fix: update can_view_actor to handle missing rows

  4. VCSM ConversationMemberModel maps vport fields
     Wentrex has no vport concept
     → VCSM-specific display logic needs vport fields passed through
     → Recently fixed (added vportName/vportSlug/vportAvatarUrl to model)

  5. VCSM actor switching is multi-actor
     Wentrex is single-actor
     → VCSM resolver must handle array of links deterministically
     → Recently fixed (resolver now queries array, not maybeSingle)
