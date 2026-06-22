# Auth Adapter Enforcement Report — 2026-06-08

**Goal**: Everything outside `features/auth/` must import only from `features/auth/adapters/auth.adapter.js`.

**Scanned root**: `/Users/vcsm/Desktop/VCSM/apps/VCSM/src`

**Files scanned**: 2130

## PASS

All external auth imports go through the official adapter.

## Approved Exceptions

- [app/routes/lazyPublic.jsx](apps/VCSM/src/app/routes/lazyPublic.jsx)
- [app/providers/AuthProvider.jsx](apps/VCSM/src/app/providers/AuthProvider.jsx)
- [app/guards/ProfileGatedOutlet.jsx](apps/VCSM/src/app/guards/ProfileGatedOutlet.jsx)
