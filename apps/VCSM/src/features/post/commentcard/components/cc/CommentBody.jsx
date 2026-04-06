// src/features/post/commentcard/components/cc/CommentBody.jsx

export default function CommentBody({ content }) {
  if (!content) return null;

  return (
    <p className="mt-1.5 text-sm leading-relaxed text-slate-100/95">
      {content}
    </p>
  );
}
