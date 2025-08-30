// src/features/explore/vdrop/components/VDropCommentModal.jsx
import { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '@/hooks/useAuth';
import { useIdentity } from '@/state/identityContext';
import { db } from '@/data/data';
import UserLink from '@/components/UserLink';

export default function VDropCommentModal({ postId, source, onClose }) {
  const { user } = useAuth();
  const { identity } = useIdentity(); // { type: 'user'|'vport', vportId? }

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Normalize which table/type we’re hitting via DAL
  const authorType = useMemo(
    () => (source === 'vport_posts' ? 'vport' : 'user'),
    [source]
  );

  const fetchComments = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const rows = await db.comments.listTopLevel({
        authorType,        // 'user' | 'vport'
        postId,            // DAL maps to post_id or vport_post_id internally
      });
      setComments(rows || []);
    } catch (e) {
      console.error('Error fetching comments:', e);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    const content = newComment.trim();
    if (!content || !user?.id) return;

    try {
      const actingAsVport =
        identity?.type === 'vport' && !!identity?.vportId;

      await db.comments.create({
        authorType,                 // 'user' | 'vport'
        postId: authorType === 'user' ? postId : undefined,
        vportPostId: authorType === 'vport' ? postId : undefined,
        userId: user.id,
        content,
        asVport: actingAsVport,
        actorVportId: actingAsVport ? identity.vportId : null,
      });

      setNewComment('');
      // For vport comments, DAL returns only id; re-fetch to hydrate profiles.
      await fetchComments();
    } catch (e) {
      console.error('Comment insert failed:', e);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, authorType]);

  const modalContent = (
    <>
      <div className="fixed inset-0 z-[999] bg-black/70 flex justify-center items-end">
        <div className="bg-[#111] w-full rounded-t-2xl p-4 max-h-[75vh] flex flex-col pb-[6.5rem]">
          <div className="flex justify-between items-center mb-2 flex-shrink-0">
            <span className="text-white font-semibold text-base">Comments</span>
            <button onClick={onClose} className="text-white text-xl">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 text-white text-sm pr-1 min-h-0">
            {loading ? (
              <p className="text-center text-gray-400">Loading…</p>
            ) : comments.length === 0 ? (
              <p className="text-center text-gray-500">No comments yet.</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="border-b border-white/10 pb-2">
                  <UserLink
                    user={
                      // DAL returns either `profiles` (user author)
                      // or vport actor via `vport` when as_vport=true.
                      c.as_vport && c.vport
                        ? { id: c.vport.id, name: c.vport.name, avatar_url: c.vport.avatar_url }
                        : c.profiles
                    }
                    authorType={c.as_vport ? 'vport' : 'user'}
                    avatarSize="w-6 h-6"
                    textSize="text-xs"
                  />
                  <div className="ml-8 mt-1">{c.content}</div>
                  <div className="ml-8 text-white/40 text-xs">
                    {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div
        className="fixed bottom-4 left-0 right-0 bg-[#111] p-4 border-t border-white/10 flex gap-2 z-[9999]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <input
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="comment-input flex-1 rounded bg-white/10 px-3 py-2 text-white text-sm outline-none"
          placeholder={
            identity?.type === 'vport' ? 'Comment as VPORT…' : 'Add a comment…'
          }
          disabled={!user}
        />
        <button
          onClick={addComment}
          disabled={!newComment.trim() || !user}
          className="text-sm text-black bg-white rounded px-4 py-2 font-medium"
        >
          Send
        </button>
      </div>
    </>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
