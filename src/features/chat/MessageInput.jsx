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
      const { data: existingMember } = await supabase
        .from('conversation_members')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .maybeSingle();

      if (!existingMember) {
        await supabase.from('conversation_members').insert([
          { conversation_id: conversationId, user_id: userId },
        ]);
      }

      let media_url = null;
      if (mediaFile) {
        const compressed = await compressImageFile(mediaFile);
        const timestamp = Date.now();
        const path = `chat/${conversationId}/${timestamp}-${compressed.name}`;
        const { url, error } = await uploadToCloudflare(compressed, path);
        if (error) throw new Error(`Media upload error: ${error}`);
        media_url = url;
      }

      const { data: newMessage, error: insertError } = await supabase
        .from('messages')
        .insert([
          {
            content: content || null,
            conversation_id: conversationId,
            sender_id: userId,
            media_url,
          },
        ])
        .select('id, content, sender_id, media_url, created_at')
        .single();

      if (insertError) throw new Error(`Message insert error: ${insertError.message}`);

      await supabase
        .from('conversations')
        .update({
          last_message: content || '📎 Media',
          last_sender_id: userId,
          last_sent_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      onSend({
        ...newMessage,
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
      console.error('[MessageInput] Error:', err.message || err);
    } finally {
      setSending(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="px-4 py-3 bg-black border-t border-gray-800"
    >
      <div className="flex items-center gap-2 rounded-full border border-purple-700 focus-within:ring-2 focus-within:ring-purple-500 px-4 py-2 bg-gray-900 transition">
        <label className="cursor-pointer text-gray-400 hover:text-white">
          <Paperclip size={18} />
          <input type="file" accept="image/*" onChange={handleFileChange} hidden />
        </label>

        <input
          type="text"
          className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          disabled={sending}
        />

        <button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-1 rounded-full disabled:opacity-50"
          disabled={sending || (!messageText.trim() && !mediaFile)}
        >
          Send
        </button>
      </div>
    </form>
  );
}
