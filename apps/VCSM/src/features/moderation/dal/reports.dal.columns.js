export const REPORT_COLUMNS =
  'id,reporter_domain,reporter_actor_id,target_domain,target_type,target_id,parent_target_domain,parent_target_type,parent_target_id,reason_code,reason_text,status,priority,assigned_domain,assigned_actor_id,reviewed_at,resolved_at,resolution,internal_note,dedupe_key,meta,created_at,updated_at'

export const REPORT_EVENT_COLUMNS =
  'id,report_id,actor_domain,actor_id,event_type,data,created_at'

export const MOD_ACTION_COLUMNS =
  'id,report_id,actor_domain,actor_id,target_domain,target_type,target_id,action_type,reason,expires_at,meta,created_at'

export const POST_HIDE_COLUMNS =
  'id,is_hidden,hidden_at,hidden_by_actor_id'

export const MESSAGE_HIDE_COLUMNS =
  'id,is_hidden,hidden_at,hidden_by_actor_id'

export const INBOX_ENTRY_FOLDER_COLUMNS =
  'conversation_id,actor_id,folder,last_message_id,last_message_at,unread_count,pinned,archived,muted,history_cutoff_at,archived_until_new,partner_display_name,partner_username,partner_photo_url'
