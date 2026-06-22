# VCSM Workspace — Feature Map

**Generated:** 2026-04-12

---

## VCSM Application Features

### actors
```
dal/        searchActors.dal.js
controllers/
model/
```

### ads
```
adapters/   api/   dal/   hooks/   lib/   model/   screens/   ui/   usecases/   widgets/
```

### auth
```
components/   controllers/   dal/       hooks/   model/
screens/      styles/        ui/        usecases/
```
DAL: actorGetByProfile.dal, profile.dal, onboarding.dal, register.dal, actorOwnerCreate.dal

### block
```
adapters/   controllers/   dal/       guards/   helpers/   hooks/   ui/
```
DAL: block.read.dal, block.check.dal

### booking
```
adapters/   components/   controller/   dal/   hooks/   model/   screens/
```
DAL: 17 files — getBookingResourceById, listBookingResourceServicesByResourceId, listAvailabilityRulesByResourceId, upsertAvailabilityRule, upsertAvailabilityException, getActorById, getBookingById, insertBookingResource, updateBookingStatus, listBookingsInRange, readVportServicesByActor, saveBookingServiceProfileDurationsByServiceIds, listBookingResourcesByOwnerActorId, listBookingServiceProfilesByServiceIds, upsertBookingResourceServices, listBookingsByResource, readActorOwnerLinkByActorAndUserProfile, listAvailabilityExceptionsInRange, insertBooking

### chat
```
adapters/   conversation/   debug/   inbox/   start/   styles/
```
Engine-backed via @chat. App provides setup.js + adapter wrappers.

### dashboard
```
adapters/   flyerBuilder/   qrcode/   vport/
```
Sub-features: flyerBuilder (dal/read+write, designStudio/dal), vport (dal/read+write, screens, model)

### explore
```
controller/   dal/   hooks/   model/   screens/   styles/   ui/   usecases/
```

### feed
```
adapters/   api/   controllers/   dal/        hooks/   lib/
model/      pipeline/             screens/    ui/      usecases/
```
DAL: 12 files — feed.read.posts, feed.read.media, feed.read.hiddenPosts, feed.read.actorsBundle, feed.read.blockRows, feed.read.followRows, feed.mentions, feed.read.viewerContext, feed.posts, listActorPostsByActor, feed.read.debugPrivacyRows, index
Pipeline: fetchFeedPage.pipeline.js (orchestrates 7 DALs in Promise.all)

### identity
```
controller/   dal/   resolvers/
```
App-side identity setup + VCSM-specific resolver. Engine-backed via @identity.

### legal
```
controllers/   dal/   docs/   engine/   hooks/   screens/   styles/
```
DAL: legalDocuments.read, userConsents.write, userConsents.read

### moderation
```
adapters/   components/   controllers/   dal/   hooks/   models/   types/
```
DAL: conversationCover.write, reports, moderationActions, conversationCover.read

### notifications
```
inbox/   screen/   styles/   types/
```
inbox/ contains: controller/ (4), dal/ (8), hooks/ (5), lib/ (3), model/ (1), realtime/ (1), ui/ (3)
types/ contains: 14 per-kind renderer components (follow, comment, reaction, mention, booking, review)

### onboarding
```
adapters/   components/   controller/   dal/   hooks/   model/   screens/
```
DAL: vibeTags, vibeInvites, profileCompletion, onboardingSteps

### post
```
adapters/   commentcard/   postcard/   screens/   styles/
```
commentcard/dal/: commentLikes, postComments.count, comments, postComments.read
postcard/dal/: postReactions.write, postMentions.read, postReactions.read, post.read, post.write, roseGifts.actor, postMentions.write

### professional
```
briefings/   core/   enterprise/   professional-nurse/   screens/
```
briefings/dal/: professionalBriefings.read

### profiles
```
adapters/   config/   controller/   dal/      hooks/
kinds/      model/    screens/      styles/   ui/
```
dal/: readActorVibeTags, readVportType, readActorKind, readActorProfile, readActorIdByUsername, readActorPosts, vportPublicDetails.read, readPostMediaByPostIds, friends/, photos/, post/
kinds/vport/dal/: services/ (5 files), menu/ (10 files), review/ (3 files), locksmith/ (5 files), gas/ (6 files), rates/ (3 files), readVportActorIdByVportId, subscribersCount
kinds/vport/hooks/portfolio/: useVportPortfolio — state management (items, loading, error, pagination, optimisticRemove, invalidatePortfolioCache)
kinds/vport/controller/portfolio/: VportPortfolio.controller — 60s TTL cache wrapper around @portfolio engine (ctrlListPortfolio, ctrlGetPortfolioItem, invalidatePortfolioCache)

### portfolio
```
setup.js              portfolioTraceStore (dev pub/sub, last 50 events)
                      configurePortfolioEngine DI (supabaseClient, isActorOwner, debugReporter)
```
Engine-backed via @portfolio. App provides setup.js + controller cache wrapper + hook.

Consumer layers:
- `setup.js` — DI wiring + portfolioTraceStore (DEV trace event store)
- `kinds/vport/controller/portfolio/VportPortfolio.controller.js` — 60s TTL cache around engine
- `kinds/vport/hooks/portfolio/useVportPortfolio.js` — pagination state, optimistic delete, tag filter
- `dashboard/vport/screens/VportDashboardPortfolioScreen.jsx` — owner CRUD + PortfolioBugsBunnyPanel (DEV)
- `profiles/kinds/vport/screens/PortfolioTab.jsx` — public read-only view

No app-side DAL. All DB access via @portfolio engine adapters.

### public
```
screens/   vportMenu/
```
vportMenu/dal/: readVportPublicMenu.rpc, readVportPublicDetails.rpc

### settings
```
account/   adapters/   privacy/   profile/   screen/   sponsored/   styles/   ui/   vports/
```
account/dal/: account.read, account.write
profile/dal/: profile.write, vportPublicDetails.read, actors.read, profile.read, vportPublicDetails.write
privacy/dal/: visibility, blocks
vports/dal/: actorOwners.read, vports.read

### social
```
adapters/   components/   friend/   privacy/
```
friend/request/dal/: actorFollows, followRequests
friend/subscribe/dal/: subscriberCount
privacy/dal/: actorPrivacy

### upload
```
adapters/   api/   controller/   controllers/   dal/   hooks/
lib/        model/   screens/    styles/        ui/
```
dal/: findPostMentionsByPostIds, findActorsByHandles, insertPostMentions, searchMentionSuggestions, postAuthRollback, insertPost, insertPostMedia

### vport
```
adapters/   controller/   dal/   hooks/   model/   utils/
```
dal/: vport.read.vportRecords, readVportServiceCatalogByType, vport.core

### wanders
```
adapters/   components/   controllers/   core/   dal/
hooks/      lib/          model/         models/   screens/
services/   utils/
```
core/dal/: actorOwners.read

---

## Wentrex Application Features

### auth
```
components/   controllers/   dal/   hooks/   screens/
```

### identity
```
controller/   dal/   resolvers/   (+ WentrexIdentityContext, setup)
```

### actors
```
dal/   (getActorSummariesByIds)
```

### communication
```
adapters/   conversation/   hooks/   inbox/   policy/   setup/   styles/
```

### moderation
```
adapters/   (components + hooks)
```

### block
```
adapters/   (UI only)
```

### services
```
cloudflare/   supabase/
```

### learning/administration
```
adapters/   components/   controller/   dal/   hooks/
```
dal/: 60+ files across 18 subdirectories (actorAccess, actors, assignments, auditLog, auth, courseTerms, courses, diagnostics, grades, lessonProgress, lessons, memberships, modules, organizations, platformAdmins, platformOwners, profiles, realms)

---

## VCSM Embedded Learning

**Path:** `apps/VCSM/src/learning/`

```
adapters/   controller/   dal/   hooks/   screens/   styles/
```
dal/: 25+ files (submissionFiles, modules, lessons, submissions, memberships, rubrics, courses, realms, lessonProgress, assignments, grades, organizations)
controller/: administration/, teachers/, students/, parents/ (15+ files)

---

## Engine Layer Summary

| Engine | DALs | Models | Controllers | Services | Hooks |
|--------|------|--------|-------------|----------|-------|
| Chat | 27 | 13+ | 29 | 9 | 9 |
| Identity | 10 | 6 | 3 | 7 | 0 |
| Hydration | 1 | 0 | 1 | 0 | 1 |
| Reviews | 7 | 6 | 6 | 3 | 0 |
| Portfolio | 7+ | 4 | 8 | 1 | 0 |
| Notifications | 11 | 7 | 4 | 4 | 0 |
