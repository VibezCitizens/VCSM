# VPORT Dashboard — Card Registry

**Last updated:** 2026-06-01  
**Maintained by:** ARCHITECT + IRONMAN  
**Purpose:** Canonical inventory of every dashboard card and module in the VPORT system

---

## Registry Format

Each entry records the module's identity, source location, VPORT kind scope, and governance status.

---

## Fully Released Modules

### Dashboard Shell
- **Module ID:** `dashboard`
- **VPORT kinds:** ALL
- **Source:** `apps/VCSM/src/features/dashboard/vport/screens/`
- **Public route:** NO (owner only)
- **Engine deps:** `engines/hydration`, `engines/identity`
- **Governance status:** COMPLETE
- **Architecture doc:** `logan/marvel/architect/modules/vcsm.vport-dashboard.architecture.md`

### Dashboard Cards (Settings Panel)
- **Module ID:** `dashboard-cards`
- **VPORT kinds:** ALL
- **Source:** `apps/VCSM/src/features/dashboard/vport/screens/`
- **Public route:** NO (owner only)
- **Engine deps:** `engines/hydration`
- **Governance status:** COMPLETE
- **Architecture doc:** `logan/marvel/architect/modules/vcsm.vport-dashboard-cards-settings.architecture.md`

### Leads Dashboard
- **Module ID:** `leads`
- **VPORT kinds:** ALL (service-providing kinds)
- **Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/leads/`
- **Public route:** NO (owner only)
- **Engine deps:** `engines/hydration`
- **Governance status:** COMPLETE
- **Architecture doc:** `logan/marvel/architect/modules/vcsm.vport-dashboard-leads.architecture.md`
- **Logan spec:** `logan/vports/vcsm.vport.leads-dashboard.md`

### Exchange Rate Dashboard
- **Module ID:** `exchange`
- **VPORT kinds:** EXCHANGE
- **Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/exchange/`
- **Public route:** PARTIAL (rates published as posts)
- **Engine deps:** `engines/hydration`
- **Governance status:** COMPLETE
- **Architecture doc:** `logan/marvel/architect/modules/vcsm.vport-exchange-rate-dashboard.architecture.md`
- **Logan spec:** `logan/vports/vcsm.vport.exchange-rate.md`

### Gas Station / Gas Prices
- **Module ID:** `gas`
- **VPORT kinds:** GAS
- **Source:** `apps/VCSM/src/features/dashboard/vport/screens/`
- **Public route:** YES (gas prices public card)
- **Engine deps:** `engines/hydration`
- **Governance status:** COMPLETE (THOR deferred — S2 screen split)
- **Architecture docs:** `vcsm.vport-gas-prices.architecture.md` + `vcsm.vport-gas-station-cards-individual.architecture.md`
- **Logan spec:** `logan/vports/vcsm.vport.gas-station-profile-spec.md`

### Restaurant Menu / QR
- **Module ID:** `menu`
- **VPORT kinds:** RESTAURANT
- **Source:** `apps/VCSM/src/features/public/vportMenu/` + dashboard menu card
- **Public route:** YES (public QR menu)
- **Engine deps:** `engines/hydration`
- **Governance status:** COMPLETE
- **Architecture docs:** `vcsm.vport-public-menu.architecture.md` + `vcsm.vport-restaurant-dashboard-menu-qr.architecture.md`
- **Logan spec:** `logan/vports/vcsm.vport.menu-pipeline.md`

### Services Dashboard Card
- **Module ID:** `services`
- **VPORT kinds:** ALL
- **Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/services/`
- **Public route:** PARTIAL (service catalog public)
- **Engine deps:** `engines/hydration`
- **Governance status:** COMPLETE
- **Architecture doc:** `logan/marvel/architect/modules/vcsm.vport-services-dashboard-card.architecture.md`
- **Logan spec:** `logan/vports/vcsm.vport.service-catalog.md`

### Booking Engine
- **Module ID:** `booking`
- **VPORT kinds:** ALL
- **Source:** `engines/booking/src/` (engine) + `apps/VCSM/src/features/dashboard/vport/dashboard/cards/bookings/` (dashboard UI layer)
- **Public route:** YES (booking confirmation public)
- **Engine deps:** `engines/booking`, `engines/notifications`
- **Governance status:** COMPLETE (DEFER-001 RESOLVED 2026-05-27 — live DB confirmed)
- **Logan spec:** `logan/vports/vcsm.vport.business-pipeline.v2.md`

### Reviews + QR
- **Module ID:** `reviews`
- **VPORT kinds:** ALL
- **Source:** `apps/VCSM/src/features/` (reviews feature)
- **Public route:** YES (QR review link)
- **Engine deps:** `engines/reviews`
- **Governance status:** COMPLETE (THOR deferred — DEFER-002)
- **Architecture docs:** `vcsm.vport-reviews-dashboard.architecture.md` + `vcsm.vport-reviews-qr.architecture.md`
- **Logan spec:** `logan/vports/vcsm.vport.review-pipeline-audit.md`

### Availability
- **Module ID:** `availability`
- **VPORT kinds:** ALL
- **Source:** `engines/booking/src/`
- **Public route:** NO
- **Engine deps:** `engines/booking`
- **Governance status:** VERIFIED (ELEK-060/061/062/063 CLOSED 2026-06-01 — DB confirmed comprehensive RLS; KRAVEN + SPIDER-MAN pending)
- **Architecture doc:** `logan/marvel/architect/modules/vcsm.vport-availability.architecture.md`

---

## Partial / Pending Modules

### Barber Profile
- **Module ID:** `barber`
- **VPORT kinds:** BARBER
- **Source:** `apps/VCSM/src/features/profiles/kinds/vport/`
- **Public route:** YES
- **Governance status:** WATCH — VENOM VERIFIED, ELEKTRA COMPLETE, BLACKWIDOW VERIFIED, ARCHITECT COMPLETE, KRAVEN COMPLETE, SENTRY VERIFIED. SPIDER-MAN pending. (Supersedes: PARTIAL / VENOM only)
- **Logan spec:** `logan/vports/vcsm.vport.barber-profile-spec.md`

### Barbershop Profile
- **Module ID:** `barbershop`
- **VPORT kinds:** BARBERSHOP
- **Source:** `apps/VCSM/src/features/profiles/kinds/vport/`
- **Public route:** YES
- **Governance status:** WATCH — VENOM VERIFIED, ELEKTRA COMPLETE, BLACKWIDOW VERIFIED, ARCHITECT COMPLETE, KRAVEN COMPLETE, SENTRY VERIFIED. SPIDER-MAN pending. (Supersedes: PARTIAL / VENOM only)

### Locksmith Profile
- **Module ID:** `locksmith`
- **VPORT kinds:** LOCKSMITH
- **Source:** `apps/VCSM/src/features/profiles/kinds/vport/`
- **Public route:** YES
- **Governance status:** WATCH — VENOM VERIFIED, ELEKTRA COMPLETE, BLACKWIDOW VERIFIED, ARCHITECT COMPLETE, KRAVEN COMPLETE, SENTRY VERIFIED. SPIDER-MAN pending. (Supersedes: PARTIAL / VENOM only)
- **Logan spec:** `logan/vports/vcsm.vport.locksmith-profile-spec.md`

### Restaurant Profile
- **Module ID:** `restaurant`
- **VPORT kinds:** RESTAURANT
- **Source:** `apps/VCSM/src/features/profiles/kinds/vport/`
- **Public route:** YES
- **Governance status:** PARTIAL — VENOM VERIFIED, ELEKTRA COMPLETE (ELEK-050/051/052/053 RESOLVED 2026-06-01), BLACKWIDOW VERIFIED. ARCHITECT + KRAVEN + SENTRY + SPIDER-MAN pending. (Supersedes: PARTIAL / VENOM only)
- **Logan spec:** `logan/vports/vcsm.vport.restaurant-profile-spec.md`

### Money Exchange Profile
- **Module ID:** `exchange-profile`
- **VPORT kinds:** EXCHANGE
- **Source:** `apps/VCSM/src/features/profiles/kinds/vport/`
- **Public route:** YES
- **Governance status:** PARTIAL
- **Logan spec:** `logan/vports/vcsm.vport.money-exchange-profile-spec.md`

### Portfolio
- **Module ID:** `portfolio`
- **VPORT kinds:** ALL
- **Source:** `apps/VCSM/src/features/` (portfolio feature)
- **Public route:** YES
- **Engine deps:** `engines/portfolio`
- **Governance status:** PARTIAL — VENOM PARTIAL (dedicated pass required), ELEKTRA COMPLETE (ELEK-040/041 resolved), BLACKWIDOW MITIGATED. KRAVEN + SENTRY + SPIDER-MAN pending.

---

## Security Review Pending (documented, not yet audited)

### Team Management
- **Module ID:** `team`
- **VPORT kinds:** ALL (BARBERSHOP primary use case)
- **Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/team/`
- **Public route:** NO (owner only)
- **Engine deps:** `engines/hydration`, `engines/notifications`
- **Governance status:** PARTIAL — VENOM VERIFIED, ELEKTRA VERIFIED, BLACKWIDOW VERIFIED, CARNAGE COMPLETE. VENOM-TEAM-005 RESOLVED 2026-05-29. Deferred: VENOM-TEAM-004 (CARNAGE), VENOM-TEAM-007 (DEADPOOL), VENOM-TEAM-008 (SPIDER-MAN). ARCHITECT + KRAVEN + SENTRY + SPIDER-MAN + THOR pending. (Supersedes: SECURITY_REVIEW_PENDING)
- **Risk:** MEDIUM — release blockers resolved; remaining deferred items are post-ship
- **Architecture doc:** `modules/team/` — initial docs created 2026-05-27

### Settings
- **Module ID:** `settings`
- **VPORT kinds:** ALL
- **Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/settings/`
- **Public route:** NO (owner only)
- **Engine deps:** `engines/hydration`
- **Governance status:** PARTIAL — VENOM VERIFIED, ELEKTRA COMPLETE, BLACKWIDOW VERIFIED, CARNAGE COMPLETE. ELEK-001/002/003/004/005 RESOLVED 2026-05-29. Remaining: VENOM-SETTINGS-002 (profile_public_details RLS — CARNAGE sprint). ARCHITECT + KRAVEN + SENTRY + SPIDER-MAN + THOR pending. (Supersedes: SECURITY_REVIEW_PENDING)
- **Risk:** MEDIUM — VEMON-SETTINGS-002 (RLS migration) is the only remaining release-blocking item
- **Architecture doc:** `modules/settings/` — initial docs created 2026-05-27

### Schedule
- **Module ID:** `schedule`
- **VPORT kinds:** ALL (primary: BARBER, BARBERSHOP, LOCKSMITH)
- **Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/schedule/`
- **Public route:** NO (owner only)
- **Engine deps:** `engines/booking`, `engines/hydration`
- **Governance status:** PARTIAL — VENOM VERIFIED, ELEKTRA COMPLETE, BLACKWIDOW VERIFIED, ARCHITECT VERIFIED. VENOM-SCHED-002/003 RESOLVED 2026-05-29. Open: ELEK-065/066 (SENTRY sprint), ELEK-067 (deferred). KRAVEN + SENTRY + SPIDER-MAN + THOR pending. (Supersedes: SECURITY_REVIEW_PENDING)
- **Risk:** MEDIUM — no HIGH findings; SENTRY architecture sprint items open
- **Architecture doc:** `modules/schedule/` — initial docs created 2026-05-27

### Calendar
- **Module ID:** `calendar`
- **VPORT kinds:** ALL (primary: BARBER, BARBERSHOP, LOCKSMITH)
- **Source:** `apps/VCSM/src/features/dashboard/vport/dashboard/cards/calendar/`
- **Public route:** NO (owner only)
- **Engine deps:** `engines/booking`
- **Governance status:** PARTIAL — VENOM VERIFIED, ELEKTRA COMPLETE, BLACKWIDOW VERIFIED, SENTRY VERIFIED. ELEK-068 RESOLVED 2026-05-29, VENOM-CAL-002/003/004 RESOLVED. Open: ELEK-069 (SENTRY sprint). ARCHITECT + KRAVEN + SPIDER-MAN + THOR pending. (Supersedes: SECURITY_REVIEW_PENDING)
- **Risk:** LOW — no HIGH findings; SENTRY architecture sprint (screen split) open
- **Architecture doc:** `modules/calendar/` — initial docs created 2026-05-27

---

## Not Yet Audited

### Subscribers
- **Module ID:** `subscribers`
- **VPORT kinds:** ALL
- **Governance status:** BLOCKED — VENOM REMEDIATED (V-SUB-001–007 resolved; V-SUB-008 DEFERRED — dead `get_follower_count` RPC), BLACKWIDOW BLOCKED (BW-SUB-003 OPEN — VPORT actor-kind follow bypass), ARCHITECT COMPLETE, SENTRY COMPLETE, SPIDER-MAN VERIFIED, LOGAN COMPLETE. THOR WATCH. (Supersedes: NOT_STARTED)
- **Risk:** HIGH — BW-SUB-003 + V-SUB-008 block THOR

### Delete Lifecycle
- **Module ID:** `delete-lifecycle`
- **VPORT kinds:** ALL
- **Governance status:** BLOCKED — VENOM BLOCKED (DELETE-001/002/003 open), ELEKTRA COMPLETE (ELEK-007/008/009/010 resolved; ELEK-011 deferred), BLACKWIDOW BLOCKED (BW-DELETE-001/003 confirmed exploitable). CARNAGE P1 sprint required. ARCHITECT + KRAVEN + SENTRY + SPIDER-MAN pending. (Supersedes: NOT_STARTED)
- **Risk:** HIGH — deprecated DAL live in bundle; cascade gap confirmed
- **Logan spec:** `logan/vports/vcsm.vport.delete-lifecycle.md`

### External Site Integration
- **Module ID:** `external-site`
- **VPORT kinds:** ALL
- **Governance status:** PARTIAL/BLOCKED — VENOM VERIFIED, ELEKTRA PARTIAL (ELEK-004/006/007/009 RESOLVED 2026-05-29; ELEK-005/008 DEFERRED — blocking THOR), BLACKWIDOW BLOCKED (BW-EXTSITE-003/004 active). ARCHITECT + KRAVEN + SENTRY + SPIDER-MAN pending. THOR BLOCKED. (Supersedes: NOT_STARTED)
- **Risk:** HIGH — SES email abuse + listUsers enumeration chains still open
- **Logan spec:** `logan/vports/vcsm.vport.external-site-integration.md`

### Content Pages Pipeline
- **Module ID:** `content-pages`
- **VPORT kinds:** ALL
- **Governance status:** PARTIAL (CARNAGE only)
- **Logan spec:** `logan/vports/vcsm.vport.content-pages-pipeline.md`

### Tab Classification System
- **Module ID:** `tab-classification`
- **VPORT kinds:** ALL
- **Governance status:** PARTIAL — VENOM PARTIAL (TABS-001/002 open HIGH findings — DEADPOOL + LOGAN required), ELEKTRA PARTIAL (ELEK-010/011 RESOLVED; ELEK-012 open), BLACKWIDOW VERIFIED (BW-TAB-001/002 MITIGATED). ARCHITECT + KRAVEN + SENTRY + SPIDER-MAN + THOR pending. (Supersedes: NOT_STARTED)
- **Logan spec:** `logan/vports/vcsm.vport.tab-classification.md`

### TriPoint Integration
- **Module ID:** `tripoint`
- **VPORT kinds:** LOCKSMITH (primary)
- **Public route:** YES (external domain)
- **Governance status:** BLOCKED — VENOM VERIFIED/spec-only (no implementation code found; 7H/4M/3L risk register), ELEKTRA DEFERRED (no source code to scan), BLACKWIDOW BLOCKED (BW-TRIPOINT-001/002/003/004/005 — 2H + 3M bypass chains). DEADPOOL + DB + Wolverine + Carnage required. (Supersedes: NOT_STARTED)
- **Risk:** HIGH — no implementation; all findings spec-level; integration expansion blocked
- **Logan spec:** `logan/vports/vcsm.vport.tripoint-integration.md`

---

## Registry Statistics

| Category | Count |
|---|---|
| Fully released + COMPLETE governance | 10 |
| WATCH (triad complete + ARCHITECT/KRAVEN/SENTRY done; SPIDER-MAN pending) | 3 |
| PARTIAL (triad complete; other commands pending) | 9 |
| PARTIAL/BLOCKED (triad partial; findings open) | 4 |
| **Total registered** | **26** |

Note: "Security Review Pending" and "Not Yet Audited" section labels above are superseded — all modules in those sections have received at least partial security coverage. Section labels preserved for historical reference; governance statuses in each entry reflect current state.

**Last updated:** 2026-06-01 — synced all governance statuses to match vport-dashboard-governance-matrix.md. Superseded: PARTIAL/VENOM-only for barber/barbershop/locksmith/restaurant; NOT_STARTED for subscribers/delete-lifecycle/external-site/tab-classification/tripoint; SECURITY_REVIEW_PENDING for team/settings/schedule/calendar.
