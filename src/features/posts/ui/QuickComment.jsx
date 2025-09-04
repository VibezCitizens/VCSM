// src/features/posts/ui/QuickComment.jsx
/**
 * Small comment input + submit. Controlled by parent for full control.
 */
import { memo } from 'react';

function QuickComment({
  value,
  onChange = () => {},
  onSubmit = () => {},
  canSubmit = false,
  placeholder = 'Write a comment…',
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="flex mt-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-neutral-900 text-white p-2 rounded-l w-full text-sm"
        placeholder={placeholder}
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className="bg-purple-600 px-4 rounded-r text-sm text-white disabled:opacity-60"
      >
        Post
      </button>
    </form>
  );
}

export default memo(QuickComment);
