import { MarkerType } from 'reactflow'
import { edgeTypeConfig } from '../data/graph'
import dalMapRaw from '../data/generated/dal-map.graph.json'

// ── Layout constants ──────────────────────────────────────────────────────────
const X = { feature: 0, file: 280, fn: 560, db: 860, risk: 1160 }
const FN_H     = 44   // px per function row
const FILE_GAP = 28   // extra gap between file groups
const DB_H     = 56   // px per db/rpc node
const RISK_H   = 72   // px per risk node

// ── Pre-index raw graph ───────────────────────────────────────────────────────
const rawNodeMap = {}
for (const n of dalMapRaw.nodes) rawNodeMap[n.id] = n

// feature → [raw file nodes]
const featureFilesMap = {}
// file.id → [raw fn nodes]
const fileToFnsMap = {}

for (const n of dalMapRaw.nodes) {
  if (n.type === 'feature') continue
  if (n.type === 'dal-file' && n.feature) {
    if (!featureFilesMap[n.feature]) featureFilesMap[n.feature] = []
    featureFilesMap[n.feature].push(n)
  }
}
for (const e of dalMapRaw.edges) {
  if (e.type === 'exports') {
    if (!fileToFnsMap[e.source]) fileToFnsMap[e.source] = []
    const fn = rawNodeMap[e.target]
    if (fn) fileToFnsMap[e.source].push(fn)
  }
}

// ── Node / edge converters ────────────────────────────────────────────────────
function processNode(raw, pos) {
  return {
    id: raw.id,
    type: 'archNode',
    position: pos,
    data: {
      nodeType: raw.type,
      label: raw.label,
      filePath: raw.path || '',
      riskLevel: (raw.risk || 'NONE').toLowerCase(),
      runtimeStatus: raw.status === 'ACTIVE' ? 'VERIFIED' : 'UNVERIFIED',
      feature: raw.feature || '',
      operations: raw.operations || [],
      isDuplicate: raw.isDuplicate || false,
      dalFileCount: raw.dalFileCount,
      count: raw.count,
      notes: raw.operations?.length ? `ops: ${raw.operations.join(', ')}` : undefined,
    },
  }
}

function processEdge(raw) {
  const ec = edgeTypeConfig[raw.type] || {}
  return {
    id: raw.id,
    source: raw.source,
    target: raw.target,
    type: 'default',
    label: raw.label || raw.type,
    data: { edgeType: raw.type },
    style: ec.style || { stroke: '#334155', strokeWidth: 1 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 10,
      height: 10,
      color: ec.stroke || '#334155',
    },
    labelStyle: {
      fill: '#4b5563',
      fontSize: 8,
      fontFamily: 'system-ui, sans-serif',
      fontWeight: 500,
    },
    labelBgStyle: { fill: '#09090b', fillOpacity: 0.9 },
    labelBgPadding: [3, 5],
    labelBgBorderRadius: 3,
  }
}

// ── Full graph (pre-processed, stored positions) ──────────────────────────────
const ALL_NODES = dalMapRaw.nodes.map((n) => processNode(n, n.position || { x: 0, y: 0 }))
const ALL_EDGES = dalMapRaw.edges.map(processEdge)

// ── Feature-scoped layout ─────────────────────────────────────────────────────
function layoutForFeature(feature) {
  const files = featureFilesMap[feature] || []
  const featureRaw = dalMapRaw.nodes.find((n) => n.type === 'feature' && n.label === feature)

  const positioned = []
  const includedIds = new Set()

  // ── 1. Files + functions — compute Y from actual function count ─────────────
  const fileLayouts = []   // { file, fileY, fns, totalH }
  let curY = 40

  for (const file of files) {
    const fns = fileToFnsMap[file.id] || []
    const h = Math.max(1, fns.length) * FN_H
    fileLayouts.push({ file, fileY: curY, fns, h })
    curY += h + FILE_GAP
  }

  const totalFilesH = curY

  // ── 2. Feature node — centered on file column ───────────────────────────────
  if (featureRaw) {
    const featY = totalFilesH / 2 - 20
    positioned.push(processNode(featureRaw, { x: X.feature, y: featY }))
    includedIds.add(featureRaw.id)
  }

  // ── 3. Place file + function nodes ─────────────────────────────────────────
  const fnIds = new Set()
  const fileIds = new Set()

  for (const { file, fileY, fns, h } of fileLayouts) {
    const fileCenterY = fileY + h / 2 - FN_H / 2
    positioned.push(processNode(file, { x: X.file, y: fileCenterY }))
    includedIds.add(file.id)
    fileIds.add(file.id)

    fns.forEach((fn, i) => {
      positioned.push(processNode(fn, { x: X.fn, y: fileY + i * FN_H }))
      includedIds.add(fn.id)
      fnIds.add(fn.id)
    })
  }

  // ── 4. Collect DB nodes (tables/views/rpcs) used by this feature ────────────
  const dbEdges = dalMapRaw.edges.filter((e) => fnIds.has(e.source) && rawNodeMap[e.target])
  const dbIdsSeen = new Set()
  const dbNodes = []
  for (const e of dbEdges) {
    if (!dbIdsSeen.has(e.target)) {
      const n = rawNodeMap[e.target]
      if (n && (n.type === 'table' || n.type === 'view' || n.type === 'rpc')) {
        dbNodes.push(n)
        dbIdsSeen.add(e.target)
      }
    }
  }

  // Center DB column vertically against the file column
  const dbTotalH = dbNodes.length * DB_H
  const dbStartY = Math.max(40, (totalFilesH - dbTotalH) / 2)

  dbNodes.forEach((n, i) => {
    positioned.push(processNode(n, { x: X.db, y: dbStartY + i * DB_H }))
    includedIds.add(n.id)
  })

  // ── 5. Collect risk nodes attached to files ─────────────────────────────────
  const riskEdges = dalMapRaw.edges.filter(
    (e) => fileIds.has(e.source) && rawNodeMap[e.target]?.type === 'risk'
  )
  const riskIdsSeen = new Set()
  const riskNodes = []
  for (const e of riskEdges) {
    if (!riskIdsSeen.has(e.target)) {
      riskNodes.push(rawNodeMap[e.target])
      riskIdsSeen.add(e.target)
    }
  }

  const riskTotalH = riskNodes.length * RISK_H
  const riskStartY = Math.max(40, (totalFilesH - riskTotalH) / 2)

  riskNodes.forEach((n, i) => {
    positioned.push(processNode(n, { x: X.risk, y: riskStartY + i * RISK_H }))
    includedIds.add(n.id)
  })

  // ── 6. Collect edges between visible nodes only ─────────────────────────────
  const visibleEdges = dalMapRaw.edges
    .filter((e) => includedIds.has(e.source) && includedIds.has(e.target))
    .map(processEdge)

  return { nodes: positioned, edges: visibleEdges }
}

// ── Public API ────────────────────────────────────────────────────────────────
export const DAL_FEATURES = dalMapRaw.metadata.features || []
export const DAL_METADATA = dalMapRaw.metadata

export function filterDALGraph(feature) {
  if (!feature || feature === 'all') return { nodes: ALL_NODES, edges: ALL_EDGES }
  return layoutForFeature(feature)
}

export const DAL_GRAPH = {
  id: 'dal-map',
  label: 'DAL Architecture Map',
  group: 'DAL',
  metadata: DAL_METADATA,
  nodes: ALL_NODES,
  edges: ALL_EDGES,
}
