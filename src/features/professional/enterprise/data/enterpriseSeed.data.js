const SHARED_KNOWLEDGE = Object.freeze([
  {
    id: 'kb-ops-1',
    title: 'Incident Response Escalation Ladder',
    category: 'Operations',
    status: 'Published',
    updatedAt: '2 days ago',
    owner: 'Ops Council',
  },
  {
    id: 'kb-comp-1',
    title: 'Quarterly Compliance Readiness Checklist',
    category: 'Compliance',
    status: 'Published',
    updatedAt: '5 days ago',
    owner: 'Risk Office',
  },
  {
    id: 'kb-market-1',
    title: 'Vendor Onboarding and Scorecard Framework',
    category: 'Marketplace',
    status: 'Draft',
    updatedAt: '1 day ago',
    owner: 'Procurement',
  },
])

const SHARED_PLAYBOOKS = Object.freeze([
  {
    id: 'pb-1',
    name: 'Auto-route high severity items',
    domain: 'Operations',
    successRate: 94,
    runsThisWeek: 183,
  },
  {
    id: 'pb-2',
    name: 'Compliance evidence follow-up',
    domain: 'Compliance',
    successRate: 91,
    runsThisWeek: 92,
  },
  {
    id: 'pb-3',
    name: 'Supplier score downgrade alerts',
    domain: 'Marketplace',
    successRate: 89,
    runsThisWeek: 47,
  },
])

const SHARED_TIMELINE = Object.freeze([
  { id: 'tm-1', label: 'SLA breach prevented by auto-escalation', severity: 'low', when: '09:14' },
  { id: 'tm-2', label: 'New audit packet submitted', severity: 'medium', when: '10:42' },
  { id: 'tm-3', label: 'Vendor quality alert triaged', severity: 'high', when: '11:33' },
  { id: 'tm-4', label: 'Ops digest published to leads', severity: 'low', when: '12:20' },
])

const PROFESSION_DATA = Object.freeze({
  nurse: {
    kpis: {
      openItems: 18,
      onTrackPrograms: 7,
      auditReadiness: 93,
      partnerHealth: 88,
      weeklyResolutionRate: 84,
    },
    incidents: [
      { id: 'n-inc-1', title: 'ICU shift coverage risk', city: 'Austin', priority: 'critical', owner: 'Staffing desk', sla: '35m' },
      { id: 'n-inc-2', title: 'Traveler housing dispute', city: 'Austin', priority: 'high', owner: 'Housing desk', sla: '2h' },
      { id: 'n-inc-3', title: 'Medication cart workflow bottleneck', city: 'Dallas', priority: 'medium', owner: 'Facility operations', sla: '4h' },
      { id: 'n-inc-4', title: 'ER handoff delays', city: 'Austin', priority: 'high', owner: 'Clinical excellence', sla: '1h' },
    ],
    programs: [
      { id: 'n-prog-1', name: 'Housing trust network', status: 'On track', lead: 'Field coordination', coverage: 72 },
      { id: 'n-prog-2', name: 'Night shift resilience', status: 'At risk', lead: 'Workforce office', coverage: 56 },
      { id: 'n-prog-3', name: 'Facility review quality', status: 'On track', lead: 'Quality board', coverage: 81 },
    ],
    audits: [
      { id: 'n-aud-1', control: 'Credential verification logs', status: 'Pass', dueIn: '6 days' },
      { id: 'n-aud-2', control: 'Protected data access review', status: 'Watch', dueIn: '2 days' },
      { id: 'n-aud-3', control: 'Incident response drill evidence', status: 'Pass', dueIn: '12 days' },
    ],
    vendors: [
      { id: 'n-vdr-1', name: 'Metro Housing Collective', type: 'Housing', score: 92, city: 'Austin' },
      { id: 'n-vdr-2', name: 'Pulse Meal Network', type: 'Food VPORT', score: 87, city: 'Austin' },
      { id: 'n-vdr-3', name: 'Rapid Transit Crew', type: 'Commute', score: 81, city: 'Dallas' },
    ],
  },
  chef: {
    kpis: {
      openItems: 14,
      onTrackPrograms: 6,
      auditReadiness: 90,
      partnerHealth: 85,
      weeklyResolutionRate: 79,
    },
    incidents: [
      { id: 'c-inc-1', title: 'Cold chain alert - seafood', city: 'Miami', priority: 'critical', owner: 'Kitchen safety', sla: '20m' },
      { id: 'c-inc-2', title: 'Prep line throughput drop', city: 'Miami', priority: 'high', owner: 'Service operations', sla: '1h' },
      { id: 'c-inc-3', title: 'Supplier delivery variance', city: 'Orlando', priority: 'medium', owner: 'Procurement', sla: '3h' },
      { id: 'c-inc-4', title: 'Allergen labeling mismatch', city: 'Miami', priority: 'high', owner: 'Compliance kitchen', sla: '40m' },
    ],
    programs: [
      { id: 'c-prog-1', name: 'Menu margin optimization', status: 'On track', lead: 'Revenue ops', coverage: 68 },
      { id: 'c-prog-2', name: 'Supplier reliability matrix', status: 'On track', lead: 'Procurement', coverage: 74 },
      { id: 'c-prog-3', name: 'Food quality excellence', status: 'At risk', lead: 'Kitchen QA', coverage: 49 },
    ],
    audits: [
      { id: 'c-aud-1', control: 'Temperature compliance logs', status: 'Pass', dueIn: '5 days' },
      { id: 'c-aud-2', control: 'Allergen policy verification', status: 'Watch', dueIn: '1 day' },
      { id: 'c-aud-3', control: 'Sanitation evidence package', status: 'Pass', dueIn: '11 days' },
    ],
    vendors: [
      { id: 'c-vdr-1', name: 'Atlantic Fresh Supply', type: 'Supplier', score: 89, city: 'Miami' },
      { id: 'c-vdr-2', name: 'PrepTech Equipment', type: 'Equipment', score: 83, city: 'Orlando' },
      { id: 'c-vdr-3', name: 'City Bento VPORT', type: 'Food VPORT', score: 91, city: 'Miami' },
    ],
  },
  driver: {
    kpis: {
      openItems: 11,
      onTrackPrograms: 5,
      auditReadiness: 92,
      partnerHealth: 86,
      weeklyResolutionRate: 82,
    },
    incidents: [
      { id: 'd-inc-1', title: 'Route congestion cluster', city: 'Chicago', priority: 'high', owner: 'Dispatch ops', sla: '25m' },
      { id: 'd-inc-2', title: 'Fleet battery degradation signal', city: 'Chicago', priority: 'critical', owner: 'Fleet engineering', sla: '45m' },
      { id: 'd-inc-3', title: 'Partner pickup wait spike', city: 'Detroit', priority: 'medium', owner: 'Partner operations', sla: '2h' },
      { id: 'd-inc-4', title: 'Driver safety report backlog', city: 'Chicago', priority: 'high', owner: 'Safety desk', sla: '1h' },
    ],
    programs: [
      { id: 'd-prog-1', name: 'High velocity lane program', status: 'On track', lead: 'Dispatch', coverage: 77 },
      { id: 'd-prog-2', name: 'Fleet readiness automation', status: 'On track', lead: 'Fleet ops', coverage: 70 },
      { id: 'd-prog-3', name: 'Driver retention playbook', status: 'At risk', lead: 'People ops', coverage: 53 },
    ],
    audits: [
      { id: 'd-aud-1', control: 'Vehicle safety checklist compliance', status: 'Pass', dueIn: '7 days' },
      { id: 'd-aud-2', control: 'Driver incident closure quality', status: 'Watch', dueIn: '3 days' },
      { id: 'd-aud-3', control: 'Dispatch routing evidence archive', status: 'Pass', dueIn: '10 days' },
    ],
    vendors: [
      { id: 'd-vdr-1', name: 'Metro Fleet Parts', type: 'Fleet', score: 84, city: 'Chicago' },
      { id: 'd-vdr-2', name: 'RouteSense Analytics', type: 'Software', score: 90, city: 'Chicago' },
      { id: 'd-vdr-3', name: 'North Dock Network', type: 'Partner', score: 82, city: 'Detroit' },
    ],
  },
})

export function getEnterpriseSeedByProfession(professionKey) {
  const profile = PROFESSION_DATA[professionKey] ?? PROFESSION_DATA.nurse
  return {
    ...profile,
    knowledge: SHARED_KNOWLEDGE,
    playbooks: SHARED_PLAYBOOKS,
    timeline: SHARED_TIMELINE,
  }
}
