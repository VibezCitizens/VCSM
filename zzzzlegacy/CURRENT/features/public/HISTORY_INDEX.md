---
# public — HISTORY_INDEX.md
# Last Updated: 2026-06-02
# Ticket: TICKET-PUBLIC-VENOM-001-PATCH
# Status: CURRENT SOURCE OF TRUTH

History and audit artifact index for the public feature.

---

## Audit History

| Date | Ticket | Command | Scope | Result |
|---|---|---|---|---|
| 2026-05-09 | — | VENOM (whole-project deep) | full project | VENOM-FINDING-2 (synthetic age — join), F-12 (profile_id in join token) |
| 2026-05-10 | — | VENOM (vcsm-full-deep-scan) | full project | VBR-02, VBR-03, VL-07, AUTH-002, VF-001 raised |
| 2026-05-14 | THOR gate | THOR (booking availability write) | booking | V-AVAIL-01 RESOLVED |
| 2026-05-24 | — | CARNAGE (leads migration plan) | DB | VL-001–005 migration plan authored; NOT EXECUTED |
| 2026-05-27 | — | ELEKTRA (external site) | edge functions | ELEK-2026-05-27-001/-004/-LOW raised |
| 2026-05-27 | — | ELEKTRA (content pages) | content pages | ELEK-2026-05-27-002 RESOLVED |
| 2026-05-28 | — | ELEKTRA (delete lifecycle) | menu delete controllers | ELEK-2026-05-28-007/-008 raised (now confirmed RESOLVED per source) |
| 2026-06-02 | TICKET-PUBLIC-VENOM-001 | VENOM (full scoped pass) | features/public/ | 19 findings (4 HIGH, 9 MEDIUM, 6 LOW) |
| 2026-06-02 | TICKET-PUBLIC-VENOM-001-PATCH | WOLVERINE (P1 patch) | features/public/ | PUBLIC-001/002/005 resolved |
| 2026-06-02 | — | ELEKTRA (edge functions + RPC + post-patch verify) | features/public/ + edge functions | 1 HIGH, 2 MEDIUM, 1 LOW; 2 FP rejected; ELEK-027-001 RESOLVED per source |

---

## Artifact Links

| Date | File | Type |
|---|---|---|
| 2026-06-02 | CURRENT/outputs/2026/06/02/wolverine/003_public_wolverine_public-venom-p1-patch.md | WOLVERINE patch report |
| 2026-06-02 | CURRENT/outputs/2026/06/02/ELEKTRA/2026-06-02_elektra_public-edge-functions-rpc.md | ELEKTRA edge functions and RPC precision scan |

---

## Open Audit Gaps

| Command | Status | Notes |
|---|---|---|
| ELEKTRA (scoped) | NOT RUN | Required for edge function + RPC precision scan |
| BLACKWIDOW | NOT RUN | Adversarial runtime verification not yet run |
| SENTRY | NOT RUN | Architecture compliance not formally audited |
| IRONMAN | NOT RUN | Feature ownership not formally audited |
| SPIDER-MAN | NOT RUN | Zero test coverage; regression baseline not established |
| KRAVEN | NOT RUN | Performance audit not run |
| CARNAGE (migration execution) | NOT STARTED | VL-001–005 plan authored but migration not applied |
| CARNAGE (RLS verification) | NOT STARTED | DELETE policies on menu_categories/menu_items not verified |
