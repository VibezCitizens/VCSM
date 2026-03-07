export default function TagChips({ tags, onRemove }) {
  if (!tags?.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {tags.map((t) => (
        <span
          key={t}
          className="upload-chip inline-flex items-center gap-2 px-3 py-1 text-sm"
        >
          #{t}
          <button
            className="opacity-70 hover:opacity-100"
            onClick={() => onRemove(t)}
            type="button"
          >
            x
          </button>
        </span>
      ))}
    </div>
  );
}
