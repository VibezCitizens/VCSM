# VCSM Remote Upload Consistency Map

## Scope

- Focus: mutations where Cloudflare R2 upload happens before the authoritative database write
- Risk lens: orphaned remote objects, dangling URLs, duplicate uploads on retry

## Remote upload before DB persistence

| Mutation | Upload location | DB write that follows | Remote object created first? | Cleanup if DB fails? | Risk level | Recommended mitigation |
| --- | --- | --- | --- | --- | --- | --- |
| Create post (upload flow) | `apps/VCSM/src/features/upload/api/uploadMedia.js` | `apps/VCSM/src/features/upload/controllers/createPostController.js` -> `vc.posts`, `vc.post_media`, `vc.post_mentions` | Yes | No remote cleanup; only post-row rollback on media-row failure | High | Upload manifest + finalize RPC, or compensating R2 delete on failed post creation |
| Save user profile | `apps/VCSM/src/features/settings/profile/hooks/useProfileUploads.js` | `apps/VCSM/src/features/settings/profile/controller/profile.controller.js` -> `public.profiles` | Yes | No | High | Temp upload token + finalize, or garbage-collect unused keys |
| Save VPORT profile | `apps/VCSM/src/features/settings/profile/hooks/useProfileUploads.js` | `profile.controller.js` -> `vc.vports` | Yes | No | High | Same fix as user profile flow |
| Create VPORT with avatar | `apps/VCSM/src/features/vport/CreateVportForm.jsx` `uploadAvatar()` | `apps/VCSM/src/features/vport/dal/vport.core.dal.js` -> `vc.create_vport` | Yes | No | High | Include avatar reference inside a server-owned create contract or clean orphaned upload on failure |
| Save menu item with image | `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormModal.jsx` `uploadImageIfNeeded()` | menu item save controller/DALs -> `vc.vport_actor_menu_items` | Yes | No | High | Finalize upload only after item row exists, or delete key on save failure |
| Upload design asset | `apps/VCSM/src/features/dashboard/flyerBuilder/designStudio/controller/designStudio.assetsExports.controller.js` `ctrlUploadDesignAsset()` | `dalCreateDesignAsset` -> `vc.design_assets` | Yes | No | High | Upload to temp key, then move/finalize via asset-create RPC |
| Publish Wanders from builder with image | `apps/VCSM/src/features/wanders/core/controllers/publishWandersFromBuilder.controller.js` | `createWandersCard` + `createWandersMailboxItem` -> `wanders.cards`, `wanders.mailbox_items` | Yes | No | High | Upload token + card finalize or async orphan cleanup |
| Chat image send | `apps/VCSM/src/features/chat/conversation/hooks/conversation/useSendMessageActions.js` `handleAttach()` | `onSendMessage` -> engine or legacy message send | Yes | No | High | Wrap upload reference and message send in one server-owned attach RPC or add client cleanup on send failure |

## Related upload-first flows that stay risky even when DB write is local-only

| Mutation | File | Note |
| --- | --- | --- |
| Upload profile avatar/banner to R2 | `apps/VCSM/src/features/settings/profile/hooks/useProfileUploads.js` | Upload helper itself is isolated, but every caller still inherits orphan risk if the DB save fails later |
| Upload post media to R2 | `apps/VCSM/src/features/upload/api/uploadMedia.js` | Remote media batch can succeed even if later post persistence never happens |
| Upload menu item image to R2 | `apps/VCSM/src/features/profiles/kinds/vport/screens/menu/components/VportActorMenuItemFormModal.jsx` | Modal treats upload as part of save, but cleanup is absent |

## Engineering guidance

1. Treat remote uploads as provisional until the DB row is finalized.
2. Prefer `reserve -> upload -> finalize` or `upload -> finalize RPC -> durable row` patterns over direct client upload + later write.
3. If provisional uploads must remain, stamp them with a mutation token so a cleanup worker can delete unused objects.
