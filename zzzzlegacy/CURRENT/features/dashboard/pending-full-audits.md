# VPORT Dashboard — Pending Full Audits

**Last updated:** 2026-06-01  
**Maintained by:** WOLVERINE + ARCHITECT  
**Total pending:** 16 (statuses updated to match governance matrix 2026-06-01)

A module appears here when it has not yet received a complete pass from all 9 governance commands (VENOM + ELEKTRA + BLACKWIDOW + ARCHITECT + KRAVEN + SENTRY + SPIDER-MAN + LOGAN + THOR).

---

## Priority 1 — Highest Risk (No Security Coverage)

### 1. Subscribers (cross-kind)
- **Status:** VENOM — BLOCKED → REMEDIATED (V-SUB-001–007 resolved 2026-05-27/2026-05-29; V-SUB-008 DEFERRED — dead `get_follower_count` RPC) | ELEKTRA — NOT_STARTED | BLACKWIDOW — BLOCKED (BW-SUB-003 OPEN HIGH — VPORT actor-kind follow bypass; BW-SUB-004 RESOLVED 2026-05-29) | ARCHITECT — COMPLETE | KRAVEN — NOT_STARTED | SENTRY — COMPLETE | SPIDER-MAN — VERIFIED (257/256 passing; 1 stub) | LOGAN — COMPLETE | THOR — WATCH (blocked on BW-SUB-003 + V-SUB-008)
- **Risk:** HIGH — BW-SUB-003 governance rule definition required before THOR clears
- **What it does:** Manages follower/subscriber relationships across all VPORT kinds
- **Remaining blockers:** BW-SUB-003 (kind-follow rule definition), V-SUB-008 (dead RPC — CARNAGE)
- **Next command:** ELEKTRA (first run) → DEADPOOL (BW-SUB-003 rule definition) → CARNAGE (V-SUB-008 RPC)
- **Module folder:** `modules/subscribers/`

> **Supersedes:** "NOT_STARTED across all commands" — module has received VENOM, ARCHITECT, SENTRY, SPIDER-MAN, LOGAN, and BLACKWIDOW coverage.

### 2. Delete Lifecycle (cross-kind)
- **Status:** VENOM — BLOCKED (2026-05-27, 3H/4M/3L) | ELEKTRA — COMPLETE (ELEK-007/008/009/010 all RESOLVED; ELEK-011 DEFERRED — menu DAL session bind) | BLACKWIDOW — BLOCKED (BW-DELETE-001 BYPASSED/HIGH, BW-DELETE-002 BYPASSED/MEDIUM, BW-DELETE-003 PARTIAL/HIGH) | ARCHITECT — NOT_STARTED | KRAVEN — NOT_STARTED | SENTRY — NOT_STARTED | SPIDER-MAN — NOT_STARTED | LOGAN — PARTIAL | THOR — BLOCKED
- **Risk:** HIGH
- **What it does:** Governs soft-delete and hard-delete flows for VPORTs and their associated data
- **VENOM blockers (still open):** DELETE-001 (deprecated DAL still exported + live in bundle), DELETE-002 (3 SECURITY DEFINER RPCs with no tracked migrations), DELETE-003 (cascade gap: resources/portfolio/availability/push_subscriptions omitted)
- **ELEKTRA COMPLETE update (2026-05-28 → 2026-05-29):** ELEK-007/008/009 RESOLVED 2026-05-28 (ownership gates added to all 3 delete controllers). ELEK-010 RESOLVED 2026-05-29 (actorId param added to deleteVportContentPageDAL; TOCTOU window eliminated). ELEK-011 DEFERRED (menu DAL session bind — DB RLS confirmation required).
- **Next command:** Wolverine (DELETE-001 remove export) → DB (DELETE-002 introspect live RPCs) → Carnage P1 sprint (DELETE-003 extend chain, ELEK-011 confirm)
- **Module folder:** `modules/delete-lifecycle/`

> **Supersedes:** "ELEKTRA — NOT_STARTED" and "BLACKWIDOW — NOT_STARTED" — both commands have run.

### 3. TriPoint Integration (cross-kind)
- **Status:** VENOM — VERIFIED (2026-05-27, 7H/4M/3L — spec-level; no implementation code found; TRIPOINT-000) | ELEKTRA — DEFERRED (2026-05-28 — no source code to scan; Edge Function not yet built; pre-implementation risk register recorded) | BLACKWIDOW — BLOCKED (BW-TRIPOINT-001/002 BYPASSED/HIGH, BW-TRIPOINT-003/004/005 BYPASSED/MEDIUM — spec-level simulations) | ARCHITECT — NOT_STARTED | KRAVEN — NOT_STARTED | SENTRY — NOT_STARTED | SPIDER-MAN — NOT_STARTED | LOGAN — PARTIAL | THOR — BLOCKED
- **Risk:** HIGH — no implementation to audit; integration expansion blocked
- **What it does:** Exposes VPORT business identity data to external sites (e.g. tripointlockandkeys.com)
- **Key VENOM findings (spec-level):** No auditable implementation found (TRIPOINT-000); anon key in browser bundle risk; CORS wildcard; actorId in public URL; unverified RLS on tripoint_emails/tripoint_reviews
- **Next command:** DEADPOOL (determine live access method) → DB (inspect tripoint_* table RLS) → Wolverine (plan Option B Edge Function) → Carnage (migration sprint) → ELEKTRA re-run after implementation
- **Module folder:** `modules/tripoint/`

> **Supersedes:** "ELEKTRA — NOT_STARTED" and "BLACKWIDOW — NOT_STARTED" — both commands have run (ELEKTRA deferred; BLACKWIDOW blocked).

---

## Priority 2 — Profile-Kind Audits (VENOM done, rest pending)

### 4. Barber Profile
- **Status:** VENOM — VERIFIED | ELEKTRA — COMPLETE (ELEK-024/025/026/028 resolved 2026-05-29; ELEK-027 RESOLVED 2026-06-01 via DEFER-007) | BLACKWIDOW — VERIFIED | ARCHITECT — COMPLETE (2026-06-01) | KRAVEN — COMPLETE (2026-06-01 — K-BLK-003 LOW: join flow clean, one-shot, no N+1) | SENTRY — VERIFIED (2026-06-01) | SPIDER-MAN — NOT_STARTED | LOGAN — PARTIAL | THOR — WATCH
- **What it does:** Barber-specific profile view, services, and booking surface
- **All ELEKTRA findings resolved (2026-06-01):** ELEK-024/025/026/028 resolved 2026-05-29. ELEK-027 (resource_type filter) confirmed RESOLVED 2026-06-01 (DB: CHECK constraint confirmed; `.eq("resource_type","staff")` added to `fetchJoinResourceByIdDAL`).
- **Next command:** SPIDER-MAN
- **Module folder:** `modules/barber/`

> **Supersedes:** "ARCHITECT — NOT_STARTED", "KRAVEN — NOT_STARTED", "SENTRY — NOT_STARTED".

### 5. Locksmith Profile
- **Status:** VENOM — VERIFIED | ELEKTRA — COMPLETE (ELEK-020/021/022/023 all resolved 2026-05-29) | BLACKWIDOW — VERIFIED | ARCHITECT — COMPLETE (2026-06-01) | KRAVEN — COMPLETE (2026-06-01 — K-BLK-001 MEDIUM: 3 uncached DB reads per profile mount; Cache Optimization Sprint; NOT release-blocking) | SENTRY — VERIFIED (2026-06-01) | SPIDER-MAN — NOT_STARTED | LOGAN — PARTIAL | THOR — WATCH
- **What it does:** Locksmith-specific profile view, services, and booking surface
- **All ELEKTRA findings resolved (2026-05-29):** ELEK-020/021/022/023 all closed.
- **Next command:** SPIDER-MAN
- **Module folder:** `modules/locksmith/`

> **Supersedes:** "ARCHITECT — NOT_STARTED", "KRAVEN — NOT_STARTED", "SENTRY — NOT_STARTED".

### 6. Restaurant Profile
- **Status:** VENOM — VERIFIED | ELEKTRA — COMPLETE (ELEK-050/051/052/053 all RESOLVED 2026-06-01) | BLACKWIDOW — VERIFIED | ARCHITECT — NOT_STARTED | KRAVEN — NOT_STARTED | SENTRY — NOT_STARTED | SPIDER-MAN — NOT_STARTED | LOGAN — PARTIAL | THOR — NOT_STARTED
- **What it does:** Restaurant-specific profile view, menu integration, and booking surface
- **ELEKTRA COMPLETE (2026-06-01):** ELEK-050 RESOLVED (DB: no actor_id col on menu_categories; dead filter removed). ELEK-051 RESOLVED (DB: no actor_id col on menu_items; dead filter removed). ELEK-052 RESOLVED (update DALs profileId scoped). ELEK-053 RESOLVED (null guards in save controllers). Controller ownership gate confirmed. RLS DELETE confirmed via actor_can_manage_profile.
- **Next command:** ARCHITECT
- **Module folder:** `modules/restaurant/`

> **Supersedes:** "ELEKTRA — PARTIAL" — ELEKTRA is now COMPLETE as of 2026-06-01.

### 7. Money Exchange Profile
- **Status:** VENOM — VERIFIED (via exchange-rate-dashboard) | ARCHITECT — PARTIAL | KRAVEN — PARTIAL | SENTRY — VERIFIED | SPIDER-MAN — PARTIAL | LOGAN — PARTIAL | THOR — NOT_STARTED
- **What it does:** Money exchange rate publishing, dashboard rate management
- **Notes:** Exchange-rate-dashboard module FULLY AUDITED; profile-level scope still partial
- **Next command:** ARCHITECT (profile-scoped)
- **Module folder:** `modules/exchange/`

---

## Priority 3 — Pipeline / Cross-Kind Systems

### 8. Content Pages Pipeline (cross-kind)
- **Status:** CARNAGE — VERIFIED | VENOM — BLOCKED (3H open) | ELEKTRA — PARTIAL (2026-05-29) | BLACKWIDOW — BLOCKED | ARCHITECT — NOT_STARTED | KRAVEN — NOT_STARTED | SENTRY — NOT_STARTED | SPIDER-MAN — NOT_STARTED | LOGAN — PARTIAL | THOR — NOT_STARTED
- **What it does:** Governs how VPORT content pages (policies, menus, catalogs) are created and published
- **ELEKTRA update (2026-05-29):** ELEK-001 verified already resolved (ALLOWED_UPDATE_FIELDS present). ELEK-003 verified already resolved (both DALs have .eq("actor_id")). ELEK-002 RESOLVED (actor_id/profile_id stripped from owner SELECT strings across update/toggle/list/read DALs).
- **VENOM blockers still open:** CONTENT-001 (hard delete → Carnage), CONTENT-004 (stale dual-RLS OR-merge → DB → Carnage), CONTENT-005 (is_indexable policy inconsistency → DB), CONTENT-007 (dead coverImageUrl removed 2026-05-29)
- **Next command:** BLACKWIDOW (re-run after ELEK patches) → DB (CONTENT-004, CONTENT-005) → Carnage (CONTENT-001)
- **Module folder:** `modules/content-pages/`

### 9. External Site Integration (cross-kind)
- **Status:** VENOM — VERIFIED (2026-05-27, 2H/5M/3L) | ELEKTRA — PARTIAL (ELEK-004/006/007/009 RESOLVED 2026-05-29; ELEK-005/008 DEFERRED — blocking THOR) | BLACKWIDOW — BLOCKED (BW-EXTSITE-001/003/004 — SES abuse + listUsers chains active) | ARCHITECT — NOT_STARTED | KRAVEN — NOT_STARTED | SENTRY — NOT_STARTED | SPIDER-MAN — NOT_STARTED | LOGAN — PARTIAL | THOR — BLOCKED
- **What it does:** Edge Function API layer that serves VPORT data to external business websites
- **ELEKTRA update (2026-05-29):** ELEK-004 RESOLVED (all 5 functions CORS-restricted). ELEK-006 RESOLVED (raw error removed). ELEK-007 RESOLVED (User-Agent + IP guard). ELEK-009 RESOLVED (Bearer auth on push stub). ELEK-005 DEFERRED (listUsers O(n) — CARNAGE RPC required). ELEK-008 DEFERRED (anon key auth — infrastructure change required).
- **Next command:** DB (check_email_registered RPC) → Carnage (API key schema for ELEK-008) → BLACKWIDOW re-run after ELEK-005/008 resolved
- **Module folder:** `modules/external-site/`

> **Supersedes:** "ELEK-004 PARTIAL (4 of 5 functions)" — ELEK-004 is fully RESOLVED (all 5 functions now restricted).

### 10. Portfolio (cross-kind)
- **Status:** VENOM — PARTIAL (implicit in kind audits; dedicated pass required) | ELEKTRA — COMPLETE (ELEK-040/041 RESOLVED; ELEK-040 2026-05-28, ELEK-041 2026-05-29) | BLACKWIDOW — MITIGATED (BW-PORT-004 MITIGATED 2026-05-28) | ARCHITECT — PARTIAL | All others — NOT_STARTED
- **What it does:** Portfolio display across all VPORT kinds — images, projects, work samples
- **ELEKTRA update:** ELEK-040 RESOLVED 2026-05-28 (ctrlSavePortfolioDetail: assertActorOwnsVportActorController replaces profile_id lookup). ELEK-041 RESOLVED 2026-05-29 (portfolioMediaId + callerProfileId null guards prevent .eq('profile_id', null) bypass). ELEK-042/043/044 INFO remain open.
- **Next command:** Dedicated VENOM pass → ARCHITECT (VPORT-level scope)
- **Module folder:** `modules/portfolio/`

> **Supersedes:** "All others — NOT_STARTED" — ELEKTRA COMPLETE, BLACKWIDOW MITIGATED.

### 11. Reviews (cross-kind)
- **Status:** CARNAGE — VERIFIED (schema provenance) | VENOM — PARTIAL | ARCHITECT — PARTIAL | Others — NOT_STARTED
- **What it does:** Review collection, display, and QR-gated submission across all VPORT kinds
- **Notes:** CARNAGE schema audit done 2026-05-23; `service_id` FK still pending
- **Next command:** Dedicated VENOM pass → ARCHITECT
- **Module folder:** `modules/reviews/`

### 12. Tab Classification System (cross-kind)
- **Status:** VENOM — PARTIAL (2026-05-27, 2H/4M/3L — TABS-001/002 open HIGH findings; corrected from VERIFIED 2026-06-01) | ELEKTRA — PARTIAL (ELEK-010/011 RESOLVED 2026-05-28; ELEK-012 LOW open) | BLACKWIDOW — VERIFIED (BW-TAB-001/002 MITIGATED 2026-05-28) | ARCHITECT — NOT_STARTED | KRAVEN — NOT_STARTED | SENTRY — NOT_STARTED | SPIDER-MAN — NOT_STARTED | LOGAN — PARTIAL | THOR — NOT_STARTED
- **What it does:** Governs which tabs appear on which VPORT kind dashboard views
- **ELEKTRA update (2026-05-28):** ELEK-010 RESOLVED (profile?.category removed from both vportType useMemos). ELEK-011 RESOLVED (vportType barbershop guard added to team tab). ELEK-012 LOW open (LOGAN deprecation recommendation).
- **VENOM TABS-001/002 open (no formal deferral):** TABS-001 (DEADPOOL — cache invalidation wiring + useProfileView lifecycle), TABS-002 (LOGAN — deprecate profile?.category as type classification source). VENOM corrected to PARTIAL 2026-06-01.
- **Next command:** DEADPOOL (TABS-001) → LOGAN (TABS-002) → VENOM re-run → ARCHITECT
- **Module folder:** `modules/tab-classification/`

> **Supersedes:** "ELEKTRA — BLOCKED" and "BLACKWIDOW — VERIFIED (superseded by NOT_STARTED)" — ELEKTRA PARTIAL (010/011 resolved), BLACKWIDOW VERIFIED (BW-TAB-001/002 mitigated).

---

## Priority 4 — Newly Documented Cards (Zero Security Coverage)

### 13. Team Management
- **Status:** VENOM — VERIFIED (VENOM-TEAM-005 + cross-feature import RESOLVED 2026-05-29) | ELEKTRA — VERIFIED (5 patches applied) | BLACKWIDOW — VERIFIED (all bypass chains closed by ELEK patches) | CARNAGE — COMPLETE | ARCHITECT — NOT_STARTED | KRAVEN — NOT_STARTED | SENTRY — NOT_STARTED | SPIDER-MAN — NOT_STARTED | LOGAN — COMPLETE | THOR — NOT_STARTED
- **Risk:** MEDIUM — release blockers (VENOM-TEAM-001/002/003, BW-TEAM-NEW-001) resolved. Remaining deferred: VENOM-TEAM-004 (CARNAGE), VENOM-TEAM-007 (DEADPOOL), VENOM-TEAM-008 (SPIDER-MAN)
- **What it does:** Manages team members for VPORT accounts, primarily BARBERSHOP; controls invite lifecycle and role assignment
- **Next command:** ARCHITECT → SPIDER-MAN (VENOM-TEAM-008 test gaps)
- **Module folder:** `modules/team/`

> **Supersedes:** "NOT_STARTED across all 9 commands" — VENOM, ELEKTRA, BLACKWIDOW, CARNAGE, LOGAN all COMPLETE.

### 14. Settings
- **Status:** VENOM — VERIFIED (VENOM-SETTINGS-001/003/005 RESOLVED 2026-05-29) | ELEKTRA — COMPLETE (ELEK-001/002/003/004/005 all resolved 2026-05-29) | BLACKWIDOW — VERIFIED (bypass vectors closed by ELEK patches) | CARNAGE — COMPLETE (VENOM-SETTINGS-002 migration plan produced) | ARCHITECT — NOT_STARTED | KRAVEN — NOT_STARTED | SENTRY — NOT_STARTED | SPIDER-MAN — NOT_STARTED | LOGAN — COMPLETE | THOR — NOT_STARTED
- **Risk:** MEDIUM — VENOM-SETTINGS-002 (profile_public_details RLS migration) is the only remaining release-blocking item (CARNAGE sprint)
- **What it does:** Owner-facing settings card; controls public profile data and TRAZE discovery opt-in/opt-out
- **Next command:** CARNAGE (VENOM-SETTINGS-002 RLS migration) → ARCHITECT
- **Module folder:** `modules/settings/`

> **Supersedes:** "NOT_STARTED across all 9 commands" — VENOM, ELEKTRA, BLACKWIDOW, CARNAGE, LOGAN all COMPLETE.

### 15. Schedule
- **Status:** VENOM — VERIFIED (VENOM-SCHED-002/003 RESOLVED 2026-05-29) | ELEKTRA — COMPLETE (ELEK-064 RESOLVED; ELEK-065/066 open — SENTRY sprint; ELEK-067 deferred) | BLACKWIDOW — VERIFIED (0 bypassed) | ARCHITECT — VERIFIED | CARNAGE — NOT_STARTED | KRAVEN — NOT_STARTED | SENTRY — NOT_STARTED | SPIDER-MAN — NOT_STARTED | LOGAN — COMPLETE | THOR — NOT_STARTED
- **Risk:** MEDIUM — no HIGH findings; SENTRY architecture sprint open (ELEK-065/066 — modal during actor switch, no screen gate)
- **What it does:** Dashboard schedule card showing upcoming bookings, availability windows, and resource assignments
- **Next command:** SENTRY (ELEK-065/066 architecture sprint) → KRAVEN → SPIDER-MAN
- **Module folder:** `modules/schedule/`

> **Supersedes:** "NOT_STARTED across all 9 commands" — VENOM, ELEKTRA, BLACKWIDOW, ARCHITECT, LOGAN all COMPLETE.

### 16. Calendar
- **Status:** VENOM — VERIFIED (VENOM-CAL-002/003/004 RESOLVED 2026-05-29) | ELEKTRA — COMPLETE (ELEK-068 RESOLVED 2026-05-29; ELEK-069 open — SENTRY sprint) | BLACKWIDOW — VERIFIED (0 bypassed) | SENTRY — VERIFIED | CARNAGE — NOT_STARTED | ARCHITECT — NOT_STARTED | KRAVEN — NOT_STARTED | SPIDER-MAN — NOT_STARTED | LOGAN — COMPLETE | THOR — NOT_STARTED
- **Risk:** LOW — no HIGH findings; SENTRY architecture sprint open (ELEK-069 — no screen split)
- **What it does:** Visual calendar view of bookings; delegates all state management to `engines/booking`
- **Next command:** SENTRY (ELEK-069 screen split sprint) → ARCHITECT → KRAVEN → SPIDER-MAN
- **Module folder:** `modules/calendar/`

> **Supersedes:** "NOT_STARTED across all 9 commands" — VENOM, ELEKTRA, BLACKWIDOW, SENTRY, LOGAN all COMPLETE.

---

## Completion Criteria

A module graduates out of this file when:

1. All 7 commands are at `VERIFIED` or `COMPLETE`
2. `audit-status.md` in the module folder is updated
3. The row in `vport-dashboard-governance-matrix.md` shows `COMPLETE` in the THOR column
4. This file entry is removed

---

## Audit Sprint Recommendations

| Sprint | Modules | Estimated Commands | Status |
|---|---|---|---|
| ~~Security Sprint 1~~ | ~~Subscribers, Delete Lifecycle, TriPoint~~ | ~~VENOM ×3 → ELEKTRA ×3 → BLACKWIDOW ×3~~ | COMPLETE (triads run; blockers remain for CARNAGE sprint) |
| ~~Security Sprint 2~~ | ~~Team, Settings~~ | ~~VENOM ×2 → ELEKTRA ×2 → BLACKWIDOW ×2~~ | COMPLETE (triads done; CARNAGE pending for Settings RLS) |
| Profile SPIDER-MAN Sprint | Barber, Locksmith, Barbershop | SPIDER-MAN ×3 | Next for barber/locksmith/barbershop (ARCHITECT/KRAVEN/SENTRY done 2026-06-01) |
| Profile Completion Sprint | Restaurant | ARCHITECT + KRAVEN + SENTRY + SPIDER-MAN | Restaurant triad done; ARCHITECT+ pending |
| Pipeline Sprint | Content Pages, External Site, Tab Classification | DEADPOOL + DB + Carnage per module | Triads partially done; blockers require CARNAGE/DB/DEADPOOL |
| Cross-Kind Sprint | Portfolio, Reviews | Dedicated VENOM pass + ARCHITECT ×2 | ELEKTRA done for portfolio; VENOM pass still needed |
| ~~Dashboard Cards Sprint~~ | ~~Schedule, Calendar~~ | ~~VENOM ×2 → ELEKTRA ×2 → BLACKWIDOW ×2~~ | COMPLETE (triads done; SENTRY architecture sprint open) |
| SENTRY Architecture Sprint | Schedule, Calendar | SENTRY ×2 (screen splits, actor-switch gates) | Open — ELEK-065/066 + ELEK-069 |
| CARNAGE Migration Sprint | Settings (RLS), External Site (API key), Subscribers (RPC) | CARNAGE ×3 | Critical — blocks multiple THOR gates |
