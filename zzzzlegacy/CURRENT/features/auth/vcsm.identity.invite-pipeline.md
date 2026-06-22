# VCSM Citizen Invite Pipeline

> **Version:** 2
> **Updated:** 2026-04-25
> **Scope:** Authenticated invite flow — citizen or VPORT sends a branded SES email to an email address not yet registered on the platform

---

## 1. Purpose

Allow any authenticated citizen or VPORT owner to invite a non-member to Vibez Citizens by email. The invitee receives a dark-themed branded email from `teams@vibezcitizens.com` containing a registration link with a unique `invite_code`. The invite is recorded in `vc.vibe_invites` before any email attempt. Email is sent via AWS SES (not Supabase Auth). Inviter name is resolved server-side.

---

## 2. Scope

**In scope:**
- `/invite` route (authenticated, protected)
- Edge Function `send-citizen-invite` — JWT verification, inviter name resolution, guards, `vc.vibe_invites` insert, SES send, `actor_onboarding_steps` upsert
- DAL → Controller → Hook → Screen stack in `src/features/invite/`
- `vc.vibe_invites` — source of truth for all sent invites
- `vc.actor_onboarding_steps` — invite step completion written server-side by Edge Function

**Out of scope:**
- Invite acceptance flow (invitee registers with `?invite_code=`) — not yet implemented
- VPORT-specific invite links (VPORT identified by `inviterActorId` only)
- Referral program / reward logic

---

## 3. Architecture

```
/invite (protected)
  └── InviteScreen.jsx
        └── InviteView.jsx
              └── useInvite.js
                    └── ctrlSendCitizenInvite()
                          └── sendCitizenInviteDAL()
                                └── supabase.functions.invoke('send-citizen-invite', { body })

Edge Function: send-citizen-invite/index.ts
  1. Verify Bearer JWT → identify caller (user.id, user.email)
  2. Parse body: { targetEmail, inviterType, inviterActorId }
  3. Self-invite guard
  4. Already-registered guard (adminClient.auth.admin.listUsers)
  5. Resolve inviterName server-side (same as v1)
  6. INSERT vc.vibe_invites (status='pending', invite_code=crypto.randomUUID(), expires_at=+30d)
  7. Build invite link: https://vibezcitizens.com/register?invite_code=${inviteCode}
  8. SES SendEmailCommand (branded dark-theme HTML email via teams@vibezcitizens.com)
     ├─ SUCCESS → upsert actor_onboarding_steps (step_key='invite', status='completed')
     │            return { ok: true, invite_id, invite_code }
     └─ FAILURE → UPDATE vc.vibe_invites SET status='cancelled',
                          metadata.cancelled_reason='EMAIL_SEND_FAILED'
                  return { ok: false, code: 'EMAIL_SEND_FAILED' }
```

---

## 4. Edge Function

**Function name:** `send-citizen-invite`
**File:** `supabase/functions/send-citizen-invite/index.ts`
**Runtime:** Deno, TypeScript

### Import map (`deno.json`)

```json
{
  "imports": {
    "@aws-sdk/client-sesv2": "npm:@aws-sdk/client-sesv2@3"
  }
}
```

### Clients

| Client | Key | Purpose |
|---|---|---|
| `userClient` | `SUPABASE_ANON_KEY` + caller JWT | Identity verification, ownership checks (RLS enforced) |
| `adminClient` | `SUPABASE_SERVICE_ROLE_KEY` | `listUsers`, VPORT name lookup, `vibe_invites` write, `actor_onboarding_steps` upsert |
| `sesClient` | `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` + `AWS_REGION` | `SendEmailCommand` via `SESv2Client` |

### Required environment variables

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `AWS_ACCESS_KEY_ID` | AWS IAM key with SES send permissions |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret |
| `AWS_REGION` | e.g. `us-east-1` |
| `SES_FROM_EMAIL` | `teams@vibezcitizens.com` |

### Request body

| Field | Type | Required |
|---|---|---|
| `targetEmail` | `string` | Yes |
| `inviterType` | `'citizen' \| 'vport'` | Yes |
| `inviterActorId` | `string \| null` | Yes when `inviterType='vport'` |

### Response codes

| Condition | Response |
|---|---|
| Success | `{ ok: true, invite_id: string, invite_code: string }` HTTP 200 |
| Self-invite | `{ ok: false, code: 'SELF_INVITE' }` HTTP 200 |
| Email already registered | `{ ok: false, code: 'USER_ALREADY_REGISTERED' }` HTTP 200 |
| SES send failure | `{ ok: false, code: 'EMAIL_SEND_FAILED' }` HTTP 200 |
| Bad input | `{ ok: false, code: 'INVALID_INPUT' }` HTTP 400 |
| Missing/invalid JWT | `{ error: 'Unauthorized' }` HTTP 401 |

> **Breaking change from v1:** Success response now includes `invite_id` and `invite_code`. The old `{ ok: true }` shape is gone. `INVITE_FAILED` code is replaced by `EMAIL_SEND_FAILED`.

### Inviter name resolution (unchanged from v1)

- **Citizen:** `SELECT display_name FROM public.profiles WHERE user_id = <caller_uid>` via `userClient`
- **VPORT:** Ownership verified via `vc.actor_owners WHERE user_id = <caller_uid> AND actor_id = <inviterActorId>`. If verified: `vc.actors.vport_id` → `vport.profiles.business_name` via `adminClient`. Falls back to `"Someone"` if check fails.

### `vc.vibe_invites` write

INSERT before email send:

| Column | Value |
|---|---|
| `inviter_actor_id` | resolved actor ID of caller |
| `invite_channel` | `'email'` |
| `invite_target` | `targetEmail` |
| `invite_code` | `crypto.randomUUID()` |
| `status` | `'pending'` |
| `expires_at` | `now() + 30 days` |

On SES failure: `UPDATE vc.vibe_invites SET status='cancelled', metadata=jsonb_set(metadata, '{cancelled_reason}', '"EMAIL_SEND_FAILED"') WHERE id=<invite_id>`

### `vc.actor_onboarding_steps` write (on SES success)

UPSERT on `(actor_id, step_key)` conflict:

| Column | Value |
|---|---|
| `actor_id` | inviter's actor ID |
| `step_key` | `'invite'` |
| `status` | `'completed'` |
| `progress` | `1` |
| `completed_at` | `now()` |
| `meta` | `{ invite_id, invite_code, invite_channel, invite_target }` |

### Email content

Dark-themed branded HTML. Key attributes:
- From: `teams@vibezcitizens.com` (must be SES-verified domain)
- Subject: `You've been invited to Vibez Citizens`
- Inviter name and link are escaped via `escapeHtml()` before insertion into HTML body
- Registration link: `https://vibezcitizens.com/register?invite_code=${inviteCode}`
- No Supabase Auth involvement — this is a plain transactional email

---

## 5. Hook — `useInvite`

File: `src/features/invite/hooks/useInvite.js`

**State:**

| State | Type | Purpose |
|---|---|---|
| `email` | `string` | Controlled input value |
| `sending` | `boolean` | RPC in flight |
| `success` | `boolean` | Invite sent successfully |
| `error` | `string \| null` | Human-readable error message |

**Identity resolution (from `useIdentity()`):**

| `identity.kind` | `inviterType` | `inviterActorId` |
|---|---|---|
| `'user'` | `'citizen'` | `null` |
| `'vport'` | `'vport'` | `identity.actorId` |

**Error code → message mapping:**

| Code | Message |
|---|---|
| `USER_ALREADY_REGISTERED` | "This email already has an account." |
| `SELF_INVITE` | "You can't invite yourself." |
| `EMAIL_SEND_FAILED` | "Invite saved but the email could not be sent. Try again." |
| `INVITE_FAILED` | "Invite could not be sent. Try again." *(legacy fallback)* |
| `INVALID_EMAIL` | "Enter a valid email address." |

**Important:** `actor_onboarding_steps` is written server-side by the Edge Function on success. The hook does NOT call `ctrlMarkInviteStepCompleted`. The onboarding state refreshes naturally on next `ctrlGetOnboardingCards` call.

---

## 6. UI

File: `src/features/invite/screens/InviteView.jsx`

- Dark/purple card on `authTheme.pageBackground`
- **Sender badge** — shows `identity.displayName` + "(VPORT)" suffix when inviting as a VPORT
- **Success state** — replaces form with checkmark, email echoed back, "Invite someone else" resets
- **Error state** — red border on input + error text below
- Send button disabled while `sending` or when `email` is empty
- Enter key triggers send

---

## 7. Route

| Route | Screen | Guard |
|---|---|---|
| `/invite` | `InviteScreen` | `ProtectedRoute` → `ProfileGatedOutlet` → `RootLayout` |

---

## 8. Invite Card (Onboarding)

The invite onboarding card is controlled by:

```js
// apps/VCSM/src/features/onboarding/controller/onboardingController.js
const SHOW_INVITE_ONBOARDING_CARD = false  // ← re-enable when SES confirmed working
```

When `true`: the card appears in `OnboardingCardsView` on `/explore` with `ctaPath: '/invite'`.

The card completes when `actor_onboarding_steps` has `step_key='invite', status='completed'` — written by the Edge Function on successful SES send.

---

## 9. Invite Acceptance Gap (Not Yet Implemented)

`useRegister.js` captures `invite_code` from the registration URL:

```js
const inviteCode = useMemo(() => {
  const params = new URLSearchParams(location.search)
  return params.get('invite_code') || null
}, [location.search])
```

But `register.controller.js` does not:
- Look up `vc.vibe_invites WHERE invite_code = ?`
- Validate expiry or status
- Set `status='accepted'`, `accepted_actor_id`, `accepted_at`
- Credit the inviter with any additional step completion

**This is a known gap.** The invite lifecycle ends at `pending` or `cancelled`. The `accepted` state is unreachable until the acceptance flow is built.

---

## 10. Files Map

| File | Role |
|---|---|
| `apps/VCSM/supabase/functions/send-citizen-invite/index.ts` | Edge Function — vibe_invites insert, SES email, onboarding step upsert |
| `apps/VCSM/supabase/functions/send-citizen-invite/deno.json` | Deno import map — `@aws-sdk/client-sesv2` |
| `apps/VCSM/src/features/invite/dal/invite.dal.js` | `sendCitizenInviteDAL` — calls edge function |
| `apps/VCSM/src/features/invite/controller/invite.controller.js` | `ctrlSendCitizenInvite` — validates + delegates |
| `apps/VCSM/src/features/invite/hooks/useInvite.js` | `useInvite` — form state, identity resolution, error mapping |
| `apps/VCSM/src/features/invite/screens/InviteScreen.jsx` | Route screen + document.title |
| `apps/VCSM/src/features/invite/screens/InviteView.jsx` | Card UI with sender badge + success/error states |
| `apps/VCSM/src/app/routes/index.jsx` | `InviteScreen` lazy import + passed to `protectedAppRoutes` |
| `apps/VCSM/src/app/routes/protected/app.routes.jsx` | `InviteScreen` param + `/invite` route entry |
| `apps/VCSM/src/features/auth/hooks/useRegister.js` | Captures `invite_code` from URL (acceptance not yet wired) |

---

## 11. Invariants

1. `vc.vibe_invites` is inserted before any email attempt — the invite row exists regardless of SES outcome.
2. Inviter name is resolved entirely server-side — client `inviterName` field is never trusted.
3. The Edge Function returns HTTP 200 for all business logic outcomes (`ok: false`). Only protocol errors (401, 405, 400) use non-200 status.
4. `inviterActorId` is verified against `actor_owners` before any VPORT name lookup.
5. `SUPABASE_SERVICE_ROLE_KEY` and AWS credentials never leave the edge function runtime.
6. HTML email content is escaped via `escapeHtml()` before string interpolation — XSS-safe.
7. `actor_onboarding_steps` for the invite step is written exclusively by the Edge Function — the client never writes this directly.

---

## 12. Deployment

```sh
supabase functions deploy send-citizen-invite --project-ref nkdrjlmbtqbywhcthppm
```

Required Supabase project secrets (set via dashboard → Project Settings → Edge Functions):
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `SES_FROM_EMAIL` — must be a SES-verified identity (`teams@vibezcitizens.com`)

---

## 13. Change Log

### 2026-04-25 — v1

**Task:** Citizen/VPORT invitation pipeline (initial build)

**Files Changed:**
- `supabase/functions/send-citizen-invite/index.ts` (NEW)
- `supabase/functions/send-citizen-invite/deno.json` (NEW)
- `src/features/invite/dal/invite.dal.js` (NEW)
- `src/features/invite/controller/invite.controller.js` (NEW)
- `src/features/invite/hooks/useInvite.js` (NEW)
- `src/features/invite/screens/InviteScreen.jsx` (NEW)
- `src/features/invite/screens/InviteView.jsx` (NEW)
- `src/app/routes/index.jsx` (MODIFIED)
- `src/app/routes/protected/app.routes.jsx` (MODIFIED)

---

### 2026-04-25 — v2

**Task:** Refactor send-citizen-invite to use AWS SES; remove Supabase Auth inviteUserByEmail; add vibe_invites as required source of truth; server-side onboarding step write

**Summary of changes:**
- Removed `auth.admin.inviteUserByEmail` entirely
- Added `SESv2Client` + `SendEmailCommand` via `@aws-sdk/client-sesv2`
- Added `escapeHtml()` sanitizer for HTML email content
- Added INSERT to `vc.vibe_invites` before email attempt (insert-first pattern)
- Added UPSERT to `actor_onboarding_steps` on SES success (server-side authoritative write)
- On SES failure: cancel invite row, return `{ ok: false, code: 'EMAIL_SEND_FAILED' }`
- Success response now: `{ ok: true, invite_id, invite_code }`
- Removed `_debug` field from all responses
- `useInvite.js`: removed `ctrlMarkInviteStepCompleted` call; added `EMAIL_SEND_FAILED` error mapping
- `useRegister.js`: captures `invite_code` from URL (acceptance flow not yet implemented)
- `deno.json`: added import map for `@aws-sdk/client-sesv2`

**Files Changed:**
- `supabase/functions/send-citizen-invite/index.ts` (REWRITTEN)
- `supabase/functions/send-citizen-invite/deno.json` (MODIFIED)
- `src/features/invite/hooks/useInvite.js` (MODIFIED)
- `src/features/auth/hooks/useRegister.js` (MODIFIED)

**Drift from v1 doc:**
- Section 3 Architecture: entirely new flow
- Section 4 Edge Function: new clients, new env vars, new response codes, new DB writes
- Section 5 Hook: removed onboarding step call, new error code
- Section 9: new — documents invite acceptance gap
- Section 10 Files Map: added `useRegister.js`
- Section 11 Invariants: added #1, #6, #7

Generated by: Claude
