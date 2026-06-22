# Calendar — Performance Notes

## Hook Calls on Mount

| Hook | Fires | Notes |
|---|---|---|
| `useOwnerBookingResources` | Always (when `isOwner && actorId`) | Reads booking resources |
| `useBookingAvailability` | When `selectedResourceId` is set | Reads availability rules for selected resource |
| `useEnsureOwnerBookingResource` | Once per actorId, if no resource exists | Conditional write on first use; guarded by `didBootstrap` ref |
| `useVportAds` | Behind `releaseFlags.vportAdsPipeline` | Feature-flagged |

## Resource Bootstrap Guard

The `didBootstrap` ref prevents `useEnsureOwnerBookingResource` from firing more than once per `actorId` — even across re-renders. Resets when `actorId` changes.

## Availability Load Trigger

`useBookingAvailability` is enabled only after `selectedResourceId` is set. `selectedResourceId` defaults to `activeResources[0].id` when resources load. On a fresh mount with resources already existing: 2 sequential async operations (resources load → availability load).

## Known Issues

No KRAVEN audit performed. Availability rule load fires on every resource selection change.
