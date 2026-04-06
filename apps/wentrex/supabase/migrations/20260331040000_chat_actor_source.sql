-- ============================================================
-- Phase 2: Add actor_source to key chat.* actor-bearing tables
-- ------------------------------------------------------------
-- Introduces explicit domain identity (actor_source + actor_id)
-- into shared chat storage.
--
-- All current rows are Wentrex-migrated data → backfill as
-- actor_source = 'learning'.
--
-- Phase 2 Wentrex-first. VC backfill is deferred to Phase 4.
-- ============================================================

-- ============================================================
-- 1. chat.conversation_members
-- ============================================================
ALTER TABLE chat.conversation_members
  ADD COLUMN IF NOT EXISTS actor_source text DEFAULT NULL
  CONSTRAINT chat_conversation_members_actor_source_check
    CHECK (actor_source IN ('learning', 'vc'));

UPDATE chat.conversation_members
  SET actor_source = 'learning'
  WHERE actor_source IS NULL;

-- ============================================================
-- 2. chat.messages  (sender identity)
-- ============================================================
ALTER TABLE chat.messages
  ADD COLUMN IF NOT EXISTS sender_actor_source text DEFAULT NULL
  CONSTRAINT chat_messages_sender_actor_source_check
    CHECK (sender_actor_source IN ('learning', 'vc'));

UPDATE chat.messages
  SET sender_actor_source = 'learning'
  WHERE sender_actor_source IS NULL;

-- ============================================================
-- 3. chat.inbox_entries
-- ============================================================
ALTER TABLE chat.inbox_entries
  ADD COLUMN IF NOT EXISTS actor_source text DEFAULT NULL
  CONSTRAINT chat_inbox_entries_actor_source_check
    CHECK (actor_source IN ('learning', 'vc'));

UPDATE chat.inbox_entries
  SET actor_source = 'learning'
  WHERE actor_source IS NULL;

-- ============================================================
-- 4. chat.message_receipts
-- ============================================================
ALTER TABLE chat.message_receipts
  ADD COLUMN IF NOT EXISTS actor_source text DEFAULT NULL
  CONSTRAINT chat_message_receipts_actor_source_check
    CHECK (actor_source IN ('learning', 'vc'));

UPDATE chat.message_receipts
  SET actor_source = 'learning'
  WHERE actor_source IS NULL;

-- ============================================================
-- 5. chat.moderation_actions
-- ============================================================
ALTER TABLE chat.moderation_actions
  ADD COLUMN IF NOT EXISTS actor_source text DEFAULT NULL
  CONSTRAINT chat_moderation_actions_actor_source_check
    CHECK (actor_source IN ('learning', 'vc'));

UPDATE chat.moderation_actions
  SET actor_source = 'learning'
  WHERE actor_source IS NULL;

-- ============================================================
-- 6. chat.audit_log
-- ============================================================
ALTER TABLE chat.audit_log
  ADD COLUMN IF NOT EXISTS actor_source text DEFAULT NULL
  CONSTRAINT chat_audit_log_actor_source_check
    CHECK (actor_source IN ('learning', 'vc'));

UPDATE chat.audit_log
  SET actor_source = 'learning'
  WHERE actor_source IS NULL;

-- ============================================================
-- 7. chat.participant_snapshots
-- ============================================================
ALTER TABLE chat.participant_snapshots
  ADD COLUMN IF NOT EXISTS actor_source text DEFAULT NULL
  CONSTRAINT chat_participant_snapshots_actor_source_check
    CHECK (actor_source IN ('learning', 'vc'));

UPDATE chat.participant_snapshots
  SET actor_source = 'learning'
  WHERE actor_source IS NULL;

-- ============================================================
-- Indexes: actor_source lookups on the highest-traffic tables
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_conversation_members_actor_source
  ON chat.conversation_members (actor_source, actor_id);

CREATE INDEX IF NOT EXISTS idx_inbox_entries_actor_source
  ON chat.inbox_entries (actor_source, actor_id);

CREATE INDEX IF NOT EXISTS idx_messages_sender_actor_source
  ON chat.messages (sender_actor_source, sender_actor_id);

CREATE INDEX IF NOT EXISTS idx_message_receipts_actor_source
  ON chat.message_receipts (actor_source, actor_id);
