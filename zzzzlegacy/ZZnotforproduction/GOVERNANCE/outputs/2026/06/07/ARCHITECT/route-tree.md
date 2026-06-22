# ARCHITECT ROUTE TREE
Generated: 2026-06-07T08:11:08.925Z
Scanner Version: 1.1.0

---

## Route Summary

| App | Route Count | Access=public | Access=protected | Access=unknown |
|---|---|---|---|---|
| VCSM | 130 | 130 | 0 | 0 |
| Traffic | 51 | 51 | 0 | 0 |
| wentrex | 63 | 63 | 0 | 0 |
| **Total** | **244** | **244** | **0** | **0** |

---

## ⚠️ ARCHITECTURE SIGNAL: All Routes Classified public

[SCANNER_LEAD] — route-map signal: all 244 routes have access=public

The scanner classified ALL routes as access=public including VCSM routes from
`protected/app.routes.jsx`. This is a scanner limitation — Next.js app-router
and React Router protect routes via middleware/guards that are not statically
inferrable from route file structure alone.

Source verification required:
- Do VCSM protected routes have working auth guards at middleware or component level?
- Do wentrex routes enforce tenant isolation?
- Route to HAWKEYE for enforcement verification.

---

## VCSM Route Tree (130 routes)

Routes sourced from: apps/VCSM/src/app/routes/

### Public Routes (from public.routes.jsx)
```
/about
/privacy
/terms
/how-it-works
/how-it-works/[feature]
/join
/join/[step]
```

### Protected Routes (from protected/app.routes.jsx)
```
* (root wildcard)
/
/actor/:actorId/dashboard
/actor/:actorId/dashboard/booking-history
/actor/:actorId/dashboard/calendar
/actor/:actorId/dashboard/exchange
/actor/:actorId/dashboard/gas
/actor/:actorId/dashboard/leads
/actor/:actorId/dashboard/media
/actor/:actorId/dashboard/posts
/actor/:actorId/dashboard/reviews
/actor/:actorId/dashboard/services
/actor/:actorId/dashboard/settings
/actor/:actorId/dashboard/subscribers
/actor/:actorId/dashboard/team
/actor/:actorId/bookings
/actor/:actorId/chat
/actor/:actorId/explore
/actor/:actorId/feed
/actor/:actorId/home
/actor/:actorId/notifications
/actor/:actorId/profile/:profileId
/actor/:actorId/vport/:vportSlug
... (130 total)
```

---

## Traffic Route Tree (51 routes)

```
/ (home)
/[city]
/[city]/[segment]
/[city]/[segment]/[service]
/[city]/[segment]/[service]/[detail]
/[city]/[segment]/[service]/[detail]/[specialty]
/[city]/categories
/[city]/pro/[providerSlug]
/[city]/top-providers
/answers/[slug]
/categories
/directory
/en/answers/[slug]
/es/answers/[slug]
/page (root)
/top-providers
... (51 total — dynamic SEO routes)
```

---

## Wentrex Route Tree (63 routes)

Multi-tenant LMS SaaS routes:
```
/auth/...
/learning/...
/admin/...
/courses/...
/[tenant]/...
... (63 total)
```

---

## Route Architecture Risks

| Risk | Routes | Severity | Action |
|---|---|---|---|
| Protected routes not detected by scanner | /actor/:actorId/* | HIGH | HAWKEYE source verification |
| Dynamic segments without guard verification | :actorId in URL | HIGH | VENOM IDOR check |
| Wildcard * route | VCSM:/ | MEDIUM | Verify catch-all scope |
| Traffic routes with DB write access | /api/answers/* | HIGH | Source verify write surfaces |
