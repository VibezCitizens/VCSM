// src/features/profiles/kinds/vport/screens/views/tabs/VportMenuView.jsx

export default function VportMenuView({ profile }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
      <h3 className="text-lg font-semibold">Menu</h3>

      <div className="mt-3 text-sm text-neutral-300 whitespace-pre-wrap">
        Online menu placeholder.
      </div>

      <div className="mt-4 text-xs text-neutral-400">
        Vport: @{profile?.username || "unknown"}
      </div>
    </div>
  );
}
