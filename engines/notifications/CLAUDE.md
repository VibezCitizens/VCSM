# Notifications Engine — Scope Rules

## Working Directory

All work in this engine is scoped to:

```
/Users/vcsm/Desktop/VCSM/engines/notifications/
```

## Strict Scope Rules

- NEVER import from `apps/VCSM/` or `apps/wentrex/`
- NEVER import from other engines (`engines/identity/`, `engines/chat/`, `engines/reviews/`, `engines/hydration/`)
- NEVER import from `shared/`
- NEVER query schemas other than `notification.*`
- NEVER add app-specific logic — use dependency injection

## What This Engine Owns

- Event publishing (creating notification events)
- Recipient resolution (determining who receives what)
- Preference evaluation (channel and frequency decisions)
- Template resolution and rendering
- Delivery orchestration (in_app, email, sms, push, webhook)
- Inbox state management (seen, read, opened, dismissed, archived, snoozed)
- Delivery attempt tracking

## Database Schema

- `notification.event_categories`
- `notification.event_types`
- `notification.events`
- `notification.recipients`
- `notification.rendered`
- `notification.delivery_attempts`
- `notification.preferences`
- `notification.inbox_items`
- `notification.templates`

## Domain Neutrality

This engine serves multiple source domains:
- `vc` — social interactions (follow, comment, reaction, mention, booking)
- `vport` — business profile events
- `learning` — course, assignment, submission events
- `platform` — system-level events

The engine NEVER assumes VC-specific concepts. Domain-specific logic is injected via configuration.

## Dependency Injection

- `supabaseClient` — required
- `resolveRecipients(event)` — optional, app-injected recipient resolution
- `resolveActorCard(actorId)` — optional, app-injected actor enrichment
- `debugReporter` — optional

## Internal Architecture

```
src/
├── config.js           # DI configuration
├── events.js           # Domain events (engine-level)
├── types/index.js      # JSDoc typedefs
├── adapters/index.js   # PUBLIC API (only public surface)
├── controller/         # Orchestration layer
├── dal/                # Database queries only
├── model/              # Pure row → domain transforms
└── services/           # Reusable domain logic
```

## Layer Rules

- **DAL:** Database queries only. No business logic. Explicit column selection. Schema: `notification`.
- **Model:** Pure functions. Row → domain object. No side effects.
- **Controller:** Orchestration. Validates inputs, calls DAL/services, emits events.
- **Services:** Shared logic used by multiple controllers.
- **Adapters:** Re-exports only. No logic.

## What NOT to Build

- React hooks (app responsibility)
- UI components (app responsibility)
- Cross-schema queries (use DI)
- Legacy `vc.notifications` compatibility (app-side bridge)
- Push/email provider integrations (future, provider-specific)
