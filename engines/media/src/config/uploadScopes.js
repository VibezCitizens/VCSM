import { BYTES } from './uploadLimits.js'

const IMAGE_MIMES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
])

const VIDEO_MIMES = Object.freeze([
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

const IMAGE_AND_VIDEO = Object.freeze([...IMAGE_MIMES, ...VIDEO_MIMES])

/**
 * Upload scope configs.
 *
 * Each scope defines:
 *   prefix      — R2 path prefix
 *   allowedMimes — explicit MIME whitelist (no accept-all)
 *   maxBytes    — size limit after compression
 *   maxFiles    — max files per upload batch
 *   compression — { maxDim, quality } for images, or null to skip
 *   mediaKinds  — ['image'] | ['image', 'video']
 */
export const UPLOAD_SCOPES = Object.freeze({
  vibe_post: {
    prefix: 'vibes',
    allowedMimes: IMAGE_AND_VIDEO,
    maxBytes: BYTES.MB_50,
    maxFiles: 10,
    compression: { maxDim: 1080, quality: 0.8 },
    mediaKinds: ['image', 'video'],
  },

  story_24drop: {
    prefix: 'stories',
    allowedMimes: IMAGE_AND_VIDEO,
    maxBytes: BYTES.MB_50,
    maxFiles: 10,
    compression: { maxDim: 1080, quality: 0.8 },
    mediaKinds: ['image', 'video'],
  },

  vdrop: {
    prefix: 'vdrops',
    allowedMimes: IMAGE_AND_VIDEO,
    maxBytes: BYTES.MB_50,
    maxFiles: 10,
    compression: { maxDim: 1080, quality: 0.8 },
    mediaKinds: ['image', 'video'],
  },

  user_avatar: {
    prefix: 'avatar-photos',
    allowedMimes: IMAGE_MIMES,
    maxBytes: BYTES.MB_5,
    maxFiles: 1,
    compression: { maxDim: 600, quality: 0.7 },
    mediaKinds: ['image'],
  },

  user_banner: {
    prefix: 'avatar-banners',
    allowedMimes: IMAGE_MIMES,
    maxBytes: BYTES.MB_5,
    maxFiles: 1,
    compression: { maxDim: 1080, quality: 0.8 },
    mediaKinds: ['image'],
  },

  vport_avatar: {
    prefix: 'vport-avatar-photos',
    allowedMimes: IMAGE_MIMES,
    maxBytes: BYTES.MB_5,
    maxFiles: 1,
    compression: null,
    mediaKinds: ['image'],
  },

  vport_banner: {
    prefix: 'vport-avatar-banners',
    allowedMimes: IMAGE_MIMES,
    maxBytes: BYTES.MB_5,
    maxFiles: 1,
    compression: { maxDim: 1080, quality: 0.8 },
    mediaKinds: ['image'],
  },

  portfolio_media: {
    prefix: 'portfolio',
    allowedMimes: IMAGE_AND_VIDEO,
    maxBytes: BYTES.MB_50,
    maxFiles: 10,
    compression: { maxDim: 1080, quality: 0.8 },
    mediaKinds: ['image', 'video'],
  },

  menu_item_photo: {
    prefix: 'menu-items',
    allowedMimes: IMAGE_MIMES,
    maxBytes: BYTES.MB_5,
    maxFiles: 1,
    compression: { maxDim: 1080, quality: 0.8 },
    mediaKinds: ['image'],
  },

  chat_attachment: {
    prefix: 'vox',
    allowedMimes: IMAGE_AND_VIDEO,
    maxBytes: BYTES.MB_50,
    maxFiles: 1,
    compression: { maxDim: 1600, quality: 0.82 },
    mediaKinds: ['image', 'video'],
  },

  design_asset: {
    prefix: 'design-assets',
    allowedMimes: IMAGE_MIMES,
    maxBytes: BYTES.MB_10,
    maxFiles: 1,
    compression: null,
    mediaKinds: ['image'],
  },

  wanders_card: {
    prefix: 'wanders',
    allowedMimes: IMAGE_MIMES,
    maxBytes: BYTES.MB_5,
    maxFiles: 1,
    compression: { maxDim: 1080, quality: 0.8 },
    mediaKinds: ['image'],
  },

  vport_creation_avatar: {
    prefix: 'vport-avatar-photos',
    allowedMimes: IMAGE_MIMES,
    maxBytes: BYTES.MB_5,
    maxFiles: 1,
    compression: { maxDim: 600, quality: 0.8 },
    mediaKinds: ['image'],
  },
})

export function getScopeConfig(scope) {
  const config = UPLOAD_SCOPES[scope]
  if (!config) throw new Error(`[MediaEngine] Unknown upload scope: "${scope}"`)
  return config
}
