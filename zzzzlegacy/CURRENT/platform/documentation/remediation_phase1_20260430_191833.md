# Contract Remediation — Phase 1
**Date:** 2026-04-30 19:18:33
**Branch:** main
**Backup directory:** zNOTFORPRODUCTION/zcontract/doc/backups/20260430_191833/

---

## Git Status Summary (at time of backup)
Branch has existing uncommitted changes across Traffic app and VCSM app from prior sessions.
No VCSM/src files related to this remediation were dirty at time of backup.

---

## Files Changed

### Deleted (3 .bak files — production safety)
| File | Reason |
|------|--------|
| `apps/VCSM/src/app/routes/index.jsx.batchC.bak` | Backup artifacts must not ship to production builds |
| `apps/VCSM/src/learning/controller/administration/adminAccess.js.batchD2.bak` | Same — exposes internal refactoring history |
| `apps/VCSM/src/features/wanders/core/controllers/_ensureGuestUser.js.batchD1.bak` | Same |

### Modified (1 — identity adapter)
| File | Reason |
|------|--------|
| `apps/VCSM/src/features/identity/adapters/identity.adapter.js` | Add `useIdentity` export so 68 feature files have a correct adapter path to migrate toward. Zero behavior change — re-export only. |

### Created (1 — notifications adapter)
| File | Reason |
|------|--------|
| `apps/VCSM/src/features/notifications/adapters/notifications.adapter.js` | Creates the correct public surface for the notifications feature. All 9 external importers must route through this adapter, not `publish.js` directly. |

### Modified (17 — notifications import path migration)
| File | Reason |
|------|--------|
| `features/booking/controller/cancelBooking.controller.js` | Import `@/features/notifications/publish` → adapter |
| `features/booking/controller/confirmBooking.controller.js` | Same |
| `features/booking/controller/createBooking.controller.js` | Same |
| `features/booking/setup.js` | Same |
| `features/dashboard/vport/controller/vportPublicBooking.controller.js` | Same |
| `features/dashboard/vport/controller/vportTeam.controller.js` | Same |
| `features/post/commentcard/controller/commentReactions.controller.js` | Same |
| `features/post/commentcard/controller/postComments.controller.js` | Same |
| `features/post/postcard/controller/sendRose.controller.js` | Same |
| `features/post/postcard/controller/togglePostReaction.controller.js` | Same |
| `features/profiles/kinds/vport/controller/review/VportReviews.controller.js` | Same |
| `features/social/friend/request/controllers/followRequests.controller.js` | Same |
| `features/social/friend/subscribe/controllers/follow.controller.js` | Same |
| `features/upload/controllers/createPost.controller.js` | Same |
| `features/wanders/core/controllers/vportBusinessCard.controller.js` | Same |
| `dev/diagnostics/groups/notificationsFeature.group.js` | Same (dev-only diagnostic file) |

### Modified (1 — relative import fix)
| File | Reason |
|------|--------|
| `apps/VCSM/src/features/settings/profile/controller/profile.controller.core.js` | Replace `../dal/` and `../model/` relative imports with `@/` alias paths per contract rule |

---

## Contract Rules Applied
- Adapters must NOT export DAL, models, or controllers — only hooks, components, view screens (notifications.adapter.js enforces this)
- Features must NOT import another feature's internal files — adapter is now the public surface
- All imports must use `@/` alias paths — relative imports fixed in profile.controller.core.js
- `.bak` files must not ship to production

---

## Behavior Change
**None.** All changes are import path re-wiring only. No runtime logic, UI, schema, or media engine changes.
