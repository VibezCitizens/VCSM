# VCSM Legal & Compliance Readiness Review

**Date:** April 9, 2026
**Scope:** Vibez Citizens (VCSM) — Social + Marketplace Platform
**Target Markets:** United States & Latin America
**Review Type:** Deep structural codebase + schema audit

---

## Table of Contents

1. [Personal Data Inventory](#1-personal-data-inventory)
2. [Content and Moderation Map](#2-content-and-moderation-map)
3. [Account and Identity Architecture](#3-account-and-identity-architecture)
4. [Data Deletion Flow Analysis](#4-data-deletion-flow-analysis)
5. [Marketplace Transparency Analysis](#5-marketplace-transparency-analysis)
6. [Compliance Gaps and Risks](#6-compliance-gaps-and-risks)
7. [Recommended Architecture Changes](#7-recommended-architecture-changes)

---

## 1. Personal Data Inventory

### 1.1 Direct PII — Tables & Fields

| Schema.Table | Column | Data Type | Category | Sensitivity | Public/Private |
|---|---|---|---|---|---|
| `public.profiles` | `email` | text | contact | HIGH | private |
| `public.profiles` | `birthdate` | date | identity | HIGH | private |
| `public.profiles` | `age` | integer | identity | HIGH | private |
| `public.profiles` | `sex` | text | identity | HIGH | private |
| `public.profiles` | `is_adult` | boolean | identity | MEDIUM | private |
| `public.profiles` | `display_name` | text | profile | LOW | public |
| `public.profiles` | `username` | text | profile | LOW | public |
| `public.profiles` | `bio` | text | profile | LOW | public |
| `public.profiles` | `photo_url` | text | media | LOW | public |
| `public.profiles` | `banner_url` | text | media | LOW | public |
| `public.profiles` | `last_seen` | timestamp | behavioral | MEDIUM | private |
| `learning.actor_profiles` | `phone` | text | contact | HIGH | private |
| `learning.actor_profiles` | `date_of_birth` | date | identity | HIGH | private |
| `learning.actor_profiles` | `guardian_phone` | text | contact | HIGH | private |
| `learning.actor_profiles` | `parent_email` (via actor_identities) | text | contact | HIGH | private |
| `learning.actor_profiles` | `relationship_to_student` | text | identity | MEDIUM | private |
| `learning.actor_profiles` | `student_id` | text | identity | MEDIUM | private |
| `learning.actor_identities` | `login_id` | text | identity | MEDIUM | private |
| `learning.actor_identities` | `synthetic_email` | text | contact | MEDIUM | private |
| `vc.vport_public_details` | `email_public` | text | contact | MEDIUM | public |
| `vc.vport_public_details` | `phone_public` | text | contact | MEDIUM | public |
| `vc.vport_public_details` | `address` | jsonb | location | MEDIUM | public |
| `vc.vport_public_details` | `lat` / `lng` | double | location | MEDIUM | public |
| `vc.bookings` | `customer_name` | text | contact | MEDIUM | private |
| `vc.bookings` | `customer_phone` | text | contact | HIGH | private |
| `vc.bookings` | `customer_email` | text | contact | HIGH | private |
| `vc.bookings` | `customer_note` | text | personal | MEDIUM | private |
| `wanders.cards` | `recipient_email` | text | contact | HIGH | private |
| `wanders.cards` | `recipient_phone` | text | contact | HIGH | private |
| `wanders.cards` | `message_text` | text (encrypted) | communications | HIGH | private |
| `omd.pins` | `lat` / `lng` | float | location | HIGH | configurable |

### 1.2 Private Communications

| Schema.Table | Content | Encryption | Retention |
|---|---|---|---|
| `chat.messages` | Message body | Optional (xchacha20poly1305) | Indefinite |
| `vc.messages` | Message body | Optional (xchacha20poly1305) | Indefinite |
| `learning.communication_messages` | Message body | Hidden flag only | Indefinite |
| `wanders.cards` | Greeting card text | Encrypted field | Indefinite |
| `vc.bookings.customer_note` | Booking notes | None | Indefinite |
| `vc.bookings.internal_note` | Business notes | None | Indefinite |

### 1.3 Behavioral / Social Graph Data

| Schema.Table | Data Type | Category |
|---|---|---|
| `vc.actor_follows` | Follow relationships | social graph |
| `vc.social_follow_requests` | Pending follow requests | social graph |
| `vc.user_blocks` | Block relationships | safety |
| `vc.post_reactions` | Content engagement | behavioral |
| `vc.post_rose_gifts` | Gifting behavior | behavioral/transactional |
| `vc.comment_likes` | Comment engagement | behavioral |
| `vc.notifications` | Triggered activity (JSON context) | behavioral |
| `learning.lesson_progress` | Completion tracking | educational (FERPA) |
| `learning.submissions` | Student work + grades | educational (FERPA) |

### 1.4 Media Storage

| Provider | Domain | Content | Path Pattern |
|---|---|---|---|
| Cloudflare R2 | `cdn.vibezcitizens.com` | Profile photos, post media, wander images | `posts/{userId}/`, avatars |
| Supabase Storage | internal | Learning documents, submission files | `submissions/{submissionId}/` |

### 1.5 Collection Points (APIs)

| File | Function | Data Collected |
|---|---|---|
| `apps/VCSM/src/features/auth/dal/onboarding.dal.js:67-91` | `upsertCompletedOnboardingProfileDAL()` | display_name, username, birthdate, age, sex, is_adult |
| `apps/VCSM/src/features/auth/dal/onboarding.dal.js:41-55` | `upsertProfileShellDAL()` | email (from auth) |
| `engines/chat/src/controller/sendMessage.controller.js:24-93` | `sendMessageController()` | message body, sender_actor_id |
| `apps/VCSM/src/services/cloudflare/uploadToCloudflare.js:55-95` | upload flow | media files keyed by user ID |
| `apps/VCSM/src/features/notifications/inbox/dal/notifications.create.dal.js:10-91` | `dalInsertNotification()` | context JSON with personal data |

### 1.6 Consent Status

| Mechanism | Status |
|---|---|
| Privacy policy acceptance recording | **NOT IMPLEMENTED** |
| Terms of service acceptance recording | **NOT IMPLEMENTED** |
| Consent version tracking | **NOT IMPLEMENTED** |
| Sensitive data consent (birthdate, sex) | **NOT IMPLEMENTED** |
| Location data consent | **NOT IMPLEMENTED** |
| Third-party storage disclosure (Cloudflare R2) | **NOT IMPLEMENTED** |
| Processing purpose declarations | **NOT IMPLEMENTED** |

### 1.7 User Data Rights

| Right | Status |
|---|---|
| View stored data | **NOT IMPLEMENTED** |
| Export data (GDPR Art 15) | **NOT IMPLEMENTED** |
| Delete account | PARTIAL — `delete_my_account()` RPC exists but skips vc schema |
| Delete individual content | PARTIAL — soft delete on posts/comments only |
| Withdraw consent | **NOT IMPLEMENTED** |

---

## 2. Content and Moderation Map

### 2.1 User-Generated Content Tables

| Table | Content | Owner | Soft Delete | Moderation (Hide) | Audit Trail |
|---|---|---|---|---|---|
| `vc.posts` | Text, media, tags, location | actor_id | `deleted_at` + `deleted_by_actor_id` | `is_hidden` + `hidden_at` + `hidden_by_actor_id` | Yes |
| `vc.post_comments` | Comment text | actor_id | `deleted_at` | Via `vc.moderation_actions` | Partial |
| `vc.post_reactions` | Reaction type | actor_id | None (row delete) | None | No |
| `vc.post_rose_gifts` | Gift event | actor_id | None | None | No |
| `vc.messages` | Message body (legacy) | sender_actor_id | None | None | No |
| `chat.messages` | Message body (encrypted) | sender_actor_id | `deleted_at` | `is_hidden` + `hidden_at` + `hidden_by_actor_id` | `chat.audit_log` |
| `vc.vport_reviews` | Review text + ratings | author_actor_id | `is_deleted` + `deleted_at` | None | No |
| `wanders.cards` | Greeting card text | sender_actor_id | `is_void` | None | No |
| `wanders.replies` | Reply text | author_actor_id | `is_deleted` + `deleted_at` | None | No |

### 2.2 Reporting System

**Status: Backend infrastructure exists, NO admin UI to operationalize it.**

| Component | Table/File | Status |
|---|---|---|
| Report submission | `vc.reports` | Implemented |
| Reason codes | spam, harassment, hate, nudity, violence, scam, illegal, self_harm, impersonation, copyright, privacy, other | Implemented |
| Report status tracking | open → triaged → needs_more_info → actioned/dismissed | Implemented in schema |
| Report events (audit trail) | `vc.report_events` | Implemented |
| Priority system | 1-5 scale | Implemented |
| Deduplication | `dedupe_key` + `reporter_actor_id` | Implemented |
| Resolution types | no_action, content_removed, user_warned, user_suspended, user_banned | Defined in schema |
| **Admin moderation queue UI** | — | **NOT IMPLEMENTED** |
| **Report assignment workflow** | — | **NOT IMPLEMENTED** |
| **Report resolution actions** | — | **NOT IMPLEMENTED** |

**Key Files:**
- `apps/VCSM/src/features/moderation/models/report.model.js`
- `apps/VCSM/src/features/moderation/hooks/useReportFlow.js`
- `apps/VCSM/src/features/moderation/controllers/report.controller.js`
- `apps/VCSM/src/features/moderation/dal/reports.dal.js`

### 2.3 Content Visibility Controls

| Content Type | Hide Mechanism | File |
|---|---|---|
| Posts | `moderation_actions` table (latest-action-wins) | `moderation/controllers/postVisibility.controller.js` |
| Comments | `moderation_actions` table (propagates to children) | `moderation/controllers/commentVisibility.controller.js` |
| Chat messages | `is_hidden` field + hard delete (admin only) | `engines/chat/src/controller/deleteMessage.controller.js` |
| Conversations | Spam folder + moderation_actions | `moderation/controllers/getConversationCoverStatus.controller.js` |

### 2.4 Blocking System

**Status: Fully implemented.**

| Feature | Implementation |
|---|---|
| Block/unblock | `vc.user_blocks` table + RPCs `block_actor()` / `unblock_actor()` |
| Symmetric enforcement | `isActorBlocked()` checks both directions |
| Side effects | Removes follows + friend_ranks on block (trigger: `vc.trg_reconcile_on_user_blocks`) |
| Chat prevention | Blocks messaging and conversation membership |
| UI | `BlockedUsersSimple.jsx`, search + block/unblock |

### 2.5 Missing Moderation Capabilities

| Capability | Status | Risk |
|---|---|---|
| Admin moderation dashboard | **MISSING** | CRITICAL — reports unactionable |
| User suspension/ban enforcement | **MISSING** — schema supports it, no RPC/controller | CRITICAL |
| Automated abuse detection | **MISSING** — all reports manual | HIGH |
| Content appeal/dispute process | **MISSING** | HIGH |
| Review moderation (flag without delete) | **MISSING** | HIGH |
| Wanders moderation | **MISSING** | MEDIUM |
| Rate limiting on content creation | **MISSING** | MEDIUM |
| Keyword/content filtering | **MISSING** | MEDIUM |
| Data retention/auto-purge | **MISSING** | MEDIUM |

---

## 3. Account and Identity Architecture

### 3.1 Identity Layer Stack

```
┌─────────────────────────────────────────────────┐
│  auth.users (Supabase Auth)                     │
│  └─ email, password hash, JWT, refresh tokens   │
├─────────────────────────────────────────────────┤
│  public.profiles (User Profile)                 │
│  └─ display_name, username, email, birthdate,   │
│     age, sex, photo_url, bio                    │
├─────────────────────────────────────────────────┤
│  platform.user_app_accounts (Per-App Account)   │
│  └─ status: provisioned|active|disabled|deleted │
├─────────────────────────────────────────────────┤
│  platform.user_app_actor_links (Actor Binding)  │
│  └─ actor_source: 'vc' | 'learning'            │
│  └─ actor_id → vc.actors.id or learning.actors  │
├─────────────────────────────────────────────────┤
│  vc.actors (VCSM Actor)                         │
│  └─ kind: 'user' | 'vport'                     │
│  └─ profile_id → public.profiles (1:1)          │
│  └─ vport_id → vc.vports (1:1)                 │
│  └─ is_void (boolean)                           │
├─────────────────────────────────────────────────┤
│  learning.actors (LMS Actor)                    │
│  └─ user_id → auth.users (1:1 per org)          │
│  └─ organization_id → learning.organizations    │
│  └─ is_active (boolean)                         │
└─────────────────────────────────────────────────┘
```

### 3.2 Ownership Tables

| Table | Purpose | Status Field |
|---|---|---|
| `vc.actor_owners` | Maps actors to owning user_id | `is_void` |
| `learning.actor_owners` | Maps learning actors to owning user_id | `is_void` |
| `platform.user_app_accounts` | Platform-level account ownership | `status` |

### 3.3 Identity Issues

**Issue 1: Dual Ownership Tracking**
- `vc.vports.owner_user_id` stores raw user ID
- `vc.actor_owners` stores actor → user mapping
- RLS policies check EITHER source (OR logic) — security gap potential
- **Risk:** Divergence between the two can cause privilege escalation

**Issue 2: VCSM Actor Links Not Provisioned**
- `platform.user_app_actor_links` has 7 rows — ALL `actor_source='learning'`
- ZERO rows with `actor_source='vc'`
- VCSM users cannot use platform-level actor switching
- **Risk:** VCSM identity not fully integrated with platform schema

**Issue 3: Profile as Source of Truth Ambiguity**
- `public.profiles.id` = `auth.users.id` (direct match)
- `vc.actors.profile_id` links to profiles (1:1 UNIQUE)
- `vc.vports.owner_user_id` links to profiles, NOT to auth.users
- **Risk:** Profile deletion orphans vport ownership

**Issue 4: Actor Void vs Account Status**
- `vc.actors.is_void` marks actors as non-operative
- `platform.user_app_state.account_status` tracks suspension
- `platform.user_app_access.status` tracks app access
- Three different places to check if a user is "disabled" — no single gate

### 3.4 Access Control Summary

| Layer | Table | States | Purpose |
|---|---|---|---|
| App access | `platform.user_app_access` | granted/pending/revoked/suspended | Can user access this app? |
| Account status | `platform.user_app_accounts` | provisioned/active/disabled/deleted | Is account operative? |
| Account state | `platform.user_app_state` | active/suspended/deleted | Runtime state |
| Actor viability | `vc.actors` | is_void=true/false | Can actor perform actions? |
| Privacy | `vc.actor_privacy_settings` | is_private=true/false | Is profile discoverable? |

---

## 4. Data Deletion Flow Analysis

### 4.1 Existing Deletion Mechanisms

**Account Deletion RPC:** `admin_delete_user_everywhere(p_user_id uuid)`
- File: `db_snapshot/full_schema.sql:3990`
- Runs as SECURITY DEFINER

**What gets deleted:**

| Schema | Tables Cleaned | Method |
|---|---|---|
| learning | audit_log, parent_student_links, observer_student_links, organization_memberships, course_memberships, grades, submissions, lesson_progress, platform_admins, actor_access, actor_identities, actor_profiles, actor_owners, communication_message_receipts, communication_message_moderation_actions, communication_conversation_members, communication_messages (sender-linked) | Hard delete |
| platform | user_app_actor_links, user_app_preferences, user_app_state, user_capabilities, user_app_account_roles | Hard delete |

**What does NOT get deleted (CRITICAL GAP):**

| Schema.Table | Content Left Behind | Risk |
|---|---|---|
| `vc.posts` | User posts with text, media, location | Data orphaning |
| `vc.post_comments` | User comments | Data orphaning |
| `vc.post_reactions` | Engagement data | Data orphaning |
| `vc.messages` | Legacy messages | PII retention |
| `chat.messages` | Chat messages (possibly encrypted) | PII retention |
| `chat.conversation_members` | Membership records | Data orphaning |
| `vc.vports` | Business profiles | Ownership orphaning |
| `vc.bookings` | Booking records with customer PII | PII retention |
| `vc.vport_reviews` | Reviews authored by user | Data orphaning |
| `vc.actor_follows` | Follow relationships | Data orphaning |
| `vc.user_blocks` | Block records | Data orphaning |
| `vc.notifications` | Notification history | Data orphaning |
| `wanders.cards` | Greeting cards with recipient PII | PII retention |
| `omd.pins` | Location pins (lat/lng) | Location data retention |

### 4.2 Vport Deletion

- `dalDeleteMyVport(vportId)` calls `delete_my_vport(p_vport_id)` RPC
- `dalDeleteOwnedVportById({ vportId, userId })` — direct table delete fallback
- **Cascade behavior unknown** — unclear if bookings, reviews, services are cleaned up

### 4.3 Content-Level Deletion

| Content | Delete Method | Reversible | Audit |
|---|---|---|---|
| Posts | Soft delete (`deleted_at`, `deleted_by_actor_id`) | Yes | Yes (who deleted) |
| Comments | Soft delete (`deleted_at`) | Yes | Partial (no deleted_by) |
| Chat messages (user) | Soft hide (receipts-level) | Yes | No |
| Chat messages (admin) | Hard delete | No | `chat.audit_log` |
| Reviews | Soft delete (`is_deleted`) | Yes | No (no deleted_by) |
| Wanders | `is_void` flag | Yes | No |

### 4.4 Deletion Entity Classification

| Entity | Recommended Action | Rationale |
|---|---|---|
| User profile (public.profiles) | **Anonymize** then soft delete | Preserve referential integrity |
| User actor (vc.actors) | **Set is_void=true** | Keep for audit trail |
| Posts | **Anonymize** author, keep content OR soft delete | Content moderation evidence |
| Comments | **Anonymize** author | Thread integrity |
| Chat messages | **Hard delete body** after retention period | Privacy right |
| Reviews | **Anonymize** author, preserve rating | Business reputation integrity |
| Bookings | **Anonymize** customer fields after 2 years | Financial/legal record keeping |
| Vport (business) | **Soft delete** (is_active=false) | May have active bookings/reviews |
| Notifications | **Hard delete** | No retention value |
| Follow/block records | **Hard delete** | No retention value |
| Moderation/audit records | **Preserve** | Legal obligation |

### 4.5 What Would Break If Rows Were Physically Deleted

| Table | Impact of Hard Delete |
|---|---|
| `public.profiles` | FK violations in vc.actors, vc.posts, vc.vports, bookings |
| `vc.actors` | FK violations across 30+ tables (posts, messages, follows, reviews) |
| `vc.posts` | FK violations in comments, reactions, rose_gifts |
| `chat.messages` | FK violations in receipts, reactions, replies |
| `vc.vport_reviews` | FK violations in review_ratings |

**Conclusion:** Hard deletion requires anonymization-first approach with FK-safe cascades.

---

## 5. Marketplace Transparency Analysis

### 5.1 Business Representation

**Core Tables:**
- `vc.vports` — business entity (name, slug, type, avatar, bio)
- `vc.vport_public_details` — contact info, address, hours, pricing tier, social links
- `vc.actors` (kind='vport') — business actor identity
- `vc.actor_owners` — ownership mapping

**VPORT Types (60+):** artist, barber, chef, mechanic, restaurant, gas_station, salon, photographer, and many more.

### 5.2 Ownership & Verification

| Check | Status | Detail |
|---|---|---|
| Ownership linked to authenticated user | YES | `vports.owner_user_id` + `actor_owners` table |
| Business can edit own listings | YES | RLS policy `vport_public_details_update_owner` |
| Business verification status | **NOT IMPLEMENTED** | No `is_verified`, `verification_status`, `verified_at` fields |
| Email/phone verification | **NOT IMPLEMENTED** | No verification flow |
| Business registration validation | **NOT IMPLEMENTED** | No EIN/tax ID checks |
| Duplicate name detection | **NOT IMPLEMENTED** | Multiple "McDonald's" possible |
| Creation rate limiting | **NOT IMPLEMENTED** | Unlimited VPORTs per user |

### 5.3 Pricing Transparency

| Feature | Table | Status |
|---|---|---|
| Price tier indicator | `vport_public_details.price_tier` (1-4) | Available but optional |
| Menu item pricing | `vc.vport_actor_menu_items.price_cents` | Available |
| Fuel pricing | `vc.vport_fuel_prices` | Available with submission workflow |
| Fuel price history | `vc.vport_fuel_price_history` | Available |
| Service pricing | Not stored | **MISSING** |
| **Price change audit trail** | Not implemented | **MISSING** — owners can change prices without justification |
| **Menu price history** | Not tracked | **MISSING** |

### 5.4 Review System

| Check | Status | Risk |
|---|---|---|
| Reviews linked to businesses | YES — `target_actor_id` FK | OK |
| Review requires transaction | **NO** — anyone can review any business | HIGH — fake reviews possible |
| Reviews verified by default | YES — `is_verified` defaults to `true` | HIGH — misleading "verified" badge |
| Review moderation workflow | **MISSING** | HIGH |
| Review edit history | **MISSING** | MEDIUM |
| One review per author enforced | YES — UNIQUE constraint | OK |
| Author identity visible | PARTIAL — falls back to "Anonymous" if RLS blocks | MEDIUM |

### 5.5 Weak Points

1. **Fake Business Creation** — Any authenticated user can create unlimited unverified VPORTs. No identity verification, business registration check, or deduplication.

2. **Unmoderated Reviews** — Reviews are auto-verified (`is_verified=true` by default). No transaction validation. Anyone can review anyone. No moderation queue for review disputes.

3. **No Change Audit Trail** — `vport_public_details` has only `updated_at`. No tracking of what changed, when, or by whom. Critical for pricing disputes.

4. **Dual Ownership Conflict** — `vports.owner_user_id` vs `actor_owners` can diverge. RLS uses OR logic — less secure.

5. **PII in Public Details** — `email_public`, `phone_public`, `address` all publicly visible via RLS policy `vport_public_details_select_public`. No GDPR privacy indicator.

---

## 6. Compliance Gaps and Risks

### 6.A HIGH-RISK GAPS

| # | Gap | Impact | Tables/Files |
|---|---|---|---|
| 1 | **No consent tracking** | Cannot prove user agreed to data processing. Blocks GDPR/CCPA compliance. | No `consent_accepted_at`, `consent_version`, `privacy_policy_accepted` fields anywhere |
| 2 | **Incomplete account deletion** | `admin_delete_user_everywhere()` skips entire vc schema. Posts, messages, bookings, reviews, vports orphaned with PII. | `db_snapshot/full_schema.sql:3990` |
| 3 | **No data export** | Users cannot download their personal data. GDPR Art 15 violation. | No export API exists |
| 4 | **No moderation queue UI** | Reports file into `vc.reports` but cannot be reviewed, assigned, or actioned by staff. Platform cannot enforce community standards. | `vc.reports`, `vc.report_events` (backend only) |
| 5 | **No user suspension/ban mechanism** | Schema defines `user_suspended`/`user_banned` resolution types but no RPC or controller to execute them. Cannot remove abusers. | `vc.moderation_actions` — action_types defined but not callable |
| 6 | **No business verification** | Any user can create unlimited fake businesses. No `is_verified`, `verification_status`, `verified_at` on `vc.vports`. | `vc.vports`, `vport.core.dal.js` |
| 7 | **Reviews auto-verified without transaction proof** | `is_verified` defaults to `true`. No booking/transaction history check. Anyone can post fake verified reviews. | `vc.vport_reviews`, `vportReviews.write.dal.js` |
| 8 | **Location data collected without consent** | `omd.pins` stores lat/lng publicly by default. No consent mechanism. | `omd.pins` |

### 6.B MEDIUM-RISK GAPS

| # | Gap | Impact | Tables/Files |
|---|---|---|---|
| 9 | **Dual ownership tracking** | `vports.owner_user_id` vs `actor_owners` can diverge. OR-based RLS policy could allow privilege escalation. | `vc.vports`, `vc.actor_owners` |
| 10 | **No data retention policies** | Messages, notifications, posts, audit logs retained indefinitely. No auto-purge. | All content tables |
| 11 | **VCSM actor links not provisioned** | `platform.user_app_actor_links` has 0 vc-source rows vs 7 learning rows. Platform identity incomplete. | `platform.user_app_actor_links` |
| 12 | **No anonymization support** | No fields for pseudonymized display names, no anonymization procedures. | All PII tables |
| 13 | **No price change audit trail** | Business owners can change menu prices, fuel prices, service details without recording what changed. | `vc.vport_public_details`, `vc.vport_fuel_prices` |
| 14 | **Inconsistent deletion patterns** | Mix of `is_deleted`, `deleted_at`, `is_void`, `is_active` across tables. No standard lifecycle. | All content/identity tables |
| 15 | **No content appeal process** | No workflow for users to contest moderation actions or review takedowns. | Not implemented |
| 16 | **Booking PII not time-limited** | `customer_phone`, `customer_email`, `customer_name` in `vc.bookings` retained indefinitely. | `vc.bookings` |

### 6.C LOW-RISK CLEANUP

| # | Gap | Impact |
|---|---|---|
| 17 | Missing `deleted_at` timestamps on design tables | `vc.design_documents`, `vc.design_assets` have `is_deleted` only — no audit of when |
| 18 | Missing `deleted_by_actor_id` on comments | `vc.post_comments` has `deleted_at` but no `deleted_by` |
| 19 | No notification muting per type | `vc.notifications` lacks granular suppression |
| 20 | Nullable fields that should be normalized | Various optional fields across schemas |
| 21 | Block reason stored in plain text | `vc.user_blocks.reason` could contain sensitive information |

---

## 7. Recommended Architecture Changes

### 7.1 Privacy & Consent

**P1: Add consent tracking table**
```sql
CREATE TABLE platform.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  consent_type text NOT NULL, -- 'privacy_policy', 'terms_of_service', 'marketing', 'location'
  consent_version text NOT NULL, -- '1.0', '2.0'
  accepted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, consent_type, consent_version)
);
```

**P2: Add data export RPC**
- Create `export_my_data(p_user_id uuid)` function that compiles:
  - Profile data, posts, comments, messages, bookings, reviews, follows, blocks, notifications
  - Returns JSON or generates downloadable archive
  - Log export request in audit table

**P3: Add retention metadata**
```sql
ALTER TABLE chat.messages ADD COLUMN retention_expires_at timestamptz;
ALTER TABLE vc.notifications ADD COLUMN retention_expires_at timestamptz;
ALTER TABLE vc.bookings ADD COLUMN pii_anonymized_at timestamptz;
```

### 7.2 Moderation

**M1: Implement suspension/ban RPCs**
```sql
CREATE FUNCTION vc.suspend_actor(
  p_actor_id uuid, p_reason text, p_until timestamptz, p_moderator_actor_id uuid
) RETURNS void;

CREATE FUNCTION vc.ban_actor(
  p_actor_id uuid, p_reason text, p_moderator_actor_id uuid
) RETURNS void;
```
- Set `vc.actors.is_void = true` and `platform.user_app_state.account_status = 'suspended'`
- Record in `vc.moderation_actions`
- Invalidate active sessions

**M2: Build admin moderation queue**
- Read from `vc.reports` filtered by status/priority
- Allow assign, triage, add notes, resolve
- Surface `vc.report_events` as audit trail
- Trigger suspension/ban from resolution

**M3: Add review moderation**
```sql
ALTER TABLE vc.vport_reviews ADD COLUMN is_flagged boolean DEFAULT false;
ALTER TABLE vc.vport_reviews ADD COLUMN flagged_at timestamptz;
ALTER TABLE vc.vport_reviews ADD COLUMN flagged_by_actor_id uuid REFERENCES vc.actors(id);
ALTER TABLE vc.vport_reviews ADD COLUMN moderation_status text DEFAULT 'none'
  CHECK (moderation_status IN ('none', 'pending', 'approved', 'removed'));
```

### 7.3 Deletion

**D1: Extend `admin_delete_user_everywhere` to cover vc schema**
Add deletion/anonymization for:
- `vc.posts` — set `deleted_at`, anonymize actor_id display
- `vc.post_comments` — set `deleted_at`
- `vc.messages` / `chat.messages` — hard delete body, keep row for threading
- `vc.vport_reviews` — anonymize author, preserve rating
- `vc.bookings` — anonymize customer_name, customer_phone, customer_email
- `vc.actor_follows` — hard delete
- `vc.user_blocks` — hard delete
- `vc.notifications` — hard delete
- `wanders.cards` — set `is_void=true`
- `omd.pins` — hard delete

**D2: Add anonymization fields**
```sql
ALTER TABLE public.profiles ADD COLUMN anonymized_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN original_username text; -- for audit before anonymization
```

**D3: Create deletion request tracking**
```sql
CREATE TABLE platform.deletion_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  scheduled_for timestamptz NOT NULL, -- 30-day grace period
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  scope text NOT NULL DEFAULT 'full' CHECK (scope IN ('full', 'vport_only')),
  meta jsonb DEFAULT '{}'
);
```

### 7.4 VPORT / Business Transparency

**V1: Add verification fields**
```sql
ALTER TABLE vc.vports ADD COLUMN is_verified boolean DEFAULT false;
ALTER TABLE vc.vports ADD COLUMN verified_at timestamptz;
ALTER TABLE vc.vports ADD COLUMN verified_by_actor_id uuid REFERENCES vc.actors(id);
ALTER TABLE vc.vports ADD COLUMN verification_status text DEFAULT 'unverified'
  CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected', 'revoked'));
```

**V2: Add change audit log**
```sql
CREATE TABLE vc.vport_changes_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vport_id uuid NOT NULL REFERENCES vc.vports(id),
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_by_actor_id uuid REFERENCES vc.actors(id),
  changed_at timestamptz NOT NULL DEFAULT now()
);
```

**V3: Fix review verification**
```sql
ALTER TABLE vc.vport_reviews ALTER COLUMN is_verified SET DEFAULT false;
```
- Add booking check: only set `is_verified=true` if author has a completed booking with target vport

**V4: Rate-limit VPORT creation**
- Add per-user limit (e.g., max 5 VPORTs per user)
- Require email verification before VPORT creation

**V5: Unify ownership**
- Deprecate `vc.vports.owner_user_id` in favor of `vc.actor_owners` as single source of truth
- Migrate existing data, update RLS policies to remove OR logic

### 7.5 Identity

**I1: Provision VCSM actor links**
- On VCSM login, auto-create `platform.user_app_actor_links` with `actor_source='vc'`
- Implement in `resolveAuthenticatedContext.controller.js`

**I2: Consolidate status checks**
- Create `platform.is_user_active(p_user_id uuid)` function that checks:
  - `user_app_access.status = 'granted'`
  - `user_app_accounts.status = 'active'`
  - `user_app_state.account_status = 'active'`
  - `vc.actors.is_void = false`
- Use as single gate in RLS policies

### 7.6 Notifications

**N1: Add notification preferences**
```sql
CREATE TABLE vc.notification_preferences (
  actor_id uuid PRIMARY KEY REFERENCES vc.actors(id),
  email_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  muted_types text[] DEFAULT '{}',
  quiet_hours_start time,
  quiet_hours_end time,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

---

## Schema-to-Compliance Matrix

| Schema/Table Group | Privacy Policy | Terms of Service | Content Moderation | Data Deletion | Business Transparency |
|---|---|---|---|---|---|
| `auth.users` | X | X | | X | |
| `public.profiles` | X | X | | X | |
| `platform.*` | X | X | | X | |
| `vc.actors` / `actor_owners` | X | X | X | X | X |
| `vc.posts` / `post_comments` | X | X | X | X | |
| `vc.messages` / `chat.messages` | X | X | X | X | |
| `vc.vports` / `vport_public_details` | X | X | | X | X |
| `vc.vport_reviews` | X | X | X | X | X |
| `vc.bookings` | X | X | | X | X |
| `vc.vport_services` / `menu_items` | | X | | | X |
| `vc.vport_fuel_prices` | | | | | X |
| `vc.actor_follows` / `social_follow_requests` | X | X | | X | |
| `vc.user_blocks` | X | X | X | X | |
| `vc.reports` / `moderation_actions` | | X | X | | |
| `vc.notifications` | X | | | X | |
| `wanders.*` | X | X | X | X | |
| `omd.pins` / `trips` | X | X | | X | |
| `learning.*` (all) | X | X | X | X | |
| Media storage (R2/Supabase) | X | X | X | X | X |

---

## Priority Implementation Order

### Phase 1 — Legal Blockers (Pre-Launch Required)
1. Consent tracking table + UI (privacy policy & ToS acceptance)
2. Extend account deletion to cover vc schema
3. Data export API
4. Fix review `is_verified` default to `false`

### Phase 2 — Operational Safety (Launch Week)
5. Admin moderation queue
6. Suspension/ban enforcement RPCs
7. VPORT verification fields
8. Rate-limit VPORT creation

### Phase 3 — Compliance Hardening (30 Days Post-Launch)
9. VPORT change audit log
10. Review moderation workflow
11. Data retention policies + auto-purge
12. Booking PII anonymization schedule
13. Content appeal process
14. Notification preferences

### Phase 4 — Architecture Cleanup (60 Days Post-Launch)
15. Unify ownership model (deprecate `owner_user_id`)
16. Provision VCSM actor links in platform schema
17. Consolidate status check function
18. Standardize deletion patterns across all tables
19. Anonymization fields + procedures

---

*Report generated from deep structural analysis of the VCSM codebase and database schema. All file references are relative to `/Users/vcsm/Desktop/VCSM/`. All table references verified against `db_snapshot/full_schema.sql`.*
