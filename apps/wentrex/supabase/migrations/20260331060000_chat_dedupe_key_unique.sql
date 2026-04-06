-- ============================================================
-- Add unique index on chat.conversations.dedupe_key
-- ============================================================
-- Required for idempotent direct-conversation creation.
-- The engine uses dedupe_key = 'direct:<sorted_actor_ids>' to
-- ensure only one 1-to-1 conversation exists per actor pair.
--
-- WHERE dedupe_key IS NOT NULL: allows group/channel conversations
-- to have NULL dedupe_key without conflicting.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS chat_conversations_dedupe_key_unique
  ON chat.conversations (dedupe_key)
  WHERE dedupe_key IS NOT NULL;
