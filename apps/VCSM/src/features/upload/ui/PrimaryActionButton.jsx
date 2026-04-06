export default function PrimaryActionButton({ label, disabled, onClick }) {
  return (
    <div className="mt-5 px-1 pb-1">
      <button
        disabled={disabled}
        onClick={onClick}
        className="upload-submit w-full py-3.5 text-lg font-semibold tracking-wide"
        type="button"
      >
        {label}
      </button>
    </div>
  );
}
