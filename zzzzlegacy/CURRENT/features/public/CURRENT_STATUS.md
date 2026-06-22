---
# public — CURRENT_STATUS.md
# Last Updated: 2026-06-02
# Ticket: TICKET-PUBLIC-VENOM-001-PATCH
# Status: CURRENT SOURCE OF TRUTH

## Feature Status

| Field | Value |
|---|---|
| Status | ACTIVE — VENOM pass complete; P1 patches applied; HIGH open findings remain |
| Security Tier | HIGH |
| Auth Surface | PUBLIC |
| Priority | P1 |
| Last Audit | VENOM full scoped pass 2026-06-02 (TICKET-PUBLIC-VENOM-001) |
| Resolved This Sprint | PUBLIC-001 (profileId exposure), PUBLIC-002 (sections IDOR), PUBLIC-005 (redirect raw ID), ELEK-007/008 (source confirmed resolved) |
| Open Security Findings | 11 open (see SECURITY.md) |
| Open Tickets | TICKET-PUBLIC-VENOM-001-PATCH (this sprint), CARNAGE migration VL-001–005 pending |
| Recommended Next Command | ELEKTRA — edge function + RPC write path precision scan |
| Last Updated | 2026-06-02 |

---

## Known Blockers

### ELEK-2026-05-27-001 — Wildcard CORS on edge functions (HIGH)
All 5 edge functions including send-lead-confirmation (public lead submit path) have wildcard CORS. Any origin may call VCSM write surfaces. No patch applied.

### ELEK-2026-05-28-007 — deleteVportActorMenuCategoryController ownership gate (HIGH) — RESOLVED
Source inspection 2026-06-02 confirmed assertActorOwnsVportActorController IS present in both controllers on branch vport-booking-feed-security-updates. Files listed as modified on current branch. CURRENT docs previously marked OPEN — updated to RESOLVED. DB-level RLS verification still required (PUBLIC-007).

### ELEK-2026-05-28-008 — deleteVportActorMenuItemController ownership gate (HIGH) — RESOLVED
Same as ELEK-007. Source confirmed gate present. See above.

### ELEK-2026-05-27-004 — send-lead-confirmation accepts anon key as auth (MEDIUM)
Publicly-known anon key is sufficient to trigger SES email delivery to arbitrary addresses via VCSM's SES infrastructure. No patch applied.

### VL-001 through VL-005 — business_card_leads migration PENDING
Legacy RPC Overload 1 (submit_business_card_lead) has GRANT EXECUTE TO PUBLIC, no availability guard, and actor_id = NULL hardcoded. Permissive INSERT policies, full-row UPDATE grant, and missing source constraint all flagged. Migration plan authored but not executed.

### Bookings {public} role cleanup — DEFERRED
Four UPDATE policies and one SELECT policy on vport.bookings use {public} role instead of {authenticated}. Separate cleanup migration required.

### Duplicate VportActorMenuPublicView — OPEN
Route /actor/:actorId/menu exposes raw UUID in back navigation /profile/${actorId} and uses a divergent duplicate hook (different data shape, console.log violations). Not yet consolidated.

### VENOM-CONTENT-005 — is_indexable inconsistency (MEDIUM, DB-blocked)
is_indexable filter inconsistency between DAL and public RLS policies. DB-blocked.

### VENOM-DELETE-004 — Stale public content after deletion (MEDIUM)
Cache invalidation dead code never called on delete; stale public content served up to 10 minutes post-deletion.

### SPIDER-MAN test coverage MISSING
No regression tests for fromPublicRow() UUID exclusion or DAL ownership predicates on any public sub-module.

### Write-review CTA dead
VportPublicReviewsPanel CTA redirects to /login with no review submission screen wired post-auth.

---

## Recommended Next Action

1. Run ELEKTRA — scoped to edge functions (send-lead-confirmation, submit_business_card_lead RPC post-migration, get_business_card_sections RPC).
2. Execute CARNAGE migration plan VL-001–005 (business_card_leads security hardening).
3. CARNAGE — verify DELETE RLS on vport.menu_categories and vport.menu_items (PUBLIC-007).
4. IRONMAN — establish ownership map; run after ELEKTRA.

---

## Release Gate State

| Gate | Status | Command |
|---|---|---|
| THOR — vportMenu | BLOCKED | ELEKTRA + CARNAGE migration required |
| THOR — vportBusinessCard | BLOCKED | ELEKTRA + CARNAGE migration required |
| PUBLIC-001 (profileId exposure) | RESOLVED 2026-06-02 | TICKET-PUBLIC-VENOM-001-PATCH |
| PUBLIC-002 (sections IDOR) | RESOLVED 2026-06-02 | TICKET-PUBLIC-VENOM-001-PATCH |
| PUBLIC-005 (redirect raw ID) | MITIGATED 2026-06-02 — /m/:actorId now resolves slug | TICKET-PUBLIC-VENOM-001-PATCH |
| ELEK-007/008 (delete gates) | RESOLVED — source confirmed | Source inspection 2026-06-02 |
| business_card_leads migration VL-001–005 | PENDING | CARNAGE — plan authored, not executed |
| Bookings {public} role cleanup | DEFERRED | CARNAGE — separate migration required |
| SPIDER-MAN coverage | MISSING | SPIDER-MAN not run on either sub-module |
| PUBLIC-003 wildcard CORS | OPEN | ELEKTRA — no patch applied |

---

## Last Command Runs

| Command | Feature Area | Date | Result |
|---|---|---|---|
| VENOM | features/public/ full scoped pass | 2026-06-02 | 19 findings (4 HIGH, 9 MEDIUM, 6 LOW) |
| WOLVERINE | P1 patch: PUBLIC-001/002/005 | 2026-06-02 | 3 findings resolved |
| ELEKTRA | External site edge functions | 2026-05-27 | ELEK-2026-05-27-001/-004/-LOW — OPEN |
| ELEKTRA | Delete lifecycle | 2026-05-28 | ELEK-2026-05-28-007/-008 — RESOLVED per source |
| ELEKTRA | Content pages | 2026-05-27 | ELEK-2026-05-27-002 RESOLVED; others OPEN |
| LOKI | vport-menu QR path | 2026-05-27 | 3x DB reads on public_menu_read_model_v traced |
| THOR | vportMenu release gate | N/A | BLOCKED |
| THOR | vportBusinessCard release gate | N/A | BLOCKED |
| BLACKWIDOW | features/public/ | NEVER | NOT RUN |
| SENTRY | features/public/ | NEVER | NOT RUN |
| IRONMAN | features/public/ | NEVER | NOT RUN |
| SPIDER-MAN | features/public/ | NEVER | NOT RUN |
| KRAVEN | features/public/ | NEVER | NOT RUN |

---

## DR. STRANGE Summary

The public feature is ACTIVE and serving production traffic across two released sub-modules — vportMenu (QR scan and slug-based public menu/reviews surface) and vportBusinessCard (public VPORT profile and lead capture). First full VENOM pass completed 2026-06-02 (19 findings). P1 patches applied same date: profileId stripped from public business card API (PUBLIC-001 RESOLVED), sections controller refactored to derive profileId server-side from slug (PUBLIC-002 RESOLVED), /m/:actorId redirect now resolves to canonical slug URL (PUBLIC-005 MITIGATED). ELEK-007/008 confirmed RESOLVED per source inspection — ownership gates are present on both menu delete controllers on the current branch. Remaining open blockers: VL-001–005 CARNAGE migration (GRANT EXECUTE TO PUBLIC on submit_business_card_lead), wildcard CORS on all 5 edge functions, and DB-level RLS verification on menu_categories/menu_items DELETE policies. Recommended next command: ELEKTRA scoped to edge functions and RPC write paths.
---
