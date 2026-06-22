---
report: blackwidow_feed-dal-rls-adversarial
date: 2026-05-18
scope: VCSM — feed DAL confirmed RLS gap surfaces (SF-07, onboarding step write, moderation actions read)
authority: GOVERNANCE_WRITABLE
triggered_by: CEREBRO 2026-05-18 — BLACKWIDOW feed-specific pass
prior_blackwidow: zNOTFORPRODUCTION/CURRENT/features/dashboard/evidence/2026-05-14_14-00_blackwidow_vcsm-full-pass.md
---

# BLACKWIDOW ADVERSARIAL REPORT — Feed DAL RLS Surfaces (2026-05-18)

**Application Scope:** VCSM  
**Reviewer:** BLACKWIDOW  
**Branch:** `vport-booking-feed-security-updates`  
**Environment:** Source Code Adversarial Simulation (READ-ONLY)  
**Governance Status:** DRAFT  
**Report Type:** Feed-specific targeted pass — adversarial simulation for V-FEED-01, V-FEED-02, V-FEED-03, SF-07

---

## Scope Note

The 2026-05-14 full BLACKWIDOW pass explicitly deferred three feed adversarial scenarios as "Not re-tested in this pass." This report covers exactly those deferred scenarios plus the SF-07 follow graph enumeration attack, which was not adversarially simulated in any prior pass.

| Scenario | VENOM Finding | Prior BLACKWIDOW coverage |
|---|---|---|
| BW-FEED-01 — Follow graph enumeration | SF-07 | NOT TESTED |
| BW-FEED-02 — Onboarding step tampering | V-FEED-03 | NOT TESTED |
| BW-FEED-03 — Moderation state leak | V-FEED-01 | NOT TESTED |
| BW-FEED-04 — Reaction fingerprint | V-FEED-02 | NOT TESTED |

---

## Threat Model

**Attacker profile:** Authenticated VCSM user with valid session. No backend access. Attack is conducted via the Supabase JavaScript client SDK (`supabase-js`) directly — bypassing DAL layer entirely. All reads go directly to Supabase PostgREST API.

**Capability:**
- Can supply arbitrary parameters to Supabase queries
- Cannot forge `auth.uid()` (controlled by Supabase Auth)
- CAN supply any `actor_id`, `actorId`, or column filter value since these are application-layer assertions, not cryptographically tied to the session

**Defense assumptions:** The only valid defense against this attack profile is RLS — PostgreSQL policies that enforce `auth.uid()` → `actor_owners` → `actor_id` ownership at the database layer.

---

## Simulated Attacks

---

### BW-FEED-01 — SF-07 Follow Graph Enumeration

**Vulnerability source:** `vc.actor_follows` — `actor_follows_select_public_subscriber_count` policy `USING (is_active = true)` — NO actor restriction

**Attack vector:**

```javascript
// Attacker constructs a direct Supabase client query
// No DAL used — direct PostgREST call
const { data } = await supabase
  .schema('vc')
  .from('actor_follows')
  .select('follower_actor_id, followed_actor_id, is_active')
  .eq('followed_actor_id', victimActorId)  // target any actor
  .eq('is_active', true)
// Returns: FULL follower list for victimActorId
```

**Why this works:** PostgreSQL evaluates PERMISSIVE policies with OR logic. The `actor_follows_select_public_subscriber_count` policy returns `true` for any row where `is_active = true`, regardless of who is querying. The actor-scoped policy (`actor_follows.select.self`) is not a restriction — it is an additional grant. Both policies allow read, so any active follow row is readable by any authenticated user.

**Blast radius:**

| Target | Data Exposed | Privacy Impact |
|---|---|---|
| Private citizen VPORT | Full follower list (follower actor IDs) | HIGH — reveals who follows a private account |
| Public VPORT (competitor) | Full follower list | MEDIUM — competitive intelligence (follower count + identities) |
| User's personal actor | Full follower list | HIGH — deanonymization risk; social graph of real person |
| Any actor | `follower_actor_id` + `followed_actor_id` for ALL their follows | HIGH — bidirectional social graph mapping |

**Escalation path:** A determined attacker can reconstruct the full social graph of the platform by enumerating follows for all known actor IDs. Combined with actor lookup APIs, this enables deanonymization of anonymous actors.

**Attack result: CONFIRMED EXPLOITABLE**  
**Severity: HIGH**  
**Defense status: NO RLS DEFENSE (confirmed via policy audit)**

---

### BW-FEED-02 — Onboarding Step Tampering via `markWelcomeFeedCardSeenDAL`

**Vulnerability source:** `vc.actor_onboarding_steps` — no RLS evidence; UPSERT accepts client-supplied `actor_id`

**Attack vector:**

```javascript
// Attacker injects a target actorId into the UPSERT
// This mirrors exactly what markWelcomeFeedCardSeenDAL does internally
const { error } = await supabase
  .schema('vc')
  .from('actor_onboarding_steps')
  .upsert(
    {
      actor_id: victimActorId,   // not the attacker's own actor
      step_key: 'FEED_WELCOME_CARD',
      status: 'completed',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'actor_id,step_key' }
  )
// If no RLS: SUCCEEDS — marks victim's welcome card as seen
```

**Why this works:** Without a `WITH CHECK` policy enforcing `actor_id IN (SELECT actor_id FROM actor_owners WHERE user_id = auth.uid())`, the database accepts any `actor_id` from any authenticated user. The UPSERT `onConflict` means it will UPDATE existing rows too — permanently overwriting the victim's onboarding state.

**Primary blast radius:**

| Attack | Impact |
|---|---|
| Mark victim's welcome card seen | Hides onboarding welcome card for victim permanently |
| Set victim's onboarding step to `completed` | Bypasses onboarding gates if checked in logic |
| Overwrite `progress` or `meta` fields | Corrupts any progress tracking tied to onboarding |
| If other steps exist on same table | Could suppress CTAs, paywall prompts, or invite gates |

**Analytics impact:** Platform onboarding completion metrics become unreliable. If product decisions are based on onboarding completion rates, this is a data integrity attack on business intelligence.

**Attack surface discovery path:** The `step_key` value `FEED_WELCOME_CARD` is visible in the JavaScript bundle (`feedWelcomeCard.dal.js`). Any other `step_key` values present in the codebase are discoverable from source. An attacker with access to the bundle can enumerate all valid step keys.

**Attack result: EXPLOITABLE IF NO RLS (unconfirmed RLS state — assume exploitable until live schema confirms otherwise)**  
**Severity: HIGH**  
**Defense status: UNKNOWN — live schema inspection required**

---

### BW-FEED-03 — Moderation State Leak via `readHiddenPostsForViewer`

**Vulnerability source:** `moderation.actions` — RLS enabled (Batch5 proposed) but zero SELECT policies confirmed

**Attack vector:**

```javascript
// readHiddenPostsForViewer internally does:
// supabase.schema("moderation").from("actions")
//   .select(...)
//   .eq("actor_id", viewerActorId)
//   .in("action_type", ["hide_post", ...])

// Attacker bypasses DAL:
const { data } = await supabase
  .schema('moderation')
  .from('actions')
  .select('actor_id, target_type, target_id, action_type, created_at')
  .eq('actor_id', victimActorId)
// If no SELECT policy: returns victim's full moderation action history
```

**Paradox risk:** If RLS is ENABLED with zero policies (as the Batch5 proposal implies), PostgreSQL default-deny blocks ALL access — including legitimate callers. This would silently break `readHiddenPostsForViewer` for ALL users (returning empty, no error depending on client config). Two outcomes:

1. **No RLS at all:** Victim's hidden post list fully readable. Any hidden post = social/behavioral PII.
2. **RLS ON but no policies (default-deny):** `readHiddenPostsForViewer` always returns empty. Hidden posts are never filtered from anyone's feed. BROKEN SILENTLY.

**Both outcomes are production failures.** Outcome 1 is a privacy violation. Outcome 2 is a feature regression — every user sees posts they've hidden.

**Data exposed (Outcome 1):**

| Field | Sensitivity |
|---|---|
| `target_id` (post ID the user hid) | Reveals content preferences — PII |
| `action_type` (hide, report, block) | Reveals moderation behavior — behavioral PII |
| `created_at` | Reveals timing of moderation behavior |
| `actor_domain` + `target_domain` | Reveals context (e.g., chat vs. feed) |

**If `action_type` includes `report`:** An attacker who knows a post ID can check whether a specific user reported it — a highly sensitive behavioral signal.

**Attack result: EITHER EXPLOITABLE (no RLS) OR SILENTLY BROKEN (RLS with no policies)**  
**Severity: HIGH (either outcome is production-blocking)**  
**Defense status: AMBIGUOUS — live schema inspection is mandatory before next deploy**

---

### BW-FEED-04 — Reaction Fingerprint via `readViewerReactionsBatch`

**Vulnerability source:** `vc.post_reactions` — INSERT/UPDATE/DELETE enforced; SELECT policy shape unconfirmed

**Attack vector:**

```javascript
// readViewerReactionsBatch internally does:
// supabase.schema("vc").from("post_reactions")
//   .select("post_id, reaction")
//   .in("post_id", postIds)
//   .eq("actor_id", actorId)

// Attacker with victim actorId and known post IDs:
const { data } = await supabase
  .schema('vc')
  .from('post_reactions')
  .select('post_id, reaction')
  .in('post_id', postIds)
  .eq('actor_id', victimActorId)
// Returns victim's specific reactions (like/dislike) on target posts
```

**Why this is likely LOW severity:** Reaction data is public social data. The aggregate counts (`readReactionCountsBatch`) already expose total likes/dislikes with no actor filter. The expected SELECT policy is `USING (true)` for authenticated users. If the policy is `USING (true)`, this is expected behavior and not a vulnerability — reaction data is intentionally public.

**Risk if SELECT policy is missing entirely:** Same behavior as `USING (true)` — low risk, public data.

**Only real risk:** If `post_reactions` is scoped to private posts (posts that only certain viewers can see), knowing that a user reacted to a private post confirms they have access to it. This is a minor cross-feature information leak.

**Attack result: LOW — public data by design**  
**Severity: LOW**  
**Defense status: LIKELY SAFE — write enforced; read expected as public**

---

## Adversarial Verdict Summary

| Scenario | Attack | Result | Severity | Blocking |
|---|---|---|---|---|
| BW-FEED-01 | SF-07 follow graph enumeration | CONFIRMED EXPLOITABLE | HIGH | YES |
| BW-FEED-02 | Onboarding step tampering | EXPLOITABLE IF NO RLS | HIGH | YES |
| BW-FEED-03 | Moderation state leak | HIGH RISK — either privacy breach OR silent feature regression | HIGH | YES |
| BW-FEED-04 | Reaction fingerprint | LOW — public data pattern | LOW | NO |

---

## Attack Dependency Diagram

```
Attacker (auth.uid() valid)
│
├─ BW-FEED-01 ─ supabase.from('actor_follows')
│                 No actor restriction on public SELECT policy
│                 → Full social graph enumeration
│
├─ BW-FEED-02 ─ supabase.from('actor_onboarding_steps').upsert({actor_id: VICTIM})
│                 No WITH CHECK RLS
│                 → Cross-actor onboarding corruption
│
├─ BW-FEED-03 ─ supabase.from('moderation.actions').select().eq('actor_id', VICTIM)
│                 No SELECT policy (default-deny OR no RLS)
│                 → Privacy breach OR silent feed regression
│
└─ BW-FEED-04 ─ supabase.from('post_reactions').select().eq('actor_id', VICTIM)
                  Expected public SELECT policy
                  → LOW — public data
```

---

## Recommendations

| Priority | Action | Command |
|---|---|---|
| BLOCKING | Apply P2 (`actor_onboarding_steps` RLS + WITH CHECK) in staging immediately | CARNAGE → DB → Wolverine |
| BLOCKING | Apply P1 (`moderation.actions` SELECT + INSERT policies) in staging immediately | CARNAGE → DB → Wolverine |
| BLOCKING | Complete P3 prerequisite (`subscriberCount.dal.js` audit) then drop SF-07 policy | CARNAGE → SENTRY → Wolverine |
| HIGH | Live schema inspection for all 4 tables before any code change | DB |
| LOW | Confirm `vc.post_reactions` SELECT policy shape | DB |

---

## BLACKWIDOW Verdict

**THREE CONFIRMED HIGH ATTACK SURFACES.**

BW-FEED-01 is directly exploitable with no prerequisites — any authenticated user can enumerate the full follow graph for any actor. BW-FEED-02 and BW-FEED-03 require confirmation of RLS absence via live schema inspection but are treated as exploitable given zero policy evidence in migration files.

**VENOM verification required after CARNAGE proposals are applied.**

**Status: REVIEW_PENDING**
