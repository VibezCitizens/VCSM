---
title: Public Module — Index
status: STUB
feature: legal
module: public
source: architect-derived
created: 2026-06-05
source-path: apps/VCSM/src/features/legal/screens/
scanner-version: 1.1.0
---

# legal / modules / public

Public-facing informational screens. No authentication required. Covers how-to guides, about pages, contact screens, and VPORT category landing pages. All 6 confirmed route-map entries in the legal feature resolve to this module (all pointing to HowToCreateVportScreen — likely multiple path patterns registered).

## Module Summary

| Field | Value |
|---|---|
| Module | public |
| Feature | legal |
| Source Path | apps/VCSM/src/features/legal/screens/ |
| Screens | 7 |
| Routes | 6 (all confirmed route-map entries for legal feature — all public access) |
| Write Surfaces | 0 |
| Config | 1 (config/vportLandingContent.js) |

## Known Source Files (ARCHITECT-verified)

### Screens
| File | Access | Role |
|---|---|---|
| screens/HowToCreateVportScreen.jsx | Public | How-to guide for VPORT creation; 6 route-map entries |
| screens/HowToCreateProfileScreen.jsx | Public | How-to guide for profile creation |
| screens/VportCategoryLandingScreen.jsx | Public | VPORT category landing page (SEO/discovery) |
| screens/AboutScreen.jsx | Public | Platform about page |
| screens/AboutView.jsx | Public | About view (sub-view or variant) |
| screens/ContactScreen.jsx | Public | Contact page |
| screens/ContactView.jsx | Public | Contact view (sub-view or variant) |

### Config
| File | Role |
|---|---|
| config/vportLandingContent.js | Static content data for VPORT category landing pages |

## Write Surfaces

None. All screens are read/display only.

## Route Map Evidence

All 6 legal route-map entries resolve to HowToCreateVportScreen.jsx (public access). The scanner notes multiple path patterns registered for this screen. HowToCreateProfileScreen, VportCategoryLandingScreen, AboutScreen, and ContactScreen are present in source but not listed as distinct route-map entries — likely registered under the same router subtree.

## Security Flags

None specific to this module from existing reviews. General risk surfaces:
- Public screens must not leak authenticated session data
- VportCategoryLandingScreen may link into VCSM deep links — confirm no raw UUID exposure in link construction

## Governance Files

| File | Status |
|---|---|
| INDEX.md | STUB |
| BEHAVIOR.md | STUB |
| ARCHITECTURE.md | STUB |
| SECURITY.md | STUB |

## TODO

- [ ] Confirm all 6 route-map entries — what path patterns are registered for HowToCreateVportScreen?
- [ ] Confirm whether HowToCreateProfileScreen, VportCategoryLandingScreen, AboutScreen, ContactScreen have their own route registrations
- [ ] Confirm vportLandingContent.js content type — static copy, category list, or config object?
- [ ] Determine relationship between Screen/View variants (AboutScreen vs AboutView, ContactScreen vs ContactView)
- [ ] Confirm VportCategoryLandingScreen deep link targets — do they use slugs or raw IDs?
