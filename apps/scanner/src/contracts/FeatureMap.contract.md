# FeatureMap Contract

File: `maps/feature-map.json`

Purpose: discover active feature, module, platform, shared, service, state, style, and engine areas.

Required top-level fields:

- `version`: number
- `generatedAt`: ISO timestamp
- `root`: scanned repository root
- `features`: array

Feature entry:

- `feature`: discovered area name
- `app`: app name or null for non-app areas
- `kind`: `feature`, `engine`, `shared`, `services`, `state`, `styles`, `tabs`, or `platform-area`
- `path`: repository-relative path
- `status`: `active`
