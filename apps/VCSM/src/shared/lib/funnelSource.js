const FUNNEL_SOURCE_KEY = 'vcsm_funnel_source'

export function setFunnelSource(source) {
  try {
    sessionStorage.setItem(FUNNEL_SOURCE_KEY, source)
  } catch (_) { /* ignore */ }
}
