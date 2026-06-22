# ARCHITECT EXECUTION QUEUE
## Ticket: TICKET-ARCHITECT-MODULE-COVERAGE-0001

**Generated:** 2026-06-05  
**Total modules requiring ARCHITECT:** 78 of 98 (79.6%)  
**Source:** MODULE_GOVERNANCE_COVERAGE_REPORT.md  

---

## PRIORITY DEFINITIONS

**P0** — Modules used by: dashboard, chat, bookings, gasprices, flyerBuilder, schedule, leads  
**P1** — Remaining user-facing modules  
**P2** — Administrative / internal modules  

---

## P0 — HIGH IMPACT (Dashboard, Chat, Bookings Core)

> These modules are on the critical user path. Process first.

### Dashboard Modules (PARTIAL → needs ARCHITECTURE.md)
*These have SOURCE_VERIFIED BEHAVIOR — closest to ACTIVE status*

1. dashboard/bookings
2. dashboard/gasprices
3. dashboard/flyerBuilder
4. dashboard/schedule
5. dashboard/vportOwnerStats
6. dashboard/calendar
7. dashboard/designStudio
8. dashboard/locksmith
9. dashboard/portfolio
10. dashboard/qrcode
11. dashboard/reviews
12. dashboard/services
13. dashboard/settings
14. dashboard/shared
15. dashboard/team
16. dashboard/exchange

### Dashboard Modules (STUB → full ARCHITECT run needed)
17. dashboard/vport
18. dashboard/dashboard *(BEHAVIOR=GENERATED, needs SOURCE_VERIFIED upgrade)*

### Chat Modules (STUB)
19. chat/conversation
20. chat/chat
21. chat/start
22. chat/debug

### Booking Modules (STUB)
23. booking/create
24. booking/ops
25. booking/availability
26. booking/ownership
27. booking/resources
28. booking/services

---

## P1 — USER-FACING MODULES

> User-visible screens and flows. Process after P0.

### Auth
29. auth/login
30. auth/register
31. auth/onboarding
32. auth/callback
33. auth/recovery

### Profiles
34. profiles/profile
35. profiles/vport
36. profiles/photos
37. profiles/friends
38. profiles/social

### Explore
39. explore/search
40. explore/ui

### Feed
41. feed/feed
42. feed/pipeline

### Notifications
43. notifications/inbox
44. notifications/runtime
45. notifications/types

### Onboarding
46. onboarding/flow

### Portfolio
47. portfolio/portfolio

### Post
48. post/postcard
49. post/commentcard

### Public
50. public/business-card
51. public/menu

### Reviews
52. reviews/reviews
53. reviews/review *(MISSING — create governance files before ARCHITECT run)*

### Services
54. services/services
55. services/service *(MISSING — create governance files before ARCHITECT run)*

### Social
56. social/follow
57. social/privacy

### vport
58. vport/vport

### Identity
59. identity/identity
60. identity/resolvers

### Actors
61. actors/search

### Block
62. block/block
63. block/guards

### Invite
64. invite/invite

### Join
65. join/join

---

## P2 — ADMINISTRATIVE / INTERNAL MODULES

> Internal, infrastructure, and admin-facing modules. Process last.

### Ads
66. ads/pipeline
67. ads/settings
68. ads/widgets

### App Infrastructure
69. app/guards
70. app/platform
71. app/routes
72. app/shell

### Debug
73. debug/panel

### Hydration
74. hydration/hydrator

### Legal
75. legal/consent
76. legal/documents
77. legal/engine
78. legal/public

### Media
79. media/assets

### Moderation
80. moderation/cover
81. moderation/report
82. moderation/visibility

### Professional
83. professional/briefings
84. professional/workspace

### Settings
85. settings/account
86. settings/privacy
87. settings/profile
88. settings/vports

### Shared
89. shared/shared

### State
90. state/state

### Styles
91. styles/styles
92. styles/style *(MISSING — create governance files before ARCHITECT run)*

### UI
93. ui/primitives
94. ui/ui *(MISSING — create governance files before ARCHITECT run)*

### Upload
95. upload/upload

### Void
96. void/void

---

## SPECIAL — MODULES WITH ZERO GOVERNANCE FILES

These 4 modules must have governance files created BEFORE ARCHITECT can run:

| Module | Status | Action |
|--------|--------|--------|
| reviews/review | MISSING | Create INDEX + BEHAVIOR + ARCHITECTURE + SECURITY |
| services/service | MISSING | Create INDEX + BEHAVIOR + ARCHITECTURE + SECURITY |
| styles/style | MISSING | Create INDEX + BEHAVIOR + ARCHITECTURE + SECURITY |
| ui/ui | MISSING | Create INDEX + BEHAVIOR + ARCHITECTURE + SECURITY |

---

## FEATURE-LEVEL RUNS ALSO NEEDED

These features have never had ARCHITECT produce SOURCE_VERIFIED content at the feature level:

| Feature | Feature ARCHITECTURE Status | Action |
|---------|---------------------------|--------|
| debug | PLACEHOLDER | Full feature-level ARCHITECT run |
| join | STUB | Full feature-level ARCHITECT run |
| moderation | TODO | Full feature-level ARCHITECT run |
| onboarding | PLACEHOLDER | Full feature-level ARCHITECT run |
| post | PLACEHOLDER | Full feature-level ARCHITECT run |
| services | PLACEHOLDER | Full feature-level ARCHITECT run |
| shared | GENERATED | Source verification pass needed |
| upload | GENERATED | Source verification pass needed |
| void | STUB | Full feature-level ARCHITECT run |
| vport | PLACEHOLDER | Full feature-level ARCHITECT run |

---

## SUMMARY COUNTS

| Priority | Module Count |
|----------|-------------|
| P0 | 28 |
| P1 | 37 |
| P2 | 29 |
| **TOTAL** | **94** |

*(Includes 4 MISSING modules that need file creation before ARCHITECT runs)*

---

*Queue generated for TICKET-ARCHITECT-MODULE-COVERAGE-0001*
