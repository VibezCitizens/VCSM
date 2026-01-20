// src/features/moderation/hooks/useReportFlow.js
// ============================================================
// useReportFlow (HOOK)
// ------------------------------------------------------------
// - Owns UI timing/state for reporting
// - Calls controllers only (authoritative)
// - No DAL / no Supabase
// ============================================================

import { useCallback, useMemo, useState, useEffect } from 'react'
import { createReportController } from '@/features/moderation/controllers/report.controller'

/**
 * context shape:
 * {
 *   objectType: 'actor'|'post'|'comment'|'message'|'conversation'|'profile'|'vport'
 *   objectId: string (uuid)
 *   conversationId?: string|null
 *   postId?: string|null
 *   messageId?: string|null
 *   dedupeKey?: string|null
 *   title?: string|null
 *   subtitle?: string|null
 * }
 */

export default function useReportFlow({ reporterActorId }) {
  const [open, setOpen] = useState(false)
  const [context, setContext] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastReportId, setLastReportId] = useState(null)

  const canReport = useMemo(() => !!reporterActorId, [reporterActorId])

  useEffect(() => {
    console.log('[useReportFlow] state', {
      reporterActorId,
      canReport,
      open,
      loading,
      context,
      error,
      lastReportId,
    })
  }, [reporterActorId, canReport, open, loading, context, error, lastReportId])

  const start = useCallback((ctx) => {
    console.log('[useReportFlow] start()', {
      ctx,
      reporterActorId,
      stack: new Error('[useReportFlow] start stack').stack,
    })

    setError(null)
    setLastReportId(null)
    setContext(ctx ?? null)
    setOpen(true)
  }, [reporterActorId])

  const close = useCallback(() => {
    console.log('[useReportFlow] close() called', {
      reporterActorId,
      stack: new Error('[useReportFlow] close stack').stack,
    })

    setOpen(false)
    setContext(null)
    setLoading(false)
    setError(null)
  }, [reporterActorId])

  const submit = useCallback(
    async ({ reasonCode, reasonText }) => {
      console.log('[useReportFlow] submit() called', {
        reasonCode,
        reasonText,
        canReport,
        context,
        reporterActorId,
        stack: new Error('[useReportFlow] submit stack').stack,
      })

      if (!canReport) return
      if (!context?.objectType || !context?.objectId) return
      if (!reasonCode) return

      setLoading(true)
      setError(null)

      const { ok, report, error: controllerError } =
        await createReportController({
          reporterActorId,
          objectType: context.objectType,
          objectId: context.objectId,
          reasonCode,
          reasonText: reasonText ?? null,

          conversationId: context.conversationId ?? null,
          postId: context.postId ?? null,
          messageId: context.messageId ?? null,

          dedupeKey: context.dedupeKey ?? null,
        })

      console.log('[useReportFlow] submit result', {
        ok,
        controllerError,
        reportId: report?.id ?? null,
      })

      setLoading(false)

      if (!ok || controllerError) {
        console.log('[useReportFlow] submit FAILED', { controllerError })
        setError(controllerError ?? new Error('Report failed'))
        return
      }

      console.log('[useReportFlow] submit OK -> closing modal', {
        reportId: report?.id ?? null,
      })

      setLastReportId(report?.id ?? null)
      setOpen(false)
      setContext(null)
    },
    [canReport, context, reporterActorId]
  )

  return {
    // state
    open,
    context,
    loading,
    error,
    lastReportId,
    canReport,

    // handlers
    start,
    close,
    submit,
  }
}
