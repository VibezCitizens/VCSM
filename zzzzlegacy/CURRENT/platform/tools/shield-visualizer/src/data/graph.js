export const nodeTypeConfig = {
  nav: {
    label: 'Nav',
    color: '#94a3b8',
    bg: '#0f172a',
    border: '#475569',
  },
  button: {
    label: 'Button',
    color: '#38bdf8',
    bg: '#042235',
    border: '#0284c7',
  },
  route: {
    label: 'Route',
    color: '#6366f1',
    bg: '#1e1b4b',
    border: '#4338ca',
  },
  screen: {
    label: 'Screen',
    color: '#06b6d4',
    bg: '#051c2e',
    border: '#0e7490',
  },
  view: {
    label: 'View',
    color: '#22d3ee',
    bg: '#042330',
    border: '#0891b2',
  },
  component: {
    label: 'Component',
    color: '#64748b',
    bg: '#0f1923',
    border: '#334155',
  },
  hook: {
    label: 'Hook',
    color: '#a855f7',
    bg: '#1a0e2e',
    border: '#7c3aed',
  },
  controller: {
    label: 'Controller',
    color: '#f59e0b',
    bg: '#1c1208',
    border: '#d97706',
  },
  model: {
    label: 'Model',
    color: '#84cc16',
    bg: '#0f1a03',
    border: '#65a30d',
  },
  adapter: {
    label: 'Adapter',
    color: '#a3e635',
    bg: '#0e1a02',
    border: '#84cc16',
  },
  engine: {
    label: 'Engine',
    color: '#fb923c',
    bg: '#1c0a04',
    border: '#ea580c',
  },
  store: {
    label: 'Store',
    color: '#ec4899',
    bg: '#1c0515',
    border: '#db2777',
  },
  cache: {
    label: 'Cache',
    color: '#facc15',
    bg: '#1c1602',
    border: '#ca8a04',
  },
  dal: {
    label: 'DAL',
    color: '#10b981',
    bg: '#071a0f',
    border: '#059669',
  },
  table: {
    label: 'DB Table',
    color: '#ef4444',
    bg: '#1c0909',
    border: '#dc2626',
  },
  provider: {
    label: 'Provider',
    color: '#e879f9',
    bg: '#1a0420',
    border: '#c026d3',
  },
  feature: {
    label: 'Feature',
    color: '#818cf8',
    bg: '#13122a',
    border: '#4f46e5',
  },
  'dal-file': {
    label: 'DAL File',
    color: '#34d399',
    bg: '#071a10',
    border: '#059669',
  },
  'dal-function': {
    label: 'DAL Fn',
    color: '#6ee7b7',
    bg: '#041a0c',
    border: '#10b981',
  },
  rpc: {
    label: 'RPC',
    color: '#22d3ee',
    bg: '#041c24',
    border: '#0891b2',
  },
  risk: {
    label: 'Risk',
    color: '#fb923c',
    bg: '#1c0d04',
    border: '#ea580c',
  },
  'pending-review': {
    label: 'Pending',
    color: '#fbbf24',
    bg: '#1c1604',
    border: '#d97706',
  },
}

export const edgeTypeConfig = {
  navigates_to: {
    stroke: '#6366f1',
    style: { stroke: '#6366f1', strokeWidth: 1.5 },
    dashed: true,
    label: 'nav',
  },
  renders: {
    stroke: '#06b6d4',
    style: { stroke: '#06b6d4', strokeWidth: 1.5 },
    dashed: false,
    label: 'renders',
  },
  calls: {
    stroke: '#10b981',
    style: { stroke: '#10b981', strokeWidth: 1.5 },
    dashed: false,
    label: 'calls',
  },
  reads: {
    stroke: '#f59e0b',
    style: { stroke: '#f59e0b', strokeWidth: 1.5 },
    dashed: false,
    label: 'reads',
  },
  writes: {
    stroke: '#ef4444',
    style: { stroke: '#ef4444', strokeWidth: 1.5 },
    dashed: false,
    label: 'writes',
  },
  owns: {
    stroke: '#e879f9',
    style: { stroke: '#e879f9', strokeWidth: 1.5 },
    dashed: true,
    label: 'owns',
  },
  contains: {
    stroke: '#334155',
    style: { stroke: '#334155', strokeWidth: 1 },
    dashed: true,
    label: 'contains',
  },
  exports: {
    stroke: '#34d399',
    style: { stroke: '#34d399', strokeWidth: 1 },
    dashed: false,
    label: 'exports',
  },
  inserts: {
    stroke: '#f97316',
    style: { stroke: '#f97316', strokeWidth: 1.5 },
    dashed: false,
    label: 'inserts',
  },
  updates: {
    stroke: '#fbbf24',
    style: { stroke: '#fbbf24', strokeWidth: 1.5 },
    dashed: false,
    label: 'updates',
  },
  deletes: {
    stroke: '#ef4444',
    style: { stroke: '#ef4444', strokeWidth: 1.5 },
    dashed: false,
    label: 'deletes',
  },
  upserts: {
    stroke: '#fb923c',
    style: { stroke: '#fb923c', strokeWidth: 1.5 },
    dashed: false,
    label: 'upserts',
  },
  calls_rpc: {
    stroke: '#22d3ee',
    style: { stroke: '#22d3ee', strokeWidth: 1.5 },
    dashed: true,
    label: 'rpc',
  },
  violates: {
    stroke: '#dc2626',
    style: { stroke: '#dc2626', strokeWidth: 2 },
    dashed: true,
    label: 'violates',
  },
  pending_review: {
    stroke: '#fbbf24',
    style: { stroke: '#fbbf24', strokeWidth: 1.5 },
    dashed: true,
    label: 'pending',
  },
}

export const reviewConfig = {
  SENTRY:  { color: '#f59e0b', bg: '#1c1208', desc: 'Architecture boundary' },
  VENOM:   { color: '#ef4444', bg: '#1c0909', desc: 'Trust boundary / security' },
  LOKI:    { color: '#06b6d4', bg: '#051c2e', desc: 'Runtime verification' },
  KRAVEN:  { color: '#a855f7', bg: '#1a0e2e', desc: 'Performance audit' },
  IRONMAN: { color: '#f97316', bg: '#1c0e04', desc: 'Ownership review' },
  FALCON:  { color: '#6366f1', bg: '#1e1b4b', desc: 'iOS native parity' },
  LOGAN:   { color: '#84cc16', bg: '#0f1a03', desc: 'Docs sync / dead code' },
  THOR:    { color: '#10b981', bg: '#071a0f', desc: 'Release gate' },
}

export const confidenceConfig = {
  STATICALLY_TRACED:      { color: '#10b981', symbol: '✓', label: 'Statically Traced' },
  INFERRED:               { color: '#f59e0b', symbol: '~', label: 'Inferred' },
  NEEDS_LOKI_VERIFICATION:{ color: '#06b6d4', symbol: '?', label: 'Needs Loki Verify' },
}

export const runtimeStatusConfig = {
  VERIFIED:   { color: '#10b981', bg: '#071a0f', label: 'Verified' },
  UNVERIFIED: { color: '#475569', bg: '#0f172a', label: 'Unverified' },
  RISKY:      { color: '#f59e0b', bg: '#1c1208', label: 'Risky' },
  BLOCKED:    { color: '#ef4444', bg: '#1c0909', label: 'Blocked' },
}
