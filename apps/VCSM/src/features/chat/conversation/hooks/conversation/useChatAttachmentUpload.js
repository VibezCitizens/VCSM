import { useMediaUpload } from '@media'

/**
 * Feature hook: upload a single chat image attachment.
 *
 * Wraps the media engine's useMediaUpload with the chat_attachment scope.
 * Components and hooks use this — they do not import from @media or the
 * Cloudflare service directly.
 *
 * @param {{ actorId: string }} params
 * @returns {{
 *   upload:    (file: File, opts?: { extraPath?: string }) => Promise<import('@media').MediaUploadResult>,
 *   uploading: boolean,
 *   error:     Error|null,
 *   reset:     () => void,
 * }}
 */
export function useChatAttachmentUpload({ actorId }) {
  return useMediaUpload({ scope: 'chat_attachment', ownerActorId: actorId })
}
