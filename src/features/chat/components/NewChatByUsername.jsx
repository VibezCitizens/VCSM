import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { getOrCreateConversation } from '@/features/chat/utils/getOrCreateConversation';

// try to parse user input as one of:
// - @username          => username
// - /u/username        => username
// - https://.../u/xyz  => username
// - uuid               => user id (direct)
function parseRecipientInput(s) {
  const raw = (s || '').trim();

  // full URL? extract path
  let str = raw;
  try {
    if (/^https?:\/\//i.test(raw)) {
      const u = new URL(raw);
      str = u.pathname || raw;
    }
  } catch {
    /* ignore URL parse errors */
  }

  // /u/username or @username
  const uMatch = str.match(/(?:^|\/)u\/([A-Za-z0-9_\.]+)/i);
  if (uMatch?.[1]) return { username: uMatch[1] };

  if (str.startsWith('@')) return { username: str.slice(1) };

  // UUID?
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str)) {
    return { userId: str };
  }

  // default assume username
  return { username: str };
}

export default function NewChatByUsername() {
  const [text, setText] = useState('');
  const [restoreHistory, setRestoreHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const start = async () => {
    setErr('');
    const parsed = parseRecipientInput(text);
    const hasValue = parsed.username?.trim() || parsed.userId?.trim();
    if (!hasValue) return;

    setLoading(true);
    try {
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) throw authErr;
      const me = auth?.user?.id;
      if (!me) throw new Error('Not authenticated');

      let otherId = parsed.userId || null;

      // resolve username -> id with case-insensitive match
      if (!otherId && parsed.username) {
        const uname = parsed.username.trim().replace(/^@/, '');
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('id, username')
          .ilike('username', uname)
          .maybeSingle();

        if (error) throw error;
        if (!profile) {
          setErr('User not found');
          return;
        }
        otherId = profile.id;
      }

      if (!otherId) {
        setErr('Invalid user');
        return;
      }
      if (otherId === me) {
        setErr("You can't start a chat with yourself.");
        return;
      }

      const convo = await getOrCreateConversation(otherId, { restoreHistory });
      if (convo?.id) {
        navigate(`/chat/${convo.id}`);
        setText('');
        inputRef.current?.blur();
      } else {
        setErr('Failed to open conversation.');
      }
    } catch (e) {
      console.error(e);
      setErr(e?.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') start();
  };

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex gap-2 items-start">
        <div className="flex-1">
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Start chat with @username, /u/username, URL, or user id"
            className="w-full p-2 rounded bg-neutral-800 border border-neutral-700 text-white placeholder-white/50"
            disabled={loading}
            inputMode="text"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {err ? (
            <div className="mt-1 text-sm text-red-300">{err}</div>
          ) : null}
        </div>
        <button
          onClick={start}
          disabled={loading || !text.trim()}
          className="px-3 py-2 rounded bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition"
        >
          {loading ? 'Starting…' : 'Start'}
        </button>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-white/80">
        <input
          type="checkbox"
          className="accent-purple-600"
          checked={restoreHistory}
          onChange={e => setRestoreHistory(e.target.checked)}
          disabled={loading}
        />
        Restore history (unhide & show past messages)
      </label>
    </div>
  );
}
