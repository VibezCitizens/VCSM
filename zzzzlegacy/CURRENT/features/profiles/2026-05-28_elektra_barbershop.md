# ELEKTRA — Barbershop Module Precision Scan
**Date:** 2026-05-28  
**Agent:** ELEKTRA  
**Scope:** apps/VCSM — barbershop VPORT module  
**Files scanned:**
- `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js`
- `apps/VCSM/src/features/profiles/kinds/vport/dal/barbershop/vportBarbershopPost.read.dal.js`
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopHoursPost.js`
- `apps/VCSM/src/features/profiles/kinds/vport/hooks/barbershop/usePublishBarbershopPortfolioPost.js`

---

## Summary

| ID | Title | Severity | Status |
|---|---|---|---|
| ELEK-2026-05-28-029 | `publishBarbershopHoursUpdateAsPostController` does not sanitize `blocks` payload — raw client data written to post payload | MEDIUM | Open |
| ELEK-2026-05-28-030 | `publishBarbershopPortfolioUpdateAsPostController` writes unsanitized `portfolioTitle` string to post payload | LOW | Open |

---

## SECURITY FINDING

**Finding ID:** ELEK-2026-05-28-029  
**Title:** `publishBarbershopHoursUpdateAsPostController` passes raw `blocks` array directly to post payload without sanitization  
**Category:** Insufficient Input Validation — Unsanitized payload written to feed store  
**Severity:** MEDIUM  
**Status:** Open  
**Scope:** VCSM  
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopHoursUpdateAsPost.controller.js:46-74`

**Source:** `blocks` parameter received from hook → controller (caller-supplied array)

**Sink:**
```js
payload: { blocks: blocks ?? [] }
```
Written via `createSystemPost` to the posts feed store (vc.posts table payload column).

**Trust Boundary:** The `blocks` array is passed from the hook layer (`usePublishBarbershopHoursPost`) which receives it from the component UI. There is no sanitization, validation, or allowlisting of the `blocks` array elements before they are stored in the post payload. The locksmith equivalent (`publishLocksmithHoursUpdateAsPostController`) includes a dedicated `sanitizeBlocks()` function that validates weekday range (0-6), startMinutes (0-1439), endMinutes (1-1440), and `end > start`. The barbershop controller has no equivalent.

**Impact:** Malformed or malicious `blocks` data (e.g., `weekday: 999`, `startMinutes: -1`, non-numeric values, extra properties) is stored verbatim in the post payload. Consumers of the feed post (e.g., public TRAZE/Traffic discovery pages, notification renderers, or any system that reads `payload.blocks`) receive unvalidated data. Stored XSS is possible if any consumer renders `blocks` properties without escaping. Numeric overflow or NaN in time calculations downstream is also possible.

**Evidence:**
```js
// publishBarbershopHoursUpdateAsPost.controller.js:62-70
const text = buildHoursText(barbershopName, blocks);  // uses blocks.weekday, startMinutes unsafely

const created = await createSystemPost({
  actorId,
  text,
  post_type: "barbershop_hours_update",
  realm_id: realmId,
  media_url: null,
  payload: { blocks: blocks ?? [] },   // <-- raw blocks stored
});
```

Compare with locksmith controller which sanitizes:
```js
// publishLocksmithHoursUpdateAsPost.controller.js:12-31
function sanitizeBlocks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b) => {
      const wd    = Number(b.weekday);
      const start = Number(b.startMinutes);
      const end   = Number(b.endMinutes);
      return (
        Number.isInteger(wd)    && wd >= 0    && wd <= 6   &&
        Number.isInteger(start) && start >= 0 && start < 1440 &&
        Number.isInteger(end)   && end > 0    && end <= 1440 &&
        end > start
      );
    })
    .map((b) => ({
      weekday:      Number(b.weekday),
      startMinutes: Number(b.startMinutes),
      endMinutes:   Number(b.endMinutes),
    }));
}
// sanitizedBlocks used in both text and payload
```

**Reproduction:**
1. Authenticated barbershop owner calls the hours-update publish flow.
2. `blocks` array contains `[{ weekday: 999, startMinutes: -1, endMinutes: 9999, injectedProp: '<script>alert(1)</script>' }]`.
3. `publishBarbershopHoursUpdateAsPostController` passes the raw array to `createSystemPost`.
4. The post is written to `vc.posts` with the malformed payload verbatim.
5. Any system rendering `payload.blocks` consumes unvalidated data.

**Existing Defense:** `assertActorOwnsVportActorController` confirms the caller owns the barbershop VPORT before the write — authorization is correct. The issue is input sanitization, not authorization.

**Why Insufficient:** Authorization does not substitute for input sanitization. A legitimate barbershop owner who has been compromised or who is acting maliciously can still store invalid data. The locksmith module demonstrates the required sanitization pattern; barbershop lacks it.

**Recommended Fix:** Port the locksmith `sanitizeBlocks` function to the barbershop controller and apply it before the write:
```js
function sanitizeBlocks(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((b) => {
      const wd    = Number(b.weekday);
      const start = Number(b.startMinutes);
      const end   = Number(b.endMinutes);
      return (
        Number.isInteger(wd)    && wd >= 0    && wd <= 6   &&
        Number.isInteger(start) && start >= 0 && start < 1440 &&
        Number.isInteger(end)   && end > 0    && end <= 1440 &&
        end > start
      );
    })
    .map((b) => ({
      weekday:      Number(b.weekday),
      startMinutes: Number(b.startMinutes),
      endMinutes:   Number(b.endMinutes),
    }));
}

// In publishBarbershopHoursUpdateAsPostController:
const sanitizedBlocks = sanitizeBlocks(blocks);
const text = buildHoursText(barbershopName, sanitizedBlocks);
// ...
payload: { blocks: sanitizedBlocks },
```

**Follow-up Command:** SPIDER-MAN regression test for blocks sanitization boundary. Grep for other publish-as-post controllers that accept `blocks` arrays without sanitization.

---

## SECURITY FINDING

**Finding ID:** ELEK-2026-05-28-030  
**Title:** `publishBarbershopPortfolioUpdateAsPostController` writes unsanitized `portfolioTitle` string to post payload  
**Category:** Insufficient Input Validation — Unsanitized free-text string in feed payload  
**Severity:** LOW  
**Status:** Open  
**Scope:** VCSM  
**Location:** `apps/VCSM/src/features/profiles/kinds/vport/controller/barbershop/publishBarbershopPortfolioUpdateAsPost.controller.js:16-49`

**Source:** `portfolioTitle` (caller-supplied free-text string)

**Sink:**
```js
payload: { portfolioTitle: portfolioTitle ?? null, vportKind: vportKind ?? null }
```
Written via `createSystemPost` to vc.posts payload.

**Trust Boundary:** `portfolioTitle` is `.trim()`-ed when building the post text (`buildPortfolioText`), but the raw untrimmed value is stored in the payload:
```js
const text = buildPortfolioText(barbershopName, portfolioTitle ?? null);  // uses trim in body
// ...
payload: { portfolioTitle: portfolioTitle ?? null,   // <-- raw value, not trimmed or length-capped
```

Compare with the locksmith equivalent which applies `sanitizeText(portfolioTitle, 120)` — strips C0/C1 control characters and caps at 120 characters — before writing to both text and payload.

**Impact:** The barbershop portfolio payload can contain:
- Leading/trailing whitespace in `portfolioTitle`
- C0/C1 control characters (null bytes, escape sequences)
- Strings of arbitrary length (no cap)

These are stored in the feed post payload. Consumers that read `payload.portfolioTitle` receive the raw string. Length is not capped, enabling an oversized JSONB payload write.

**Evidence:**
```js
// publishBarbershopPortfolioUpdateAsPost.controller.js:38-46
const text = buildPortfolioText(barbershopName, portfolioTitle ?? null);

const created = await createSystemPost({
  actorId,
  text,
  ...
  payload: { portfolioTitle: portfolioTitle ?? null, vportKind: vportKind ?? null },  // raw
});

// Compare locksmith: sanitizeText(portfolioTitle, 120) applied before both text and payload
```

**Reproduction:**
1. Authenticated barbershop owner submits a portfolio update with `portfolioTitle` = a 50,000-character string with embedded null bytes.
2. Controller stores the raw title in `payload.portfolioTitle`.
3. The JSONB payload column receives an oversized value, potentially impacting query performance or causing truncation/error at the DB layer.

**Existing Defense:** Authorization via `assertActorOwnsVportActorController` is correct. `buildPortfolioText` trims the title before using it in the post text. The issue is the payload field, not the post text.

**Why Insufficient:** The text is sanitized but the payload field is not. Payload is stored separately and read independently. The locksmith module demonstrates the correct pattern.

**Recommended Fix:** Apply `sanitizeText` (same function as locksmith) before writing to payload:
```js
function sanitizeText(str, maxLen) {
  if (!str || typeof str !== "string") return null;
  let out = "";
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c >= 32 && c !== 127 && !(c >= 128 && c < 160)) out += str[i];
  }
  const trimmed = out.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLen) : null;
}

// In publishBarbershopPortfolioUpdateAsPostController:
const sanitizedTitle = sanitizeText(portfolioTitle, 120);
const text = buildPortfolioText(barbershopName, sanitizedTitle);
// ...
payload: { portfolioTitle: sanitizedTitle, vportKind: vportKind ?? null },
```

**Follow-up Command:** SPIDER-MAN regression test for oversized and control-character inputs.

---

## Non-Findings

### Ownership assertion — both publish controllers
Both `publishBarbershopHoursUpdateAsPostController` and `publishBarbershopPortfolioUpdateAsPostController` call `assertActorOwnsVportActorController({ requestActorId: callerActorId, targetActorId: actorId })` before any write. The hook layer (`usePublishBarbershopHoursPost`, `usePublishBarbershopPortfolioPost`) correctly resolves `callerActorId` from `identity?.actorId` via `useIdentity()`. No bypass of the authorization check confirmed.

### Dedup throttle
`hasRecentBarbershopHoursPostDAL` and `hasRecentBarbershopPortfolioPostDAL` use a 1-hour dedup window on the `vc.posts` table, scoped by `actor_id` and `post_type`. No finding on throttling logic.

### `resolveVportBarbershopNameDAL`
Returns only `name` from the profiles table (explicit column selection). Filters `is_deleted = false`. No finding.

### `vportKind` in portfolio payload
`vportKind` is passed from the hook as `identity?.vportType ?? null` — a string from session state, not user-controlled free text input that reaches the DB raw. The value is stored in payload as-is, but it is sourced from the identity context (not a form field). Low risk; acceptable.

---

## Verdict

**0H / 1M / 1L**  
THOR release gate: **CAUTION** on ELEK-2026-05-28-029 (blocks sanitization gap — medium severity). ELEK-2026-05-28-030 is low but should be fixed in the same patch pass. Both are straightforward patches that bring barbershop in line with the locksmith sanitization pattern. No HIGH findings — THOR is not hard-blocked but should not release without patching the blocks sanitization gap.
