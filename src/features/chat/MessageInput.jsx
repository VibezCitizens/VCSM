// src/features/chat/MessageInput.jsx
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';

export default function MessageInput({ conversationId, onSend }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const send = async () => {
    if (!user) return;

    let media_url = null;
    let media_type = null;

    // 1) If an image is selected, upload it via your Cloudflare Worker
    if (file) {
      setUploading(true);
      const ext = file.name.split('.').pop();
      const key = `chat/${conversationId}/${crypto.randomUUID()}.${ext}`;

      const { url, error: uploadError } = await uploadToCloudflare(file, key);
      if (uploadError || !url) {
        console.error('Cloudflare upload error:', uploadError);
        setUploading(false);
        return;
      }

      media_url = url;
      media_type = 'image';
      setUploading(false);
      setFile(null);
    }

    // 2) Insert into Supabase
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: media_url ? null : text.trim(),
        media_url,
        media_type,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Send message failed:', insertError);
      return;
    }

    // 3) Optimistically render the new message
    onSend?.(message);
    setText('');
  };

  return (
    <div className="flex items-center gap-2">
      {/* Image picker */}
      <label className="p-2 bg-neutral-700 rounded cursor-pointer">
        📷
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] || null);
            setText(''); // clear text when an image is selected
          }}
        />
      </label>

      {/* Text input */}
      <input
        className="flex-1 p-2 rounded border border-neutral-600 bg-neutral-800 text-white"
        value={file ? '' : text}
        onChange={(e) => setText(e.target.value)}
        placeholder={file ? 'Image selected' : 'Type a message…'}
        disabled={uploading}
        onKeyDown={(e) => e.key === 'Enter' && send()}
      />

      {/* Send button */}
      <button
        onClick={send}
        disabled={uploading || (!text.trim() && !file)}
        className="px-4 py-2 bg-purple-600 text-white rounded disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : 'Send'}
      </button>
    </div>
  );
}
