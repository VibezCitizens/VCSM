import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { LIKE, DISLIKE } from '../constants';

export default function PostCard({ post, r, mine, onReact, reacting }) {
  const likeCount = r?.[LIKE] || 0;
  const dislikeCount = r?.[DISLIKE] || 0;

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3">
      {post.title && <div className="font-medium mb-1">{post.title}</div>}
      {post.body && <p className="text-sm text-zinc-200 whitespace-pre-wrap">{post.body}</p>}

      <div className="mt-3 flex items-center gap-4 text-sm">
        <button
          type="button"
          disabled={reacting}
          onClick={() => onReact(LIKE)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${
            mine === LIKE
              ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-700/40'
              : 'text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700'
          }`}
          title="Like"
        >
          <ThumbsUp size={16} /> {likeCount}
        </button>
        <button
          type="button"
          disabled={reacting}
          onClick={() => onReact(DISLIKE)}
          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${
            mine === DISLIKE
              ? 'bg-red-600/20 text-red-300 border border-red-700/40'
              : 'text-zinc-400 hover:text-white border border-transparent hover:border-zinc-700'
          }`}
          title="Dislike"
        >
          <ThumbsDown size={16} /> {dislikeCount}
        </button>

        <div className="ml-auto text-xs text-zinc-500">{new Date(post.created_at).toLocaleString()}</div>
      </div>
    </div>
  );
}
