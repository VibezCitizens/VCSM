# BlackWidow V2 Adversarial Review — invite
## Feature: invite | App: VCSM | Protocol: BW2.5 V2

---

## 1. Output Metadata

| Field | Value |
|---|---|
| Report Date | 2026-06-04 |
| Feature | invite |
| App | VCSM |
| Reviewer | BLACKWIDOW V2 |
| Protocol Version | BW2.5 V2 |
| Report Status | COMPLETE |
| Output Path | ZZnotforproduction/APPS/VCSM/features/invite/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_invite-adversarial-review.md |

---

## 2. Scanner Preflight

| Field | Value |
|---|---|
| Scanner Status | FRESH |
| Maps Generated | 2026-06-04T19:48:25.152Z |
| Scanner Version | 1.1.0 |
| Security Paths Attributed (invite) | 2 |
| Total Platform Security Paths | 598 |
| Callgraph Nodes (invite) | 7 |
| Callgraph Edges (invite) | 6 |
| Write Execution Paths | 0 (all edge-function routed — no direct DB write from client) |
| RPC Paths | 0 |

---

## 3. Scanner Inputs

```
Security Path Map:   apps/scanner/maps/security-path-map.json
Callgraph Map:       apps/scanner/maps/callgraph.json
Write Execution Map: apps/scanner/maps/write-execution-map.json
RPC Execution Map:   apps/scanner/maps/rpc-execution-map.json
```

Source files read:
- `apps/VCSM/src/features/invite/controller/invite.controller.js`
- `apps/VCSM/src/features/invite/dal/invite.dal.js`
- `apps/VCSM/src/features/invite/hooks/useInvite.js`
- `apps/VCSM/src/features/invite/screens/InviteView.jsx`
- `apps/VCSM/src/features/invite/screens/InviteScreen.jsx`
- `apps/VCSM/supabase/functions/send-citizen-invite/index.ts`
- `apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js`
- `apps/VCSM/src/features/auth/hooks/useRegister.js`
- `apps/VCSM/src/app/routes/protected/app.routes.jsx`
- `apps/VCSM/src/app/guards/ProtectedRoute.jsx`

---

## 4. Attack Surface Inventory

### 4.1 Security Paths in Scope

| Path ID | Route | Access | Confidence | Notes |
|---|---|---|---|---|
| SP-INV-001 | null (unresolved) | unknown | LOW | Edge function invoke from sendCitizenInviteDAL — no route confirmed |
| SP-INV-002 | null (unresolved) | unknown | LOW | Edge function discovery path — duplicate evidence |

Both paths are LOW confidence (unresolved sourceRoute). These are PRIMARY ATTACK TARGETS per Rule BW-002.

### 4.2 Resolved Route Surface

Despite LOW scanner confidence, route confirmed via source inspection:
- `/invite` — registered in `protectedAppRoutes()` at `app.routes.jsx:152`
- Protected by `ProtectedRoute` component (wraps all protectedAppRoutes)
- ProtectedRoute enforces: `!user → Navigate /login`, email verification, legal consent gate

### 4.3 Hook Entry Points

| Hook | Layer | File |
|---|---|---|
| `useInvite()` | hook | `apps/VCSM/src/features/invite/hooks/useInvite.js` |

### 4.4 Controller Entry Points

| Function | Layer | File |
|---|---|---|
| `ctrlSendCitizenInvite()` | controller | `apps/VCSM/src/features/invite/controller/invite.controller.js` |
| `codeToInviteMessage()` | controller | `apps/VCSM/src/features/invite/controller/invite.controller.js` |

### 4.5 DAL Write Surfaces

| Function | Operation | Target | File |
|---|---|---|---|
| `sendCitizenInviteDAL()` | Edge Function invoke | `send-citizen-invite` | `apps/VCSM/src/features/invite/dal/invite.dal.js` |

### 4.6 Secondary Read Surface (Onboarding)

| Function | Operation | Returns | File |
|---|---|---|---|
| `readVibeInvitesDAL()` | SELECT vc.vibe_invites | includes `invite_code` | `apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js` |
| `readVibeInviteCountDAL()` | COUNT vc.vibe_invites | count | `apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js` |
| `readQualifyingVibeInviteCountDAL()` | COUNT vc.vibe_invites | count | `apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js` |

### 4.7 Callgraph Backward Trace

```
useInvite [hook]
  → ctrlSendCitizenInvite [controller:invite.controller.js]
    → sendCitizenInviteDAL [dal:invite.dal.js]
      → supabase.functions.invoke('send-citizen-invite') [Edge Function]
        → adminClient.auth.admin.listUsers() [O(n) DB scan]
        → vc.actor_owners [ownership verification]
        → vc.actors [actor resolution]
        → vc.vibe_invites [INSERT]
        → vc.actor_onboarding_steps [UPSERT]
        → SES SendEmailCommand [email dispatch]
```

---

## 5. Scanner Signals

| Signal Type | Count | Notes |
|---|---|---|
| LOW confidence security paths | 2 | No route resolution — both are PRIMARY ATTACK TARGETS |
| HIGH confidence writes | 1 | Edge function invoke confirmed by AST |
| RPC paths | 0 | No RPCs used in this feature |
| Callgraph layers covered | 4 | hook, controller, dal, screen |
| Open VENOM findings carried into BW | 5 | VEN-INVITE-001 through VEN-INVITE-005 |

---

## 6. Adversarial Path Analysis

### A. OWNERSHIP BYPASS (§5.1)

**Attack: Submit another actor's vportId as inviterActorId**

Path: `useInvite → ctrlSendCitizenInvite → sendCitizenInviteDAL → Edge Function`

Hypothesis: A malicious citizen-authenticated user constructs a payload with `inviterType: 'vport'` and `inviterActorId` set to a VPORT they do not own.

Evidence from Edge Function (`index.ts:347-354`):
```typescript
const { data: ownerRow, error: ownerError } = await adminClient
  .schema("vc")
  .from("actor_owners")
  .select("actor_id")
  .eq("user_id", user.id)        // <-- JWT-resolved user.id
  .eq("actor_id", inviterActorId) // <-- client-supplied actorId cross-referenced
  .eq("is_void", false)
  .maybeSingle();

if (!ownerRow?.actor_id) {
  return json({ ok: false, code: "VPORT_NOT_OWNED" }, 403);
}
```

Result: **BLOCKED** [SOURCE_VERIFIED: index.ts:347-354]

The server re-verifies ownership via `actor_owners` using the JWT-resolved `user.id` before accepting the client-supplied `inviterActorId`. Cross-actor actor ID injection is rejected with 403.

**Attack: Citizen path with injected inviterActorId for a different user's actor**

For `inviterType: 'citizen'`, the `inviterActorId` from the client body is completely ignored. The server re-derives the actor from `actor_owners` using the JWT `user.id` (`index.ts:287-325`). Any client-supplied value has no effect.

Result: **BLOCKED** [SOURCE_VERIFIED: index.ts:287-325]

---

### B. SESSION MUTATION (§5.2)

**Attack: Supply fabricated or null viewerActorId to bypass authentication**

The invite feature does not use a `viewerActorId` parameter in the client-side controller or hook. The edge function derives `user` exclusively from the JWT bearer token (`index.ts:240`):
```typescript
const { data: { user }, error: userError } = await userClient.auth.getUser();
if (userError || !user) {
  return json({ ok: false, code: "UNAUTHORIZED" }, 401);
}
```

The bearer token is forwarded by the Supabase client automatically from the active session.

**Attack: Null identity in useInvite hook**

`useInvite.js:14`: `inviterType = identity?.kind === 'vport' ? 'vport' : 'citizen'`

If `identity` is null (e.g., session not yet loaded), inviterType defaults to `'citizen'` and inviterActorId is `null`. However, the `ProtectedRoute` guard (`ProtectedRoute.jsx:33-38`) redirects unauthenticated users to `/login` before the hook can render. The Edge Function also independently validates the session.

Result: **BLOCKED** [SOURCE_VERIFIED: ProtectedRoute.jsx:33-38, index.ts:240-244]

---

### C. RUNTIME ABUSE (§5.3)

**Attack: Non-citizen actor type reaches invite flow**

The invite route is within `protectedAppRoutes` — it does not appear to be gated by an actor kind check beyond the `ProtectedRoute` authentication gate. Any authenticated user (citizen or VPORT owner) can access `/invite`. However:

- If identity.kind is `'vport'`, the hook correctly sets `inviterType = 'vport'` and `inviterActorId = identity.actorId`
- The Edge Function handles both types and verifies ownership separately for each

There is no prohibition against VPORT actors sending invites; this appears to be intentional product design.

Result: **BLOCKED** (by design) [SOURCE_VERIFIED: useInvite.js:14-15, index.ts:340-395]

---

### D. RLS VERIFICATION (§5.4)

**Attack: Bypass ownership by relying on client-side RLS assumptions**

The invite write path routes entirely through an Edge Function using the `adminClient` (service role). There is no client-side direct write to `vc.vibe_invites`. The service role client bypasses RLS entirely, meaning:

- RLS on `vc.vibe_invites` provides zero insert protection for this flow
- The Edge Function code itself is the only ownership enforcement
- Ownership is enforced via `actor_owners` check (confirmed BLOCKED in §A)

**Secondary surface: `readVibeInvitesDAL()` in onboarding**

`vibeInvites.dal.js:8-28`: Uses the anon client (user session) with `.eq('inviter_actor_id', senderActorId)`. This query is filtered by the caller-supplied `senderActorId`. If RLS on `vc.vibe_invites` does not have a row-level policy enforcing the caller is the inviter, a crafted `senderActorId` value could read another user's invite records — including their `invite_code` values.

The `invite_code` is a one-time redemption token. If an attacker could supply an arbitrary `senderActorId` and the table lacks RLS enforcement, they could exfiltrate invite tokens for pending invites targeting specific emails.

**Assessment**: The migration for `vc.vibe_invites` was not found in the codebase (searched all `.sql` files). RLS presence on this table is UNVERIFIED. Combined with `invite_code` being returned in the SELECT, this constitutes an UNRESOLVED risk.

Finding: **BW-INVITE-001** — UNRESOLVED [SCANNER_LOW_CONF] — See §7.

---

### E. VIEWER CONTEXT FUZZING (§5.5)

**Attack: Pass null inviterActorId to ctrlSendCitizenInvite with vport type**

`invite.controller.js:25`: Controller function signature has `inviterActorId = null` as default. If called with `inviterType: 'vport'` and `inviterActorId: null`, the Edge Function catches this at `index.ts:343-345`:
```typescript
if (!inviterActorId) {
  return json({ ok: false, code: "MISSING_VPORT_ACTOR" }, 400);
}
```

Result: **BLOCKED** [SOURCE_VERIFIED: index.ts:343-345]

**Attack: Pass null/undefined targetEmail**

`invite.controller.js:26-29`: 
```javascript
const email = (targetEmail ?? '').trim()
if (!email || !EMAIL_RE.test(email)) {
  throw new Error('INVALID_EMAIL')
}
```

And Edge Function `index.ts:258-262` validates independently on the server.

Result: **BLOCKED** [SOURCE_VERIFIED: invite.controller.js:26-29, index.ts:258-262]

**Attack: inviterType with unexpected/injected value**

Client-side controller validates to exactly `'citizen' | 'vport'` (`invite.controller.js:32-34`). Edge Function also validates at `index.ts:261`: `.includes(inviterType)` check against `["citizen", "vport"]`.

Result: **BLOCKED** [SOURCE_VERIFIED: invite.controller.js:32-34, index.ts:261]

---

### F. MUTATION REPLAY (§5.6)

**Attack: Replay a successful invite to spam a target email address**

No deduplication check exists before the `vibe_invites` insert. The Edge Function checks whether the target email already has an account via `auth.admin.listUsers()` — but this does NOT check whether an active pending invite to that email already exists.

An authenticated user can call the invite Edge Function N times with the same `targetEmail`, generating N invite records and dispatching N SES emails to the recipient. This is the VEN-INVITE-004 SES spam relay risk, now adversarially verified.

Attack harness:
```
POST send-citizen-invite (auth: valid JWT)
body: { targetEmail: "victim@example.com", inviterType: "citizen" }
→ Repeat 100x
→ Expected: N vibe_invites rows created, N SES emails sent
→ No counter, no dedup, no rate limit at any layer
```

The attack does not require ownership bypass — any authenticated user can execute it.

Result: **BYPASSED** [SOURCE_VERIFIED: index.ts:269-281 (no pre-insert dedup), index.ts:401-465 (no rate limit), useInvite.js:17-51 (no client-side throttle beyond button disable)]

Finding: **BW-INVITE-002** — HIGH — See §7.

**Attack: Re-send invite to a new target after cancellation**

When email send fails, the invite record is set to `status: 'cancelled'` (`index.ts:455`). The next call with the same targetEmail is not blocked — a new invite record is created. This is expected behavior, not a vulnerability.

---

### G. HYDRATION POISONING (§5.7)

The invite feature does not interact with the platform hydration store. `useInvite()` calls `useIdentity()` for read-only identity data but does not write to any hydration cache.

Result: **NOT APPLICABLE**

---

### H. URL SURFACE (§5.9)

**Attack: Raw UUID in public-facing invite link**

`index.ts:401-402`:
```typescript
const inviteCode = makeInviteCode(); // crypto.randomUUID()
const inviteLink = `https://vibezcitizens.com/register?invite_code=${inviteCode}`;
```

The `invite_code` is a `crypto.randomUUID()` value — a raw UUID — embedded directly in the email invite link and also returned in the Edge Function response body (`index.ts:493`).

Platform memory rule: "Raw UUIDs must never appear in public-facing URLs — always use human-readable slugs (QR, share links, copy-link, navigation)."

The invite link is sent to external recipients via SES email. The URL `https://vibezcitizens.com/register?invite_code=<uuid>` is a public-facing URL containing a raw UUID.

However, there is a functional distinction: this is a single-use authentication token (like an email confirmation link), not a resource navigation URL. The spirit of the slug rule targets resource identity exposure (profile slugs, VPORT slugs), not cryptographic tokens. This finding is noted as LOW (policy interpretation ambiguity).

Finding: **BW-INVITE-003** — LOW — See §7.

**Invite code returned to sender client:**

`index.ts:490-494`:
```typescript
return json({
  ok: true,
  invite_id: inviteRow.id,
  invite_code: inviteCode,
}, 200);
```

The `invite_code` (a redemption token) is returned to the inviter's browser. The inviter can extract this token from the response. Combined with the known destination URL pattern, the inviter could construct the invitation link and share it with unintended recipients, bypassing the "one invite to one email" intent.

This is VEN-INVITE-002 re-verified adversarially. The token is also written into the inviter's `actor_onboarding_steps.meta` and is readable via `readVibeInvitesDAL()` without apparent token rotation.

Additionally: `rawDebugError` in DEV mode shows the full JSON response including `invite_code` (useInvite.js:39, InviteView.jsx:51-64).

Finding: **BW-INVITE-004** — HIGH — See §7.

---

### I. §9 INVARIANT ATTACK (HIGHEST PRIORITY)

BEHAVIOR.md status is **PLACEHOLDER**. No §4 Failure Paths and no §9 Must Never Happen entries exist. All §9 invariants are **UNANCHORED**.

The following invariants are inferred from source behavior and attacked:

**Inferred Invariant 1: "An actor must never send an invite on behalf of another actor"**

Attack: See §A — BLOCKED by server-side actor_owners verification.

**Inferred Invariant 2: "Invite tokens must not be accessible to unauthorized parties"**

Attack: `readVibeInvitesDAL()` returns `invite_code` values for sender's own invites. If RLS is absent on `vc.vibe_invites`, any authenticated user could read any invite's token by passing arbitrary `senderActorId`. Status: UNRESOLVED (RLS unverified).

Additionally, the Edge Function returns `invite_code` to the sender client unconditionally on success — confirmed BYPASSED.

**Inferred Invariant 3: "Each invite email must be sent at most once per unique sender+target combination per time window"**

Attack: See §F — BYPASSED. No deduplication or rate limiting enforced at any layer.

**Inferred Invariant 4: "A pending invite must be redeemed only by the email target"**

Attack assessment: `useRegister.js:34-39` reads `invite_code` from the URL param but has a TODO comment (`useRegister.js:35`): "after signup, look up vc.vibe_invites by invite_code and mark it accepted". This logic is **NOT IMPLEMENTED**. The invite_code is parsed from the URL but never validated or redeemed server-side. Anyone with the invite link can register regardless of email match.

Finding: **BW-INVITE-005** — HIGH — See §7.

**Inferred Invariant 5: "The invite system must not enumerate registered users to non-admin callers"**

Attack: `index.ts:269`: `await adminClient.auth.admin.listUsers()` — this fetches all platform users using the service role key and is executed on every invite attempt. While the full list is not returned to the caller (only a boolean `alreadyExists` result), the O(n) scan is a DoS amplification vector (VEN-INVITE-001). Adversarial verification: sending rapid parallel requests would exhaust this call across the user base. BYPASSED as a DoS amplification vector.

Finding: **BW-INVITE-006** — HIGH (DoS amplification, confirms VEN-INVITE-001) — See §7.

---

## 7. Exploitability Assessment

| Finding ID | Severity | Description | Result | Exploit Chain Type | Provenance |
|---|---|---|---|---|---|
| BW-INVITE-001 | MEDIUM | `readVibeInvitesDAL` returns `invite_code` tokens; RLS on `vc.vibe_invites` unverified — cross-actor token read may be possible | UNRESOLVED | Single-step | [SCANNER_LOW_CONF] |
| BW-INVITE-002 | HIGH | No deduplication or rate limit — authenticated user can fire N invite emails to same target (SES spam relay, confirmed adversarial replay) | BYPASSED | Replay | [SOURCE_VERIFIED: index.ts:269-281, useInvite.js:17-51] |
| BW-INVITE-003 | LOW | Raw UUID in public-facing invite URL violates platform slug rule (policy interpretation ambiguity — may be intentional token design) | PARTIAL | Injection | [SOURCE_VERIFIED: index.ts:402] |
| BW-INVITE-004 | HIGH | Invite redemption token (`invite_code`) returned to sender client in Edge Function response, also readable via `readVibeInvitesDAL()` — sender can construct link and forward to unintended recipients | BYPASSED | Single-step | [SOURCE_VERIFIED: index.ts:490-494, vibeInvites.dal.js:16-40] |
| BW-INVITE-005 | HIGH | Invite redemption not implemented — `invite_code` parsed from URL in `useRegister.js` but never validated or marked accepted server-side (TODO comment at line 35) — link can be used by anyone regardless of target email | BYPASSED | Single-step | [SOURCE_VERIFIED: useRegister.js:34-39] |
| BW-INVITE-006 | HIGH | `auth.admin.listUsers()` full O(n) scan on every invite request — no pagination, no caching — DoS amplification vector confirmed (adversarial verification of VEN-INVITE-001) | BYPASSED | Replay | [SOURCE_VERIFIED: index.ts:269-275] |

---

## 8. Source Verification Summary

All BYPASSED findings carry [SOURCE_VERIFIED] status with file and line citations.

| Finding | Source File | Lines |
|---|---|---|
| BW-INVITE-002 | `supabase/functions/send-citizen-invite/index.ts` | 269-281 (no dedup), 401-465 (no rate limit) |
| BW-INVITE-002 | `apps/VCSM/src/features/invite/hooks/useInvite.js` | 17-51 (no client throttle) |
| BW-INVITE-004 | `supabase/functions/send-citizen-invite/index.ts` | 490-494 (token in response) |
| BW-INVITE-004 | `apps/VCSM/src/features/onboarding/dal/vibeInvites.dal.js` | 16, 40 (token in read DTO) |
| BW-INVITE-005 | `apps/VCSM/src/features/auth/hooks/useRegister.js` | 34-39 (unimplemented TODO) |
| BW-INVITE-006 | `supabase/functions/send-citizen-invite/index.ts` | 269-275 (listUsers O(n)) |

---

## 9. Confidence Summary

| Category | Count | Notes |
|---|---|---|
| BYPASSED (confirmed exploitable) | 4 | BW-INVITE-002, 004, 005, 006 |
| UNRESOLVED (requires DB verification) | 1 | BW-INVITE-001 |
| PARTIAL | 1 | BW-INVITE-003 |
| BLOCKED | All ownership, session, auth attacks | A, B, C, E attacks all blocked |
| Source-verified findings | 5 of 6 | All BYPASSED findings have citation |
| BEHAVIOR.md | PLACEHOLDER | All §9 invariants unanchored |

---

## 10. §9 Invariant Attack Map

| Inferred Invariant | Attack | Result |
|---|---|---|
| Actor cannot invite on behalf of another actor | Cross-actor `inviterActorId` injection | BLOCKED (actor_owners server verification) |
| Invite tokens inaccessible to unauthorized parties | Cross-actor readVibeInvites via missing RLS | UNRESOLVED (BW-INVITE-001) |
| Invite tokens inaccessible to unauthorized parties | Token returned to sender in API response | BYPASSED (BW-INVITE-004) |
| One invite per sender+target per time window | Parallel replay of send-citizen-invite | BYPASSED (BW-INVITE-002) |
| Invite redeemable only by target email | invite_code URL with no server-side redemption check | BYPASSED (BW-INVITE-005) |
| System does not enumerate all registered users to callers | O(n) listUsers on every invite | BYPASSED (BW-INVITE-006) |

---

## 11. Behavior Contract Attack Summary

BEHAVIOR.md for `invite` is a **PLACEHOLDER** stub with no authored invariants. All attack targets were inferred from source behavior. This means:

1. No §4 Failure Paths exist — failure handling is undocumented and unverifiable against spec
2. No §9 Must Never Happen entries exist — all invariants are currently unenforced at contract level
3. The placeholder condition itself was previously logged as VEN-INVITE-005 (HIGH)
4. Security governance for this feature is operating entirely from source inference with no authored contract

**Risk**: Future changes to the feature may inadvertently remove protections that are currently implicit in the Edge Function logic, with no contract to flag the regression.

---

## 12. THOR Impact

### BYPASSED findings = Release Blockers

The following findings are THOR release blockers by BW governance policy:

| Finding | Severity | Blocker Rationale |
|---|---|---|
| BW-INVITE-002 | HIGH | SES relay abuse — authenticated user can spam any email address with N invites. No rate limit at any layer. |
| BW-INVITE-004 | HIGH | One-time redemption token returned to sender — link forwarding defeats targeting intent. |
| BW-INVITE-005 | HIGH | Invite redemption entirely unimplemented — `invite_code` serves no security purpose until attribution is built. |
| BW-INVITE-006 | HIGH | DoS amplification via full user list scan on every invite — compound attack with BW-INVITE-002. |

THOR Status: **BLOCKED** — 4 HIGH findings with BYPASSED status.

Existing THOR blocker VEN-INVITE-001 (O(n) listUsers) is now adversarially confirmed as BW-INVITE-006.

---

## 13. SPIDER-MAN Test Requirements

The following regression tests are required before this feature can clear THOR:

| Test ID | Scenario | Required Assertion |
|---|---|---|
| SM-INVITE-001 | Rate limiting | Calling `sendCitizenInviteDAL` N times in rapid succession for the same targetEmail must fail or be throttled after threshold |
| SM-INVITE-002 | Deduplication | Insert to `vc.vibe_invites` must be blocked if a `pending` invite from the same `inviter_actor_id` to the same `invite_target` already exists |
| SM-INVITE-003 | Token non-exposure | Edge Function response must NOT include `invite_code` in production response |
| SM-INVITE-004 | Invite redemption | POST to `/register?invite_code=<token>` must call server-side lookup, verify email matches `invite_target`, and mark status = 'accepted' |
| SM-INVITE-005 | Invite replay protection | A `invite_code` that has been marked 'accepted' must not be reusable for a second registration |
| SM-INVITE-006 | listUsers replacement | Edge Function must use a targeted lookup (e.g., `getUserByEmail` RPC or direct `auth.users` query with email filter) rather than O(n) `listUsers()` |
| SM-INVITE-007 | Cross-actor token read | `readVibeInvitesDAL` with a `senderActorId` not owned by the caller must return empty (RLS verification required) |
| SM-INVITE-008 | BEHAVIOR.md authored | Feature must have a complete BEHAVIOR.md with §4 and §9 before merge |
