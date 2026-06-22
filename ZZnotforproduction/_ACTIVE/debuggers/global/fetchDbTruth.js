// debuggers/global/fetchDbTruth.js
// ============================================================
// DEV-ONLY: Fetch live database truth for the current user.
// Uses the existing Supabase client. Read-only.
// ============================================================

export async function fetchDbTruth(supabase, userId) {
  if (!import.meta.env.DEV) return null
  if (!supabase || !userId) return null

  const results = {}

  try {
    // 1. Profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, display_name, discoverable')
      .eq('id', userId)
      .maybeSingle()
    results.profile = profile ?? null

    // 2. App
    const { data: app } = await supabase
      .schema('platform')
      .from('apps')
      .select('id, key, name, is_active')
      .eq('key', 'vcsm')
      .eq('is_active', true)
      .maybeSingle()
    results.app = app ?? null

    if (!app?.id) return results

    // 3. Access
    const { data: accessRows } = await supabase
      .schema('platform')
      .from('user_app_access')
      .select('user_id, app_id, status, granted_at, revoked_at')
      .eq('user_id', userId)
      .eq('app_id', app.id)
      .limit(1)
    results.access = accessRows?.[0] ?? null

    // 4. Account
    const { data: accountRows } = await supabase
      .schema('platform')
      .from('user_app_accounts')
      .select('id, user_id, app_id, status, activated_at, last_seen_at, created_at, updated_at')
      .eq('user_id', userId)
      .eq('app_id', app.id)
      .limit(5)
    results.accounts = accountRows ?? []
    const account = accountRows?.[0] ?? null
    results.account = account

    if (!account?.id) return results

    // 5. Preferences
    const { data: prefs } = await supabase
      .schema('platform')
      .from('user_app_preferences')
      .select('user_app_account_id, active_actor_link_id, last_actor_link_id, updated_at')
      .eq('user_app_account_id', account.id)
      .maybeSingle()
    results.preferences = prefs ?? null

    // 6. State
    const { data: state } = await supabase
      .schema('platform')
      .from('user_app_state')
      .select('user_app_account_id, onboarding_status, account_status, last_actor_link_id, requires_onboarding, requires_actor_selection, first_login_at, last_login_at, updated_at')
      .eq('user_app_account_id', account.id)
      .maybeSingle()
    results.state = state ?? null

    // 7. Actor links
    const { data: links } = await supabase
      .schema('platform')
      .from('user_app_actor_links')
      .select('id, actor_id, actor_kind, actor_source, is_primary, is_switchable, status, display_name_snapshot, created_at, updated_at')
      .eq('user_app_account_id', account.id)
      .order('is_primary', { ascending: false })
    results.actorLinks = links ?? []

    // 8. VC actors owned by this user
    const { data: actors } = await supabase
      .schema('vc')
      .from('actors')
      .select('id, kind, profile_id, vport_id, is_void, user_app_account_id, created_at')
      .or(`profile_id.eq.${userId}`)
      .limit(10)
    results.actors = actors ?? []

    // Also get actors via actor_owners
    const { data: ownerRows } = await supabase
      .schema('vc')
      .from('actor_owners')
      .select('actor_id, user_id, is_primary, is_void')
      .eq('user_id', userId)
    results.actorOwners = ownerRows ?? []

    // 9. Vports owned
    const vportActorIds = (actors ?? []).filter(a => a.kind === 'vport' && a.vport_id).map(a => a.vport_id)
    if (vportActorIds.length > 0) {
      const { data: vports } = await supabase
        .schema('vc')
        .from('vports')
        .select('id, owner_user_id, name, slug, is_active, created_at')
        .in('id', vportActorIds)
      results.vports = vports ?? []
    } else {
      results.vports = []
    }

  } catch (err) {
    results.error = err?.message ?? String(err)
  }

  results.fetchedAt = new Date().toISOString()
  return results
}
