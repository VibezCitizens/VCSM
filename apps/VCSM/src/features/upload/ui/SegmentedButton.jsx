export default function SegmentedButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`upload-segment-btn ${active ? "is-active" : ""}`}
      type="button"
    >
      {children}
    </button>
  );
}
