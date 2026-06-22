# VENOM V2 — Traffic:answers Full Security Review
**Branch:** vport-booking-feed-security-updates
**Date:** 2026-06-07
**Run type:** First full VENOM pass on this feature (new DALs introduced on this branch)

---

## Source Files Verified

| File | Lines | Layer |
|---|---|---|
| apps/Traffic/src/app/api/answers/questions/route.js | 1-22 | route |
| apps/Traffic/src/app/api/answers/moderation/answers/route.js | 1-32 | route |
| apps/Traffic/src/app/api/answers/moderation/questions/route.js | 1-31 | route |
| apps/Traffic/src/features/answers/dal/questions.write.dal.js | 1-45 | dal |
| apps/Traffic/src/features/answers/dal/moderationAnswers.dal.js | 1-80 | dal |
| apps/Traffic/src/features/answers/dal/moderationQuestions.dal.js | 1-53 | dal |
| apps/Traffic/src/features/answers/controllers/submitQuestion.controller.js | 1-46 | controller |
| apps/Traffic/src/features/answers/controllers/moderateAnswers.controller.js | 1-109 | controller |
| apps/Traffic/src/features/answers/models/questionSubmission.model.js | 1-51 | model |
| apps/Traffic/src/features/answers/models/moderationAuth.model.js | 1-24 | model |
| apps/Traffic/src/features/answers/adapters/answers.adapter.js | 1-21 | adapter |

---

## Feature Flag Architecture [SOURCE_VERIFIED] ✅

All write operations gate on `process.env.TRAZE_ANSWERS_SCHEMA_READY === "true"`. Both public client (`getAnswersClient()`) and admin client (`getAnswersAdminClient()`) return `null` if flag is false, causing operations to return a feature-disabled error. This flag is the primary on/off switch — all security risk is conditional on this flag being `true`.

---

## VEN-TRAFFIC-001 — OPEN (Carry-Forward from Earlier This Session)

**Severity:** HIGH
**Finding:** POST `/api/answers/questions` — no rate limiting, no CAPTCHA, no auth when TRAZE_ANSWERS_SCHEMA_READY=true
**Evidence:** route.js lines 1-22: raw `body` passed to `submitQuestion(body)`; no rate limit middleware; no auth check
**Controller validation:** `buildQuestionSubmission()` validates title presence and slug normalization — prevents empty spam but not volume spam
**Questions quarantined:** Inserted as `status: "draft"`, `is_published: false`, `moderation_status: "pending"` ✅ — public users don't see unmoderated questions
**Residual risk:** DB resource exhaustion; moderation queue pollution
**DB Audit Note:** `answers.questions` INSERT policy must limit what the anon key can write before flag activation

---

## VEN-TRAFFIC-002 — OPEN (Carry-Forward from Earlier This Session)

**Severity:** MEDIUM
**Finding:** Moderation API uses static pre-shared bearer token (`TRAZE_ANSWERS_MODERATION_TOKEN`)
**Evidence:** moderationAuth.model.js lines 1-24: `Authorization: Bearer <token>` compared against env var; no JWT; no user identity; no token expiry; no audit trail per caller
**Effect:** All moderation operations share one identity. Any token holder has full moderation access (list queue, approve, reject, create answers). Token rotation requires env var update and redeploy.
**Acceptable trade-off for initial implementation?** Yes — this is an internal admin tool, not a user-facing auth surface. But must be documented as a known limitation.

---

## VEN-TRAFFIC-003 — OPEN [SCANNER_LEAD]

**Severity:** MEDIUM
**Finding:** `submit_business_card_lead` RPC in Traffic conversion DAL has no env gate — auth model of RPC unverified
**Status:** SCANNER_LEAD — source file not read in this pass; RPC signature and SECURITY DEFINER status unverified

---

## VEN-TRAFFIC-004 — OPEN (NEW — SOURCE_VERIFIED)

**Severity:** MEDIUM
**Finding:** No terminal-state guard on moderation actions — already-moderated items can be re-moderated
**Evidence:**

`moderateAnswers.controller.js` lines 77-109 (moderateAnswer):
```js
const values = valuesByAction[action];  // builds update payload from safe dict
if (!id || !values) return { ok: false, error: '...' };
const { data, error } = await updateAnswerModerationRow({ id, values });
```

`moderationAnswers.dal.js` lines 66-79:
```js
.update(values)
.eq("id", id)  // updates by id only — no prior-state check
```

A published (`moderation_status: "approved"`, `is_published: true`) answer can be re-rejected. A rejected answer can be re-published. `moderated_at` and `published_at` timestamps are overwritten on each call.

**Blast radius:** All content in answers.questions and answers.answers
**Why not CRITICAL/HIGH:** Requires valid bearer token. The action allowlist prevents SQL injection. This is content integrity, not an authorization bypass.
**Recommended fix:** Add `.eq('moderation_status', 'pending')` guard on the DAL UPDATE call, OR check current state in the controller before writing. Alternative: treat `published` as terminal — add explicit `unpublish` action.

---

## VEN-TRAFFIC-005 — OPEN (NEW — SOURCE_VERIFIED)

**Severity:** LOW
**Finding:** `cleanText()` strips only `<>` — not a complete HTML sanitization strategy
**Evidence:** questionSubmission.model.js lines 7-12:
```js
function cleanText(value, maxLength) {
  return String(value ?? "")
    .replace(/[<>]/g, "")  // only strips < and > — not full sanitization
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
```

Fields affected: title, body, serviceKey, city, region, country.
Passes through: `&lt;script&gt;`, `javascript:alert(1)`, CSS `expression()`, HTML entities.
Stored in answers.questions and exposed to SEO page renders.

**Risk conditional on:** (1) React JSX auto-escaping (typically present), (2) JSON-LD serialization (typically escapes), (3) any `dangerouslySetInnerHTML` usage in Traffic
**Recommended fix:** Use full HTML sanitization (DOMPurify server-side or `xss` npm package). At minimum, encode `&`, `"`, `'`, in addition to `<` and `>`.
**Note:** Not upgrading to MEDIUM — quarantine + moderation + React JSX escaping provide adequate defense-in-depth for typical rendering. Follow-up: HAWKEYE should verify all question field render sites.

---

## What Was Verified Safe

| Item | Verification |
|---|---|
| Moderation `action` parameter | SAFE — `valuesByAction[action]` lookup returns `undefined` for unknown actions; controller returns error before DB call |
| Question `status` on INSERT | SAFE — hardcoded `status: "draft"` in DAL; caller cannot inject a different status |
| Question `is_published` on INSERT | SAFE — hardcoded `false` in DAL |
| `moderation_note` in moderateAnswer | SAFE — `cleanNote()` strips `<>`, limits to 500 chars |
| `slugBase` generation | SAFE — `normalizeSlug(title)` applied; suffix is `crypto.randomUUID().slice(0,8)` |
| Admin client for moderation | APPROPRIATE — intentional bypass of RLS for operator-level mutations |
| Public client for question submission | APPROPRIATE — anon INSERT gated by `ANSWERS_SCHEMA_READY` flag; RLS is the DB-layer control |

---

## DB Audit Notes

| DB Object | Risk | Suggested Review |
|---|---|---|
| answers.questions INSERT RLS (anon key) | When flag=true, any HTTP client can INSERT — RLS must restrict to expected column values | Verify policy; consider restricting `status`, `is_published`, `is_moderated` to defaults |
| answers.questions UPDATE RLS | moderationQuestions.dal.js uses admin client (bypasses RLS) — correct, but confirm no accidental public client path exists | Verify no public client exposes UPDATE surface |

---

## THOR Gate Assessment

Traffic:answers does not directly block VCSM THOR. VEN-TRAFFIC-001 blocks `TRAZE_ANSWERS_SCHEMA_READY` flag activation — flag must not be set to `true` in production until rate limiting is added. VEN-TRAFFIC-004 and VEN-TRAFFIC-005 are pre-launch concerns for the answers feature specifically.
