# Portfolio Engine — Contract

## Status

- **Owner:** Platform
- **Consumers:** VCSM
- **Schema:** `vc.vport_portfolio_*` tables

## Purpose

App-agnostic portfolio management for vport actors. Handles portfolio item CRUD, media management, tagging, and barber-specific metadata. Supports before/after transformations, service linking, and featured/pinned items.

## What This Engine Does

- Manages portfolio item lifecycle (create, update, soft-delete)
- Manages media per item (add, remove, role-based: cover, before, after, result, detail)
- Manages tags per item (add, remove, replace)
- Reads portfolio via RPC for public consumption
- Reads barber-specific details per item
- Enforces actor ownership on all write operations

## What This Engine Does NOT Do

- Does NOT render UI components
- Does NOT manage React hooks or state
- Does NOT handle file uploads (app provides URLs)
- Does NOT manage booking or services (separate concerns)
- Does NOT manage review data (separate engine)

## Public API

### Configuration

- `configurePortfolioEngine({ supabaseClient, isActorOwner, debugReporter? })`

### Controllers

- `listPortfolio({ actorId, limit?, offset? })` — paginated portfolio via RPC
- `getPortfolioItem({ itemId, includeBarberDetails? })` — single item with media, tags, barber details
- `createItem({ actorId, title?, description?, portfolioKind?, serviceId?, visibility?, tags? })`
- `updateItem({ itemId, actorId, updates?, tags? })`
- `deleteItem({ itemId, actorId })` — soft-delete
- `addMedia({ itemId, actorId, url, mediaType?, mediaRole?, ... })`
- `removeMedia({ mediaId, actorId })`
- `manageTags({ itemId, actorId, tags })`

### Events

- `ITEM_CREATED`, `ITEM_UPDATED`, `ITEM_DELETED`
- `MEDIA_ADDED`, `MEDIA_REMOVED`
- `TAGS_UPDATED`

## Database Tables

- `vc.vport_portfolio_items`
- `vc.vport_portfolio_media`
- `vc.vport_barber_portfolio_details`
- `vc.vport_portfolio_tags`

### RPC Functions

- `vc.get_vport_portfolio(uuid, integer, integer)` — public read

## Schema Note

Portfolio tables live in `vc.*` (not a dedicated schema) because they are tightly coupled to `vc.actors` and `vc.vport_services`. The engine queries `vc.*` via `.schema('vc')`.

## Dependency Injection

| Key | Required | Purpose |
|-----|----------|---------|
| `supabaseClient` | Yes | Database client |
| `isActorOwner` | Yes | Verify caller owns the acting actor |
| `debugReporter` | No | Debug output sink |

## Forbidden Dependencies

- NEVER import from `apps/VCSM/` or `apps/wentrex/`
- NEVER import from other engines
