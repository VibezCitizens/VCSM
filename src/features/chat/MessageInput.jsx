import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { compressImageFile } from '@/utils/compressImage';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare'; // Corrected import
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
      // Ensure user is in the conversation
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

      // Upload media if needed using the new utility function
      let media_url = null;
      if (mediaFile) {
        const compressed = await compressImageFile(mediaFile);
        const timestamp = Date.now();
        // Ensure the key is unique and descriptive for chat media
        const path = `chat/${conversationId}/${timestamp}-${compressed.name}`;
        const { url, error } = await uploadToCloudflare(compressed, path); // Using the utility

        if (error) {
          throw new Error(`Media upload error: ${error}`);
        }
        media_url = url;
      }

      // Insert message into Supabase
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

      // Update conversation metadata
      await supabase
        .from('conversations')
        .update({
          last_message: content || '📎 Media',
          last_sender_id: userId,
          last_sent_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Notify parent
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