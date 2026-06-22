# Block Feature — Deferred Work

**As of:** 2026-06-02
**Sources:** CARNAGE 2026-05-11 (FILE_NOT_FOUND), LOKI 2026-05-14 (FILE_NOT_FOUND), THOR 2026-05-14 (FILE_NOT_FOUND), CURRENT_STATUS 2026-05-14

> Items in this file are known, intentional, and not currently being executed.
> Active blockers belong in BLOCKERS.md. Items here become tickets when their
> stated trigger condition is met.

---

## 1. Migration Dependencies — batch4

**Item ID:** DEFER-BLOCK-001

**Migration file:** `20260510100000_fix_block_actor_bidirectional_follows.sql`

**What it does:**
Fixes bidirectional follow integrity after a block event. When actor A blocks actor B,
any existing `vc.actor_follows` rows in both directions must be removed. The batch4
migration handles the schema-level enforcement and/or backfill path that the current
app-layer `applyBlockSideEffects.js` approximates at runtime.

**Why deferred:**
Migration has been written and is staged but has not been promoted to production.
No critical failure is occurring in the interim — the app-layer side-effect handler
(`applyBlockSideEffects.js`) provides a runtime bridge until batch4 deploys.

**Depends on:**
- Staging validation of the migration script
- Production deployment window

**Recommended trigger:**
Create a CARNAGE migration ticket the moment staging validation is confirmed.
Do not merge any follow or friend_ranks changes until batch4 is in production.

**Owner command:** CARNAGE

---

## 2. Orphan Cleanup — Historical vc.actor_follows Reverse Orphans

**Item ID:** DEFER-BLOCK-002

**What it is:**
Historical `vc.actor_follows` rows where actor A follows actor B but a block
relationship exists between them — reverse orphans that predate bidirectional
enforcement. These rows were not cleaned by any prior migration and may surface
stale follow state for old blocked pairs.

**Why deferred:**
The backfill cannot run safely until batch4 deploys. Running it before batch4
risks inconsistent state if the migration introduces constraint changes that the
backfill assumes are already present.

**Depends on:**
- DEFER-BLOCK-001 (batch4 in production)

**Recommended trigger:**
Open a follow-on DATA ticket immediately after batch4 is confirmed in production.
Backfill should be a one-time script run with transaction isolation.

**Owner command:** CARNAGE / DB

---

## 3. friend_ranks Policy Fix — step2 Section 2D

**Item ID:** DEFER-BLOCK-003

**What it is:**
`vc.friend_ranks` has a SELECT policy defined as `USING(true)`, which exposes all
social graph scores to any authenticated user. This is a data-exposure gap — a
logged-in user can read the full global social graph scores table via direct query.

**Why deferred:**
The fix (step2 section 2D) was identified and scoped but has not been applied.
It was explicitly flagged as "pending application" in CURRENT_STATUS. No immediate
exploit path exists via the app layer, but the RLS policy is overpermissive.

**Depends on:**
- Independent of batch4 — can be applied in a standalone migration
- However, should be coordinated with the batch4 deployment window to reduce
  migration count and review overhead

**Recommended trigger:**
Open a SEC ticket before the next production deployment window. This does not need
to wait for batch4 but should be batched with it if timing allows.

**Owner command:** VENOM / ELEKTRA

---

## 4. applyBlockSideEffects.js Deletion

**Item ID:** DEFER-BLOCK-004

**File:** `applyBlockSideEffects.js`

**What it does:**
Calls `deleteFriendRankRowsBetweenActors` at runtime when a block event fires.
This is a compensating app-layer workaround for the gap that batch4 fixes at the
DB layer.

**Why deferred:**
The file has zero callers other than the block side-effect path. Once batch4
deploys, this runtime workaround becomes redundant and should be deleted to
prevent future confusion about which layer owns the cleanup. It must NOT be
deleted before batch4 is in production — deleting it early would remove the
only active cleanup mechanism.

**Depends on:**
- DEFER-BLOCK-001 (batch4 in production and verified)

**Recommended trigger:**
Delete this file in the same PR that confirms batch4 is live and validated.
Add a code comment to the file now referencing this DEFERRED entry if it
does not already have one.

**Owner command:** CARNAGE / SENTRY

---

## 5. LOKI Open Runtime Findings

> These are unresolved runtime observations from the LOKI audit. They are not
> release blockers for PWA but are known inefficiencies that should be addressed
> in a future performance sprint.

### LF-01 — Duplicate Uncached checkBlockStatus Reads

**Item ID:** DEFER-BLOCK-005

**Description:**
`checkBlockStatus` is called twice in parallel on profile screen load —
once directly in `VportProfileViewScreen:54` and once inside `useProfileGate:19`.
Both calls hit Supabase with no cache layer. Read Amplification Score: 2.0.

**Why deferred:**
Not a correctness issue. No data inconsistency risk. Pure read amplification
that increases Supabase query volume on profile views but does not affect behavior.

**Depends on:**
- No blocking dependency. Can be addressed independently.

**Recommended trigger:**
Open a KRAVEN performance ticket when the next profiling sprint is planned,
or when Supabase read costs become a concern at scale.

**Owner command:** KRAVEN / LOKI

---

### LF-02 — invalidateFeedBlockCache Missing from useBlockActorAction Path

**Item ID:** DEFER-BLOCK-006

**Description:**
`invalidateFeedBlockCache` is inferred to be missing from the `useBlockActorAction`
hook path based on cache behavior observed during the LOKI audit. If this is
confirmed, block actions from this path would not invalidate the feed cache,
causing stale feed entries to persist until TTL expiry (60s).

**Why deferred:**
Inferred finding — not confirmed by direct code trace in available sources.
Impact is bounded by the 60s TTL on `readFeedBlockRowsDAL`. Users would see
a blocked actor's content for up to 60 seconds after blocking.

**Depends on:**
- Requires a direct code trace of `useBlockActorAction` to confirm or dismiss.

**Recommended trigger:**
Open a BUG ticket when the next security or feed integrity sprint begins.
Confirm or dismiss with a direct trace before writing any fix.

**Owner command:** LOKI / VENOM

---

### LF-03 — Note on Source Availability

**Item ID:** DEFER-BLOCK-007

The LOKI source file was marked FILE_NOT_FOUND at the time this DEFERRED.md was
generated. LF-01 and LF-02 are sourced from CURRENT_STATUS verbatim. A third
LOKI finding (LF-03) was referenced in the task specification but is not documented
in CURRENT_STATUS. If the LOKI source file is recovered, re-run this audit to
check for additional deferred findings.

**Owner command:** LOKI

---

## 6. Android Native Governance

**Item ID:** DEFER-BLOCK-008

**THOR Decision:** BLOCKED — NOT STARTED

**What is needed:**
The Android native platform has not received any governance coverage for the Block
feature. The following workstreams are required before Android can be considered
for release:

- FALCON parity audit: identify all block-related surfaces in the Android native
  build (block action, follow gate, chat compose disable, fail-closed behavior)
- Confirm controller-level chat compose disable is implemented and verified
- Confirm fail-closed behavior is runtime-tested on all block-guarded surfaces
- Confirm native follow/friend gate has an assigned owner and transfer evidence
- THOR gate review for Android after FALCON audit completes

**Why deferred:**
Work has not started. No Android-specific block governance has been assigned.

**Depends on:**
- A FALCON audit for Android must be opened and completed first
- iOS FALCON P0 gaps (NTB-02, NTB-03, NDF-01) should be resolved before
  Android work begins, as the iOS findings may reveal patterns that apply
  to Android as well

**Recommended trigger:**
Open a FALCON ticket for Android block governance after iOS P0 blockers
(THOR release blockers 1–3) are resolved.

**Owner command:** FALCON / THOR

---

## Summary Table

| ID | Item | Depends On | Trigger |
|---|---|---|---|
| DEFER-BLOCK-001 | batch4 migration to production | Staging validation | Staging confirmed |
| DEFER-BLOCK-002 | Historical actor_follows orphan backfill | batch4 in production | batch4 confirmed live |
| DEFER-BLOCK-003 | friend_ranks SELECT policy fix (step2 2D) | None (standalone) | Next deployment window |
| DEFER-BLOCK-004 | applyBlockSideEffects.js deletion | batch4 confirmed live | Same PR as batch4 verification |
| DEFER-BLOCK-005 | LF-01 duplicate checkBlockStatus reads | None | Next performance sprint |
| DEFER-BLOCK-006 | LF-02 invalidateFeedBlockCache missing from useBlockActorAction | Direct code trace | Next security/feed sprint |
| DEFER-BLOCK-007 | LOKI source file recovery — possible LF-03 | LOKI file available | When LOKI file is recovered |
| DEFER-BLOCK-008 | Android native block governance | iOS P0 blockers resolved | After iOS THOR gate clears |
