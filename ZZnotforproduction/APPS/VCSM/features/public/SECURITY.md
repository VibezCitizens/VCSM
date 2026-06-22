# Security Posture — public

Last Updated: 2026-06-04
Highest Open Severity: HIGH
THOR Release Blocker: YES — VEN-PUBLIC-001, VEN-PUBLIC-006, BW-PUBLIC-007

---

## VENOM STATUS
VENOM Last Run: 2026-06-04
VENOM Status: COMPLETE

Summary: 6 findings — 0 CRITICAL, 2 HIGH, 4 MEDIUM, 0 LOW

| Finding ID | Severity | Description |
|---|---|---|
| VEN-PUBLIC-001 | HIGH | Edge function `send-lead-confirmation` accepts any "Bearer" token — anon key is public in frontend bundle; no rate limiting; enables SES spam abuse |
| VEN-PUBLIC-002 | MEDIUM | navigator.userAgent silently collected client-side and stored in DB with lead PII — no disclosure to submitter |
| VEN-PUBLIC-003 | MEDIUM | Notification linkPath in lead owner notification uses raw actorId UUID — violates VCSM URL hygiene contract |
| VEN-PUBLIC-004 | MEDIUM | lat/lng fetched from public_menu_read_model_v and embedded in returned directionsUrl — precise coordinates exposed to all anonymous viewers; misleading model comment claims coordinates are not returned |
| VEN-PUBLIC-005 | MEDIUM | author_actor_id and target_actor_id returned in public review model output — actor UUID enumeration via anonymous review pages |
| VEN-PUBLIC-006 | HIGH | BEHAVIOR.md is a PLACEHOLDER — zero security rules or must-never-happen invariants for a feature that handles anonymous PII, email dispatch, and notifications |

Full report: ZZnotforproduction/APPS/VCSM/features/public/outputs/2026/06/04/Venom/2026-06-04_19-48_venom_public-security-review.md

---

## ELEKTRA STATUS
ELEKTRA Last Run: NEVER
ELEKTRA Status: NOT RUN

---

## BLACKWIDOW STATUS
BLACKWIDOW Last Run: 2026-06-04
BLACKWIDOW Status: COMPLETE

Summary: 15 findings — 0 CRITICAL, 1 HIGH, 4 MEDIUM, 4 LOW, 4 INFO | 3 BYPASSED, 4 BLOCKED, 2 PARTIAL, 3 N/A, 3 PARTIAL/BLOCKED

| Finding ID | Severity | Description | Result | Status |
|---|---|---|---|---|
| BW-PUBLIC-001 | LOW | Ownership bypass: actor_id not accepted from client; RPC resolves ownership server-side from slug | BLOCKED | DRAFT |
| BW-PUBLIC-002 | LOW | profileId injection: getVportBusinessCardSectionsController derives profileId server-side, never from caller | BLOCKED | DRAFT |
| BW-PUBLIC-003 | INFO | Session mutation: feature is fully anonymous by design; no viewerActorId accepted or required | N/A | DRAFT |
| BW-PUBLIC-004 | INFO | Runtime abuse: no privileged/owner-only paths exist in this feature | N/A | DRAFT |
| BW-PUBLIC-005 | MEDIUM | RLS verification: write uses SECURITY DEFINER RPC (correct); edge function auth gap still open (VEN-PUBLIC-001) | PARTIAL | DRAFT |
| BW-PUBLIC-006 | LOW | Null/undefined fuzzing: all controllers handle null/undefined slug and actorId gracefully | BLOCKED | DRAFT |
| BW-PUBLIC-007 | HIGH | Lead replay: no idempotency token, no server-side rate limit, p_ip hardcoded null — unlimited submissions flood owner notifications + trigger SES spam | BYPASSED | DRAFT |
| BW-PUBLIC-008 | INFO | Hydration poisoning: feature does not interact with hydration store | N/A | DRAFT |
| BW-PUBLIC-009 | LOW | TTL cache logic bug: `cached !== undefined` guard ineffective for null data; stale null served for 60s after first fetch | PARTIAL | DRAFT |
| BW-PUBLIC-010 | MEDIUM | UUID in notification linkPath: `/actor/<UUID>/dashboard/leads` — raw actor UUID in notification record | PARTIAL | DRAFT |
| BW-PUBLIC-011 | MEDIUM | Actor UUID enumeration: author_actor_id and target_actor_id returned verbatim in public review model output | BYPASSED | DRAFT |
| BW-PUBLIC-012 | MEDIUM | Lat/lng in directionsUrl: precise coordinates embedded in Google Maps URL returned to anonymous viewers; model comment misleads that coords are not returned | BYPASSED | DRAFT |
| BW-PUBLIC-013 | LOW | Invariant I-1: notification redirect via RPC result interception — no client-side interception point | BLOCKED | DRAFT |
| BW-PUBLIC-014 | LOW | Invariant I-2: UUID-as-slug to leak profileId — slug normalization prevents resolution | BLOCKED | DRAFT |
| BW-PUBLIC-015 | LOW | Junk phone validation: toSafePhone permits `+`, `,`, `.` as valid phone; single-char phone passes contact check | PARTIAL | DRAFT |

Output: ZZnotforproduction/APPS/VCSM/features/public/outputs/2026/06/04/BlackWidow/2026-06-04_blackwidow_public-adversarial-review.md
