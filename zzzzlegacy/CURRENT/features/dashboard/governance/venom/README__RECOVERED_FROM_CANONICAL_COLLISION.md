# Governance: VENOM — Security Reviews

**Authority:** VENOM is the security sheriff and trust boundary review authority.
**Last Updated:** 2026-05-27

## Responsibility

VENOM reviews VPORT tab security for:
- Trust boundary enforcement between public and authenticated contexts
- Actor ownership validation on all write paths
- Identity exposure — raw UUIDs, profileId, vportId in public surfaces
- Auth flow review on any mutation-capable tab
- Booking security (payment surface, ownership before charge)
- Team membership security (identity objects in public lists)
- Feature flag gate verification (is the disabled tab truly inaccessible?)
- Owner tab injection safety (is non-owner exposure possible?)

## Audit Scope Per Tab

| Tab | Security Priority | Focus Areas |
|---|---|---|
| book | CRITICAL | Booking mutations, payment intent, ownership before charge |
| owner | HIGH | Injection gate, acting-as confusion, race condition |
| team | HIGH | Barber identity exposure, team join/leave ownership |
| gas | HIGH | Price write ownership — can non-owner modify prices? |
| menu | MEDIUM | QR access gate, flyer editor flag, content injection |
| rates | PARTIAL (2026-05-27) | Hardened on branch; formal VENOM pass still needed |
| reviews | MEDIUM | Review submission identity, reviewer actorId auth |
| services | MEDIUM | Service CRUD ownership |
| portfolio | MEDIUM | Upload path identity, media ownership |
| about | LOW | Read-only; PII display expected |
| content | LOW | Read-only feed slice |
| subscribers | LOW | Identity list read |
| vibes | LOW | Read-only feed slice |

## Reports Location

`governance/venom/` — all VENOM VPORT tab reports stored here.

Filename format: `YYYY-MM-DD_venom_vport-tab-<tab-key>.md`

## Completed Reports

| Tab | Date | Status | Report |
|---|---|---|---|
| rates (partial — branch work) | 2026-05-27 | PARTIAL | See `vport-booking-feed-security-updates` branch |

## VENOM Release Gate Rule

Any VENOM finding of CRITICAL or HIGH severity on a VPORT tab **blocks THOR release approval** for that tab until resolved.
