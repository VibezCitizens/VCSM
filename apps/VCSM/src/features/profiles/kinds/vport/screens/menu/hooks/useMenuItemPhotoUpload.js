import { useMediaUpload } from '@media'

/**
 * Feature hook: upload a single menu item photo.
 *
 * Wraps the media engine's useMediaUpload with the menu_item_photo scope.
 * Components use this hook — they do not import from @media or from
 * the Cloudflare service directly.
 *
 * @param {{ actorId: string }} params
 * @returns {{
 *   upload:    (file: File, opts?: { extraPath?: string }) => Promise<import('@media').MediaUploadResult>,
 *   uploading: boolean,
 *   error:     Error|null,
 *   reset:     () => void,
 * }}
 */
export function useMenuItemPhotoUpload({ actorId }) {
  return useMediaUpload({ scope: 'menu_item_photo', ownerActorId: actorId })
}
