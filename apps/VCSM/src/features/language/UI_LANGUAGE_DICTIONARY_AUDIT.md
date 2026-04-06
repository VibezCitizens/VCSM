# UI LANGUAGE DICTIONARY AUDIT & I18N MIGRATION PLAN

Date: 2026-04-05
Scope: VCSM + Wentrex + shared engines
Method: Full JSX/JS file scan across all features

---

## 1. CURRENT UI ARCHITECTURE

**VCSM**: React 19 + Vite SPA, BrowserRouter, Zustand state, UnoCSS + Framer Motion
**Wentrex**: React 19 + Vite SPA, same stack, separate app root
**Rendering**: Standard JSX with inline string literals everywhere
**No i18n system exists today** — all text is hardcoded in JSX/JS files

Entry points:
- VCSM: `apps/VCSM/src/main.jsx` → `App.jsx` → `routes/index.jsx`
- Wentrex: `apps/wentrex/src/main.jsx` → routes

---

## 2. FILES CONTAINING USER-FACING UI TEXT

### VCSM — ~120+ files with user-visible strings

**Auth & Onboarding (8 files)**
- features/auth/screens/LoginScreen.jsx
- features/auth/components/RegisterFormCard.jsx
- features/auth/screens/Onboarding.jsx
- features/auth/screens/ResetPasswordScreen.jsx
- features/auth/screens/CompleteProfileGate.jsx
- features/auth/hooks/useRegister.js
- features/auth/hooks/useResetPassword.js
- features/auth/hooks/useAuthOnboarding.js

**Navigation & Layout (4 files)**
- shared/components/BottomNavBar.jsx
- shared/components/TopNav.jsx
- app/routes/index.jsx
- app/platform/ios/components/IosInstallPrompt.jsx

**Feed (3 files)**
- features/feed/screens/CentralFeedScreen.jsx
- features/feed/components/FeedConfirmModal.jsx
- features/feed/dal/feed.posts.dal.js (dynamic author labels)

**Post & Comments (~15 files)**
- features/post/postcard/components/PostHeader.jsx
- features/post/postcard/components/PostActionsMenu.jsx
- features/post/postcard/components/ShareModal.jsx
- features/post/postcard/components/PostConfirmModal.jsx
- features/post/postcard/screens/EditPost.jsx
- features/post/screens/PostDetail.view.jsx
- features/post/screens/PostFeed.screen.jsx
- features/post/postcard/components/MediaCarousel.jsx
- features/post/commentcard/components/CommentCard.view.jsx
- features/post/commentcard/components/CommentActions.jsx
- features/post/commentcard/components/CommentList.jsx
- features/post/commentcard/components/CommentComposeModal.jsx
- features/post/commentcard/components/CommentReplyModal.jsx
- features/post/commentcard/components/CommentInput.view.jsx
- features/post/commentcard/screens/EditComment.jsx

**Upload/Composer (6 files)**
- features/upload/screens/UploadScreenModern.jsx
- features/upload/components/UploadHeader.jsx
- features/upload/components/UploadCard.jsx
- features/upload/components/CaptionCard.jsx
- features/upload/components/SelectedThumbStrip.jsx
- features/upload/components/MentionChips.jsx

**Chat & Inbox (~10 files)**
- features/chat/inbox/components/InboxEmptyState.jsx
- features/chat/inbox/components/CardInbox.jsx
- features/chat/inbox/screens/InboxScreen.jsx
- features/chat/inbox/screens/RequestsInboxScreen.jsx
- features/chat/inbox/screens/ArchivedInboxScreen.jsx
- features/chat/inbox/screens/SpamInboxScreen.jsx
- features/chat/start/screens/StartConversationModal.jsx
- features/chat/conversation/components/ChatHeader.jsx
- features/chat/conversation/components/ChatInput.jsx
- features/chat/conversation/components/MessageBubble.jsx
- features/chat/conversation/components/ConversationActionsMenu.jsx
- features/chat/conversation/components/MessageActionsMenu.jsx
- features/chat/conversation/screen/ConversationView.jsx

**Notifications (~10 files)**
- features/notifications/inbox/ui/NotificationsHeader.view.jsx
- features/notifications/inbox/ui/Notifications.view.jsx
- features/notifications/types/follow/FollowNotificationItem.view.jsx
- features/notifications/types/follow/FollowRequestItem.view.jsx
- features/notifications/types/follow/AcceptFriendRequestItem.jsx
- features/notifications/types/reaction/PostLikeNotificationItem.view.jsx
- features/notifications/types/reaction/PostDislikeNotificationItem.view.jsx
- features/notifications/types/reaction/PostRoseNotificationItem.view.jsx
- features/notifications/types/comment/CommentNotificationItem.view.jsx
- features/notifications/types/comment/CommentLikeNotificationItem.view.jsx
- features/notifications/types/comment/CommentReplyNotificationItem.view.jsx
- features/notifications/types/mention/PostMentionNotificationItem.view.jsx

**Profiles & Social (~15 files)**
- features/profiles/ui/header/Subscribebutton.jsx
- features/profiles/ui/header/Messagebutton.jsx
- features/profiles/ui/PrivateProfileGate.jsx
- features/profiles/screens/views/ActorProfileTabs.jsx
- features/profiles/screens/views/ActorProfileHeader.jsx
- features/profiles/screens/views/tabs/friends/components/FriendsList.jsx
- features/profiles/screens/views/tabs/friends/components/FriendsEmptyState.jsx
- features/profiles/screens/views/profileheader/ProfileHeaderQRCodeModal.jsx

**Vport Profile Tabs (~20 files)**
- features/profiles/kinds/vport/screens/VportProfileViewScreen.jsx
- features/profiles/kinds/vport/screens/views/tabs/VportAboutView.jsx
- features/profiles/kinds/vport/screens/views/tabs/VportSubscribersView.jsx
- features/profiles/kinds/vport/screens/views/tabs/VportMenuView.jsx
- features/profiles/kinds/vport/screens/services/view/VportServicesView.jsx
- features/profiles/kinds/vport/screens/services/components/VportServicesEmptyState.jsx
- features/profiles/kinds/vport/screens/review/VportReviewsView.jsx
- features/profiles/kinds/vport/screens/booking/view/VportBookingView.jsx
- features/profiles/kinds/vport/screens/portfolio/PortfolioTab.jsx
- features/profiles/kinds/vport/screens/rates/view/VportRatesView.jsx
- features/profiles/kinds/vport/screens/gas/view/VportGasPricesView.jsx
- features/profiles/kinds/vport/screens/owner/VportOwnerView.jsx
- features/profiles/kinds/vport/screens/menu/components/*.jsx

**Settings (~8 files)**
- features/settings/screen/SettingsScreen.jsx
- features/settings/account/ui/AccountTab.view.jsx
- features/settings/profile/ui/ProfileTab.view.jsx
- features/settings/privacy/ui/PrivacyTab.view.jsx
- features/settings/privacy/ui/ProfilePrivacyToggle.jsx
- features/settings/privacy/ui/PendingFollowRequests.jsx
- features/settings/privacy/ui/BlockedUsersSimple.jsx
- features/settings/privacy/ui/UserLookup.jsx
- features/settings/vports/ui/VportsTab.view.jsx

**Vport Creation (1 file)**
- features/vport/CreateVportForm.jsx

**Public Pages (1 file)**
- features/public/vportMenu/view/VportPublicMenuView.jsx

### Wentrex — ~40+ files

**Auth**: features/auth/components/LoginFormPanel.jsx
**Landing**: learning/screens/LandingPage.jsx
**Dashboards**: student/teacher/parent/admin dashboard screens
**Course screens**: student/teacher course views
**Lesson/Assignment screens**: shared lesson and assignment views
**Submission/Grading**: teacher submission review
**Roster**: admin course roster management
**Access Management**: admin access management screen
**Communication/Inbox**: features/communication/inbox/screens/InboxScreen.jsx
**Layouts**: StudentLayout, ParentLayout, StaffLayout, AdminLayout

---

## 3. ENUM / STATUS / LABEL MAPPINGS

### VCSM Mappings

**Follow Button States** (followRelationState.model.js):
```
not_following → "Subscribe"
request_pending → "Requested"
following → "Unsubscribe"
```

**Booking Status** (bookingCalendarDate.model.js):
```
pending → "Pending"
confirmed → "Confirmed"
completed → "Completed"
cancelled → "Cancelled"
no_show → "No show"
hold → "Hold"
```

**Day Segments** (bookingCalendarDate.model.js):
```
morning → "Morning"
afternoon → "Afternoon"
evening → "Evening"
```

**Weekday Labels**: Sun, Mon, Tue, Wed, Thu, Fri, Sat

**Profile Completion Labels** (onboarding.model.js):
```
displayName → "Name"
username → "username"
avatarUrl → "Profile Picture"
bio → "Bio"
```

**Settings Tabs**:
```
privacy → "Privacy"
profile → "Profile"
account → "Account"
vports → "VPORTs"
```

**Profile Tabs** (profileTabs.config.js):
```
vibes → "Vibes"
photos → "Photos"
about → "About"
subscribers → "Subscribers"
reviews → "Reviews"
menu → "Menu"
gas → "Gas"
services → "Services"
rates → "Rates"
portfolio → "Portfolio"
book → "Calendar"
```

**Vport Types** (vportTypes.config.js) — 80+ types across 13 category groups

**Notification Kinds** (notification.mapper.js):
```
like → "liked your Vibe 👍"
dislike → "disliked your Vibe 👎"
post_rose → "sent a rose to your Vibe 🌹"
follow → "subscribed to you"
follow_request → "sent you a subscribe request"
accept_friend_request → "accepted your subscribe request."
comment → "commented on your Spark 💬"
comment_like → "liked your Spark ❤️"
comment_reply → "replied to your Spark 💬"
mention → "mentioned you in a Vibe"
```

**Lesson Progress** (ProgressPill.jsx):
```
not_started → "Not started"
in_progress → "In progress"
completed → "Completed"
```

### Wentrex Mappings

**Conversation Types** (InboxScreen.jsx):
```
direct → "Direct" (DM)
course → "Class Chat" (CC)
organization → "Staff" (ST)
announcement → "Announcement" (AN)
group → "Group" (GR)
```

**Role Labels** (InboxScreen.jsx):
```
owner/admin → "Administrators"
staff → "Staff"
teacher → "Teachers"
student → "Students"
parent → "Parents"
```

**Course Status**: Active, Draft, Archived, Published
**Submission Status**: Submitted, Graded, Late, Draft, Returned, Missing
**Course Member Status**: Active, Invited, Completed, Dropped, Removed

---

## 4. DUPLICATE & INCONSISTENT PHRASES

### Exact Duplicates (same string in 3+ files)

| String | Occurrences | Files |
|--------|-------------|-------|
| "Cancel" | 15+ | EditPost, EditComment, CommentComposeModal, CommentReplyModal, AccountTab, FeedConfirmModal, PostConfirmModal, CaptionCard, etc. |
| "Save" | 8+ | EditPost, EditComment, CommentCard, ChatInput, ProfileTab, etc. |
| "Delete" | 6+ | PostActionsMenu, MessageActionsMenu, AccountTab, etc. |
| "Loading..." | 10+ | Almost every screen/view |
| "Back" | 8+ | Multiple screens, aria-labels |
| "Close" | 6+ | Modals, StartConversationModal, ConversationView, etc. |
| "Confirm" | 4+ | FeedConfirmModal, PostConfirmModal, AccountTab |
| "View" | 8+ | All notification items |
| "Report" | 3+ | PostActionsMenu, MessageActionsMenu, ConversationActionsMenu |
| "Edit" | 3+ | PostActionsMenu, MessageActionsMenu, EditPost title |
| "Refresh" | 5+ | Wentrex dashboards, settings |
| "Subscribe" | 2+ | Subscribebutton, PostActionsMenu follow label |
| "Accept" / "Decline" | 2+ | FollowRequestItem, PendingFollowRequests |

### Inconsistent Wording (same concept, different text)

| Concept | Variant 1 | Variant 2 | Files |
|---------|-----------|-----------|-------|
| Submit comment | "Spark" | "Vibe" | CommentComposeModal vs CommentInput.view |
| Delete confirm | "Delete this Vibe?" | "Delete Vibe" | PostDetail vs PostFeed |
| Chat name | "Vox" | "Vox Requests" / "Archived Vox" | InboxScreen variants |
| Loading text | "Loading..." | "Loading more..." / "Loading Vibes..." / "Loading conversation..." | Various |
| Empty state | "No Vibes found." | "No Vibes yet." / "No sparks yet. Be the first." | CentralFeed vs PostFeed vs PostDetail |
| Chat placeholder | "Type a message..." | "Edit message..." | ChatInput (compose vs edit) |

---

## 5. DYNAMIC / INTERPOLATED STRINGS

### Template Literals Requiring Placeholders

| Current Code | Proposed Key | Interpolation |
|-------------|-------------|---------------|
| `` `Vox (${chatUnread})` `` | navigation.vox_with_count | `{{count}}` |
| `` `Notifications (${notiCount})` `` | navigation.notifications_with_count | `{{count}}` |
| `` `${followerCount} Subscribers` `` | profile.subscriber_count | `{{count}}` |
| `` `No results for "${query}".` `` | search.no_results_for | `{{query}}` |
| `` `About ${displayName}` `` | vport.about_title | `{{name}}` |
| `` `Booking availability for @${username}.` `` | booking.availability_subtitle | `{{username}}` |
| `` `My Courses (${count})` `` | courses.my_courses_count | `{{count}}` |
| `` `${count} blocked` `` | settings.blocked_count | `{{count}}` |
| `` `Vport: @${username}` `` | vport.footer_handle | `{{username}}` |
| `` `Selected (${count})` `` | upload.selected_count | `{{count}}` |
| `` `Remove @${handle}` `` | upload.remove_mention | `{{handle}}` |
| `` `Step ${n}` `` | ios_install.step_n | `{{n}}` |

### Notification Sentences (name + action)

| Pattern | Proposed Key | Interpolation |
|---------|-------------|---------------|
| `"{name} subscribed to you"` | notifications.follow_body | `{{name}}` |
| `"{name} liked your Vibe 👍"` | notifications.post_like_body | `{{name}}` |
| `"{name} disliked your Vibe 👎"` | notifications.post_dislike_body | `{{name}}` |
| `"{name} sent a rose to your Vibe 🌹"` | notifications.post_rose_body | `{{name}}` |
| `"{name} commented on your Spark 💬"` | notifications.comment_body | `{{name}}` |
| `"{name} liked your Spark ❤️"` | notifications.comment_like_body | `{{name}}` |
| `"{name} replied to your Spark 💬"` | notifications.comment_reply_body | `{{name}}` |
| `"{name} mentioned you in a Vibe"` | notifications.mention_body | `{{name}}` |
| `"{name} sent you a subscribe request"` | notifications.follow_request_body | `{{name}}` |
| `"{name} accepted your subscribe request."` | notifications.follow_accept_body | `{{name}}` |

### Plural-Sensitive Strings

| String | Needs Plural | Proposed Format |
|--------|-------------|-----------------|
| `"{count} Subscribers"` | Yes | `"{{count}} Subscriber" / "{{count}} Subscribers"` |
| `"{count} comments"` | Yes | `"{{count}} comment" / "{{count}} comments"` |
| `"You can upload up to 10 photos"` | No (fixed) | Static |

---

## 6. PROPOSED DICTIONARY NAMESPACES

```
locales/
  en/
    common.json          — Save, Cancel, Delete, Close, Back, Loading, Confirm, etc.
    auth.json            — Login, Register, Onboarding, Reset password
    navigation.json      — Tab labels, header titles, bottom nav
    feed.json            — Feed states, post actions, confirm dialogs
    post.json            — Post detail, edit post, share, report
    comment.json         — Sparks (comments), compose, reply, edit
    upload.json          — Composer, caption, media, mentions
    chat.json            — Vox (inbox), conversation, messages, actions
    notifications.json   — Notification bodies, filters, actions
    profile.json         — Profile header, tabs, follow, friends, privacy gate
    settings.json        — Privacy, profile edit, account, vports tab
    booking.json         — Calendar, slots, statuses, appointment actions
    vport.json           — About, services, reviews, menu, gas, rates, portfolio, owner
    vport_types.json     — All 80+ vport type labels by category
    forms.json           — Labels, placeholders, validation messages
    errors.json          — Error messages, fallback text
    empty_states.json    — Empty state titles and descriptions
    moderation.json      — Report, block, spam actions
    ios_install.json     — iOS PWA install steps
    wentrex/
      common.json        — Wentrex-specific common terms
      auth.json          — Wentrex login text
      landing.json       — Landing page copy
      dashboard.json     — Dashboard labels per role
      courses.json       — Course, lesson, assignment labels
      grading.json       — Submission, grade, rubric labels
      roster.json        — Membership, roles, access labels
      communication.json — Wentrex messaging labels
```

---

## 7. KEY NAMING CONVENTIONS

Format: `namespace.semantic_key`

```
common.save                    → "Save"
common.cancel                  → "Cancel"
common.delete                  → "Delete"
common.close                   → "Close"
common.back                    → "Back"
common.loading                 → "Loading..."
common.confirm                 → "Confirm"
common.edit                    → "Edit"
common.search                  → "Search"

auth.login_title               → "Vibez Citizens"
auth.login_tagline             → "Where your vibez belongs."
auth.login_button              → "Login"
auth.login_loading             → "Logging in…"
auth.register_title            → "Join Vibez Citizens"
auth.register_button           → "Create account"
auth.forgot_password           → "Forgot password?"
auth.reset_title               → "Reset Password"
auth.reset_send                → "Send Reset Link"
auth.reset_success             → "Check your email for the reset link."

navigation.home                → "Home"
navigation.explore             → "Explore"
navigation.vox                 → "Vox"
navigation.notifications       → "Notifications"
navigation.citizen             → "Citizen"
navigation.settings            → "Settings"
navigation.new_upload          → "New Upload"

feed.no_vibes                  → "No Vibes found."
feed.loading_more              → "Loading more..."
feed.end_of_feed               → "End of feed"

post.edit_title                → "Edit Vibe"
post.delete_title              → "Delete Vibe"
post.delete_confirm            → "Delete this Vibe?"
post.delete_error              → "Failed to delete Vibe"
post.report_title              → "Report Vibe"
post.share_title               → "Spread"

comment.compose_title          → "New Spark"
comment.reply_title            → "Reply"
comment.placeholder            → "Write a Spark..."
comment.submit                 → "Spark"
comment.sign_in                → "Sign in to Spark"
comment.view_replies           → "View replies"
comment.hide_replies           → "Hide replies"
comment.empty                  → "No sparks yet. Be the first."

chat.inbox_title               → "Vox"
chat.inbox_vport               → "Vport Vox"
chat.new_vox                   → "New Vox"
chat.empty_title               → "No Vox yet"
chat.empty_description         → "Start a Vox and your Vox will appear here."
chat.search_placeholder        → "Search Citizens, Vports..."
chat.message_placeholder       → "Type a message..."
chat.edit_placeholder          → "Edit message..."
chat.send                      → "Send"
chat.message_deleted           → "Message deleted"
chat.message_edited            → "(edited)"

notifications.title            → "Notifications"
notifications.mark_all_seen    → "Mark all seen"
notifications.empty            → "No notifications"
notifications.view             → "View"
notifications.accept           → "Accept"
notifications.decline          → "Decline"

profile.subscribe              → "Subscribe"
profile.message                → "Message"
profile.qr                     → "QR"
profile.no_bio                 → "No bio provided."
profile.private_title          → "Private Profile"
profile.tab_photos             → "Photos"
profile.tab_videos             → "Videos"
profile.tab_vibes              → "Vibes"
profile.tab_friends            → "Friends"
profile.tab_tags               → "Tags"

booking.calendar_title         → "Calendar"
booking.request_slot           → "Request selected slot"
booking.status_pending         → "Pending"
booking.status_confirmed       → "Confirmed"
booking.status_cancelled       → "Cancelled"

vport.about_title              → "About {{name}}"
vport.services_title           → "Services"
vport.reviews_title            → "Reviews"
vport.subscribers_title        → "Subscribers"
vport.owner_title              → "Owner"

settings.title                 → "Settings"
settings.tab_privacy           → "Privacy"
settings.tab_profile           → "Profile"
settings.tab_account           → "Account"
settings.tab_vports            → "VPORTs"
settings.logout                → "Log out"
settings.delete_account        → "Delete account"
settings.delete_vport          → "Delete VPORT"
settings.changes_saved         → "Changes saved"
```

---

## 8. VCSM VS WENTREX WORDING DRIFT

| Concept | VCSM | Wentrex | Recommendation |
|---------|------|---------|----------------|
| Chat section | "Vox" | "Messages" | App-specific (keep separate) |
| User | "Citizen" | "Student/Teacher/Parent/Admin" | App-specific |
| Post | "Vibe" / "Vibes" | N/A | VCSM-only |
| Comment | "Spark" / "Sparks" | N/A | VCSM-only |
| Share | "Spread" | N/A | VCSM-only |
| Follow | "Subscribe" | N/A | VCSM-only |
| Business profile | "VPORT" / "Vport" | N/A | VCSM-only |
| Login button | "Login" | "Sign in" | **Standardize to one** |
| Forgot password | "Forgot password?" | "Forgot password?" | Shared |
| Back button | "Back" | "Back" / "← Back to portal" | Wentrex adds context |
| Loading | "Loading..." | "Loading..." | Shared via common.json |
| Empty state | "No Vibes found." | "No courses found." | Pattern shared, nouns app-specific |
| Dashboard | N/A | "Student/Teacher/Parent/Admin Dashboard" | Wentrex-only |
| Conversation types | N/A | "Direct/Class Chat/Staff/Announcement/Group" | Wentrex-only |
| Grading | N/A | "Submitted/Graded/Late/Draft/Returned/Missing" | Wentrex-only |

---

## 9. BAD LOCALIZATION PATTERNS

### Concatenated Labels (Hard to Translate)
```jsx
// BAD: "Selected: " + count — word order breaks in other languages
"Selected: " + selectedFiles.length

// BAD: Split across JSX nodes
<span>Selected (</span><span>{count}</span><span>)</span>

// BAD: Inline punctuation fragments
"Vport: @" + username
```

### Template Strings with Embedded Emojis
```
"liked your Vibe 👍"
"sent a rose to your Vibe 🌹"
"commented on your Spark 💬"
```
Emojis should be separated from translatable text.

### Hardcoded Punctuation
```
"Are you sure?"  — OK
"Delete this Vibe?"  — OK (full sentence)
"(edited)"  — Parentheses are part of display, should be in key
```

### Dynamic Labels Without Full Phrases
```jsx
// BAD: builds label by concatenation
`${count} Subscribers` — needs plural rule
`Step ${n}` — needs interpolation
```

### Inconsistent Casing
```
"Subscribe" vs "subscribe" (in different contexts)
"VPORTs" vs "Vport" vs "VPORT" (inconsistent casing across UI)
```

---

## 10. RECOMMENDED I18N LIBRARY

**Recommendation: `react-i18next`**

Reasons:
- Standard for React apps, massive ecosystem
- JSON dictionary files (exact format proposed above)
- Built-in interpolation: `t('profile.subscriber_count', { count: 42 })`
- Built-in pluralization: `"{{count}} Subscriber" / "{{count}} Subscribers"`
- Namespace support (matches domain structure)
- Lazy loading per namespace (performance)
- SSR/SSG compatible if needed later
- React Native compatible (mobile parity)
- SwiftUI can consume same JSON files via Apple's String Catalog or custom loader

---

## 11. SAFE MIGRATION ORDER

### Phase 1 — Foundation + Common (lowest risk)
- Install react-i18next + i18next
- Create `locales/en/common.json` with: Save, Cancel, Delete, Close, Back, Loading, Confirm, Edit
- Create `useTranslation` wrapper
- Migrate BottomNavBar.jsx and TopNav.jsx (6 strings, high visibility, zero business logic)

### Phase 2 — Auth Screens
- Create `locales/en/auth.json`
- Migrate LoginScreen, RegisterFormCard, Onboarding, ResetPasswordScreen
- ~40 strings, isolated screens, no cross-feature dependencies

### Phase 3 — Feed + Post
- Create `locales/en/feed.json`, `locales/en/post.json`, `locales/en/comment.json`
- Migrate CentralFeedScreen, PostDetail, PostFeed, PostActionsMenu
- Migrate CommentComposeModal, CommentReplyModal, CommentInput, CommentCard
- ~80 strings, high-traffic surfaces

### Phase 4 — Chat + Inbox
- Create `locales/en/chat.json`
- Migrate InboxScreen variants, ConversationView, ChatHeader, ChatInput
- Migrate message actions, conversation actions
- ~60 strings

### Phase 5 — Notifications
- Create `locales/en/notifications.json`
- Migrate all notification item views
- ~30 strings, mostly interpolated sentences

### Phase 6 — Profile + Settings
- Create `locales/en/profile.json`, `locales/en/settings.json`
- Migrate profile headers, tabs, privacy gates, settings tabs
- ~60 strings

### Phase 7 — Vport + Booking
- Create `locales/en/vport.json`, `locales/en/booking.json`, `locales/en/vport_types.json`
- Migrate all vport tab views, booking calendar, services, reviews
- ~150 strings (largest batch due to vport type taxonomy)

### Phase 8 — Upload/Composer + Forms + Errors
- Create `locales/en/upload.json`, `locales/en/forms.json`, `locales/en/errors.json`, `locales/en/empty_states.json`
- Sweep remaining hardcoded strings
- ~40 strings

### Phase 9 — Wentrex
- Create `locales/en/wentrex/*.json` namespace
- Migrate Wentrex screens independently
- ~200 strings (landing page alone is ~50)

---

## 12. MOBILE COMPATIBILITY STRATEGY

The same JSON dictionary keys work across platforms:

**React (Web)**: `react-i18next` reads `locales/en/*.json` directly
**React Native (future)**: `react-i18next` works identically
**SwiftUI (native iOS)**: Two options:
  1. Convert JSON → Apple `.xcstrings` (String Catalog) at build time
  2. Load JSON at runtime via custom `LocalizationService`

Key naming convention (`namespace.key`) maps cleanly to:
- Apple `NSLocalizedString("chat.send", comment: "")` format
- Android `strings.xml` `<string name="chat_send">Send</string>` format

The dictionary files should live in a shared location consumable by all platforms:
```
/locales/en/common.json    ← web + mobile read from here
/locales/es/common.json    ← future Spanish
```

---

## 13. HIGHEST-PRIORITY STRINGS TO MIGRATE FIRST

| Priority | Strings | Reason |
|----------|---------|--------|
| P0 | common.json (15 strings) | Foundation — Save, Cancel, Delete, Close, Back, Loading, Confirm, Edit, Search, Remove, Refresh, Submit, Done, Next, Previous |
| P0 | navigation.json (7 strings) | Every user sees tab labels on every page load |
| P1 | auth.json (~40 strings) | First screens every new user encounters |
| P1 | chat.json (~60 strings) | High-frequency daily use |
| P2 | notifications.json (~30 strings) | Contains interpolated sentences most complex to migrate |
| P2 | post.json + comment.json (~50 strings) | Core social content |
| P3 | vport_types.json (80+ strings) | Largest single batch, low change frequency |
| P3 | wentrex/*.json (~200 strings) | Separate app, can migrate independently |

---

## TOTAL STRING COUNT ESTIMATE

| App | Estimated Unique Strings |
|-----|-------------------------|
| VCSM | ~500-550 |
| Wentrex | ~200-250 |
| Shared (common) | ~15-20 |
| **Total** | **~750** |
