// ─── Command Category Config ──────────────────────────────────────────────────
export const commandNodeTypeConfig = {
  orchestrator: { label: 'Orchestrator', color: '#f59e0b', bg: '#1c1208', border: '#d97706' },
  analysis:     { label: 'Analysis',     color: '#a855f7', bg: '#1a0e2e', border: '#7c3aed' },
  documentation:{ label: 'Documentation',color: '#06b6d4', bg: '#051c2e', border: '#0e7490' },
  security:     { label: 'Security',     color: '#ef4444', bg: '#1c0909', border: '#dc2626' },
  compliance:   { label: 'Compliance',   color: '#6366f1', bg: '#1e1b4b', border: '#4338ca' },
  debug:        { label: 'Debug',        color: '#eab308', bg: '#1a1607', border: '#ca8a04' },
  native:       { label: 'Native',       color: '#10b981', bg: '#071a0f', border: '#059669' },
  release:      { label: 'Release',      color: '#3b82f6', bg: '#0f1f3d', border: '#2563eb' },
  migration:    { label: 'Migration',    color: '#f97316', bg: '#1c0e06', border: '#ea580c' },
}

// ─── Edge Type Config ─────────────────────────────────────────────────────────
export const commandEdgeTypeConfig = {
  routes_to: {
    stroke: '#f59e0b',
    style: { stroke: '#f59e0b', strokeWidth: 1.5 },
    dashed: true,
    label: 'routes',
  },
  feeds: {
    stroke: '#a855f7',
    style: { stroke: '#a855f7', strokeWidth: 1.5 },
    dashed: false,
    label: 'feeds',
  },
  assembles: {
    stroke: '#3b82f6',
    style: { stroke: '#3b82f6', strokeWidth: 1.5 },
    dashed: false,
    label: 'assembles',
  },
  gates: {
    stroke: '#ef4444',
    style: { stroke: '#ef4444', strokeWidth: 2 },
    dashed: false,
    label: 'gates',
  },
}

// ─── Nodes ────────────────────────────────────────────────────────────────────
// Layout:
//   Row 0  y=20   — Orchestrators       (Wolverine, NickFury)
//   Row 1  y=220  — Root inputs         (ARCHITECT, Loki, DB, SHIELD, Captain, session-summary)
//   Row 2  y=420  — Dependent analysis  (Venom, Ironman, Kraven, Vision, Carnage, Deadpool)
//   Row 3  y=620  — Compliance + Docs   (Sentry, review-contract, Logan, Falcon)
//   Row 4  y=820  — Native extension    (WinterSoldier)
//   Row 5  y=1020 — AvengersAssemble
//   Row 6  y=1220 — Thor (final gate)

export const commandNodes = [

  // ── Row 0: Orchestrators ────────────────────────────────────────────────────
  {
    id: 'wolverine',
    type: 'archNode',
    position: { x: 580, y: 20 },
    data: {
      nodeType: 'orchestrator',
      label: 'Wolverine',
      filePath: '.claude/commands/Wolverine.md',
      riskLevel: 'high',
      authorityLevel: 'FULL_WRITABLE',
      notes: 'Main planning, routing, and execution orchestrator. Classifies tasks, enforces workspace boundaries, routes specialists, and gates execution with APPROVE / EXECUTE / PROCEED.',
      meta: {
        authority: 'FULL_WRITABLE',
        outputPath: '_ACTIVE/planning/[month]/[DD]/',
        upstream: 'none',
        downstream: 'SENTRY, LOGAN (post-impl)',
      },
    },
  },
  {
    id: 'nickfury',
    type: 'archNode',
    position: { x: 810, y: 20 },
    data: {
      nodeType: 'orchestrator',
      label: 'NickFury',
      filePath: '.claude/commands/NickFury.md',
      riskLevel: 'high',
      authorityLevel: 'FULL_WRITABLE',
      notes: 'Parallel build orchestrator for side missions. Runs a completely separate intake from Wolverine (FurySignal queue). Never takes over the main queue. Scope must be explicitly declared.',
      meta: {
        authority: 'FULL_WRITABLE',
        outputPath: '_ACTIVE/planning/fury/[month]/[DD]/',
        upstream: 'none',
        downstream: 'SENTRY, DEADPOOL, LOGAN, DB, ARCHITECT (via FurySignal)',
      },
    },
  },

  // ── Row 1: Root inputs (no upstream deps) ───────────────────────────────────
  {
    id: 'architect',
    type: 'archNode',
    position: { x: 0, y: 220 },
    data: {
      nodeType: 'analysis',
      label: 'ARCHITECT',
      filePath: '.claude/commands/ARCHITECT.md',
      riskLevel: 'medium',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Repository architecture cartographer. Maps feature structure, layer hierarchy, DB reads, DAL usage, N+1 risk, and engine boundaries. Read-only — never modifies source code.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_CANONICAL/logan/marvel/architect/',
        upstream: 'none',
        downstream: 'SENTRY, VENOM, IRONMAN, LOGAN',
        runOrder: '1',
      },
    },
  },
  {
    id: 'loki',
    type: 'archNode',
    position: { x: 220, y: 220 },
    data: {
      nodeType: 'analysis',
      label: 'Loki',
      filePath: '.claude/commands/Loki.md',
      riskLevel: 'medium',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Runtime truth and execution trace authority. Inspects query amplification, render state, hydration traces, and realtime event monitoring. Never modifies production code.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_ACTIVE/audits/runtime/',
        upstream: 'none',
        downstream: 'KRAVEN, DEADPOOL, VISION',
        runOrder: '3',
      },
    },
  },
  {
    id: 'db',
    type: 'archNode',
    position: { x: 440, y: 220 },
    data: {
      nodeType: 'analysis',
      label: 'DB',
      filePath: '.claude/commands/DB.md',
      riskLevel: 'medium',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Database inspection and schema analysis. Reads tables, policies, indexes, and query plans. Read-only by default — all schema changes must go through Carnage migration plan.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '(inline findings)',
        upstream: 'none',
        downstream: 'CARNAGE (if change needed)',
      },
    },
  },
  {
    id: 'shield',
    type: 'archNode',
    position: { x: 660, y: 220 },
    data: {
      nodeType: 'security',
      label: 'SHIELD',
      filePath: '.claude/commands/SHIELD.md',
      riskLevel: 'medium',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'IP safety and governance meta-orchestration authority. Reviews licenses, third-party assets, AI-generated code, and Cerebro command registry truth. CRITICAL findings block release.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_ACTIVE/audits/ip-safety/',
        upstream: 'none',
        downstream: 'THOR (if blocking IP risk)',
        runOrder: '10',
      },
    },
  },
  {
    id: 'captain',
    type: 'archNode',
    position: { x: 880, y: 220 },
    data: {
      nodeType: 'documentation',
      label: 'Captain',
      filePath: '.claude/commands/CAPTAIN.md',
      riskLevel: 'low',
      authorityLevel: 'UTILITY',
      notes: 'Future ideas and next-session planning capture. Records future features, debugging follow-ups, architecture ideas. Never executes tasks — only captures for later promotion.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_CANONICAL/logan/marvel/captain/',
        upstream: 'none',
        downstream: 'none',
      },
    },
  },
  {
    id: 'session-summary',
    type: 'archNode',
    position: { x: 1100, y: 220 },
    data: {
      nodeType: 'documentation',
      label: 'session-summary',
      filePath: '.claude/commands/session-summary.md',
      riskLevel: 'low',
      authorityLevel: 'UTILITY',
      notes: 'End-of-session audit log and context handoff. Creates structured records of completed work, decisions, changed files, open items, and prompt provenance for IP auditability.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_HISTORY/session-summaries/YYYY-MM/',
        upstream: 'none',
        downstream: 'none',
      },
    },
  },

  // ── Row 2: Dependent analysis ────────────────────────────────────────────────
  {
    id: 'venom',
    type: 'archNode',
    position: { x: 0, y: 420 },
    data: {
      nodeType: 'security',
      label: 'Venom',
      filePath: '.claude/commands/Venom.md',
      riskLevel: 'high',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Security sheriff and trust-boundary governance. Inspects authorization, actor ownership, input sanitization, auth flows, and exposed internal IDs. CRITICAL or HIGH findings block release.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_ACTIVE/audits/security/',
        upstream: 'ARCHITECT',
        downstream: 'SENTRY, THOR',
        runOrder: '2',
      },
    },
  },
  {
    id: 'ironman',
    type: 'archNode',
    position: { x: 220, y: 420 },
    data: {
      nodeType: 'analysis',
      label: 'Ironman',
      filePath: '.claude/commands/Ironman.md',
      riskLevel: 'medium',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Feature ownership and responsibility mapping authority. Identifies who owns each DAL, controller, and service. Documents ownership chains per feature. Read-only.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_CANONICAL/logan/marvel/ironman/',
        upstream: 'ARCHITECT',
        downstream: 'AVENGERSASSEMBLE',
      },
    },
  },
  {
    id: 'kraven',
    type: 'archNode',
    position: { x: 440, y: 420 },
    data: {
      nodeType: 'analysis',
      label: 'Kraven',
      filePath: '.claude/commands/Kraven.md',
      riskLevel: 'medium',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Performance governance and bottleneck hunter. Profiles render cycles, DAL query costs, cache efficiency, and bundle size. Produces findings reports — never implements fixes.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_ACTIVE/audits/performance/',
        upstream: 'LOKI',
        downstream: 'THOR',
        runOrder: '4',
      },
    },
  },
  {
    id: 'vision',
    type: 'archNode',
    position: { x: 660, y: 420 },
    data: {
      nodeType: 'analysis',
      label: 'Vision',
      filePath: '.claude/commands/Vision.md',
      riskLevel: 'medium',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Analytics intelligence authority. Governs instrumentation, behavioral telemetry, funnel tracking, conversion, retention analytics, event taxonomy, attribution integrity, and dashboard governance.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_ACTIVE/audits/analytics/ (vision_ prefix)',
        upstream: 'LOKI',
        downstream: 'THOR (if blocking)',
      },
    },
  },
  {
    id: 'carnage',
    type: 'archNode',
    position: { x: 880, y: 420 },
    data: {
      nodeType: 'migration',
      label: 'Carnage',
      filePath: '.claude/commands/Carnage.md',
      riskLevel: 'high',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Database migration governance. Inspects schema read-only and produces migration plans. No schema modification without explicit approval of the Carnage migration plan.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_ACTIVE/audits/migrations/',
        upstream: 'DB, VENOM',
        downstream: 'THOR',
        runOrder: '5',
      },
    },
  },
  {
    id: 'deadpool',
    type: 'archNode',
    position: { x: 1100, y: 420 },
    data: {
      nodeType: 'debug',
      label: 'Deadpool',
      filePath: '.claude/commands/Deadpool.md',
      riskLevel: 'high',
      authorityLevel: 'FULL_WRITABLE',
      notes: 'Root-cause debugging and forensic investigation (BUGS_BUNNY spec). Investigation-before-fix — proves the bug before touching code. A bug task may not be complete if the symptom still reproduces.',
      meta: {
        authority: 'FULL_WRITABLE',
        outputPath: '_ACTIVE/debuggers/[feature]/',
        upstream: 'LOKI',
        downstream: 'SENTRY (if arch touched), LOGAN',
        internalName: 'BUGS_BUNNY',
      },
    },
  },

  // ── Row 3: Compliance + Documentation ────────────────────────────────────────
  {
    id: 'sentry',
    type: 'archNode',
    position: { x: 0, y: 620 },
    data: {
      nodeType: 'compliance',
      label: 'Sentry',
      filePath: '.claude/commands/Sentry.md',
      riskLevel: 'high',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Architecture compliance and boundary enforcement. Reviews changed files against the architecture contract. MAJOR DRIFT findings block task completion.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_ACTIVE/audits/compliance/ (sentry_ prefix)',
        upstream: 'ARCHITECT',
        downstream: 'AVENGERSASSEMBLE, THOR',
        runOrder: '11',
      },
    },
  },
  {
    id: 'review-contract',
    type: 'archNode',
    position: { x: 220, y: 620 },
    data: {
      nodeType: 'compliance',
      label: 'review-contract',
      filePath: '.claude/commands/review-contract.md',
      riskLevel: 'medium',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Architecture contract compliance auditor. Verifies module layering, dependency direction, naming conventions, and identity surface rules. Read-only — explains violations, never auto-fixes.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_ACTIVE/audits/compliance/ (review-contract_ prefix)',
        upstream: 'ARCHITECT',
        downstream: 'AVENGERSASSEMBLE',
        runOrder: '9',
      },
    },
  },
  {
    id: 'logan',
    type: 'archNode',
    position: { x: 440, y: 620 },
    data: {
      nodeType: 'documentation',
      label: 'Logan',
      filePath: '.claude/commands/Logan.md',
      riskLevel: 'medium',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Documentation truth, drift detection, provenance, and governance sync authority. Docs must be read before code changes and updated only after implementation is verified.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_CANONICAL/logan/',
        upstream: 'ARCHITECT',
        downstream: 'AVENGERSASSEMBLE',
        runOrder: '8',
      },
    },
  },
  {
    id: 'falcon',
    type: 'archNode',
    position: { x: 660, y: 620 },
    data: {
      nodeType: 'native',
      label: 'Falcon',
      filePath: '.claude/commands/Falcon.md',
      riskLevel: 'medium',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Native parity governance authority. Governs PWA → Native transfer integrity, architecture alignment, runtime parity, trust-boundary parity, and native release readiness. Read-only.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_ACTIVE/native/',
        upstream: 'ARCHITECT, LOGAN',
        downstream: 'WINTERSOLDIER, AVENGERSASSEMBLE',
        runOrder: '6',
      },
    },
  },

  // ── Row 4: Native extension ──────────────────────────────────────────────────
  {
    id: 'wintersoldier',
    type: 'archNode',
    position: { x: 660, y: 820 },
    data: {
      nodeType: 'native',
      label: 'WinterSoldier',
      filePath: '.claude/commands/WinterSoldier.md',
      riskLevel: 'medium',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Android parity governance authority. Must not begin until Falcon completes native parity pass. Consumes Falcon output as Android transfer input. Read-only.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_ACTIVE/android/',
        upstream: 'FALCON',
        downstream: 'AVENGERSASSEMBLE',
        runOrder: '7',
      },
    },
  },

  // ── Row 5: Assembly ──────────────────────────────────────────────────────────
  {
    id: 'avengersassemble',
    type: 'archNode',
    position: { x: 330, y: 1020 },
    data: {
      nodeType: 'release',
      label: 'AvengersAssemble',
      filePath: '.claude/commands/AvengersAssemble.md',
      riskLevel: 'high',
      authorityLevel: 'GOVERNANCE_WRITABLE',
      notes: 'Full governance alignment ceremony. Coordinates all specialist commands in canonical run order (1–11) and synthesizes findings into one release evidence package for Thor.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_CANONICAL/logan/marvel/avengers-assembly/',
        upstream: 'All specialists',
        downstream: 'THOR',
        runOrder: '12',
      },
    },
  },

  // ── Row 6: Final gate ────────────────────────────────────────────────────────
  {
    id: 'thor',
    type: 'archNode',
    position: { x: 330, y: 1220 },
    data: {
      nodeType: 'release',
      label: 'Thor',
      filePath: '.claude/commands/Thor.md',
      riskLevel: 'critical',
      authorityLevel: 'RELEASE_GATE',
      notes: 'Release commander and final production gatekeeper. Only Thor can declare RELEASE APPROVED. No deployment proceeds without Thor approval. Consumes full AvengersAssemble evidence.',
      meta: {
        authority: 'GOVERNANCE_WRITABLE',
        outputPath: '_ACTIVE/audits/release/',
        upstream: 'AVENGERSASSEMBLE',
        downstream: 'none (final gate)',
        runOrder: 'Final',
      },
    },
  },
]

// ─── Edges ────────────────────────────────────────────────────────────────────

export const commandEdges = [
  // Wolverine → specialists (routes_to, animated dashed)
  { id: 'e-w-architect',      source: 'wolverine', target: 'architect',       type: 'smoothstep', animated: true,  label: 'routes', data: { edgeType: 'routes_to' } },
  { id: 'e-w-loki',           source: 'wolverine', target: 'loki',            type: 'smoothstep', animated: true,  label: 'routes', data: { edgeType: 'routes_to' } },
  { id: 'e-w-db',             source: 'wolverine', target: 'db',              type: 'smoothstep', animated: true,  label: 'routes', data: { edgeType: 'routes_to' } },
  { id: 'e-w-shield',         source: 'wolverine', target: 'shield',          type: 'smoothstep', animated: true,  label: 'routes', data: { edgeType: 'routes_to' } },
  { id: 'e-w-captain',        source: 'wolverine', target: 'captain',         type: 'smoothstep', animated: true,  label: 'routes', data: { edgeType: 'routes_to' } },
  { id: 'e-w-deadpool',       source: 'wolverine', target: 'deadpool',        type: 'smoothstep', animated: true,  label: 'routes', data: { edgeType: 'routes_to' } },
  { id: 'e-w-logan',          source: 'wolverine', target: 'logan',           type: 'smoothstep', animated: true,  label: 'routes', data: { edgeType: 'routes_to' } },
  { id: 'e-w-sessionsummary', source: 'wolverine', target: 'session-summary', type: 'smoothstep', animated: true,  label: 'routes', data: { edgeType: 'routes_to' } },
  { id: 'e-w-assemble',       source: 'wolverine', target: 'avengersassemble',type: 'smoothstep', animated: true,  label: 'routes', data: { edgeType: 'routes_to' } },

  // NickFury → Sentry (parallel workstream arch gate)
  { id: 'e-nf-sentry',   source: 'nickfury', target: 'sentry',   type: 'smoothstep', animated: false, label: 'routes', data: { edgeType: 'routes_to' } },
  { id: 'e-nf-deadpool', source: 'nickfury', target: 'deadpool', type: 'smoothstep', animated: false, label: 'routes', data: { edgeType: 'routes_to' } },

  // ARCHITECT feeds
  { id: 'e-arch-venom',          source: 'architect', target: 'venom',          type: 'smoothstep', label: 'feeds', data: { edgeType: 'feeds' } },
  { id: 'e-arch-ironman',        source: 'architect', target: 'ironman',        type: 'smoothstep', label: 'feeds', data: { edgeType: 'feeds' } },
  { id: 'e-arch-sentry',         source: 'architect', target: 'sentry',         type: 'smoothstep', label: 'feeds', data: { edgeType: 'feeds' } },
  { id: 'e-arch-logan',          source: 'architect', target: 'logan',          type: 'smoothstep', label: 'feeds', data: { edgeType: 'feeds' } },
  { id: 'e-arch-reviewcontract', source: 'architect', target: 'review-contract',type: 'smoothstep', label: 'feeds', data: { edgeType: 'feeds' } },

  // Loki feeds
  { id: 'e-loki-kraven',   source: 'loki', target: 'kraven',   type: 'smoothstep', label: 'feeds', data: { edgeType: 'feeds' } },
  { id: 'e-loki-deadpool', source: 'loki', target: 'deadpool', type: 'smoothstep', label: 'feeds', data: { edgeType: 'feeds' } },
  { id: 'e-loki-vision',   source: 'loki', target: 'vision',   type: 'smoothstep', label: 'feeds', data: { edgeType: 'feeds' } },

  // DB → Carnage
  { id: 'e-db-carnage', source: 'db', target: 'carnage', type: 'smoothstep', label: 'feeds', data: { edgeType: 'feeds' } },

  // Venom → Sentry (cross-check)
  { id: 'e-venom-sentry', source: 'venom', target: 'sentry', type: 'smoothstep', label: 'feeds', data: { edgeType: 'feeds' } },

  // Deadpool → Logan (post-debug doc update)
  { id: 'e-deadpool-logan', source: 'deadpool', target: 'logan', type: 'smoothstep', label: 'feeds', data: { edgeType: 'feeds' } },

  // Falcon → WinterSoldier (native iOS pass before Android)
  { id: 'e-falcon-ws', source: 'falcon', target: 'wintersoldier', type: 'smoothstep', label: 'feeds', data: { edgeType: 'feeds' } },

  // Specialists → AvengersAssemble (assembles evidence)
  { id: 'e-sentry-aa',         source: 'sentry',          target: 'avengersassemble', type: 'smoothstep', label: 'assembles', data: { edgeType: 'assembles' } },
  { id: 'e-reviewcontract-aa', source: 'review-contract', target: 'avengersassemble', type: 'smoothstep', label: 'assembles', data: { edgeType: 'assembles' } },
  { id: 'e-logan-aa',          source: 'logan',           target: 'avengersassemble', type: 'smoothstep', label: 'assembles', data: { edgeType: 'assembles' } },
  { id: 'e-ironman-aa',        source: 'ironman',         target: 'avengersassemble', type: 'smoothstep', label: 'assembles', data: { edgeType: 'assembles' } },
  { id: 'e-falcon-aa',         source: 'falcon',          target: 'avengersassemble', type: 'smoothstep', label: 'assembles', data: { edgeType: 'assembles' } },
  { id: 'e-ws-aa',             source: 'wintersoldier',   target: 'avengersassemble', type: 'smoothstep', label: 'assembles', data: { edgeType: 'assembles' } },

  // Blocking direct → Thor (parallel evidence gate)
  { id: 'e-kraven-thor',  source: 'kraven',  target: 'thor', type: 'smoothstep', label: 'gates', data: { edgeType: 'gates' } },
  { id: 'e-carnage-thor', source: 'carnage', target: 'thor', type: 'smoothstep', label: 'gates', data: { edgeType: 'gates' } },
  { id: 'e-vision-thor',  source: 'vision',  target: 'thor', type: 'smoothstep', label: 'gates', data: { edgeType: 'gates' } },
  { id: 'e-shield-thor',  source: 'shield',  target: 'thor', type: 'smoothstep', label: 'gates', data: { edgeType: 'gates' } },

  // AvengersAssemble → Thor (final ceremony gate)
  { id: 'e-aa-thor', source: 'avengersassemble', target: 'thor', type: 'smoothstep', animated: true, label: 'gates', data: { edgeType: 'gates' } },
]

// ─── Extended Command Details ─────────────────────────────────────────────────

export const commandDetails = {
  wolverine: {
    purpose: 'Primary work command. Classifies tasks, enforces workspace roots, routes specialists, and gates execution with mandatory approval.',
    keyRules: [
      'Always plan before execution',
      'Requires APPROVE / EXECUTE / PROCEED before any code change',
      'Enforces protected roots: VCSM, wentrex, Traffic, engines',
      'Routes all specialist commands automatically',
      'Manages queue: incoming → ready → active → backlog',
      'Creates Command Approval Tracker for multi-command tasks',
    ],
    canonicalRunOrder: null,
    writeAuthority: 'FULL_WRITABLE',
  },
  nickfury: {
    purpose: 'Parallel build orchestrator. Runs isolated side missions via FurySignal intake — completely separate from Wolverine\'s main queue.',
    keyRules: [
      'Uses FurySignal intake — never touches main .tp-active',
      'Scope must be explicitly declared before execution',
      'Can route: LOGAN, DEADPOOL, DB, SENTRY, review-contract, CAPTAIN, ARCHITECT',
      'All outputs must indicate NICK FURY ownership',
    ],
    canonicalRunOrder: null,
    writeAuthority: 'FULL_WRITABLE',
  },
  architect: {
    purpose: 'System cartographer. Produces reliable repository maps including feature structure, DAL read audit, N+1 risk, and engine consumption patterns.',
    keyRules: [
      'Read-only — never modifies application code',
      'Feeds: Venom, Ironman, Sentry, Logan, review-contract',
      'Produces graph files to _CANONICAL/logan/marvel/architect/graph-data/',
      'First command in canonical AvengersAssemble run order',
    ],
    canonicalRunOrder: 1,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  loki: {
    purpose: 'Runtime truth and execution trace authority. Attaches observability tooling in dev/debug contexts only.',
    keyRules: [
      'Read-only in production — dev/debug mode only',
      'Feeds Kraven for performance analysis',
      'Feeds Deadpool for root-cause investigation',
      'Feeds Vision for analytics trace alignment',
    ],
    canonicalRunOrder: 3,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  db: {
    purpose: 'Database inspection and schema analysis. Maps tables, policies, indexes, query plans, and relationship risks.',
    keyRules: [
      'Read-only by default — no CREATE / ALTER / DROP',
      'All schema changes must go through Carnage',
      'DB modification requires explicit user approval',
    ],
    canonicalRunOrder: null,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  shield: {
    purpose: 'IP safety authority and governance meta-orchestrator. Governs Cerebro — the canonical command registry.',
    keyRules: [
      'Reviews license contamination and patented workflow risk',
      'Reviews AI-generated code provenance',
      'Maintains Cerebro as single source of command truth',
      'CRITICAL findings block release',
    ],
    canonicalRunOrder: 10,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  captain: {
    purpose: 'Lightweight idea capture for future sessions. Records future features, debug follow-ups, architecture ideas, and next-session reminders.',
    keyRules: [
      'Never executes tasks — capture only',
      'Never modifies application code, engines, or database',
      'Stores ideas for later promotion into TP planning files',
    ],
    canonicalRunOrder: null,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  'session-summary': {
    purpose: 'End-of-session audit log. Creates structured records for next-session continuity and engineering audit trail.',
    keyRules: [
      'Only summarizes — never executes work',
      'Never marks planning files complete',
      'Records prompt provenance for IP and legal auditability',
      'Creates monthly summary at start of new month',
    ],
    canonicalRunOrder: null,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  venom: {
    purpose: 'Security sheriff. Inspects trust boundaries, actor ownership validation, input sanitization, auth flows, and exposed internal IDs.',
    keyRules: [
      'CRITICAL or HIGH findings must block release',
      'Read-only — never applies fixes',
      'Feeds Sentry for architecture cross-check',
      'Reviews booking security and RLS policy enforcement',
    ],
    canonicalRunOrder: 2,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  ironman: {
    purpose: 'Feature ownership mapper. Documents who owns each DAL, controller, and service across the repository.',
    keyRules: [
      'Read-only — documentation authority only',
      'Feeds AvengersAssemble with ownership evidence',
      'Writes to _CANONICAL/logan/marvel/ironman/',
    ],
    canonicalRunOrder: null,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  kraven: {
    purpose: 'Performance governance and bottleneck hunter. Profiles render cycles, query costs, cache efficiency, and bundle size.',
    keyRules: [
      'Produces findings reports — never implements fixes',
      'Feeds Thor directly as a performance gate',
      'Requires Loki runtime traces as upstream input',
    ],
    canonicalRunOrder: 4,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  vision: {
    purpose: 'Analytics intelligence authority. Governs instrumentation, behavioral telemetry, funnel tracking, conversion, retention analytics, event taxonomy, and attribution integrity.',
    keyRules: [
      'CRITICAL/HIGH findings on conversion-critical funnels block release',
      'Never modifies app code or analytics providers',
      'Governs analytics privacy and safety',
      'Reports persist with vision_ prefix in audits/analytics/',
    ],
    canonicalRunOrder: null,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  carnage: {
    purpose: 'Database migration governance. Produces migration plans — no schema changes without explicit plan approval.',
    keyRules: [
      'Read-only schema inspection',
      'Upstream: DB (schema read) + Venom (security check)',
      'Feeds Thor directly as a migration gate',
      'No schema modification without Carnage plan approval',
    ],
    canonicalRunOrder: 5,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  deadpool: {
    purpose: 'Root-cause debugging and forensic investigation (internal spec: BUGS_BUNNY). Investigation-before-fix — proves the bug before touching code.',
    keyRules: [
      'Bug not complete if visible symptom still reproduces',
      'Creates dev-only debuggers — never ships to production',
      'Post-debug: triggers Sentry if arch touched, Logan for doc update',
      'Requires Loki as upstream for runtime context',
      'Internal command spec is BUGS_BUNNY',
    ],
    canonicalRunOrder: null,
    writeAuthority: 'FULL_WRITABLE',
  },
  sentry: {
    purpose: 'Architecture compliance and boundary enforcement. Reviews changed files against the locked architecture contract.',
    keyRules: [
      'MAJOR DRIFT findings block task completion',
      'Can run Pre-Execution or Post-Execution',
      'Shares output path with review-contract (sentry_ file prefix)',
      'Post-execution preferred for architecture-sensitive changes',
    ],
    canonicalRunOrder: 11,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  'review-contract': {
    purpose: 'Architecture contract compliance auditor. Verifies layering, dependency direction, naming, and identity surface rules.',
    keyRules: [
      'Read-only — explains violations, never auto-fixes',
      'Shares output path with Sentry (review-contract_ file prefix)',
      'Feeds AvengersAssemble with compliance evidence',
    ],
    canonicalRunOrder: 9,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  logan: {
    purpose: 'Documentation truth, drift detection, provenance, and governance sync authority.',
    keyRules: [
      'Docs must be read before code changes',
      'Docs updated only after implementation is verified',
      'Creates immutable engine audit snapshots on engine changes',
      'Records prompt provenance (IP / legal auditability)',
      'Classifies docs as VERIFIED / PARTIAL / STALE / MISSING / CONTRADICTORY',
    ],
    canonicalRunOrder: 8,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  falcon: {
    purpose: 'Native parity governance authority. Governs PWA → Native transfer integrity, architecture alignment, runtime parity, trust-boundary parity, and native release readiness.',
    keyRules: [
      'Read-only — does not implement native code',
      'PWA is the behavioral blueprint unless explicitly overridden',
      'Must preserve actor ownership rules, booking trust, identity surface rules',
      'Must complete native parity pass before WinterSoldier begins Android',
      'Feeds AvengersAssemble with native parity evidence',
    ],
    canonicalRunOrder: 6,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  wintersoldier: {
    purpose: 'Android parity governance authority. Must not begin until Falcon completes native parity pass for the same module.',
    keyRules: [
      'Consumes Falcon output as Android transfer input',
      'Read-only — does not implement Android code',
      'Feeds AvengersAssemble with Android parity evidence',
    ],
    canonicalRunOrder: 7,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  avengersassemble: {
    purpose: 'Full governance alignment ceremony. Coordinates all specialist commands in canonical run order and synthesizes one release evidence package.',
    keyRules: [
      'Runs specialists in canonical order: 1 ARCHITECT → 11 Sentry',
      'Produces single evidence package for Thor',
      'All required commands must be APPROVED or CAUTION before Thor',
      'BLOCKED findings from any specialist halt the ceremony',
    ],
    canonicalRunOrder: 12,
    writeAuthority: 'GOVERNANCE_WRITABLE',
  },
  thor: {
    purpose: 'Release commander and final production gatekeeper. No deployment proceeds without THOR approval.',
    keyRules: [
      'Only Thor declares RELEASE APPROVED',
      'Consumes full AvengersAssemble evidence package',
      'Blocking findings from any specialist prevent Thor approval',
      'CAUTION findings may pass with monitoring commitment',
    ],
    canonicalRunOrder: 'Final',
    writeAuthority: 'RELEASE_GATE',
  },
}
