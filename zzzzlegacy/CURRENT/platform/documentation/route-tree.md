# ARCHITECT — Route Tree
Generated: 2026-05-09

---

## VCSM Route Tree (React Router DOM)

Entry: apps/VCSM/src/App.jsx

```
/ (root)
├── /auth
│   ├── /auth/login                    → LoginScreen
│   ├── /auth/register                 → RegisterScreen
│   ├── /auth/callback                 → AuthCallbackScreen
│   ├── /auth/forgot-password          → ForgotPasswordScreen
│   ├── /auth/reset-password           → ResetPasswordScreen
│   └── /auth/verify-email             → VerifyEmailRequiredScreen
│
├── /welcome                           → WelcomeScreen
│
├── /consent                           → ConsentGateScreen
│
├── /onboarding
│   └── /onboarding/vibes              → CitizenVibesScreen
│
├── /invite                            → InviteScreen
│
├── /join
│   └── /join/barbershop               → JoinBarbershopScreen
│
├── /feed                              → CentralFeedScreen
│
├── /explore                           → ExploreScreen
│
├── /notifications                     → NotificationsScreen
│   └── /notifications/post/:postId    → NotiViewPostScreen
│
├── /chat
│   ├── /chat/inbox                    → InboxScreen
│   ├── /chat/inbox/archived           → ArchivedInboxScreen
│   ├── /chat/inbox/requests           → RequestsInboxScreen
│   ├── /chat/inbox/spam               → SpamInboxScreen
│   ├── /chat/inbox/settings           → InboxSettingsScreen
│   ├── /chat/inbox/:chatId/settings   → InboxChatSettingsScreen
│   ├── /chat/inbox/settings/blocked   → BlockedUsersScreen
│   ├── /chat/inbox/settings/privacy   → MessagePrivacyScreen
│   └── /chat/:conversationId          → ConversationScreen
│
├── /u/:username                       → ProfileScreen (user actor)
├── /v/:slug                           → ProfileScreen (vport actor)
│
├── /dashboard
│   └── /dashboard/:vportSlug
│       ├── / (overview)               → VportDashboardScreen
│       ├── /calendar                  → VportDashboardCalendarScreen
│       ├── /schedule                  → VportDashboardScheduleScreen
│       ├── /booking-history           → VportDashboardBookingHistoryScreen
│       ├── /services                  → VportDashboardServicesScreen
│       ├── /portfolio                 → VportDashboardPortfolioScreen
│       ├── /reviews                   → VportDashboardReviewScreen
│       ├── /team                      → VportDashboardTeamScreen
│       ├── /team/requests             → BarberTeamRequestsScreen
│       ├── /leads                     → VportDashboardLeadsScreen
│       ├── /gas                       → VportDashboardGasScreen
│       ├── /locksmith                 → VportDashboardLocksmithScreen
│       ├── /exchange                  → VportDashboardExchangeScreen
│       ├── /settings                  → VportSettingsScreen
│       ├── /flyer                     → VportActorMenuFlyerScreen
│       ├── /flyer/editor              → VportActorMenuFlyerEditorScreen
│       └── /design-studio             → VportDesignStudioViewScreen
│
├── /settings
│   ├── /settings/profile              → (SettingsProfileScreen)
│   ├── /settings/account              → (SettingsAccountScreen)
│   ├── /settings/privacy              → (PrivacyScreen)
│   └── /settings/vports               → (VportListScreen)
│
├── /legal
│   ├── /legal/:docType                → LegalDocumentScreen
│   ├── /legal/about                   → AboutScreen
│   └── /legal/contact                 → ContactScreen
│
├── /how-to
│   ├── /how-to/create-profile         → HowToCreateProfileScreen
│   └── /how-to/create-vport           → HowToCreateVportScreen
│
├── /vport/:vportSlug/menu             → (VportPublicMenu — public)
├── /vport/:vportSlug/card             → (VportBusinessCard — public)
│
├── /briefings                         → ProfessionalBriefingsScreen
│
├── /ads                               → VportAdsSettingsScreen
│
├── /wanders                           → (Wanders feature — card-based mailbox)
│
├── /wanderex                          → (Wanderex — public discovery)
│
└── /learning
    ├── /learning/dashboard            → (LearningHomeScreen)
    ├── /learning/courses/:courseId    → (CourseHomeScreen)
    ├── /learning/admin/*              → (Administration screens)
    ├── /learning/student/*            → (Student screens)
    ├── /learning/teacher/*            → (Teacher screens)
    └── /learning/parent/*            → (Parent screens)
```

NOTES:
- Exact route paths inferred from screen names and feature structure — verify against App.jsx
- /u/:username and /v/:slug both render ProfileScreen with different actor kinds
- /learning is VCSM's embedded LMS — separate from Wentrex

---

## TRAFFIC Route Tree (Next.js 14 App Router)

Root: apps/Traffic/src/app/

```
/
├── / (homepage)                       → app/page.jsx
│
├── (seo) [route group — no URL prefix]
│   ├── /[city]                        → (seo)/[city]/page.jsx
│   ├── /[city]/[segment]              → (seo)/[city]/[segment]/page.jsx
│   ├── /[city]/[segment]/[service]    → (seo)/[city]/[segment]/[service]/page.jsx
│   ├── /[city]/categories             → (seo)/[city]/categories/
│   ├── /[city]/pro                    → (seo)/[city]/pro/
│   ├── /[city]/top-providers          → (seo)/[city]/top-providers/
│   └── /pro/[providerSlug]            → (seo)/pro/[providerSlug]/page.jsx
│
├── /answers/[slug]                    → app/answers/[slug]/
├── /categories                        → app/categories/
├── /directory                         → app/directory/
├── /guides/[profileSlug]/[contentSlug] → app/guides/[profileSlug]/[contentSlug]/
├── /top-providers                     → app/top-providers/
│
└── Sitemaps
    ├── /sitemap-index.xml             → app/sitemap-index.xml/
    └── /sitemaps/[chunk]              → app/sitemaps/[chunk]/
```

FLAGS:
- [city] and [segment] are dynamic — overlap risk if a city slug matches a segment slug
- /[city]/[segment]/[service] is a 3-level dynamic route — generateStaticParams must be exhaustive
- /pro/[providerSlug] at root and /[city]/pro are separate route families — ensure no canonical confusion
- Route group (seo) keeps SEO pages isolated from utility pages (answers, guides, sitemaps)

---

## WENTREX Route Tree

Entry: apps/wentrex/src/app/

Wentrex routes not fully scanned in this pass. Known domains:
- auth routes (login, register, callback)
- learning admin routes
- learning student routes
- learning staff/teacher routes
- learning parent routes
- communication/inbox routes

Full Wentrex route scan required in a dedicated pass.
