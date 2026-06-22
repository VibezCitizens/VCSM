---
title: Public Module — Architecture
status: STUB
feature: legal
module: public
source: architect-derived
created: 2026-06-05
---

# legal / modules / public — ARCHITECTURE

## Status

STUB. Architecture sourced from ARCHITECT 2026-06-04. Verification required.

## Layer Stack (unverified)

### Public Screen Render (static / no server data)
```
Router (public routes — no auth guard)
  ├── HowToCreateVportScreen.jsx (static content)
  ├── HowToCreateProfileScreen.jsx (static content)
  ├── VportCategoryLandingScreen.jsx → config/vportLandingContent.js (static config)
  ├── AboutScreen.jsx → AboutView.jsx
  └── ContactScreen.jsx → ContactView.jsx
```

## Source File Map

| File | Layer | Confirmed |
|---|---|---|
| screens/HowToCreateVportScreen.jsx | Screen (public) | ARCHITECT-derived |
| screens/HowToCreateProfileScreen.jsx | Screen (public) | ARCHITECT-derived |
| screens/VportCategoryLandingScreen.jsx | Screen (public) | ARCHITECT-derived |
| screens/AboutScreen.jsx | Screen (public) | ARCHITECT-derived |
| screens/AboutView.jsx | View (sub-view) | ARCHITECT-derived |
| screens/ContactScreen.jsx | Screen (public) | ARCHITECT-derived |
| screens/ContactView.jsx | View (sub-view) | ARCHITECT-derived |
| config/vportLandingContent.js | Config (static) | ARCHITECT-derived |

## Write Surfaces

None.

## Route Evidence (scanner)

| Entry | Target | Access |
|---|---|---|
| 6 route-map entries | HowToCreateVportScreen.jsx | Public |

Other screens likely registered in same router subtree — not individually listed in route-map scanner output.

## TODO

- [ ] List all route paths registered for this module
- [ ] Confirm VportCategoryLandingScreen receives category param from route
- [ ] Confirm Screen/View split — are View components mounted inside Screen or separate routes?
- [ ] Verify screens carry no auth-session imports
