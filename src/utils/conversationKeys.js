// src/utils/conversationKeys.js

import { supabase } from '@/lib/supabaseClient';

// ✅ Store a new AES key for a conversation (one row per conversation)
export async function storeConversationKey(conversationId, key) {
  const { error } = await supabase
    .from('conversation_keys')
    .insert({
      conversation_id: conversationId,
      shared_key: key,
    });

  if (error) {
    console.error('❌ Failed to store conversation key:', error);
    throw error;
  }

  console.log('✅ Stored new conversation key');
}

// ✅ Fetch the AES key for a conversation (shared, not per-user)
export async function getConversationKey(conversationId) {
  const { data, error } = await supabase
    .from('conversation_keys')
    .select('shared_key')
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (error) {
    console.error('❌ Failed to fetch conversation key:', error);
    throw error;
  }

  return data?.shared_key || null;
}

// 🚧 (Optional) Store per-user copies of the key for multi-key architecture
export async function createConversationKey(conversationId, userAId, userBId, key) {
  const { error } = await supabase
    .from('conversation_keys')
    .insert([
      {
        conversation_id: conversationId,
        user_id: userAId,
        shared_key: key,
      },
      {
        conversation_id: conversationId,
        user_id: userBId,
        shared_key: key,
      },
    ]);

  if (error) {
    console.error('❌ Failed to create per-user conversation keys:', error);
    throw error;
  }

  console.log('✅ Created per-user conversation keys');
}

