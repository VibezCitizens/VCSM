# Engine: Identity

You are working inside a monorepo, but your scope is strictly limited.

## Working Directory

Your ONLY allowed working directory is:

```
/Users/vcsm/Desktop/VCSM/engines/identity
```

## Strict Scope Rules

1. **NEVER modify anything outside** `/Users/vcsm/Desktop/VCSM/engines/identity`
2. **NEVER import from** `/apps`, `/engines/chat`, `/engines/hydration`, `/shared`, or any frontend code
3. **This engine is platform-level and app-agnostic** — it must not contain:
   - VCSM-specific UI, routes, screens, or resolver implementations
   - Wentrex-specific UI, routes, screens, or resolver implementations
   - Any React components, providers, or context
   - HTTP handlers or WebSocket logic
   - App-named exports (no VCSM, Wentrex, or app-specific names in public API)
   - App-specific resolver implementations (apps inject resolvers via config)

---

## What This Engine Owns

The identity engine resolves the full authenticated context:

```
session -> app -> access -> account -> actors -> roles -> capabilities -> destination
```

**Responsibilities:**
- Session restore and user resolution
- App resolution by app key
- App access gate (granted / suspended / revoked)
- User app account resolution
- Actor link resolution and active actor selection
- Actor switching
- Role and capability aggregation
- Onboarding state resolution
- Default destination resolution after login
- Logout cleanup
- Domain event emission

---

## Database Schema

The engine reads/writes exclusively from the `platform` schema:

```
platform.apps
platform.platform_owners
platform.user_app_access
platform.user_app_accounts
platform.app_roles
platform.capabilities
platform.role_capabilities
platform.user_app_account_roles
platform.user_capabilities
platform.user_app_actor_links
platform.user_app_preferences
platform.user_app_state
platform.v_user_app_context   (view)

Helper RPC:
  platform.current_user_app_account_id(app_key)
  platform.current_user_has_app_access(app_key)
```

Actor rows (display_name, avatar_url) live in `learning` or `vc` schemas.
The engine does NOT query those schemas directly.
It relies on snapshots stored in `user_app_actor_links` and app-injected enrichers.

---

## Dependency Injection

Apps must call `configureIdentityEngine()` before using the engine:

```js
configureIdentityEngine({
  supabaseClient,            // required
  debugReporter,             // optional — app-owned debug sink
  enrichActorLinks,          // optional — app provides live actor data
  resolveAppContext,         // optional — app provides all-in-one actor/role/capability resolver
})
```

App-specific resolvers live ONLY in the consuming app:
- Wentrex resolver: `apps/wentrex/src/features/identity/resolvers/`
- VCSM resolver: `apps/VCSM/src/features/identity/resolvers/`

---

## Internal Architecture

```
src/
  config.js                  — DI: configureIdentityEngine, getSupabaseClient
  events.js                  — domain events + emit/on
  resolveTrace.js            — debug tracing utility
  types/
    index.js                 — JSDoc typedefs for all domain types
  dal/
    session.read.dal.js      — supabase.auth.* wrappers
    app.read.dal.js          — platform.apps
    access.read.dal.js       — platform.user_app_access
    account.read.dal.js      — platform.user_app_accounts, v_user_app_context
    actorLinks.read.dal.js   — platform.user_app_actor_links (read)
    actorLinks.write.dal.js  — platform.user_app_actor_links + preferences (write)
    roles.read.dal.js        — app_roles, user_app_account_roles, role_capabilities
    capabilities.read.dal.js — capabilities, user_capabilities
    preferences.read.dal.js  — platform.user_app_preferences
    state.read.dal.js        — platform.user_app_state
    state.write.dal.js       — update login timestamps, destination
  model/
    App.model.js
    Access.model.js
    Account.model.js
    ActorLink.model.js
    Preferences.model.js
    State.model.js
  services/
    sessionService.js        — resolveSessionUser
    accessService.js         — resolveUserAppAccess
    accountService.js        — resolveUserAppAccount
    actorService.js          — resolveAvailableActors, resolveActiveActor
    roleService.js           — resolveRoleKeys
    capabilityService.js     — resolveCapabilityKeys (roles + direct overrides)
    destinationService.js    — resolveDefaultDestination
  controller/
    resolveAuthenticatedContext.controller.js
    switchActiveActor.controller.js
    logoutCleanup.controller.js
  adapters/
    index.js                 — public API (never export DAL/model/controller directly)
```

## Layer Rules

- **DAL**: database queries only — no business logic
- **Model**: row -> domain object — pure functions only
- **Services**: reusable domain logic shared by controllers
- **Controllers**: orchestration — enforce rules, coordinate services, return domain objects
- **Adapters**: public surface only — never re-export internals

## What NOT to Build Here

- React pages, providers, or context
- Route files or navigation
- Push notifications or email
- Chat logic (belongs in engines/chat)
- App-specific business rules
- App-specific resolver implementations (these belong in apps/<app>/features/identity/resolvers/)
- Anything that references VCSM, Wentrex, or app-specific names
