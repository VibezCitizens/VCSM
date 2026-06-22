# VCSM Contract Violations
Generated: 2026-05-01
Scanned: 1,957 files in apps/VCSM/src

---

## SUMMARY

| Category | Count | Priority |
|----------|-------|----------|
| Files > 300 lines | 5 | P2 |
| Cross-feature imports (no adapters) | 12 | P1 |
| Layer order violations (hooks bypass controller) | 14 | P1 |
| Naming violations | 5 | P3 |
| TypeScript files | 0 ✓ | — |

**Total open violations: 36**

---

## 1. FILES OVER 300 LINES (5)

| Lines | File | Notes |
|-------|------|-------|
| 476 | `features/legal/screens/AboutView.jsx` | Static content page |
| 471 | `features/legal/docs/TermsOfServiceContent.jsx` | Long-form legal text |
| 379 | `features/legal/docs/PrivacyPolicyContent.jsx` | Long-form legal text |
| 351 | `features/legal/screens/ContactView.jsx` | Static content page |
| 302 | `learning/screens/administration/LearningOrganizationScreen.jsx` | LMS admin screen |

---

## 2. CROSS-FEATURE BOUNDARY VIOLATIONS (12)

Direct feature-to-feature imports that bypass the adapter boundary.

**Media feature (8 violations — highest priority)**
- `features/chat/conversation/controller/recordChatAttachment.controller.js` → `@/features/media`
- `features/dashboard/flyerBuilder/controller/flyerEditor.controller.js` → `@/features/media`
- `features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js` → `@/features/media`
- `features/dashboard/vport/controller/addPortfolioMediaWithRecord.controller.js` → `@/features/media`
- `features/upload/controller/recordPostMedia.controller.js` → `@/features/media`
- `features/wanders/core/controllers/publishWandersFromBuilder.controller.js` → `@/features/media`
- `features/wanders/core/controllers/cards.controller.js` → `@/features/media`
- `features/vport/controller/submitCreateVport.controller.js` → `@/features/media`
- `features/settings/profile/controller/recordProfileMediaAsset.controller.js` → `@/features/media`

**Other features (3 violations)**
- `features/wanders/core/hooks/useWandersBusinessCardOps.js` → `@/features/public`
- `features/profiles/controller/friends/getTopFriendCandidates.controller.js` → `@/features/block`
- `features/notifications/inbox/controller/inboxUnread.controller.js` → `@/features/chat`

**Fix:** Add `features/media/adapters/` and expose media operations through it. Callers import from adapters only.

---

## 3. LAYER ORDER VIOLATIONS — HOOKS BYPASS CONTROLLER (14)

Hooks calling DAL directly instead of going through Controller layer.

- `features/moderation/hooks/useConversationCover.js`
- `features/invite/hooks/useInvite.js`
- `features/feed/hooks/useFeedWelcomeCard.js`
- `features/legal/hooks/useLegalConsent.js`
- `features/legal/hooks/useLegalDocument.js`
- `features/upload/hooks/useUploadSubmit.js`
- `features/post/commentcard/hooks/useCommentCard.js`
- `features/dashboard/flyerBuilder/hooks/useFlyerEditor.js`
- `features/public/vportMenu/hooks/useResolveMenuSlug.js`
- `features/public/vportMenu/hooks/useResolveVportSlug.js`
- `features/notifications/inbox/hooks/useMarkNotificationsRead.js`
- `features/notifications/inbox/hooks/useNotificationsHeader.js`
- `features/notifications/inbox/hooks/useNotificationsInternal.js`
- `features/notifications/inbox/hooks/useNotificationInbox.js`

**Fix:** Introduce controller layer for each. Hooks call controller; controller calls DAL.

---

## 4. NAMING VIOLATIONS (5)

| File | Violation |
|------|-----------|
| `features/moderation/dal/reports.dal.columns.js` | Non-standard DAL suffix |
| `features/dashboard/flyerBuilder/dal/flyerDraft.model.js` | Model file placed in dal/ |
| `features/profiles/screens/views/tabs/friends/dal/friendGraph.utils.js` | Utility file in dal/ |
| `features/onboarding/controller/onboarding.controller.helpers.js` | Helper suffix — should be `.controller.js` |
| `features/settings/profile/controller/profile.controller.core.js` | Core suffix — should be `.controller.js` |

---

## COMPLIANT

- No TypeScript files ✓
- No direct `/engines/` imports in source ✓
- Engine abstraction via `@/features/*/setup` ✓
- Adapter pattern adopted in 21+ features ✓
- Relative imports contained to same-feature contexts ✓
- All `@/` alias usage correct across 1,957 files ✓
