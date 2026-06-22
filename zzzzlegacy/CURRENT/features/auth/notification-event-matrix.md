# Notification Event Matrix

**Generated:** 2026-04-12
**Updated:** 2026-05-10 — booking events migrated to ENGINE; recipient rules corrected for vport actorId fix and team member batch
**Method:** Code-derived — inspected all controllers, DAL writes, DB triggers, and notification paths
**Scope:** apps/VCSM + apps/wentrex

---

## 1. Executive Summary

The platform has **45 identifiable notification events** across VCSM and Wentrex. Of these:
- **10 are implemented via DB triggers** (legacy `vc.notifications`)
- **4 are implemented via controller code** (legacy `dalInsertNotification`)
- **2 are badge-only** (no stored notification, just count)
- **29 are MISSING** (should exist but don't — 12 VCSM + 17 Wentrex)

The notification engine (`engines/notifications/`) is built but not yet wired. The matrix below maps every event to its current status, recipient rule, channel, and priority.

---

## 2. VCSM Notification Matrix

### 2.1 Social Events

| Event Key | Trigger Source | Recipient | Channels | Priority | Status |
|-----------|---------------|-----------|----------|----------|--------|
| `social.follow.requested` | DB trigger `trg_follow_request_notify` on `vc.social_follow_requests` | Target actor | in_app | 3 | LEGACY |
| `social.follow.accepted` | DB trigger `trg_follow_accept_notify` on `vc.social_follow_requests` | Requester actor | in_app | 3 | LEGACY |
| `social.follow.new` | DB trigger `trg_actor_follows_notify` on `vc.actor_follows` | Followed actor | in_app | 4 | LEGACY |
| `social.post.comment` | DB trigger `trg_post_comments_notify` on `vc.post_comments` | Post author | in_app | 3 | LEGACY |
| `social.post.comment_reply` | DB trigger `trg_post_comments_notify` on `vc.post_comments` | Parent comment author | in_app | 3 | LEGACY |
| `social.post.comment_like` | DB trigger `trg_comment_like_notify` on `vc.comment_likes` | Comment author | in_app | 4 | LEGACY |
| `social.post.like` | DB trigger `trg_post_reactions_notify` on `vc.post_reactions` | Post author | in_app | 4 | LEGACY |
| `social.post.dislike` | DB trigger `trg_post_reactions_notify` on `vc.post_reactions` | Post author | in_app | 4 | LEGACY |
| `social.post.rose` | DB trigger `trg_post_rose_gifts_notify` on `vc.post_rose_gifts` | Post author | in_app | 3 | LEGACY |
| `social.post.mention` | DB trigger `trg_post_mentions_notify` on `vc.post_mentions` | Mentioned actor | in_app | 3 | LEGACY |

### 2.2 Booking Events

| Event Key | Trigger Source | Recipient | Channels | Priority | Status |
|-----------|---------------|-----------|----------|----------|--------|
| `booking.created` | `vportPublicBooking.controller.js` → `publishVcsmNotificationBatch()` | vport profile actor + `resource.member_actor_id` (batch, deduped, requester excluded) | in_app | 2 | **ENGINE** (2026-05-10) |
| `booking.confirmed` | `updateVportBooking.controller.js` → `publishVcsmNotification()` | Other party — client acting → vport actor; vport acting → customer actor | in_app | 2 | **ENGINE** (2026-05-10) |
| `booking.cancelled` | `updateVportBooking.controller.js` → `publishVcsmNotification()` | Other party — client acting → vport actor; vport acting → customer actor | in_app | 2 | **ENGINE** (2026-05-10) |
| `booking.reminder` | — | Customer actor | in_app, push | 2 | MISSING |
| `booking.completed` | — | Both parties | in_app | 3 | MISSING |

### 2.3 Review Events

| Event Key | Trigger Source | Recipient | Channels | Priority | Status |
|-----------|---------------|-----------|----------|----------|--------|
| `review.created` | `VportReviews.controller.js` → `dalInsertNotification()` | Business owner actor | in_app, email | 2 | LEGACY (controller) |
| `review.replied` | — | Review author | in_app | 3 | MISSING |

### 2.4 Moderation Events

| Event Key | Trigger Source | Recipient | Channels | Priority | Status |
|-----------|---------------|-----------|----------|----------|--------|
| `moderation.post_hidden` | `moderationActions.controller.js` | Post author | in_app | 2 | MISSING |
| `moderation.post_hidden` | `hideReportedObjectController` in moderationActions.controller.js | Post author | in_app | 2 | MISSING |
| `moderation.report_dismissed` | `dismissReportController` in moderationActions.controller.js | Reporter actor | in_app | 3 | MISSING |
| `moderation.account_warning` | — | Target actor | in_app, email | 1 | MISSING |

### 2.5 Vport Business Events

| Event Key | Trigger Source | Recipient | Channels | Priority | Status |
|-----------|---------------|-----------|----------|----------|--------|
| `lead_received` | `vportBusinessCard.controller.js` → `publishVcsmNotification()` | Vport owner actor | in_app | 2 | **ENGINE** (2026-04-29) |
| `vport.fuel_price.approved` | `reviewFuelPriceSuggestion.controller.js` | Submitter actor | in_app | 4 | MISSING |
| `vport.fuel_price.rejected` | `reviewFuelPriceSuggestion.controller.js` | Submitter actor | in_app | 4 | MISSING |

### 2.6 Chat Events

| Event Key | Trigger Source | Recipient | Channels | Priority | Status |
|-----------|---------------|-----------|----------|----------|--------|
| `chat.message_received` | Chat engine → `chat.inbox_entries` | Recipient actor | in_app (badge) | 3 | BADGE ONLY |
| `chat.conversation_invite` | — | Invited actor | in_app | 3 | MISSING |

### 2.6 System Events

| Event Key | Trigger Source | Recipient | Channels | Priority | Status |
|-----------|---------------|-----------|----------|----------|--------|
| `system.legal_update` | Legal consent system | All users | in_app, email | 1 | MISSING |
| `system.account_suspended` | — | Suspended actor | in_app, email | 1 | MISSING |
| `system.password_changed` | — | User | email | 2 | MISSING |

---

## 3. WENTREX Notification Matrix

**Status: ALL MISSING — Wentrex has zero notification infrastructure**

### 3.1 Course & Enrollment Events

| Event Key | Trigger Source | Recipient | Channels | Priority | Status |
|-----------|---------------|-----------|----------|----------|--------|
| `learning.course.created` | `createCourse.controller.js` | Organization admins | in_app | 3 | MISSING |
| `learning.student.enrolled` | `assignStudentToCourse.controller.js` | Student, teachers, linked parents | in_app, email | 2 | MISSING |
| `learning.teacher.assigned` | `assignTeacherToCourse.controller.js` | Teacher, org admins | in_app, email | 2 | MISSING |
| `learning.observer.assigned` | `assignObserverToCourse.controller.js` | Observer/parent, org admins | in_app | 3 | MISSING |

### 3.2 Assignment & Grading Events

| Event Key | Trigger Source | Recipient | Channels | Priority | Status |
|-----------|---------------|-----------|----------|----------|--------|
| `learning.assignment.created` | CreateAssignmentScreen | Enrolled students | in_app | 3 | MISSING |
| `learning.assignment.submitted` | `submitAssignment.controller.js` | Teachers/graders | in_app, email | 2 | MISSING |
| `learning.assignment.graded` | `gradeSubmission.controller.js` | Student, linked parents | in_app, email | 2 | MISSING |
| `learning.lesson.completed` | `markLessonComplete.controller.js` | Teachers, linked parents | in_app | 4 | MISSING |

### 3.3 Membership & Admin Events

| Event Key | Trigger Source | Recipient | Channels | Priority | Status |
|-----------|---------------|-----------|----------|----------|--------|
| `learning.parent.linked` | `linkParentToStudent.controller.js` | Parent, student, org admins | in_app, email | 2 | MISSING |
| `learning.member.created` | `createOrganizationMember.controller.js` | New member | in_app, email | 2 | MISSING |
| `learning.parent.created` | `createParentMember.controller.js` | Parent, linked student | in_app, email | 2 | MISSING |
| `learning.role.changed` | `assignOrganizationMember.controller.js` | Affected member | in_app | 3 | MISSING |
| `learning.admin.granted` | `addPlatformAdmin.controller.js` | New admin | in_app, email | 2 | MISSING |
| `learning.admin.revoked` | `removePlatformAdmin.controller.js` | Removed admin | in_app, email | 2 | MISSING |
| `learning.access.granted` | `grantLearningAccess.controller.js` | User | in_app | 3 | MISSING |
| `learning.access.revoked` | `revokeLearningAccess.controller.js` | User | in_app, email | 2 | MISSING |

---

## 4. Legacy vs Engine Coverage

| Category | Count | Details |
|----------|-------|---------|
| **LEGACY (DB trigger)** | 10 | Social events — follow, comment, reaction, mention. All via `vc.create_notification()` RPC (dual-write; UI reads engine now) |
| **LEGACY (controller)** | 1 | `review.created` via `VportReviews.controller.js → publishVcsmNotification()` |
| **BADGE ONLY** | 2 | Chat message (inbox_entries badge), notification bell (notification.inbox_items COUNT) |
| **MISSING** | 26 | 9 VCSM + 17 Wentrex |
| **ENGINE** | 14 | All active events via `publishVcsmNotification()` / `publishVcsmNotificationBatch()` — social × 10 + booking × 3 + review × 1 |

---

## 5. Missing Notifications Summary

### VCSM Missing (9)

| Priority | Events |
|----------|--------|
| Critical (1) | system.legal_update, system.account_suspended, moderation.account_warning |
| High (2) | booking.reminder, moderation.post_hidden, moderation.post_removed, system.password_changed |
| Normal (3) | review.replied, chat.conversation_invite, moderation.report_resolved, booking.completed |

### Wentrex Missing (17)

| Priority | Events |
|----------|--------|
| High (2) | assignment.submitted, assignment.graded, student.enrolled, teacher.assigned, parent.linked, member.created, parent.created, admin.granted, admin.revoked, access.revoked |
| Normal (3) | course.created, observer.assigned, role.changed, access.granted, assignment.created |
| Low (4) | lesson.completed |

---

## 6. Migration Plan

### Phase 1 — Wire Engine + Migrate VCSM Legacy (14 events)

1. Create `apps/VCSM/src/features/notifications/setup.js` → `configureNotificationsEngine()`
2. Seed `notification.event_types` for all 14 existing VCSM events
3. Seed `notification.templates` for in_app channel (10 social + 4 controller events)
4. Wire `publishEvent()` alongside existing `dalInsertNotification()` in booking/review controllers
5. Social events: triggers continue writing to `vc.notifications` for now; engine can shadow-write to `notification.*` for testing

### Phase 2 — Add Missing VCSM Events (9 events)

1. Add moderation notifications (post_hidden, post_removed, report_resolved, account_warning)
2. Add system notifications (legal_update, account_suspended, password_changed)
3. Add booking reminder + completion
4. Add review reply notification
5. Add chat conversation invite

### Phase 3 — Wire Wentrex (17 events)

1. Create `apps/wentrex/src/features/notifications/setup.js` → `configureNotificationsEngine()`
2. Add `@notifications` Vite alias to Wentrex
3. Seed learning event types + templates
4. Wire `publishEvent()` into all 17 Wentrex controllers
5. Build Wentrex notification inbox screen

### Phase 4 — Deprecate Legacy

1. Remove `dalInsertNotification()` calls from booking/review controllers
2. Stop writing to `vc.notifications` (engine handles storage)
3. Migrate bell badge to read from `notification.inbox_items` instead of `vc.notifications`
4. Remove or archive `vc.create_notification()` RPC

---

## 7. Template Requirements

### VCSM Templates (14 existing events)

| Template Key | Variables | Example CTA Path |
|-------------|-----------|-----------------|
| `social.follow.requested` | `{senderName}` | `/profile/{senderId}` |
| `social.follow.accepted` | `{senderName}` | `/profile/{senderId}` |
| `social.follow.new` | `{senderName}` | `/profile/{senderId}` |
| `social.post.comment` | `{senderName}, {postTitle}` | `/post/{postId}` |
| `social.post.comment_reply` | `{senderName}, {postTitle}` | `/post/{postId}` |
| `social.post.comment_like` | `{senderName}` | `/post/{postId}` |
| `social.post.like` | `{senderName}` | `/post/{postId}` |
| `social.post.rose` | `{senderName}, {roseCount}` | `/post/{postId}` |
| `social.post.mention` | `{senderName}, {postTitle}` | `/post/{postId}` |
| `booking.created` | `{customerName}, {serviceName}, {bookingDate}` | `/actor/{actorId}/dashboard/booking-history` |
| `booking.confirmed` | `{businessName}, {bookingDate}` | `/actor/{actorId}/dashboard/booking-history` |
| `booking.cancelled` | `{cancelledBy}, {bookingDate}` | `/actor/{actorId}/dashboard/booking-history` |
| `review.created` | `{reviewerName}, {overallRating}` | `/actor/{actorId}/dashboard/reviews` |

### Wentrex Templates (17 new events)

| Template Key | Variables | Example CTA Path |
|-------------|-----------|-----------------|
| `learning.student.enrolled` | `{studentName}, {courseName}` | `/learning/{realm}/courses/{courseId}` |
| `learning.teacher.assigned` | `{courseName}` | `/learning/{realm}/teacher/courses/{courseId}` |
| `learning.assignment.submitted` | `{studentName}, {assignmentTitle}` | `/learning/{realm}/teacher/courses/{courseId}` |
| `learning.assignment.graded` | `{assignmentTitle}, {grade}` | `/learning/{realm}/student/courses/{courseId}` |
| `learning.parent.linked` | `{studentName}` | `/learning/{realm}/parent` |
| `learning.member.created` | `{organizationName}, {role}` | `/learning/{realm}/admin` |
| `learning.admin.granted` | `{grantedBy}` | `/learning/{realm}/admin` |
| `learning.admin.revoked` | `{revokedBy}` | `/learning/{realm}` |
| `learning.access.granted` | — | `/learning/{realm}` |
| `learning.access.revoked` | `{reason}` | — |
