# SCANNER-MONITORING-QUICK-REVIEW-001

**Generated:** 2026-06-07
**Scanner timestamp:** 2026-06-07T08:11:08.925Z
**Scanner version:** 1.1.0
**Ticket:** SCANNER-MONITORING-QUICK-REVIEW-001
**Scope:** Read-only. No code modified.

**Maps consumed:**
- `feature-map.json` — feature inventory
- `rpc-map.json` — 71 RPCs across all apps
- `edge-function-map.json` — 52 edge functions
- `write-surface-map.json` — write surface inventory
- `finding-map.json` — 4041 open findings
- `engine-candidates.json` — engine risk tiers and write surfaces

---

## Current Monitoring Coverage

| Location | Call Sites | Status |
|---|---|---|
| `state/identity/` | 12 | Done (VCSM-MONITORING-INSTRUMENTATION-001) |
| `features/identity/` | 2 | Done (VCSM-MONITORING-INSTRUMENTATION-001) |
| `features/booking/` | 9 | Done (VCSM-MONITORING-BOOKING-001) |
| **All other VCSM features** | **0** | **Unmonitored** |

**Total instrumented:** 23 call sites across 2 features (identity + booking)
**Platform coverage:** 7.1% of active features

---

## Feature Risk Matrix

| Feature | Priority | Write Surfaces | RPCs | Edge Fns | Open Findings (CRIT/HIGH) | Current Monitoring | Recommended behavior_id Namespace |
|---|---|---|---|---|---|---|---|
| **notifications** | P0 | 9 (update, rpc) | 5 | 1 (send-push-notification) | 64 (8C/8H) | 0 | `behavior.notifications.*` |
| **moderation** | P0 | 12 (rpc, delete, upsert, update) | 1 | 0 | 84 (6C/10H) | 0 | `behavior.moderation.*` |
| **settings** | P0 | 16 (upsert, update, rpc, edge_fn) | 6 | 1 (delete-citizen-account) | 75 (0C/24H) | 0 | `behavior.settings.*` |
| **auth** | P1 | 9 (upsert, update, rpc, edge_fn) | 2 | 2 (auth-register-recovery, auth-reset-password-secure) | 398 (2C/15H) | partial (monitoringClient, no behavior_id) | `behavior.auth.*` |
| **vport** | P1 | 7 (update, rpc) | 4 | 0 | 47 (1C/22H) | 0 | `behavior.vport.*` |
| **upload** | P1 | 6 (rpc, update, delete, insert) | 1 | 0 | 59 (0C/16H) | 0 | `behavior.upload.*` |
| **vportDashboard** | P1 | 24 (upsert, update, delete, insert) | 0 | 0 | 652 (6C/89H) | 0 | `behavior.dashboard.*` |
| **profiles** | P2 | 28 (rpc, delete, upsert, update) | 4 | 0 | 71 (3C/18H) | 0 | `behavior.profiles.*` |
| **social** | P2 | 8 (upsert, rpc, update) | 3 | 0 | 57 (0C/9H) | 0 | `behavior.social.*` |
| **post** | P2 | 15 (rpc, update, delete, insert) | 1 | 0 | 69 (0C/11H) | 0 | `behavior.post.*` |
| **feed** | P2 | 1 (upsert) | 0 | 0 | 491 (0C/44H) | 0 | `behavior.feed.*` |
| **chat** | P2 | 2 (rpc, update) | 1 | 0 | 171 (0C/18H) | 0 | `behavior.chat.*` |
| **public** | P2 | 4 (rpc, edge_fn) | 3 | 1 (send-lead-confirmation) | 67 (0C/5H) | 0 | `behavior.public.*` |

---

## P0 Feature Analysis

### notifications

**Why P0:**
- 8 CRITICAL open findings — highest critical count of any P0 feature
- 5 RPCs all route through a single file (`notificationRuntime.dal.js`) with zero monitoring
- Silent delivery failure is invisible: booking events fire `publishVcsmNotification` but if the notification pipeline fails, no signal reaches Quicksilver
- `create_event` → `insert_inbox_item` → `insert_recipients` → `upsert_rendered` → `update_recipient_status` — a 5-step chain with no observability
- `send-push-notification` edge function has no caller mapping — push delivery completely dark

**RPC chain:**
```
notification.create_event
notification.insert_inbox_item
notification.insert_recipients
notification.upsert_rendered
notification.update_recipient_status
```

**Write surfaces:** `inbox_items` (update), 5x RPC writes

**Recommended behavior_ids:**
- `behavior.notifications.publish` — top-level publish orchestrator failure
- `behavior.notifications.ingest` — `create_event` RPC failure
- `behavior.notifications.inbox` — `insert_inbox_item` RPC failure
- `behavior.notifications.recipient` — `insert_recipients` RPC failure
- `behavior.notifications.status_update` — `update_recipient_status` failure
- `behavior.notifications.render` — `upsert_rendered` failure

**Safe context schema:**
```js
{
  rpcCalled: boolean,
  eventInserted: boolean,
  inboxInserted: boolean,
  recipientsInserted: boolean,
  notificationKind: string,   // 'booking_created'|'booking_cancelled'|'booking_confirmed'|...
  dbErrorCode: string|null,
}
```

---

### moderation

**Why P0:**
- 6 CRITICAL open findings
- `is_current_user_moderator` is the sole authorization gate for all moderation actions — if it fails silently or the RPC returns an unexpected value, unauthorized actors can execute moderation writes
- 12 write surfaces span: posts, reports, report_events, actions, messages — all destructive or punitive
- No try/catch or monitoring in any controller

**RPC:** `moderation.is_current_user_moderator`

**Write surfaces:** `posts` (update/delete), `reports` (insert/upsert), `report_events` (insert), `actions` (upsert), `messages` (delete)

**Recommended behavior_ids:**
- `behavior.moderation.authorization` — is_current_user_moderator RPC failure or auth rejection
- `behavior.moderation.report` — report insert/upsert failure
- `behavior.moderation.action` — moderation action apply failure
- `behavior.moderation.post_remove` — post soft-delete write failure
- `behavior.moderation.message_remove` — message delete failure

**Safe context schema:**
```js
{
  moderationAuthorized: boolean,
  actionType: string,    // 'report'|'action'|'post_remove'|'message_remove'
  targetKind: string,    // 'post'|'message'|'actor'
  dbErrorCode: string|null,
}
```

---

### settings

**Why P0:**
- 6 account-mutation RPCs — most destructive set on the platform
- `soft_delete_citizen_account` and `hard_delete_vport` are irreversible operations with no retry safety
- `delete-citizen-account` edge function invoked from DAL — if edge function fails, account deletion silently fails but the user session may be invalidated
- 16 write surfaces touch `profiles`, `actor_privacy_settings`, `profile_public_details` — all owner-critical data
- 0 monitoring

**Destructive RPCs:**
```
soft_delete_citizen_account   → account soft delete
hard_delete_vport             → permanent vport destroy
soft_delete_vport             → vport soft delete
restore_vport                 → vport restore
set_business_card_publish_state → publish gate
```

**Destructive edge functions:**
```
delete-citizen-account        → full account deletion
```

**Recommended behavior_ids:**
- `behavior.settings.account_delete` — soft_delete_citizen_account / hard_delete_vport failure
- `behavior.settings.account_restore` — restore_vport failure
- `behavior.settings.vport_publish` — set_business_card_publish_state failure
- `behavior.settings.privacy_update` — actor_privacy_settings write failure
- `behavior.settings.profile_update` — profile/profile_public_details write failure
- `behavior.settings.edge_fn_delete` — delete-citizen-account edge function failure

**Safe context schema:**
```js
{
  settingsAction: string,    // 'delete_citizen'|'delete_vport_soft'|'delete_vport_hard'|'restore_vport'|'publish'|'privacy_update'|'profile_update'
  rpcFailed: boolean,
  edgeFnFailed: boolean,
  dbErrorCode: string|null,
}
```

---

## P1 Feature Analysis

### auth

**Why P1:**
- 2 security edge functions: `auth-register-recovery` and `auth-reset-password-secure` — called from `resetPasswordSecure.dal.js`, no monitoring
- `create_actor_for_user` RPC — if this fails during registration, the user is authenticated but has no actor row, causing silent identity failure
- `generate_username` RPC — if it fails, onboarding stalls with no signal
- Already uses `monitoringClient.js` in some auth hooks but with no behavior_id taxonomy — partial coverage only

**Recommended behavior_ids:**
- `behavior.auth.actor_create` — create_actor_for_user RPC failure (fatal: no actor = no identity)
- `behavior.auth.username_generate` — generate_username RPC failure
- `behavior.auth.password_reset` — auth-reset-password-secure edge function failure
- `behavior.auth.recovery_register` — auth-register-recovery edge function failure
- `behavior.auth.profile_write` — profiles/actor_owners upsert failure during registration

**Safe context schema:**
```js
{
  authStep: string,       // 'register'|'login'|'reset_password'|'actor_create'|'username_generate'|'recovery_register'
  rpcFailed: boolean,
  edgeFnFailed: boolean,
  dbErrorCode: string|null,
}
```

---

### vport

**Why P1:**
- 22 HIGH findings — highest high-severity count after dashboard
- 4 RPCs, 3 of which are destructive: `soft_delete_vport`, `hard_delete_vport`, `restore_vport`
- `create_vport` RPC is the actor provisioning path for business accounts — failure here leaves the user in a broken half-created state
- Also called from `settings/account/dal/` (shared RPC surface)

**Recommended behavior_ids:**
- `behavior.vport.create` — create_vport RPC failure
- `behavior.vport.delete` — soft/hard delete RPC failure
- `behavior.vport.restore` — restore_vport RPC failure
- `behavior.vport.profile_update` — vport profiles write failure

**Safe context schema:**
```js
{
  vportAction: string,    // 'create'|'soft_delete'|'hard_delete'|'restore'|'profile_update'
  rpcFailed: boolean,
  dbErrorCode: string|null,
}
```

---

### upload

**Why P1:**
- 16 HIGH findings
- `search_actor_directory` RPC used for mention suggestions
- 6 write surfaces: `posts`, `post_media`, `post_mentions`
- Upload failures are directly user-visible (post creation fails silently)

**Recommended behavior_ids:**
- `behavior.upload.post_create` — post insert failure
- `behavior.upload.media_attach` — post_media insert failure
- `behavior.upload.mention_write` — post_mentions write failure
- `behavior.upload.cloudflare` — Cloudflare upload fetch failure

**Safe context schema:**
```js
{
  uploadStep: string,     // 'post_insert'|'media_attach'|'mention_write'|'cloudflare_upload'
  mediaCount: number,
  mentionCount: number,
  dbErrorCode: string|null,
}
```

---

### vportDashboard (dashboard sub-feature)

**Why P1:**
- 24 write surfaces — highest write count of any single VCSM feature
- Touches: `fuel_price_submissions`, `portfolio_media`, `fuel_prices`, `bookings`, `business_card_leads` — all owner-managed data
- 6 CRITICAL and 89 HIGH open findings in dashboard module
- Likely overlaps with flyerBuilder (14 writes: design_assets, design_documents, design_page_versions)

**Recommended behavior_ids:**
- `behavior.dashboard.fuel_price` — fuel price submission failure
- `behavior.dashboard.portfolio` — portfolio media write failure
- `behavior.dashboard.booking_manage` — owner-side booking write failure
- `behavior.dashboard.lead_capture` — business card lead write failure
- `behavior.dashboard.flyer_save` — design document/page save failure

**Safe context schema:**
```js
{
  dashboardAction: string, // 'fuel_price'|'portfolio'|'booking_manage'|'lead_capture'|'flyer_save'
  writeAttempted: boolean,
  dbErrorCode: string|null,
}
```

---

## Top 10 First Monitoring Insertion Points

These are the specific file + function + failure branch targets. Instrumentation must trace the full call path before editing.

### #1 — notifications ingest RPC failure

| Field | Value |
|---|---|
| **File** | `apps/VCSM/src/features/notifications/runtime/notificationRuntime.dal.js` |
| **Function** | `insertNotificationEventDAL` |
| **Failure branch** | `create_event` RPC call returns error or throws |
| **Severity** | `error` |
| **behavior_id** | `behavior.notifications.ingest` |
| **Safe context** | `{ rpcCalled: true, eventInserted: false, dbErrorCode }` |

### #2 — notifications inbox RPC failure

| Field | Value |
|---|---|
| **File** | `apps/VCSM/src/features/notifications/runtime/notificationRuntime.dal.js` |
| **Function** | `insertNotificationInboxItemDAL` |
| **Failure branch** | `insert_inbox_item` RPC call returns error or throws |
| **Severity** | `error` |
| **behavior_id** | `behavior.notifications.inbox` |
| **Safe context** | `{ rpcCalled: true, inboxInserted: false, dbErrorCode }` |

### #3 — moderation authorization gate

| Field | Value |
|---|---|
| **File** | `apps/VCSM/src/features/moderation/dal/assertModerationAccess.dal.js` |
| **Function** | `isModerationAuthorizedDAL` |
| **Failure branch** | `is_current_user_moderator` RPC throws OR returns false |
| **Severity** | `warning` (auth rejection) / `error` (RPC failure) |
| **behavior_id** | `behavior.moderation.authorization` |
| **Safe context** | `{ moderationAuthorized: false, dbErrorCode }` |

### #4 — settings soft-delete citizen account

| Field | Value |
|---|---|
| **File** | `apps/VCSM/src/features/settings/account/dal/account.write.dal.js` |
| **Function** | `dalSoftDeleteCitizenAccount` |
| **Failure branch** | `soft_delete_citizen_account` RPC throws |
| **Severity** | `error` |
| **behavior_id** | `behavior.settings.account_delete` |
| **Safe context** | `{ settingsAction: 'delete_citizen', rpcFailed: true, dbErrorCode }` |

### #5 — settings hard-delete vport (irreversible)

| Field | Value |
|---|---|
| **File** | `apps/VCSM/src/features/settings/account/dal/account.write.dal.js` |
| **Function** | `dalHardDeleteVport` |
| **Failure branch** | `hard_delete_vport` RPC throws |
| **Severity** | `fatal` |
| **behavior_id** | `behavior.settings.account_delete` |
| **Safe context** | `{ settingsAction: 'delete_vport_hard', rpcFailed: true, dbErrorCode }` |

### #6 — auth actor creation (registration critical path)

| Field | Value |
|---|---|
| **File** | `apps/VCSM/src/features/auth/dal/actorCreate.dal.js` |
| **Function** | `dalCreateUserActor` |
| **Failure branch** | `create_actor_for_user` RPC throws or returns null actor |
| **Severity** | `fatal` — no actor row means identity resolution always fails |
| **behavior_id** | `behavior.auth.actor_create` |
| **Safe context** | `{ authStep: 'actor_create', rpcFailed: true, dbErrorCode }` |

### #7 — auth password reset edge function

| Field | Value |
|---|---|
| **File** | `apps/VCSM/src/features/auth/dal/resetPasswordSecure.dal.js` |
| **Function** | `dalUpdatePasswordSecure` |
| **Failure branch** | `auth-reset-password-secure` edge function invocation returns error |
| **Severity** | `error` |
| **behavior_id** | `behavior.auth.password_reset` |
| **Safe context** | `{ authStep: 'reset_password', edgeFnFailed: true, errorCode }` |

### #8 — vport create RPC

| Field | Value |
|---|---|
| **File** | `apps/VCSM/src/features/vport/dal/vport.core.dal.js` |
| **Function** | `createVport` |
| **Failure branch** | `create_vport` RPC throws |
| **Severity** | `error` |
| **behavior_id** | `behavior.vport.create` |
| **Safe context** | `{ vportAction: 'create', rpcFailed: true, dbErrorCode }` |

### #9 — vport hard delete RPC (irreversible)

| Field | Value |
|---|---|
| **File** | `apps/VCSM/src/features/vport/dal/vport.core.dal.js` |
| **Function** | `hardDeleteVport` |
| **Failure branch** | `hard_delete_vport` RPC throws |
| **Severity** | `fatal` |
| **behavior_id** | `behavior.vport.delete` |
| **Safe context** | `{ vportAction: 'hard_delete', rpcFailed: true, dbErrorCode }` |

### #10 — settings delete-citizen-account edge function

| Field | Value |
|---|---|
| **File** | `apps/VCSM/src/features/settings/account/dal/account.write.dal.js` |
| **Function** | `dalDeleteCitizenAccountFull` |
| **Failure branch** | `delete-citizen-account` edge function invocation fails |
| **Severity** | `fatal` |
| **behavior_id** | `behavior.settings.edge_fn_delete` |
| **Safe context** | `{ settingsAction: 'delete_citizen', edgeFnFailed: true, errorCode }` |

---

## Recommended Next Feature: notifications

**Ticket to open:** `VCSM-MONITORING-NOTIFICATIONS-001`

Reasoning in priority order:
1. **8 CRITICAL open findings** — highest of any unmonitored feature
2. **Zero visibility into the notification delivery pipeline** — 5 RPCs, 0 monitoring. A booking confirmation can be written to the DB but the notification never delivered. No signal.
3. **All other monitored features call it** — `createBooking`, `cancelBooking`, `confirmBooking` all fire `publishVcsmNotification`. The booking monitoring is only half the picture without notification delivery observability.
4. **Single DAL file owns all 5 RPCs** — `notificationRuntime.dal.js` is the one file to instrument. Estimated 5–7 call sites, 1 file.
5. **Highest leverage per call site** — every downstream feature that creates notifications benefits immediately.

---

## behavior_id Registry — New Additions

The following namespaces are reserved for future instrumentation. Do not reuse a behavior_id across features.

```
behavior.notifications.publish
behavior.notifications.ingest
behavior.notifications.inbox
behavior.notifications.recipient
behavior.notifications.status_update
behavior.notifications.render

behavior.moderation.authorization
behavior.moderation.report
behavior.moderation.action
behavior.moderation.post_remove
behavior.moderation.message_remove

behavior.settings.account_delete
behavior.settings.account_restore
behavior.settings.vport_publish
behavior.settings.privacy_update
behavior.settings.profile_update
behavior.settings.edge_fn_delete

behavior.auth.actor_create
behavior.auth.username_generate
behavior.auth.password_reset
behavior.auth.recovery_register
behavior.auth.profile_write

behavior.vport.create
behavior.vport.delete
behavior.vport.restore
behavior.vport.profile_update

behavior.upload.post_create
behavior.upload.media_attach
behavior.upload.mention_write
behavior.upload.cloudflare

behavior.dashboard.fuel_price
behavior.dashboard.portfolio
behavior.dashboard.booking_manage
behavior.dashboard.lead_capture
behavior.dashboard.flyer_save

behavior.profiles.friend_rank
behavior.profiles.rate_write

behavior.social.follow
behavior.social.visibility_check

behavior.post.create
behavior.post.react
behavior.post.comment

behavior.public.lead_submit
behavior.public.lead_email

behavior.chat.message_send
```

---

## CONTEXT_ALLOWLIST Additions Required

Before instrumenting these features, add the following keys to `vcsmMonitoring.js` CONTEXT_ALLOWLIST:

```js
// notifications
'rpcCalled',
'eventInserted',
'inboxInserted',
'recipientsInserted',
'notificationKind',

// moderation
'moderationAuthorized',
'actionType',
'targetKind',

// settings + auth + vport
'settingsAction',
'authStep',
'vportAction',
'rpcFailed',
'edgeFnFailed',

// upload + dashboard
'uploadStep',
'dashboardAction',
'writeAttempted',
'mediaCount',
'mentionCount',
```

---

## Scanner Observations

- **`flyerBuilder`** appears in write-surface-map but not in feature-map — it is a sub-feature of `dashboard`. Instrument inside dashboard ticket.
- **`initiation`** appears in write-surface-map with 4 writes — not mapped in feature-map. Likely a vibe/district invite sub-flow. Exclude until feature is properly registered.
- **`unknown`** category in write-surface-map has 111 write surfaces — largest bucket. Includes booking_availability_rules, bookings, reports, actor_follows. These belong to feature-mapped files but scanner could not assign a feature label (likely from dev diagnostics or scripts). Not a target for feature-level monitoring.
- **notifications DAL split:** `notificationRuntime.dal.js` (VCSM) and `engines/notifications/src/dal/` (engine) both have RPC write surfaces. VCSM monitoring goes in the VCSM DAL only — engine files cannot import vcsmMonitoring.
