import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { compressImageFile } from '@/utils/compressImage';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';
import { Paperclip } from 'lucide-react';

export default function MessageInput({ conversationId, currentUser, onSend }) {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [mediaFile, setMediaFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      console.log('[Debug] File selected:', file);
      setMediaFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = messageText.trim();
    if (!content && !mediaFile) return;
    if (!currentUser?.id) return;

    setSending(true);
    const userId = currentUser.id;

    try {
      // ✅ Ensure user is in the conversation
      const { data: existingMember, error: memberError } = await supabase
        .from('conversation_members')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (memberError) throw new Error(`Member check failed: ${memberError.message}`);
      if (!existingMember) {
        console.log('[Debug] Adding user to conversation_members');
        const { error: insertMemberError } = await supabase
          .from('conversation_members')
          .insert([{ conversation_id: conversationId, user_id: userId }]);
        if (insertMemberError) throw new Error(`Member insert failed: ${insertMemberError.message}`);
      }

      // ✅ Upload media if present
      let media_url = null;
      if (mediaFile) {
        console.log('[Debug] Compressing media...');
        const compressed = await compressImageFile(mediaFile);
        console.log('[Debug] Compressed file:', compressed);

        const timestamp = Date.now();
        const filePath = `chat/${conversationId}/${timestamp}-${compressed.name}`;
        console.log('[Debug] Uploading to Cloudflare:', filePath);

        const { url, error: uploadErr } = await uploadToCloudflare(compressed, filePath);
        console.log('[Debug] Upload result:', { url, uploadErr });

        if (uploadErr) throw new Error(uploadErr);
        media_url = url;
      }

      // ✅ Insert message into Supabase
      const { data, error: insertError } = await supabase
        .from('messages')
        .insert([{
          content: content || null,
          conversation_id: conversationId,
          sender_id: userId,
          media_url,
        }])
        .select('id, content, sender_id, media_url, created_at')
        .single();

      if (insertError) throw new Error(`Message insert error: ${insertError.message}`);
      console.log('[Debug] Message inserted:', data);

      // ✅ Update conversation metadata
      const { error: updateError } = await supabase
        .from('conversations')
        .update({
          last_message: content || '📎 Media',
          last_sender_id: userId,
          last_sent_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      if (updateError) console.warn('[Warn] Conversation metadata update failed:', updateError.message);

      // ✅ Send message to UI
      onSend({
        ...data,
        sender: {
          display_name:
            currentUser.profile?.display_name ||
            currentUser.user_metadata?.display_name ||
            'You',
          photo_url:
            currentUser.profile?.photo_url ||
            currentUser.user_metadata?.photo_url ||
            '/default-avatar.png',
        },
      });

      setMessageText('');
      setMediaFile(null);
    } catch (err) {
      console.error('[Error] Send failed:', err.message || err);
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center space-x-2 px-4 py-3 border-t border-gray-700 bg-black"
    >
      <label className="cursor-pointer text-gray-400 hover:text-white">
        <Paperclip size={18} />
        <input type="file" accept="image/*" onChange={handleFileChange} hidden />
      </label>

      <input
        type="text"
        className="flex-1 px-4 py-2 border border-gray-600 bg-black text-white rounded-full focus:outline-none"
        placeholder="Type a message..."
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        disabled={sending}
      />

      <button
        type="submit"
        className="px-4 py-2 bg-purple-600 text-white rounded-full disabled:opacity-50"
        disabled={sending || (!messageText.trim() && !mediaFile)}
      >
        Send
      </button>
    </form>
  );
}
