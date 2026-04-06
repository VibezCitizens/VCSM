export default function LearningEmptyState({
  title = "Nothing here yet",
  message = "There is no data available.",
  actionLabel,
  onAction,
}) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-12 text-center">
      <h3 className="text-lg font-semibold mb-2">{title}</h3>

      <p className="text-sm text-gray-500 mb-4">{message}</p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-black text-white text-sm rounded-md hover:opacity-90"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}