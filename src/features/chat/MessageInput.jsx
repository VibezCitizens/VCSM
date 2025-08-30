// src/features/chat/MessageInput.jsx
import { useEffect, useRef, useState } from 'react';
import { chat } from '@/data/chat';
import { uploadToCloudflare } from '@/lib/uploadToCloudflare';

const MAX_TEXT_LEN = 4000;
const MAX_FILE_MB = 25;

export default function MessageInput({ conversationId, onSend, className = '' }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const trimmed = (text || '').trim();
  const disabled = uploading || sending;
  const canSend = !!conversationId && (trimmed.length > 0 || !!file);

  // Autosize textarea
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

  const normalizeErr = (err) =>
    err?.message || err?.error_description || 'Something went wrong. Please try again.';

  const setPickedFile = (f) => {
    if (!f) return;
    if (f.size / (1024 * 1024) > MAX_FILE_MB) {
      setErrorMsg(`File too large (>${MAX_FILE_MB}MB).`);
      return;
    }
    setFile(f);
    setText('');
  };

  const clearFile = () => {
    setFile(null);
    try {
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {}
  };

  const send = async () => {
    if (!canSend || disabled) return;

    setErrorMsg('');
    setSending(true);

    let media_url = null;
    let media_type = null;

    try {
      // 1) Upload attachment (if any)
      if (file) {
        setUploading(true);
        try {
          const ext = (file.name?.split('.').pop() || 'bin').toLowerCase();
          const key = `chat/${conversationId}/${crypto.randomUUID()}.${ext}`;
          const { url, error: upErr } = await uploadToCloudflare(file, key);
          if (upErr || !url) throw upErr || new Error('Upload failed.');
          media_url = url;
          media_type = mediaType(file.type);
        } finally {
          setUploading(false);
        }
      }

      // 2) Compose content (text when no media)
      const content = media_url ? null : (trimmed || null);
      if (!content && !media_url) return;

      // 3) Persist via DAL (returns full row incl. id, sender_id, created_at)
      const msg = await chat.sendMessage(conversationId, {
        content,
        media_url,
        media_type,
      });

      // 4) Bubble full message to parent so it renders immediately (correct side + timestamp)
      onSend?.(msg);

      // 5) Cleanup + refocus
      setText('');
      clearFile();
      textareaRef.current?.focus();
    } catch (err) {
      console.error('[MessageInput] send error:', err);
      setErrorMsg(normalizeErr(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`sticky bottom-0 z-20 bg-black/85 backdrop-blur border-t border-neutral-800 p-2 ${className}`}>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
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
              value={file ? '' : text}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= MAX_TEXT_LEN) setText(val);
              }}
              placeholder={file ? `Attachment: ${file.name}` : 'Type a message…'}
              disabled={disabled}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
                if (e.key === 'Escape' && file) {
                  e.preventDefault();
                  clearFile();
                }
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
