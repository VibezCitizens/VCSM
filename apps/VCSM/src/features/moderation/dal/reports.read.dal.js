import { supabase } from '@/services/supabase/supabaseClient'
import { REPORT_COLUMNS } from '@/features/moderation/dal/reports.dal.columns'

function logModerationDalError(...args) {
  if (import.meta.env?.DEV) console.error(...args)
}

export async function getReportRowById({ reportId }) {
  const { data, error } = await supabase
    .schema('moderation')
    .from('reports')
    .select(REPORT_COLUMNS)
    .eq('id', reportId)
    .maybeSingle()

  if (error) logModerationDalError('[DAL][moderation.reports.getById] error', { reportId, error })
  return { row: data ?? null, error }
}

export async function getReportRowByDedupeKey({ reporterActorId, dedupeKey }) {
  const { data, error } = await supabase
    .schema('moderation')
    .from('reports')
    .select(REPORT_COLUMNS)
    .eq('reporter_actor_id', reporterActorId)
    .eq('dedupe_key', dedupeKey)
    .maybeSingle()

  if (error) logModerationDalError('[DAL][moderation.reports.getByDedupeKey] error', { reporterActorId, dedupeKey, error })
  return { row: data ?? null, error }
}
