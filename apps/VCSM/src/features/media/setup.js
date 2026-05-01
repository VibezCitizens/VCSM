// src/features/media/setup.js
// ============================================================
// VCSM Media Engine — Startup Configuration
// ============================================================
// Wires VCSM-specific transport into the shared media engine
// via dependency injection. Must be called once before render.
// ============================================================

import { configureMediaEngine } from '@media'
import {
  uploadToCloudflare,
  publicUrlForKey,
} from '@/services/cloudflare/uploadToCloudflare'

let _configured = false

export function setupVcsmMediaEngine() {
  if (_configured) return
  _configured = true

  configureMediaEngine({
    uploadFn: uploadToCloudflare,
    publicUrlFn: publicUrlForKey,
  })
}
