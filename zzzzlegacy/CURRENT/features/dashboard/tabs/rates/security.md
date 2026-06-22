# Tab: rates — Security

**Last Updated:** 2026-05-27
**VENOM Status:** PARTIAL

## Trust Boundaries

| Check | Location | Type | Status |
|---|---|---|---|
| identityActorId required | upsertVportRateController | Hard guard | VERIFIED |
| Actor owns vport | assertActorOwnsVportActorController | DB-backed authoritative | VERIFIED (fixed 2026-05-27) |
| UI ownership advisory | useVportOwnership | Advisory only | VERIFIED |
| System post uses PUBLIC_REALM_ID | publishExchangeRateUpdateAsPostController | Hardcoded public realm | VERIFIED |

## Identity Exposure

- Rates tab exposes: rate values, currency pairs, exchange name, last-updated timestamps
- Does NOT expose: profileId, vportId, internal UUIDs
- actorId exposed (canonical — expected on public VPORT profile)

## Open Security Items

- VENOM has not been formally run as a standalone command on this tab
- The security hardening from `vport-booking-feed-security-updates` branch covers QR URLs and booking validation; rates-specific VENOM audit is still pending
