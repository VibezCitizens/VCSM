export default function FriendsEmptyState({ label = "No entries." }) {
  return (
    <div className="py-6 text-center text-neutral-500 text-sm">
      {label}
    </div>
  );
}
