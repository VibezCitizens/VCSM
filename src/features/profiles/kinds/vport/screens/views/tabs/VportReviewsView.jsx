// src/features/profiles/kinds/vport/screens/views/tabs/VportReviewsView.jsx

export default function VportReviewsView({ profile }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
      <h3 className="text-lg font-semibold">Reviews</h3>

      <div className="mt-3 text-sm text-neutral-300">
        Reviews tab placeholder.
      </div>

      <div className="mt-4 text-xs text-neutral-400">
        Vport: @{profile?.username || "unknown"}
      </div>
    </div>
  );
}
