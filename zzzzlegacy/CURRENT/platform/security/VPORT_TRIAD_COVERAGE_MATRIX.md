# VPORT Triad Coverage Matrix

**Generated:** 2026-06-02  
**Triad definition:** VENOM (trust boundary + injection scan) + ELEKTRA (precision patch scan) + BLACKWIDOW (adversarial runtime verification)  
**Evidence source:** `DASHBOARD/vport-dashboard-governance-matrix.md` + `TABS/vport-tab-governance-matrix.md` + per-module `audit-status.md` files

---

## Triad Status Definitions

| Status | Meaning |
|---|---|
| `TRIAD_COMPLETE` | All three commands ran and all findings resolved |
| `PARTIAL_TRIAD` | At least one triad command ran; none are BLOCKED; not all three are COMPLETE |
| `VENOM_ONLY` | Only VENOM ran; ELEKTRA and BLACKWIDOW not started |
| `TRIAD_BLOCKED` | One or more triad commands found CONFIRMED HIGH findings that are unresolved |
| `TRIAD_NOT_STARTED` | No triad command has run on this feature |
| `TRIAD_NOT_TRACKED` | The governance system for this feature does not track the full triad (structural gap) |
| `TRIAD_STALE_DOCS` | Evidence exists but governance files conflict or reference unresolved contradictions |

---

## Part 1 — DASHBOARD Modules Triad Status

Source: `DASHBOARD/vport-dashboard-governance-matrix.md` (last updated 2026-06-01)

| Module | VENOM | ELEKTRA | BLACKWIDOW | Triad Status | Evidence | Notes |
|---|---|---|---|---|---|---|
| **dashboard** | COMPLETE | COMPLETE | COMPLETE | **TRIAD_COMPLETE** | Governance matrix row 2026-05-11 | Core dashboard shell — all 9 commands COMPLETE |
| **dashboard-cards** | COMPLETE | COMPLETE | COMPLETE | **TRIAD_COMPLETE** | Governance matrix row 2026-05-23 | All card variants — all 9 commands COMPLETE |
| **leads** | COMPLETE | COMPLETE | COMPLETE | **TRIAD_COMPLETE** | Governance matrix row 2026-05-24 | Lead pipeline — all 9 commands COMPLETE |
| **exchange** | COMPLETE | COMPLETE | COMPLETE | **TRIAD_COMPLETE** | Governance matrix row 2026-05-28 | ELEK-2026-05-28-045 LOW only — ownership gates CLEAN |
| **gas** | COMPLETE | COMPLETE | COMPLETE | **TRIAD_COMPLETE** | Governance matrix row 2026-05-28 | ELEK-001–009 all resolved; THOR cleared |
| **menu** | COMPLETE | COMPLETE | COMPLETE | **TRIAD_COMPLETE** | Governance matrix row 2026-05-27 | Restaurant menu QR — all 9 commands COMPLETE |
| **services** | COMPLETE | COMPLETE | COMPLETE | **TRIAD_COMPLETE** | Governance matrix row 2026-05-23 | Service catalog — all 9 commands COMPLETE |
| **booking** | COMPLETE | COMPLETE | COMPLETE | **TRIAD_COMPLETE** | Governance matrix row 2026-05-27 | THOR cleared (CAUTION). DEFER-001 confirmed resolved |
| **reviews** | COMPLETE | COMPLETE | COMPLETE | **TRIAD_COMPLETE** | Governance matrix row 2026-05-27 | THOR cleared (CAUTION). DEFER-002 (service_id FK) deferred to CARNAGE sprint |
| **subscribers** | BLOCKED | NOT_STARTED | BLOCKED | **TRIAD_BLOCKED** | BW-SUB-003 CONFIRMED HIGH — VPORT actor-kind follow bypass. V-SUB-008 DEFERRED (RPC confirmation required). THOR BLOCKED. | ELEKTRA never ran. Two blocked findings, neither resolved. |
| **availability** | VERIFIED | COMPLETE | VERIFIED | **PARTIAL_TRIAD** | ELEK-060/061/062/063 all CLOSED 2026-06-01 (DB RLS confirmed). KRAVEN + SPIDER-MAN pending. | ELEKTRA COMPLETE; VENOM + BW at VERIFIED only. Triad coverage present but incomplete. |
| **barber** | VERIFIED | COMPLETE | VERIFIED | **PARTIAL_TRIAD** | ELEK-024/025/026/028 resolved 2026-05-29. ELEK-027 deferred (DB). THOR cleared. SPIDER-MAN pending. | All three triad arms have run. None COMPLETE except ELEKTRA. |
| **barbershop** | VERIFIED | COMPLETE | VERIFIED | **PARTIAL_TRIAD** | ELEK resolved 2026-05-29. THOR cleared. SPIDER-MAN pending. K-BLK-002 NOT_A_RISK confirmed (no N+1). | All three triad arms have run. None COMPLETE except ELEKTRA. |
| **locksmith** | VERIFIED | COMPLETE | VERIFIED | **PARTIAL_TRIAD** | K-BLK-001 MEDIUM (3 parallel uncached DB reads — NOT release-blocking). THOR cleared. SPIDER-MAN pending. | All three triad arms have run. None COMPLETE except ELEKTRA. |
| **restaurant** | VERIFIED | COMPLETE | VERIFIED | **PARTIAL_TRIAD** | ELEK-050/051/052/053 all RESOLVED 2026-06-01 (dead actor_id filter removed). ARCHITECT + KRAVEN + SENTRY + SPIDER-MAN pending. | BW at VERIFIED. Triad present but downstream commands still open. |
| **portfolio** | PARTIAL | COMPLETE | VERIFIED | **PARTIAL_TRIAD** | ELEK-040/041 RESOLVED. BW-PORT-004 MITIGATED. Engine write paths CLEAN. SPIDER-MAN required. | VENOM still PARTIAL. Not all findings confirmed resolved. |
| **exchange-profile** | PARTIAL | COMPLETE | VERIFIED | **PARTIAL_TRIAD** | ELEK-045 RESOLVED (MAX_EXCHANGE_RATE cap added). BW: public profile conditional pass. No CRITICAL/HIGH. | VENOM PARTIAL — some findings unresolved or partially verified. |
| **tripoint** | VERIFIED | DEFERRED | BLOCKED | **TRIAD_BLOCKED** | ELEKTRA deferred: no source code to scan (spec-only). BW-TRIPOINT-001/002 HIGH BYPASSED. BW-TRIPOINT-004/005 MEDIUM BYPASSED. THOR BLOCKED. | Implementation does not exist yet. ELEKTRA will re-run once committed. BLOCKED cannot be cleared until implementation exists. |
| **team** | VERIFIED | VERIFIED | VERIFIED | **PARTIAL_TRIAD** | VENOM-TEAM-005 RESOLVED. VENOM-TEAM-004/007/008 DEFERRED. BW: VERIFIED status. No BLOCKED findings. | All three triad arms ran and reached VERIFIED. Not COMPLETE — downstream commands (ARCHITECT, KRAVEN, etc.) still pending but triad itself is clean. |
| **settings** | VERIFIED | COMPLETE | VERIFIED | **PARTIAL_TRIAD** | ELEK-001/002 RESOLVED. ELEK-003/004/005 verified pre-resolved. CARNAGE (VENOM-SETTINGS-002 profile_public_details RLS) still pending. | BLACKWIDOW at VERIFIED. Full triad coverage present. |
| **content-pages** | BLOCKED | PARTIAL | BLOCKED | **TRIAD_BLOCKED** | BW-CONTENT-001/002/004 HIGH BYPASSED. VENOM CONTENT-001/004/007/008 open. ELEK-002 RESOLVED but ELEK patch partial. CARNAGE migration required. | Three HIGH confirmed exploitable via adversarial simulation. TRIAD BLOCKED until CARNAGE sprint runs. |
| **tab-classification** | VERIFIED | PARTIAL | VERIFIED | **PARTIAL_TRIAD** | ELEK-010/011 RESOLVED. ELEK-012 LOW OPEN (LOGAN deprecation). BW-TAB-001/002 MITIGATED. VENOM TABS-001/002 (2H) still open. | ELEKTRA PARTIAL due to ELEK-012. Two HIGH VENOM findings unresolved. Not blocked but not clean. |
| **delete-lifecycle** | BLOCKED | COMPLETE | BLOCKED | **TRIAD_BLOCKED** | BW-DELETE-001 (deprecated DAL confirmed callable — HIGH BYPASSED). BW-DELETE-003 (cascade gap — HIGH). VENOM DELETE-001/002/003 open. CARNAGE P1 sprint required. | ELEKTRA COMPLETE but both VENOM and BLACKWIDOW BLOCKED. |
| **external-site** | VERIFIED | PARTIAL | BLOCKED | **TRIAD_BLOCKED** | BW-EXTSITE-001 (CORS wildcard HIGH BYPASSED). BW-EXTSITE-003 (SES email abuse HIGH BYPASSED). BW-EXTSITE-004 (listUsers enumeration HIGH PARTIAL). ELEK-004/006/007/009 RESOLVED; ELEK-005/008 DEFERRED. THOR BLOCKED. | BLACKWIDOW BLOCKED with 3 HIGH findings. ELEKTRA PARTIAL due to deferred items. |
| **schedule** | VERIFIED | COMPLETE | VERIFIED | **PARTIAL_TRIAD** | ELEK-065/066/067 open (MEDIUM — SENTRY + architecture sprint required). VENOM-SCHED-003 RESOLVED. | ELEKTRA COMPLETE but ELEK findings require SENTRY follow-up. Triad arms all ran. |
| **calendar** | VERIFIED | COMPLETE | VERIFIED | **PARTIAL_TRIAD** | ELEK-068 RESOLVED. ELEK-069 MEDIUM open (no screen split — SENTRY sprint). | ELEKTRA COMPLETE. BW VERIFIED. Triad arms all ran. |

---

### DASHBOARD Triad Summary

| Triad Status | Count | Modules |
|---|---|---|
| TRIAD_COMPLETE | 9 | dashboard, dashboard-cards, leads, exchange, gas, menu, services, booking, reviews |
| PARTIAL_TRIAD | 12 | availability, barber, barbershop, locksmith, restaurant, portfolio, exchange-profile, team, settings, tab-classification, schedule, calendar |
| TRIAD_BLOCKED | 4 | subscribers, content-pages, delete-lifecycle, external-site |
| TRIAD_BLOCKED (pre-implementation) | 1 | tripoint |
| TRIAD_NOT_STARTED | 0 | — |
| **Total tracked** | **26** | |

---

## Part 2 — TABS Triad Status

Source: `TABS/vport-tab-governance-matrix.md` (last updated 2026-05-27)

### STRUCTURAL GAP: ELEKTRA and BLACKWIDOW Are Not Tracked in TABS Governance

The TABS governance matrix contains these columns only:
```
VENOM | ARCHITECT | KRAVEN | SENTRY | SPIDER-MAN | LOGAN | THOR
```

**ELEKTRA and BLACKWIDOW are absent from the TABS governance system entirely.**

This means:
1. No tab has ever received an ELEKTRA precision scan
2. No tab has ever received a BLACKWIDOW adversarial runtime test
3. Even tabs with VENOM COMPLETE cannot be classified as PARTIAL_TRIAD — they are TRIAD_NOT_TRACKED
4. The TABS governance matrix must be updated to add ELEKTRA and BLACKWIDOW columns before any tab triad classification can be meaningful

For this matrix, triad status for all tabs is classified as `TRIAD_NOT_TRACKED` for ELEKTRA and BLACKWIDOW, with VENOM status noted separately.

| Tab | VENOM | ELEKTRA | BLACKWIDOW | Triad Status | Evidence | Notes |
|---|---|---|---|---|---|---|
| **about** | NOT_STARTED | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | Matrix row — never audited | Identity fields visible on public profile |
| **book** | PARTIAL | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | BOOK-001/002 RESOLVED. BOOK-003 LOW post-release. DTAB-006 deferred. THOR RELEASE APPROVED 2026-05-27. | Booking writes + ownership enforcement. Highest-risk tab. VENOM partial but THOR approved. |
| **content** | NOT_STARTED | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | Never audited | Social content feed |
| **gas-prices** | COMPLETE | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | GAS-001 resolved by tests. GAS-002 LOW open. 2026-05-27. | VENOM COMPLETE but no ELEKTRA/BLACKWIDOW |
| **menu** | NOT_STARTED | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | Never audited | QR public access; printable flag |
| **owner** | COMPLETE | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | LOW finding open. Injection gate sound. 2026-05-27. | VENOM COMPLETE but no ELEKTRA/BLACKWIDOW |
| **photos/gallery** | NOT_STARTED | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED + TRIAD_STALE_DOCS** | Photos row in matrix; gallery folder on disk — contradiction unresolved | Naming conflict adds stale doc issue on top of not-started status |
| **portfolio** | NOT_STARTED | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | Never audited | Upload surface; media handling |
| **rates** | PARTIAL | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | 3 bugs fixed 2026-05-27. KRAVEN VERIFIED. SPIDER-MAN PARTIAL. | VENOM PARTIAL; other non-triad commands further along |
| **reviews** | NOT_STARTED | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | Never audited | Review submission write path |
| **services** | NOT_STARTED | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | Never audited | Service catalog; cross-feature adapter concern |
| **subscribers** | NOT_STARTED | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | Never audited | Note: DASHBOARD.subscribers is BLOCKED on same actor-kind bypass finding (BW-SUB-003) |
| **team** | NOT_STARTED | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | Never audited | Barber identity + booking routing; HIGH risk |
| **vibes** | NOT_STARTED | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | Never audited | Social feed slice |
| **contact** | NOT_STARTED | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | Not implemented | Planned tab |
| **gallery** | NOT_STARTED | NOT_TRACKED | NOT_TRACKED | **TRIAD_NOT_TRACKED** | Not implemented | Planned tab; naming conflict with "photos" |

---

### TABS Triad Summary

| Triad Status | Count | Tabs |
|---|---|---|
| TRIAD_COMPLETE | 0 | — |
| PARTIAL_TRIAD | 0 | — (none possible while ELEKTRA/BW not tracked) |
| TRIAD_NOT_TRACKED | 16 | All 15 active tabs + gallery |
| TRIAD_STALE_DOCS | 1 | gallery (photos/gallery naming conflict) |
| **Total tracked** | **16** | |

---

## Part 3 — Features with No Architecture Folder (Triad Status: TRIAD_NOT_STARTED)

These features have no governance folder at all. All triad commands are effectively NOT_STARTED.

| Feature | Source Path | VENOM | ELEKTRA | BLACKWIDOW | Triad Status | Risk | Notes |
|---|---|---|---|---|---|---|---|
| **flyer-builder** | `dashboard/flyerBuilder/` | NOT_STARTED | NOT_STARTED | NOT_STARTED | **TRIAD_NOT_STARTED** | HIGH | Owner tool with controller+DAL+upload surface |
| **qrcode** | `dashboard/qrcode/` | NOT_STARTED | NOT_STARTED | NOT_STARTED | **TRIAD_NOT_STARTED** | MEDIUM | Identity embedded in QR payloads |
| **vport-core** | `features/vport/` | NOT_STARTED | NOT_STARTED | NOT_STARTED | **TRIAD_NOT_STARTED** | HIGH | Core identity/resolution layer |
| **join** | `features/join/` | NOT_STARTED | NOT_STARTED | NOT_STARTED | **TRIAD_NOT_STARTED** | HIGH | Ownership-establishment flow; active on current branch |
| **invite** | `features/invite/` | NOT_STARTED | NOT_STARTED | NOT_STARTED | **TRIAD_NOT_STARTED** | HIGH | Invite issuance + acceptance; shares DAL with join |
| **settings-vports** | `features/settings/vports/` | NOT_STARTED | NOT_STARTED | NOT_STARTED | **TRIAD_NOT_STARTED** | MEDIUM | VPORT-specific settings writes |
| **public-vport-business-card** | `public/vportBusinessCard/` | NOT_STARTED | NOT_STARTED | NOT_STARTED | **TRIAD_NOT_STARTED** | HIGH | Unauthenticated VPORT identity exposure |
| **public-vport-menu** | `public/vportMenu/` | NOT_STARTED | NOT_STARTED | NOT_STARTED | **TRIAD_NOT_STARTED** | HIGH | Unauthenticated QR public menu surface |
| **vport-profile-header** | `profiles/kinds/vport/ui/vportprofileheader/` | NOT_STARTED | NOT_STARTED | NOT_STARTED | **TRIAD_NOT_STARTED** | MEDIUM | Identity fields exposed across all public tab views |

---

## Part 4 — Cross-Feature Triad Conflicts and Contradictions

| Conflict | Severity | Detail |
|---|---|---|
| **subscribers: DASHBOARD BLOCKED vs TABS NOT_STARTED** | HIGH | `DASHBOARD/modules/subscribers/` is BLOCKED by BW-SUB-003 (VPORT actor-kind follow bypass). `TABS/tabs/subscribers/` is NOT_STARTED. The BW finding in the dashboard module directly affects the tab surface — a visitor could bypass the kind guard through the subscriber tab. The tab module cannot be audited in isolation without resolving BW-SUB-003 first. |
| **content-pages: DASHBOARD BLOCKED vs TABS content NOT_STARTED** | HIGH | BW-CONTENT-002 (actor_id in public read — BYPASSED) affects the public content tab directly. The TABS.content folder is NOT_STARTED, but the underlying data exposure confirmed by BLACKWIDOW exists. |
| **external-site: BLOCKED but deployed** | HIGH | `DASHBOARD/modules/external-site/` is BLACKWIDOW BLOCKED (3 HIGH BYPASSED findings). This feature is marked as RELEASED in the governance matrix. Three HIGH confirmed exploitable paths on a live public endpoint with no THOR clearance. |
| **photos/gallery: STALE_DOCS** | MEDIUM | The TABS governance matrix tracks two rows for photo/gallery-related tabs but only one folder exists on disk. Cannot determine which row is authoritative without reading the tab content switch implementation. |
| **TABS missing ELEKTRA/BLACKWIDOW** | CRITICAL (structural) | The TABS governance matrix was designed without the security triad. Any tab with a HIGH-risk public write surface (book, team, services, reviews) is operating without the ELEKTRA precision scan or BLACKWIDOW adversarial verification that DASHBOARD modules receive. This is a systematic gap across all 15 tabs. |

---

## Triad Priority Remediation Stack

Listed in order of urgency based on risk level and blocked status:

| Priority | Feature | Root | Current Triad Status | Recommended First Command | Reason |
|---|---|---|---|---|---|
| 1 | **external-site** | DASHBOARD | TRIAD_BLOCKED (3 HIGH live) | BLACKWIDOW re-run after CARNAGE fixes | Deployed + 3 HIGH BYPASSED. CARNAGE prerequisite identified. |
| 2 | **subscribers** | DASHBOARD | TRIAD_BLOCKED (BW-SUB-003) | ARCHITECT + VENOM (V-SUB-008 RPC resolution) | Both VENOM and BLACKWIDOW blocked. Affects tab surface too. |
| 3 | **content-pages** | DASHBOARD | TRIAD_BLOCKED (3 HIGH) | CARNAGE migration first, then BLACKWIDOW re-run | CARNAGE is the gating prerequisite before BLACKWIDOW can be cleared. |
| 4 | **delete-lifecycle** | DASHBOARD | TRIAD_BLOCKED (2 HIGH) | CARNAGE P1 sprint first | Deprecated DAL still callable. CARNAGE prerequisite for both VENOM and BLACKWIDOW resolution. |
| 5 | **join** | MISSING | TRIAD_NOT_STARTED | VENOM | Ownership-establishment flow active on current branch; no audit. |
| 6 | **invite** | MISSING | TRIAD_NOT_STARTED | VENOM | Trust boundary; shares DAL with join. |
| 7 | **public-vport-business-card** | MISSING | TRIAD_NOT_STARTED | VENOM | Unauthenticated identity exposure — no audit. |
| 8 | **public-vport-menu** | MISSING | TRIAD_NOT_STARTED | VENOM | Unauthenticated public surface — no audit. |
| 9 | **flyer-builder** | MISSING | TRIAD_NOT_STARTED | VENOM | Owner tool with upload surface — no audit. |
| 10 | **TABS: book** | TABS | TRIAD_NOT_TRACKED (VENOM PARTIAL) | ELEKTRA (add column first) | Booking writes — highest-risk unaudited tab |
| 11 | **TABS: team** | TABS | TRIAD_NOT_TRACKED | VENOM → ELEKTRA | Barber identity + booking routing; HIGH risk |
| 12 | **TABS: services** | TABS | TRIAD_NOT_TRACKED | VENOM | Service catalog owner writes |
| 13 | **TABS: reviews** | TABS | TRIAD_NOT_TRACKED | VENOM | Review submission write path |
| 14 | **vport-core** | MISSING | TRIAD_NOT_STARTED | ARCHITECT → VENOM | Core identity resolution layer needs architecture mapping first |
| 15 | **tripoint** | DASHBOARD | TRIAD_BLOCKED (pre-impl) | Wait for implementation, then ELEKTRA + VENOM | Cannot scan what doesn't exist. BLOCKED until code exists. |
