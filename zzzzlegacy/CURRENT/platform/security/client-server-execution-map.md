# ARCHITECT — Client vs Server Execution Map
Generated: 2026-05-09

---

## VCSM — Execution Model

VCSM is a Vite SPA. All logic executes on the client after bundle load.
There is no server-side rendering. No server-side code execution.
Supabase auth and DB calls execute from the browser using the Supabase JS client.

| Module | Execution | Notes |
|---|---|---|
| All controllers | CLIENT | Business logic in browser |
| All DAL files | CLIENT | Supabase queries from browser |
| All hooks | CLIENT | React hooks |
| All screens | CLIENT | React render in browser |
| All Zustand stores | CLIENT | In-memory, browser only |
| Supabase auth | CLIENT → SUPABASE | JWT validation on Supabase server |
| Supabase RPC | CLIENT → SUPABASE EDGE | RPC runs on Supabase server |
| R2 media upload | CLIENT → CLOUDFLARE R2 | Direct upload from browser |
| sendLeadConfirmationEmail | CLIENT → SUPABASE EDGE FUNCTION | Email sent via edge function |

---

## TRAFFIC — Execution Model

Traffic has a true server/client split via Next.js 14.

### Build-Time Execution (Static Generation)

| Module | When | Notes |
|---|---|---|
| generateStaticParams() | Build — once | Reads provider/city/service list to generate page paths |
| vportDataset.read.dal.js | Build — once per dataset call | Supabase query at build time |
| vportHomepage.read.dal.js | Build — once | Supabase query at build time |
| trazeCategories.read.dal.js | Build — once | Supabase query at build time |
| providerProfile.read.dal.js | Build — per provider page | Supabase query at build time |
| provider.repo.js | Build | Data transformation at build |
| staticParams.repo.js | Build | Param list generation at build |
| taxonomyParams.repo.js | Build | Category/service param list at build |
| pageModel.model.js | Build | Page model shape transformation |
| Sitemap generation | Build | Static sitemap files generated |

### Server-Side Execution (Runtime — if ISR or API routes)

| Module | When | Notes |
|---|---|---|
| Reverse-geocode API route | Runtime server | Geolocation lookup — cannot be static |
| /sitemaps/[chunk] | Runtime or build | May be dynamically chunked |

### Client-Side Execution (After Hydration)

| Module | Execution | Notes |
|---|---|---|
| Conversion CTA components | Client | Click handlers, deep-link navigation |
| Search/filter UI | Client | Interactive filtering of static data |
| Globe/GeoJSON render | Client | 3D map if present — heavy client render |
| features/answers hooks | Client | Answer page interactivity |
| features/conversion hooks | Client | CTA and lead capture flow |
| supabase.client.js (Traffic) | Client (if used client-side) | Anon client — must only be used for claim writes |

### Execution Flags

| Flag | Detail |
|---|---|
| RUNTIME LOGIC IN STATIC EXPORT | Reverse-geocode route requires a running server — if Traffic is exported as fully static (output: 'export'), this route cannot function. Verify deployment target. |
| HYDRATION MISMATCH RISK | If server-rendered HTML includes data that differs from client state after hydration, React will warn/error. Traffic's static-rendered provider data must match what the client shows. |
| ACCIDENTAL CLIENT EXPOSURE | Verify that provider.repo.js and staticParams.repo.js are never imported by client components — they contain server-side Supabase calls that should not run in the browser. |
| SERVER-ONLY DEPENDENCY LEAK | supabase.client.js (anon) is used both at build time and potentially client-side. Verify the service role key (if any) is never used in this client. |

---

## WENTREX — Execution Model

Wentrex is a Vite SPA. Same execution model as VCSM — all client-side.
No server-side rendering detected.

---

## Summary by App

| App | Primary Execution | Server-Side | Build-Time |
|---|---|---|---|
| VCSM | 100% client | NO (Supabase handles server functions) | NO |
| TRAFFIC | Hybrid | Runtime API routes | generateStaticParams + page data |
| WENTREX | 100% client | NO | NO |
