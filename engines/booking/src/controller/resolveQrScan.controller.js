import { dalGetQrLinkBySlug } from '../dal/qrLink.read.dal.js'
import { dalIncrementQrScanCountRaw } from '../dal/qrLink.write.dal.js'
import { mapQrLinkRow } from '../model/QrLink.model.js'

/**
 * Resolve a QR code scan: look up slug, increment scan count, return destination path.
 *
 * @param {{ slug: string }} params
 * @returns {{ destinationPath: string, qrLink: object }}
 */
export async function resolveQrScan({ slug }) {
  if (!slug) throw new Error('[BookingEngine] slug is required')

  const row = await dalGetQrLinkBySlug({ slug })
  if (!row) throw new Error('QR link not found.')

  // Fire-and-forget increment — do not block the redirect on this
  dalIncrementQrScanCountRaw({ qrLinkId: row.id, currentCount: row.scan_count ?? 0 }).catch(() => {})

  return {
    destinationPath: row.destination_path,
    qrLink:          mapQrLinkRow(row),
  }
}
