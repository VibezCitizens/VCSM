export default function FriendsEmptyState({ label = "No entries." }) {
  return (
    <div className="profiles-subcard py-6 px-4 text-center text-slate-300/80 text-sm">
      {label}
    </div>
  );
}
