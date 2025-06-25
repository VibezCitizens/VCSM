// src/features/chat/hooks/useEncryption.js

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { decryptAESMessage, encryptAESMessage } from '@/utils/crypto';

export function useEncryption(conversationId) {
  const [sharedKey, setSharedKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) return;

    const fetchKey = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('conversation_keys')
        .select('shared_key')
        .eq('conversation_id', conversationId)
        .maybeSingle();

      if (error) {
        console.error('🔐 Encryption key fetch error:', error);
        alert('Encryption is still initializing. Please wait...');
      } else if (data?.shared_key) {
        setSharedKey(data.shared_key);
        console.log('✅ Shared encryption key loaded');
      } else {
        console.warn('⚠️ No key found yet for this conversation');
      }

      setLoading(false);
    };

    fetchKey();
  }, [conversationId]);

  const encryptMessage = async (plainText) => {
    if (!sharedKey) throw new Error('Encryption key not loaded');
    return encryptAESMessage(sharedKey, plainText);
  };

  const decryptMessage = async (ciphertext, iv) => {
    if (!sharedKey) throw new Error('Encryption key not loaded');
    if (!iv) throw new Error('Missing IV for decryption');
    return decryptAESMessage(sharedKey, ciphertext, iv);
  };

  return {
    encryptMessage,
    decryptMessage,
    encryptionReady: !!sharedKey && !loading,
  };
}
