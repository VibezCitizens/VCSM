/**
 * NOT CALLED — this file is retained for reference only.
 *
 * Client-side IP fetching is not suitable for legal consent records
 * because the returned IP is client-controlled and not server-authoritative.
 * IP capture must be moved to a server-side path (Supabase Edge Function).
 *
 * See: Carnage task — consent write Edge Function with server-side IP capture.
 */
export async function getPublicIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(800),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.ip ?? null
  } catch {
    return null
  }
}
