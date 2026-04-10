/**
 * Fetch the client's public IP address from ipify.
 * Returns null on failure — never blocks the consent flow.
 */
export async function getPublicIp() {
  try {
    const res = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.ip ?? null
  } catch {
    return null
  }
}
