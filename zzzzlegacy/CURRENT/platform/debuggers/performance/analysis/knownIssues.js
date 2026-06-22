// debuggers/performance/analysis/knownIssues.js
// Rule-based matcher that connects live duplicate query groups to known VCSM bottlenecks.
// Source of truth: logan/performance/vcsm.performance.known-bottlenecks.md
// DEV-ONLY. Pure analysis, no side effects.

/**
 * Known issue rules. Each rule tests a duplicate query group and returns
 * a match descriptor if the group matches a documented bottleneck.
 *
 * To add a new rule: append an entry with { id, name, category, test, description, status, action }.
 * The `test` function receives a duplicate group object from detectDuplicateQueries():
 *   { key, table, method, queryName, queries, count, totalDurationMs, severity }
 * and optionally the current route string.
 */
const KNOWN_ISSUE_RULES = [
  {
    id: 'bootstrap-duplication',
    name: 'Bootstrap Duplication',
    category: 'duplicate-query',
    affectedRoutes: ['/feed', '/profile', '/notifications', '/settings', '/chat', '/explore'],
    description: 'Platform bootstrap queries (identity/app-context) repeated across components. Multiple independent callers resolve platform state before cache is populated.',
    status: 'partial',
    action: 'Strengthen request-scope cache reuse. Consider a single bootstrap RPC returning all platform tables.',
    test: (group) => {
      const bootstrapTables = [
        'platform.user_app_actor_links',
        'platform.user_app_state',
        'platform.user_app_preferences',
        'platform.v_user_app_context',
      ]
      return bootstrapTables.some((t) => group.table === t)
    },
  },
  {
    id: 'notification-recipient-duplication',
    name: 'Notification Recipient Duplication',
    category: 'duplicate-query',
    affectedRoutes: ['/notifications'],
    description: 'notification.recipients read multiple times per navigation: inbox fetch, badge count, and actor resolution each query independently.',
    status: 'open',
    action: 'Consolidate recipient reads into a single DAL call. Use notification engine cached count instead of re-querying.',
    test: (group) => {
      return group.table === 'notification.recipients'
    },
  },
  {
    id: 'profile-duplicate-fetch',
    name: 'Profile Duplicate Fetch',
    category: 'duplicate-query',
    affectedRoutes: ['/profile'],
    description: 'public.profiles fetched multiple times for the same actor on profile routes. Hydration engine and profile view independently resolve profile data.',
    status: 'fixed',
    action: 'Resolved with 6-slice profile architecture. Monitor for regression.',
    test: (group, route) => {
      if (group.table !== 'public.profiles') return false
      return route ? route.startsWith('/profile') : true
    },
  },
  {
    id: 'privacy-triple-read',
    name: 'Privacy Triple-Read',
    category: 'duplicate-query',
    affectedRoutes: ['/profile', '/feed'],
    description: 'vc.actor_privacy_settings read 3x per profile navigation: visibility gate, content gate, and follow-button check.',
    status: 'fixed',
    action: 'Resolved with TTL cache on privacy DAL. All reads share cached result.',
    test: (group) => {
      return group.table === 'vc.actor_privacy_settings'
    },
  },
  {
    id: 'notification-inbox-pressure',
    name: 'Notification Inbox Pressure',
    category: 'high-volume',
    affectedRoutes: ['/notifications'],
    description: 'notification.inbox_items queried with high frequency. Combination of inbox fetch, badge polling (45s), and realtime-triggered refreshes.',
    status: 'partial',
    action: 'Review poll interval. Consider realtime-only with polling as degraded fallback.',
    test: (group) => {
      return group.table === 'notification.inbox_items' && group.count >= 3
    },
  },
  {
    id: 'identity-re-resolution',
    name: 'Identity Re-Resolution',
    category: 'duplicate-query',
    affectedRoutes: ['/feed', '/profile', '/notifications', '/settings', '/chat', '/explore'],
    description: 'vc.actors identity lookup repeated across component mounts. Each useIdentity() call triggered fresh DAL resolution.',
    status: 'fixed',
    action: 'Resolved with 60s identity result cache. Monitor actor-switch invalidation.',
    test: (group) => {
      return group.table === 'vc.actors' &&
        (group.queryName?.includes('identity') || group.queryName?.includes('actor_kind'))
    },
  },
  {
    id: 'chat-badge-noise',
    name: 'Chat Badge Polling Noise',
    category: 'background-noise',
    affectedRoutes: ['*'],
    description: 'chat.inbox_entries polled every 15s for unread badge count. Runs globally from BottomNavBar.',
    status: 'partial',
    action: 'Consider increasing poll interval or switching to realtime-only.',
    test: (group) => {
      return group.table === 'chat.inbox_entries' && group.count >= 3
    },
  },
]

/**
 * Match duplicate query groups against known VCSM bottleneck rules.
 *
 * @param {Array<{ key, table, method, queryName, queries, count, totalDurationMs, severity }>} duplicateGroups
 *   Output from detectDuplicateQueries()
 * @param {string} [currentRoute] Optional current route for route-specific matching
 * @returns {Array<{ ruleId, name, category, description, status, action, affectedRoutes, matchedGroup }>}
 */
export function matchKnownIssues(duplicateGroups, currentRoute = null) {
  if (!duplicateGroups || duplicateGroups.length === 0) return []

  const matches = []
  const matchedRuleIds = new Set()

  for (const group of duplicateGroups) {
    for (const rule of KNOWN_ISSUE_RULES) {
      if (matchedRuleIds.has(rule.id)) continue
      if (rule.test(group, currentRoute)) {
        matchedRuleIds.add(rule.id)
        matches.push({
          ruleId: rule.id,
          name: rule.name,
          category: rule.category,
          description: rule.description,
          status: rule.status,
          action: rule.action,
          affectedRoutes: rule.affectedRoutes,
          matchedGroup: {
            table: group.table,
            queryName: group.queryName,
            count: group.count,
            totalDurationMs: group.totalDurationMs,
          },
        })
      }
    }
  }

  // Sort: open issues first, then partial, then fixed
  const statusOrder = { open: 0, partial: 1, fixed: 2 }
  return matches.sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3))
}

/**
 * Get all known issue rules (for display/reference).
 * @returns {Array}
 */
export function getKnownIssueRules() {
  return KNOWN_ISSUE_RULES.map(({ test, ...rest }) => rest)
}
