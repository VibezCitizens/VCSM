// src/features/upload/ui/PrimaryActionButton.jsx
export default function PrimaryActionButton({ label, disabled, onClick }) {
  return (
    <div className="mt-6 flex justify-center">
      <button
        disabled={disabled}
        onClick={onClick}
        className={`
          w-full max-w-md
          py-4
          rounded-full
          text-lg font-semibold
          transition
          ${
            disabled
              ? "bg-neutral-800 text-neutral-500 border border-white/10"
              : "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-[0_10px_40px_rgba(128,90,213,0.25)] hover:opacity-95"
          }
        `}
        type="button"
      >
        {label}
      </button>
    </div>
  );
}
