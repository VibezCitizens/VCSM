# Settings — Ownership and Trust Boundaries

## Ownership Gates

| Path | Gate | Layer |
|---|---|---|
| Screen render | `useVportOwnership(viewerActorId, actorId)` → `isOwner` | `VportSettingsFinalScreen` (Final Screen) |
| `saveVportPublicDetailsByActorIdController` | `assertActorOwnsVportActorController(requestActorId, actorId)` — reads `actor_owners` | Controller layer — fires before any DB read or write |
| TRAZE visibility toggle | NEEDS_VERIFICATION | `features/settings/vports/hooks/useVportDirectoryVisibility` |
| Business card settings | NEEDS_VERIFICATION | `features/settings/vports/hooks/useVportBusinessCardSettings` |

## Dual-Gate Pattern

The settings card applies two ownership checks:
1. `useVportOwnership` at the Final Screen — prevents non-owners from mounting the View Screen at all
2. `assertActorOwnsVportActorController` in the controller — enforces ownership at the DB call boundary before any write

This is the correct dual-gate pattern per the architecture contract.

## Write Path Flow

```
requestActorId + actorId
  → assertActorOwnsVportActorController (actor_owners read)
  → readVportProfileByActorIdDAL        (resolves profileId from actorId)
  → mapPayloadToRow                     (pure transform, no DB)
  → resolveVportCity                    (non-blocking; sets city_id if city found)
  → upsertVportPublicDetailsDAL         (vport.profile_public_details write)
  → invalidateVportPublicDetails(actorId) (in-memory cache bust, no DB)
```

## Public Impact

`vport.profile_public_details` data is consumed by:
- Public VPORT business cards (external-facing)
- TRAZE directory pages (traffic.vibezcitizens.com)
- QR code landing pages

Incorrect ownership enforcement at any layer would allow overwriting another actor's externally visible identity data.

## DB-Level RLS

**NEEDS_VERIFICATION** — `vport.profile_public_details` RLS policy not audited. See SETTINGS-FIND-001.
