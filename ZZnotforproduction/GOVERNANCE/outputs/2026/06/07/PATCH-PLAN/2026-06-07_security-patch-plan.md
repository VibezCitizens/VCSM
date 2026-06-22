# Security Patch Plan — Branch vport-booking-feed-security-updates
**Date:** 2026-06-07
**Source:** ARCHITECT → VENOM → BLACKWIDOW → ELEKTRA pipeline output
**ELEKTRA Result:** FAIL — multiple CRITICAL + HIGH open findings
**Scope:** App-layer only. DB phase is separate. THOR runs in a fresh session after all waves pass.

---

## Execution Order

```
TICKET-BOOKING-PATCH-001  (Waves 1–5)
TICKET-NOTI-PATCH-001     (Wave 6)
TICKET-TRAFFIC-PATCH-001  (Wave 7)
TICKET-VPORT-PATCH-001    (Wave 8 — conditional on DB verify)
DB PHASE                  (separate session, owner deploys)
THOR                      (fresh isolated session)
```

---

## TICKET-BOOKING-PATCH-001

**Priority:** P0 (CRITICAL blockers) → P1 (HIGH)
**App:** VCSM
**Type:** SEC

---

### Wave 1 — CRITICAL: Dead DALs (undefined supabase variable)

Both files import `vportClient` at line 1 but reference bare `supabase` (not imported, undefined).
These DALs throw ReferenceError at runtime — slot configuration and resource-service linking are completely dead.

---

#### Patch 1A — VEN-BOOKING-002 / ELEK-2026-06-04-006

**File:** [apps/VCSM/src/features/booking/dal/saveBookingServiceProfileDurationsByServiceIds.dal.js](apps/VCSM/src/features/booking/dal/saveBookingServiceProfileDurationsByServiceIds.dal.js)

**Issue:** Lines 38, 53, 79 reference `supabase` (undefined). Import line 1 brings in `vportClient` but it is never used.

**Tables accessed:**
- `vc.service_booking_profiles` (SELECT, UPDATE, INSERT)

**Fix:** The `vc` schema is accessible through any Supabase client via `.schema("vc")`.
Since `vportClient` is already imported, replace all three `supabase` references with `vportClient`.

```
Line 38:  supabase  →  vportClient
Line 53:  supabase  →  vportClient
Line 79:  supabase  →  vportClient
```

**Pre-read required:** Already read (lines 1–96).
**Callers to check:** grep `saveBookingServiceProfileDurationsByServiceIds` — needed before declaring fixed.

---

#### Patch 1B — VEN-BOOKING-003 / ELEK-2026-06-04-007

**File:** [apps/VCSM/src/features/booking/dal/upsertBookingResourceServices.dal.js](apps/VCSM/src/features/booking/dal/upsertBookingResourceServices.dal.js)

**Issue:** Line 24 references `supabase` (undefined). Import line 1 brings in `vportClient` (unused).

**Table accessed:**
- `vc.resource_services` (UPSERT)

**Fix:** Replace `supabase` → `vportClient` at line 24.

**Pre-read required:** Already read (lines 1–34).

---

### Wave 2 — HIGH: Terminal-State Guards

Both controllers call `updateBookingStatusDAL` without checking the booking's current state.
A cancelled booking can be re-confirmed; a cancelled booking can be re-cancelled (mutating `cancelled_at` and `internal_note`).

---

#### Patch 2A — ELEK-2026-06-04-003 / BW-BOOK-012: confirmBookingController terminal-state gate

**File:** [apps/VCSM/src/features/booking/controllers/confirmBooking.controller.js](apps/VCSM/src/features/booking/controllers/confirmBooking.controller.js)

**Issue:** After fetching the booking (line 22) and asserting VPORT ownership (line 34), the controller calls
`updateBookingStatusDAL` unconditionally. Cancelled or completed bookings can be re-confirmed.

**Fix:** After ownership assertion, before `updateBookingStatusDAL`, add terminal-state guard:

```js
const TERMINAL_STATUSES = new Set(['cancelled', 'completed', 'no_show'])
if (TERMINAL_STATUSES.has(booking.status)) {
  throw new Error('This booking cannot be confirmed — it is already in a terminal state.')
}
```

Insert after line 37 (after `assertActorOwnsVportActorController` call), before the `updateBookingStatusDAL` call.

**Pre-read required:** Already read (lines 1–85).
**No new imports required.**

---

#### Patch 2B — ELEK-2026-06-04-009 / BW-BOOK-013: cancelBookingController terminal-state guard

**File:** [apps/VCSM/src/features/booking/controllers/cancelBooking.controller.js](apps/VCSM/src/features/booking/controllers/cancelBooking.controller.js)

**Issue:** Cancelled bookings can be re-cancelled, mutating `cancelled_at` and `internal_note`.
A customer can cancel their own already-cancelled booking repeatedly.

**Fix:** After booking fetch (line 22), before ownership checks, add:

```js
if (booking.status === 'cancelled') {
  throw new Error('This booking is already cancelled.')
}
```

Insert immediately after the `!booking` guard (after line 35 throw block).

**Pre-read required:** Already read (lines 1–123).

---

### Wave 3 — HIGH: Availability Rule/Exception Cross-Actor Hijack

Both DALs use `onConflict: "id"` for upsert. When a caller supplies a foreign row's `id`,
the DAL overwrites that foreign row — scoped only to `id`, not also `resource_id`.
The controller verifies VPORT ownership of `resourceId` but never verifies that `ruleId/exceptionId` belongs to that resource.

---

#### Patch 3A — ELEK-2026-06-04-001 / BW-BOOK-009: upsertAvailabilityRuleDAL — scoped update

**File:** [apps/VCSM/src/features/booking/dal/upsertAvailabilityRule.dal.js](apps/VCSM/src/features/booking/dal/upsertAvailabilityRule.dal.js)

**Issue:** `upsert(payload, { onConflict: "id" })` at line 55 allows overwriting any row by id regardless of resource_id.

**Fix:** Split into conditional UPDATE (when id present) vs INSERT (when id absent).
When `id` is present, scope the UPDATE to BOTH `id` AND `resource_id` — this prevents cross-resource hijack:

```js
export async function upsertAvailabilityRuleDAL({ row } = {}) {
  // ... existing validation unchanged ...

  const payload = pickDefined(row, RULE_WRITE_COLUMNS)

  if (payload.id) {
    // Update existing rule — scope to resource_id to prevent cross-resource hijack
    const { data, error } = await vportClient
      .from('availability_rules')
      .update(payload)
      .eq('id', payload.id)
      .eq('resource_id', payload.resource_id)
      .select(BOOKING_AVAILABILITY_RULE_SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('upsertAvailabilityRuleDAL: rule not found or does not belong to this resource')
    return data
  }

  // Insert new rule
  const { data, error } = await vportClient
    .from('availability_rules')
    .insert(payload)
    .select(BOOKING_AVAILABILITY_RULE_SELECT)
    .single()
  if (error) throw error
  return data ?? null
}
```

**Pre-read required:** Already read (lines 1–65).

---

#### Patch 3B — ELEK-2026-06-04-002 / BW-BOOK-010: upsertAvailabilityExceptionDAL — scoped update

**File:** [apps/VCSM/src/features/booking/dal/upsertAvailabilityException.dal.js](apps/VCSM/src/features/booking/dal/upsertAvailabilityException.dal.js)

**Issue:** Same `onConflict: "id"` vector as Patch 3A for availability exceptions.

**Fix:** Same conditional UPDATE/INSERT split, scoped to `id AND resource_id`:

```js
if (payload.id) {
  const { data, error } = await vportClient
    .from('availability_exceptions')
    .update(payload)
    .eq('id', payload.id)
    .eq('resource_id', payload.resource_id)
    .select(BOOKING_AVAILABILITY_EXCEPTION_SELECT)
    .maybeSingle()
  if (error) throw error
  if (!data) throw new Error('upsertAvailabilityExceptionDAL: exception not found or does not belong to this resource')
  return data
}

const { data, error } = await vportClient
  .from('availability_exceptions')
  .insert(payload)
  .select(BOOKING_AVAILABILITY_EXCEPTION_SELECT)
  .single()
if (error) throw error
return data ?? null
```

**Pre-read required:** Already read (lines 1–61).

---

### Wave 4 — HIGH: Management Source customerActorId Injection

Public source already patches `customerActorId = requestActorId` at line 112.
Management sources (`owner`, `admin`, `import`, `sync`) accept caller-supplied `customerActorId` without any validation.
A VPORT owner can attribute bookings to any citizen without their consent.

---

#### Patch 4 — ELEK-2026-06-07-B001 / ELEK-2026-06-04-008 / BW-BOOK-017: createBookingController management source customerActorId binding

**File:** [apps/VCSM/src/features/booking/controllers/createBooking.controller.js](apps/VCSM/src/features/booking/controllers/createBooking.controller.js)

**Issue:** Management path (lines 76–85) only calls `assertActorOwnsVportActorController` (verifies VPORT ownership, NOT customer identity). `customerActorId` flows unchanged into `insertBookingDAL`.

**Fix:** After the VPORT ownership assertion (after line 84), add management-source customerActorId binding:

```js
// Management source: bind customerActorId defensively.
// If not provided or matches caller — self-booking (staff books for themselves).
// If explicitly set to a different actorId — validate that actor is a real, non-void citizen.
if (!customerActorId || String(customerActorId) === String(requestActorId)) {
  customerActorId = requestActorId
} else {
  const customerActor = await getActorByIdDAL({ actorId: customerActorId })
  if (!customerActor || customerActor.kind !== 'user' || customerActor.is_void === true) {
    throw new Error('createBookingController: customerActorId is not a valid citizen actor')
  }
}
```

Insert between line 85 (end of `assertActorOwnsVportActorController` call) and line 87 (`if (CITIZEN_ONLY_SOURCES...)`).

`getActorByIdDAL` is already imported (line 3).

**Pre-read required:** Already read (lines 1–186).

---

### Wave 5 — HIGH: Status Allowlist for Management Sources

#### Patch 5 — VEN-BOOKING-004 / ELEK-2026-06-04-004: createBookingController status allowlist

**File:** [apps/VCSM/src/features/booking/controllers/createBooking.controller.js](apps/VCSM/src/features/booking/controllers/createBooking.controller.js)

**Issue:** `status` parameter flows directly to `insertBookingDAL` for all sources. Management sources can insert terminal statuses (`cancelled`, `completed`, `no_show`) on creation.

**Fix:** Add status allowlist constant and validate before insert. After the `ALL_VALID_SOURCES` definition (line 12), add:

```js
const ALLOWED_INSERT_STATUSES = new Set(['pending', 'confirmed'])
```

Then after the source validation block (line 56), add for management sources:
```js
if (MANAGEMENT_SOURCES.has(String(source))) {
  if (status !== null && !ALLOWED_INSERT_STATUSES.has(String(status))) {
    throw new Error(`createBookingController: status "${String(status)}" is not allowed on insert`)
  }
}
```

For public source, status must always be null (default) — the DAL/DB should assign it. Public source does not need explicit validation beyond the null default already in place.

**Pre-read required:** Already read (lines 1–186). Same file as Wave 4 — apply both patches together.

---

### Wave 5B — MEDIUM: listOwnerBookingResources auth assertion

#### Patch 5B — ELEK-2026-06-04-010 / BW-BOOK-007: listOwnerBookingResourcesController ownership assertion

**File:** [apps/VCSM/src/features/booking/controllers/listOwnerBookingResources.controller.js](apps/VCSM/src/features/booking/controllers/listOwnerBookingResources.controller.js)

**Issue:** Any caller can enumerate any actor's booking resources by passing a foreign `ownerActorId`. No session or ownership assertion.

**Fix:** Add `requestActorId` parameter; assert it matches `ownerActorId` (resource owner lists only their own):

```js
import assertActorOwnsVportActorController from '@/features/booking/controllers/assertActorOwnsVportActor.controller'

export async function listOwnerBookingResourcesController({
  requestActorId,
  ownerActorId,
  includeInactive = false,
} = {}) {
  if (!requestActorId) throw new Error('listOwnerBookingResourcesController: requestActorId is required')
  if (!ownerActorId) throw new Error('listOwnerBookingResourcesController: ownerActorId is required')

  await assertActorOwnsVportActorController({ requestActorId, targetActorId: ownerActorId })

  const rows = await listBookingResourcesByOwnerActorIdDAL({ ownerActorId, includeInactive })
  return mapBookingResourceRows(rows)
}
```

**Pre-read required:** Already read (lines 1–20).
**Callers to update:** grep `listOwnerBookingResourcesController` — all callers must pass `requestActorId`. Read each caller before patching.

---

### Wave 5C — MEDIUM: profile_id surface removal

#### Patch 5C — VEN-BOOKING-010: listBookingsByCustomer.dal.js — remove profile_id from SELECT

**File:** [apps/VCSM/src/features/booking/dal/listBookingsByCustomer.dal.js](apps/VCSM/src/features/booking/dal/listBookingsByCustomer.dal.js)

**Issue:** `profile_id` (internal DB identifier) is selected at line 6 and surfaced as `customerProfileId` through the booking model, violating the architecture contract (no profileId on public surfaces).

**Fix:**
1. Remove `"profile_id"` from BOOKING_SELECT (line 6)
2. Remove the join `"profiles!profile_id(actor_id,name)"` (line 23-24) — **only if the join data is not consumed by any caller**
3. Pre-read `booking.model.js` to find `customerProfileId` mapping and remove it there too

**Pre-read required:** Already read (lines 1–41). Must also read `booking.model.js` before patching.

---

## TICKET-NOTI-PATCH-001

**Priority:** P0 (CRITICAL/HIGH), P1 (MEDIUM)
**App:** VCSM
**Type:** SEC

---

### Wave 6A — CRITICAL/HIGH: markSeen bulk ownership bypass

#### Patch 6A — ELEK-2026-06-07-001 / VEN-NOTIFICATIONS-001 / BW-NOTI-001

**File:** [apps/VCSM/src/features/notifications/runtime/index.js](apps/VCSM/src/features/notifications/runtime/index.js)

**Issue:** `markSeen({ recipientIds })` at line 271 calls `markRecipientIdsSeen(recipientIds)` with no ownership check.
Any caller with any `recipientId` UUIDs can bulk-mark another actor's notifications as seen.
`markRead`, `dismiss`, `archive` all call `verifyRecipientOwnership` — `markSeen` does not.

**Fix:** Add `actorId` parameter; filter `recipientIds` to only those owned by `actorId` using `verifyRecipientOwnership`. Use bulk approach to avoid N×1 query issue:

```js
export async function markSeen({ recipientIds, actorId } = {}) {
  if (!actorId) return 0

  const ids = (recipientIds ?? []).filter(Boolean)
  if (!ids.length) return 0

  // Verify ownership in parallel — filter to only this actor's recipientIds
  const ownershipResults = await Promise.all(
    ids.map((id) => verifyRecipientOwnership(id, actorId))
  )
  const ownedIds = ids.filter((_, i) => ownershipResults[i])
  if (!ownedIds.length) return 0

  const count = await markRecipientIdsSeen(ownedIds)
  invalidateCountUnreadCache()
  return count
}
```

**Pre-read required:** Lines 260–275 already read. Read full `markSeen` context (lines 265–280) before patching.
**Callers to update:** grep `markSeen(` — all callers must pass `actorId`. Read each before patching.

---

### Wave 6B — MEDIUM: publish.js actorId session binding

#### Patch 6B — ELEK-2026-06-07-B003 / VEN-NOTIFICATIONS-004 / BW-NOTI-005

**File:** [apps/VCSM/src/features/notifications/publish.js](apps/VCSM/src/features/notifications/publish.js)

**Issue:** `getSession()` at line 62 confirms auth but does NOT verify `actorId` parameter matches the session user.
Authenticated actor A can pass `actorId = actorB` and publish a notification appearing to originate from actorB.
DB BEFORE INSERT trigger (TICKET-ARCH-NOTI-SESSION-001) is the sole backstop — app layer has zero protection.

**Fix approach — two options:**

**Option A (surgical — preferred):** After `getSession()`, look up the session user's actorId from `actor_owners`
and cross-check against the `actorId` param. Reject mismatches:

```js
const { data: { session } } = await supabase.auth.getSession()
if (!session) return false

// Verify actorId belongs to session user
// session.user.id is the auth user UUID — look up via actor_owners
const { data: ownerLink } = await supabase
  .schema('vc')
  .from('actor_owners')
  .select('actor_id')
  .eq('user_id', session.user.id)
  .eq('actor_id', actorId)
  .maybeSingle()

if (!ownerLink) return false  // actorId not owned by this session user
```

**Option B (broader):** Remove `actorId` from `publishVcsmNotification` param surface; derive it from session internally.
This requires updating all callers — higher blast radius, separate ticket.

**Recommended:** Option A. It is surgical, preserves the existing call signature, and adds the missing layer.

**Pre-read required:** Already read (lines 1–155). Also apply same fix to `publishVcsmNotificationBatch`.
**Must also read:** `actor_owners` table schema to confirm `user_id + actor_id` columns are queryable this way.

---

## TICKET-TRAFFIC-PATCH-001

**Priority:** P2
**App:** Traffic
**Type:** SEC

---

### Wave 7 — MEDIUM: Moderation State Machine Terminal-State Guard

#### Patch 7 — ELEK-2026-06-07-B002 / VEN-TRAFFIC-004 / BW-TRAFFIC-004

**Files:**
- [apps/Traffic/src/features/answers/dal/moderationAnswers.dal.js](apps/Traffic/src/features/answers/dal/moderationAnswers.dal.js) — `updateAnswerModerationRow`
- [apps/Traffic/src/features/answers/dal/moderationQuestions.dal.js](apps/Traffic/src/features/answers/dal/moderationQuestions.dal.js) — `updateQuestionModerationRow`

**Issue:** Both DALs do `.update(values).eq("id", id)` with no prior-state check.
Bearer token holder can re-reject a published answer, silently removing it from public view.
No audit trail — `published_at` / `moderated_at` overwritten unconditionally.

**Fix (Option B — minimal, no behavior change for valid flows):**

In `moderationAnswers.dal.js` `updateAnswerModerationRow`:
```js
const { data, error } = await client
  .schema("answers")
  .from("answers")
  .update(values)
  .eq("id", id)
  .eq("moderation_status", "pending")   // ← add this guard
  .select(ANSWER_PROJECTION)
  .single();
```

In `moderationQuestions.dal.js` `updateQuestionModerationRow`:
```js
const { data, error } = await client
  .schema("answers")
  .from("questions")
  .update(values)
  .eq("id", id)
  .eq("moderation_status", "pending")   // ← add this guard
  .select(QUESTION_PROJECTION)
  .single();
```

**Note:** `.single()` will return an error if no row matches — the controller must handle this gracefully (not crash; return `{ ok: false, error: "Already moderated." }`). Check `moderateAnswers.controller.js` error handling before applying.

**Pre-read required:** Both DAL files already read. Must also read `moderateAnswers.controller.js` lines 77–109 (already read in pipeline — confirm error path handles null data).

---

## TICKET-VPORT-PATCH-001

**Priority:** P1 — CONDITIONAL on DB phase result
**App:** VCSM
**Type:** SEC
**Gate:** Do not apply these patches until DB phase confirms `vport.profiles` RLS UPDATE policy status.

---

### Wave 8 — HIGH (Conditional): vport app-layer ownership binding

#### Patch 8A — BW-VPORT-001: vport.core.dal — updateVport owner scope

**File:** `apps/VCSM/src/features/vport/dal/vport.core.dal.js` (lines ~183–229 — not yet read)

**Issue:** `requireUser()` at line 185 confirms session exists but the UPDATE is not scoped to the session user.
Any authenticated actor can update any vport profile by supplying a foreign vportId.
RLS is sole barrier — unverified.

**Fix approach:** Read file first. After `requireUser()`, scope UPDATE to user's owned actor:
`.update(patch).eq("id", vportId).eq("owner_user_id", user.id)` — **only if the column exists**.
If not, derive from `actor_owners` join or fetch ownership via readOwnerLinkByActorAndSession before mutating.

**Pre-read required:** Must read `vport.core.dal.js` lines 183–229 before planning this patch.

---

#### Patch 8B — BW-VPORT-002: vport.write.profileMedia.dal — session bind on avatar/banner update

**File:** `apps/VCSM/src/features/vport/dal/vport.write.profileMedia.dal.js` (lines 1–24 already read)

**Issue:** No `requireUser()`. `actorId` accepted as caller-supplied param with no session verification.
Attack: any authenticated actor passes victim's `actorId` → replaces victim's avatar.

**Fix:** Add `requireUser()` call (import from vportClient pattern). After session verification, cross-check `actorId` against `session.user.id` via `actor_owners` — reject if actorId does not belong to the session user.

**Pre-read required:** Already read. Must confirm `requireUser()` import pattern from same file tree.

---

## DB PHASE — Deferred (Separate Session, Owner Deploys)

These items were found during the code audit. They are NOT patched in this session.
They require DB inspection and owner deployment.

| DB Audit ID | Object | Risk | SQL to Verify |
|---|---|---|---|
| DB-VPORT-001 | `vport.profiles` UPDATE policy | RLS absent → BW-VPORT-001 becomes unconditional bypass | `SELECT policyname, qual FROM pg_policies WHERE tablename='profiles' AND schemaname='vport' AND cmd='UPDATE'` |
| DB-NOTI-001 | `notification.inbox_items` UPDATE policy | RLS absent → markSeen fix is sole defense with no DB backstop | `SELECT policyname FROM pg_policies WHERE tablename='inbox_items' AND schemaname='notification'` |
| DB-BOOKING-001 | `vport.bookings` UPDATE | No owner_actor_id filter at DAL layer (VEN-BOOKING-001) | `SELECT policyname, qual FROM pg_policies WHERE tablename='bookings' AND schemaname='vport' AND cmd='UPDATE'` |
| DB-TRAFFIC-001 | `answers.questions` INSERT | Anon key permission unknown — blocks TRAZE_ANSWERS_SCHEMA_READY activation | `SELECT policyname, roles FROM pg_policies WHERE tablename='questions' AND schemaname='answers' AND cmd='INSERT'` |
| DB-VPORT-002 | `soft_delete_vport` RPC | AUTH_REQUIRED enforcement unverified (VEN-VPORT-003) | Inspect RPC body for `auth.uid()` enforcement |

---

## Pre-Patch Checklist (Must Complete Before Execution)

Before starting any wave:

- [ ] Read `apps/VCSM/src/features/booking/model/booking.model.js` — locate `customerProfileId` exposure (Wave 5C)
- [ ] grep `listOwnerBookingResourcesController` — find all callers to update (Wave 5B)
- [ ] grep `markSeen(` — find all callers to update (Wave 6A)
- [ ] Read `vport.core.dal.js` lines 183–229 — confirm column names for owner scope (Wave 8A)
- [ ] Confirm `actor_owners` queryable with `user_id + actor_id` columns (Wave 6B)
- [ ] Read `moderateAnswers.controller.js` error handling for null-row case from DAL (Wave 7)

---

## Implementation Return Format (per VCSM CLAUDE.md)

Each patch must produce:
```
[TICKET-ID] — Implementation Return

Files Changed:     path + what changed and why
Behavior Changed:  before / after / preserved
Grep Checks:       symbol grepped → result
Tests Run:         test file → result (or: not run)
Build Result:      passed / failed / not run
Remaining TODOs:   open items or follow-up tickets
```

---

## THOR Gate

THOR must run in a **fresh, isolated session** after all waves above are applied and verified.
THOR is blocked until:
- All CRITICAL findings are CLOSED_SOURCE_VERIFIED
- All HIGH findings that are not conditional-on-DB are CLOSED_SOURCE_VERIFIED
- DB audit SQL above is executed and reported by owner
- SPIDER-MAN regression pass (separate ticket) — if required by THOR contract

THOR must NEVER run in this session.
