---
title: Public Module — Behavior
status: STUB
feature: legal
module: public
source: architect-derived
created: 2026-06-05
---

# legal / modules / public — BEHAVIOR

## Status

STUB. No behavior contract. Seeded from source directory and route-map evidence. Verification required.

## Expected Behaviors (unverified — ARCHITECT-derived)

| ID | Name | Description | Confidence |
|---|---|---|---|
| BEH-LEGAL-PUBLIC-001 | Render How-To VPORT | HowToCreateVportScreen renders static how-to guide for VPORT creation; 6 route patterns | UNVERIFIED |
| BEH-LEGAL-PUBLIC-002 | Render How-To Profile | HowToCreateProfileScreen renders guide for profile creation | UNVERIFIED |
| BEH-LEGAL-PUBLIC-003 | VPORT Category Landing | VportCategoryLandingScreen renders category-specific landing page using vportLandingContent.js config | UNVERIFIED |
| BEH-LEGAL-PUBLIC-004 | Render About | AboutScreen / AboutView renders platform about content | UNVERIFIED |
| BEH-LEGAL-PUBLIC-005 | Render Contact | ContactScreen / ContactView renders contact information | UNVERIFIED |

## Route Entry Points (scanner-verified)

| Route | Screen | Access |
|---|---|---|
| (6 entries — all public) | HowToCreateVportScreen.jsx | Public — no auth required |

## TODO

- [ ] Confirm all route paths registered for this module
- [ ] Confirm whether VportCategoryLandingScreen receives a category param from the route
- [ ] Confirm Screen vs View naming — are View variants mounted inside Screen components or separate routes?
- [ ] Verify no session data leaks into public screens
