# ARCHITECT — Bundle Boundary Map
Generated: 2026-05-09

---

## VCSM — Bundle Boundaries (Vite SPA)

VCSM is a Vite-bundled SPA. Everything ships to the client unless explicitly excluded.
There is no server/client split — all code runs in the browser after the bundle loads.

### Client-Only (Everything in VCSM)

| Category | Files | Notes |
|---|---|---|
| All controllers | features/*/controller/*.controller.js | Run in browser — business logic in client |
| All DAL files | features/*/dal/*.dal.js | Supabase calls from browser |
| All hooks | features/*/hooks/use*.js | React hooks — client only |
| All screens | features/*/screens/*.jsx | React components — client only |
| All stores | state/*.store.js | Zustand — client memory only |
| Engine controllers | engines/*/src/controller/*.controller.js | Bundle-included — client side |

### Potential Heavy Bundle Contributors

| Module | Risk |
|---|---|
| features/dashboard/flyerBuilder/designStudio | Design studio likely includes large canvas/drawing libraries |
| engines/chat | Full chat engine with realtime, typing, threads, reactions — significant size |
| engines/booking | Booking engine with availability calculation — moderate size |
| features/wanders | Card-based mailbox system — unknown size |
| features/wanderex | Public discovery — unknown size |
| Zustand stores (all) | Low — Zustand is tiny |

### Dynamic Import Opportunities (Not Yet Detected)

Routes that are rarely accessed should be dynamically imported:
- Dashboard/DesignStudio (heavy, accessed infrequently)
- Learning module (large feature tree — admin, student, teacher, parent)
- Wanders (separate product feature)
- Wanderex (separate discovery feature)
- Professional briefings (narrow audience)

Verify: Does VCSM use React.lazy() + Suspense for route-level code splitting?
If all routes are in a single bundle, initial load time is proportional to total app size.

---

## TRAFFIC — Bundle Boundaries (Next.js 14)

Traffic has a proper server/client split via Next.js.

### Server-Side Only (not in client bundle)

| Module | Execution | Notes |
|---|---|---|
| provider.repo.js | Server (generateStaticParams) | Never sent to client |
| staticParams.repo.js | Server (build-time) | Build artifact only |
| taxonomyParams.repo.js | Server (build-time) | Build artifact only |
| vportDataset.read.dal.js | Server (build-time) | Supabase call at build |
| vportHomepage.read.dal.js | Server (build-time) | Supabase call at build |
| trazeCategories.read.dal.js | Server (build-time) | Supabase call at build |
| providerProfile.read.dal.js | Server (build-time) | Supabase call at build |
| pageModel.model.js | Server (build-time transforms) | Data shape only |

### Client-Side (Hydrated after static HTML)

| Module | Notes |
|---|---|
| Search/filter UI components | Interactive on client |
| Conversion CTA components | Client-side click handlers |
| Globe/GeoJSON rendering | Heavy — likely client-only render |
| features/answers hooks | Client interactive |
| features/conversion hooks | Client interactive |

### Potential Client Bundle Risks

| Risk | Module |
|---|---|
| Globe/GeoJSON rendering | If a 3D globe or map renders on provider pages, the GeoJSON/map library adds significant client bundle weight |
| Supabase client in client bundle | supabase.client.js ships to client — verify anon key is the only credential (no service role key) |
| Large provider datasets | If provider data is embedded in static HTML rather than fetched, page size grows with provider count |

### Server/Client Mixing Risk

| Risk | Detail |
|---|---|
| Runtime API routes in static export | If Next.js export is configured as fully static (output: 'export'), runtime API routes (reverse-geocode) cannot run — they require a server |
| ISR vs static | Verify if Traffic uses ISR (Incremental Static Regeneration) or pure static export — affects data freshness and server requirements |

---

## WENTREX — Bundle Boundaries

Wentrex is a Vite SPA (similar to VCSM). All code runs in the client.
No server/client split detected.
Full bundle scan requires a dedicated pass.
