function includesNeedle(value, needle) {
  return String(value || '').toLowerCase().includes(needle)
}

function scoreFromAudits(audits = []) {
  if (!audits.length) return 0
  const weighted = audits.reduce((sum, item) => {
    if (item.status === 'Pass') return sum + 100
    if (item.status === 'Watch') return sum + 68
    return sum + 40
  }, 0)
  return Math.round(weighted / audits.length)
}

function scoreFromVendors(vendors = []) {
  if (!vendors.length) return 0
  const total = vendors.reduce((sum, item) => sum + Number(item.score || 0), 0)
  return Math.round(total / vendors.length)
}

function filterByQuery(items, query, fields) {
  if (!query) return items
  return items.filter((item) => fields.some((field) => includesNeedle(item[field], query)))
}

function filterByCity(items, city) {
  if (!city || city === 'all') return items
  return items.filter((item) => includesNeedle(item.city, city))
}

function filterByPriority(items, priority) {
  if (!priority || priority === 'all') return items
  return items.filter((item) => item.priority === priority)
}

export function buildEnterpriseView({
  seed,
  query = '',
  city = 'all',
  priority = 'all',
}) {
  const needle = query.trim().toLowerCase()

  const incidents = filterByPriority(
    filterByCity(filterByQuery(seed.incidents, needle, ['title', 'owner', 'city', 'priority']), city),
    priority
  )

  const programs = filterByQuery(seed.programs, needle, ['name', 'lead', 'status'])
  const audits = filterByQuery(seed.audits, needle, ['control', 'status', 'dueIn'])
  const vendors = filterByCity(filterByQuery(seed.vendors, needle, ['name', 'type', 'city']), city)
  const knowledge = filterByQuery(seed.knowledge, needle, ['title', 'category', 'owner', 'status'])
  const playbooks = filterByQuery(seed.playbooks, needle, ['name', 'domain'])
  const timeline = filterByQuery(seed.timeline, needle, ['label', 'severity', 'when'])

  const openCritical = incidents.filter((item) => item.priority === 'critical').length
  const openHigh = incidents.filter((item) => item.priority === 'high').length

  const kpis = {
    openItems: incidents.length,
    onTrackPrograms: programs.filter((item) => item.status === 'On track').length,
    auditReadiness: scoreFromAudits(audits),
    partnerHealth: scoreFromVendors(vendors),
    weeklyResolutionRate: Number(seed.kpis?.weeklyResolutionRate || 0),
    openCritical,
    openHigh,
  }

  return {
    kpis,
    incidents,
    programs,
    audits,
    vendors,
    knowledge,
    playbooks,
    timeline,
  }
}
