export default function LearningErrorState({ error, onRetry }) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-12 text-center">
      <h3 className="text-lg font-semibold text-red-600 mb-2">
        Something went wrong
      </h3>

      <p className="text-sm text-gray-500 mb-4">
        {error?.message || "An unexpected error occurred"}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-black text-white text-sm rounded-md hover:opacity-90"
        >
          Try Again
        </button>
      )}
    </div>
  );
}