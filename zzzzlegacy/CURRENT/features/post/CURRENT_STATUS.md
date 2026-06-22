# Post Feature — Current Status

**As of:** 2026-05-19
**Sprint:** DAL governance pass on `vcsm.dal.post.md` (triggered by CEREBRO)

---

## Command Coverage

| Command | Status | Date |
|---|---|---|
| VENOM | COMPLETE — 2 OPEN findings | 2026-05-19 |
| SENTRY | COMPLETE — 1 OPEN finding | 2026-05-19 |
| review-contract | COMPLETE — 1 OPEN finding | 2026-05-19 |
| KRAVEN | NOT_STARTED | — |
| LOKI | NOT_STARTED | — |
| THOR | NOT_STARTED | — |
| IRONMAN | NOT_STARTED | — |
| CARNAGE | NOT_STARTED | — |

---

## Open Findings

| ID | Command | Severity | Description | Status |
|---|---|---|---|---|
| V-1 | VENOM | HIGH (confirmed — INSERT policy has no actor ownership check) | `createSystemPost` — no actor ownership verification; actorId accepted from caller with only authenticated-user check | OPEN |
| V-2 | VENOM | MEDIUM | `searchMentionSuggestions` — `viewerActorId` always null; controller never passes it through; blocked/blocking actors may appear in mention autocomplete | OPEN |
| S-1 | SENTRY | MEDIUM | `post.write.dal.js` DAL→DAL boundary violation: `replacePostMentions` coordinates delete + insert internally; belongs in `editPost.controller.js` | OPEN |
| RC-2 | review-contract | LOW | Dual controller folders — `upload/controller/` (singular) and `upload/controllers/` (plural) coexist; two files in the wrong location | OPEN |

---

## Resolved Findings (per audit)

| ID | Command | Description | Resolved |
|---|---|---|---|
| RC-1 | review-contract | Ungated `console.warn` calls (3 → 4 instances) | RESOLVED — Codex Fix Pass 2026-05-11 |

---

## Handoff State

- **DB / CARNAGE required:** Confirm RLS INSERT policy on `vc.posts` — does it enforce `actor_id` ∈ `actor_owners` for the session user? (V-1 resolution depends on this)
- **IRONMAN required:** Ownership enforcement decision for vport publish controllers (V-1); refactor ownership decision for `replacePostMentions` (S-1); decision for dual controller folder cleanup (RC-2)
- **WOLVERINE:** Schedule `replacePostMentions` move to controller layer once IRONMAN decides
