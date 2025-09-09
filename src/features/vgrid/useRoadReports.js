// src/features/vgrid/useRoadReports.js
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

/**
 * useRoadReports (no Realtime)
 * - Initial fetch on mount
 * - Optional polling with `pollMs` (default: off)
 * - Local prune of expired rows every minute
 */
export default function useRoadReports({ pollMs = 0 } = {}) {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastFetched, setLastFetched] = useState(null)

  const pruneExpired = useCallback(() => {
    const now = Date.now()
    setReports(prev => prev.filter(r => new Date(r.expires_at).getTime() > now))
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('road_reports')
      .select('id, kind, lat, lng, description, created_at, expires_at, confidence')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) setError(error)
    else {
      setReports(data || [])
      setLastFetched(new Date())
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Optional polling (off by default)
  useEffect(() => {
    if (!pollMs) return
    const id = setInterval(refresh, pollMs)
    return () => clearInterval(id)
  }, [pollMs, refresh])

  // Periodic local prune to drop newly expired items without a refetch
  useEffect(() => {
    const id = setInterval(pruneExpired, 60_000)
    return () => clearInterval(id)
  }, [pruneExpired])

  const submitReport = useCallback(async ({ kind, lat, lng, description = '' }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Must be logged in')

    const { data, error } = await supabase
      .from('road_reports')
      .insert({
        user_id: user.id,
        kind,
        lat,
        lng,
        description,
        // expires_at: you can pass one to override the DB default (60m)
      })
      .select()
      .single()

    if (error) throw error

    // Optimistic add (only if still valid)
    if (new Date(data.expires_at) > new Date()) {
      setReports(prev => [data, ...prev])
    }
    return data
  }, [])

  return {
    reports,
    loading,
    error,
    lastFetched,
    refresh,
    submitReport,
  }
}
