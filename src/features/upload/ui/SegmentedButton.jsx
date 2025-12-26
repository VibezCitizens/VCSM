export default function SegmentedButton({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full font-semibold transition ${
        active ? "bg-purple-600 text-white" : "bg-neutral-800 text-gray-300 hover:bg-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}
