// ============================================================
// Media Engine — Public API
// ============================================================
// Host apps must call configureMediaEngine() once at startup
// before any upload hooks or controllers are used.
//
// DAL internals (r2Upload.dal.js) are NOT exported.
// ============================================================

export { configureMediaEngine } from './config.js'

export { uploadMediaController } from './controller/uploadMedia.controller.js'

export { useMediaUpload } from './hooks/useMediaUpload.js'

export { validateMediaFile, validateMediaFiles } from './lib/validateMediaFile.js'
export { classifyMediaFile } from './lib/classifyMediaFile.js'

export { UPLOAD_SCOPES, getScopeConfig } from './config/uploadScopes.js'
export { BYTES, BLOCKED_MIMES } from './config/uploadLimits.js'
