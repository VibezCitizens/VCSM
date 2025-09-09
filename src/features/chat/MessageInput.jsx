// src/features/chat/MessageInput.jsx
import { useEffect, useRef, useState } from 'react';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';
import { useAuth } from '@/hooks/useAuth';

const MAX_TEXT_LEN = 4000;
const MAX_FILE_MB = 25;

export default function MessageInput({ conversationId, onSend, className = '' }) {
  const { user } = useAuth() || {};

  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);
  const textareaRef  = useRef(null);

  const normalizeText = (input) =>
    (input ?? '')
      .replace(/<[^>]*>/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const disabled     = uploading || sending;
  const finalContent = normalizeText(text) || null; // keep caption even with media
  const canSend      = !!conversationId && (finalContent || file);

  // autosize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const mediaType = (mime) =>
    mime?.startsWith('image/') ? 'image'
      : mime?.startsWith('video/') ? 'video'
      : 'file';

  const setPickedFile = (f) => {
    if (!f) return;
    if (f.size / (1024 * 1024) > MAX_FILE_MB) {
      setErrorMsg(`File too large (>${MAX_FILE_MB}MB).`);
      return;
    }
    setFile(f); // DO NOT clear text; allow caption + media
  };

  const clearFile = () => {
    setFile(null);
    try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch {}
  };

  const send = async () => {
    if (!canSend || disabled) return;

    setErrorMsg('');
    setSending(true);

    let media_url  = null;
    let media_type = null;
    let media_mime = null;

    try {
      if (!user?.id) throw new Error('Not authenticated');

      // 1) upload attachment if any
      if (file) {
        setUploading(true);
        try {
          const ext = (file.name?.split('.').pop() || 'bin').toLowerCase();
          const key = `chat/${conversationId}/${crypto.randomUUID()}.${ext}`;
          const { url, error: upErr } = await uploadToCloudflare(file, key);
          if (upErr || !url) throw upErr || new Error('Upload failed.');
          media_url  = url;
          media_type = mediaType(file.type);
          media_mime = file.type || null;
        } finally {
          setUploading(false);
        }
      }

      // 2) hand off to parent (ChatScreen does optimistic + DB write)
      onSend?.({
        content: finalContent,
        media_url,
        media_type,
        media_mime,
      });

      // 3) reset local UI
      setText('');
      clearFile();
      textareaRef.current?.focus();
    } catch (err) {
      console.error('[MessageInput] send error:', err);
      setErrorMsg(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`sticky bottom-0 z-20 bg-black/85 backdrop-blur border-t border-neutral-800 p-2 ${className}`}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 w-full">
          <label className="p-2 bg-neutral-800 border border-neutral-700 rounded cursor-pointer hover:bg-neutral-700">
            📎
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setPickedFile(e.target.files[0])}
              disabled={disabled}
            />
          </label>

          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              rows={1}
              className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-white placeholder:text-white/40 focus:outline-none focus:border-neutral-500 resize-none"
              value={text}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= MAX_TEXT_LEN) setText(val);
              }}
              placeholder={file ? `Add a caption for ${file.name}…` : 'Type a message…'}
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                if (e.key === 'Escape' && file) { e.preventDefault(); clearFile(); }
              }}
            />
            <div className="px-1 pt-1 text-[10px] text-white/40 select-none">
              {Math.max(0, MAX_TEXT_LEN - (text?.length || 0))} characters left
            </div>
          </div>

          <button
            onClick={send}
            disabled={!canSend || disabled}
            className="px-4 h-10 rounded bg-purple-600 text-white font-medium disabled:opacity-50 active:scale-95"
          >
            {uploading ? 'Uploading…' : (sending ? 'Sending…' : 'Send')}
          </button>
        </div>

        {file && (
          <div className="flex items-center gap-2 text-xs text-white/80">
            <div className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 truncate max-w-[60%]">
              {file.name}
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="px-2 py-1 rounded bg-neutral-700 hover:bg-neutral-600"
              aria-label="Remove attachment"
            >
              Remove
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="text-xs text-red-300 bg-red-900/20 border border-red-800 rounded px-2 py-1">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
}
