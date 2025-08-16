import React from 'react';

export default function PostComposer({ posting, postErr, onPublish }) {
  const [title, setTitle] = React.useState('');
  const [body, setBody]   = React.useState('');
  const [file, setFile]   = React.useState(null);

  function submit(e) {
    e.preventDefault();
    onPublish({ title, body, file });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full bg-zinc-800/70 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm"
        disabled={posting}
      />
      <textarea
        rows={4}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write something…"
        className="w-full bg-zinc-800/70 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm"
        disabled={posting}
      />
      <div className="flex items-center justify-between">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          disabled={posting}
          className="text-sm text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700"
        />
        <div className="flex items-center gap-3">
          {postErr && <span className="text-red-400 text-sm">{postErr}</span>}
          <button
            type="submit"
            disabled={posting}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 bg-white text-black hover:opacity-90 transition text-sm disabled:opacity-50"
          >
            {posting ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    </form>
  );
}
