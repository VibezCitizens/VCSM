# Portfolio Engine — Scope Rules

## Working Directory

```
/Users/vcsm/Desktop/VCSM/engines/portfolio/
```

## Strict Scope Rules

- NEVER import from `apps/VCSM/` or `apps/wentrex/`
- NEVER import from other engines
- NEVER import from `shared/`
- NEVER add app-specific logic — use dependency injection

## Database Tables

- `vport.portfolio_items`
- `vport.portfolio_media`
- `vport.portfolio_tags`
- `vport.barber_portfolio_details`
- `vport.locksmith_portfolio_details`
- `vport.portfolio_item_metrics`
- `vport.portfolio_item_services`

## Internal Architecture

```
src/
├── config.js           # DI configuration
├── events.js           # Domain events
├── types/index.js      # JSDoc typedefs
├── adapters/index.js   # PUBLIC API (only public surface)
├── controller/         # Orchestration layer
├── dal/                # Database queries only
├── model/              # Pure row → domain transforms
└── services/           # Reusable domain logic
```

## Layer Rules

- **DAL:** Database queries only. Explicit column selection.
- **Model:** Pure functions. Row → domain object.
- **Controller:** Validates inputs, calls DAL, emits events.
- **Adapters:** Re-exports only.
