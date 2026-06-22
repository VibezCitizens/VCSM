# RouteMap Contract

File: `maps/route-map.json`

Purpose: discover public, protected, dynamic, and native-aware route surfaces.

Required top-level fields:

- `version`: number
- `generatedAt`: ISO timestamp
- `routes`: array

Route entry:

- `route`: route path
- `type`: `static` or `dynamic`
- `access`: `public` or `protected`
- `runtime`: `web` or `native-aware`
- `app`: app owner
- `file`: repository-relative source file
- `source`: route discovery source, such as `react-router` or `next-app-router`
