// src/features/vgrid/useRoadReports.js
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function useRoadReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const subRef = useRef(null)

  const fetchCurrent = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('road_reports')
      .select('id, kind, lat, lng, description, created_at, expires_at, confidence')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) setError(error)
    else setReports(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCurrent()

    // Realtime: INSERT/UPDATE/DELETE
    const channel = supabase
      .channel('road_reports_stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'road_reports' },
        (payload) => {
          setReports(prev => {
            if (payload.eventType === 'INSERT') {
              const r = payload.new
              if (new Date(r.expires_at) <= new Date()) return prev
              return [r, ...prev]
            }
            if (payload.eventType === 'UPDATE') {
              const r = payload.new
              if (new Date(r.expires_at) <= new Date()) {
                return prev.filter(x => x.id !== r.id)
              }
              return prev.map(x => x.id === r.id ? r : x)
            }
            if (payload.eventType === 'DELETE') {
              const id = payload.old?.id
              return prev.filter(x => x.id !== id)
            }
            return prev
          })
        }
      )
      .subscribe()
    subRef.current = channel

    return () => {
      if (subRef.current) supabase.removeChannel(subRef.current)
    }
  }, [fetchCurrent])

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
        // expires_at auto 60m by default; you can override by adding expires_at here
      })
      .select()
      .single()
    if (error) throw error
    return data
  }, [])

  return { reports, loading, error, refresh: fetchCurrent, submitReport }
}
