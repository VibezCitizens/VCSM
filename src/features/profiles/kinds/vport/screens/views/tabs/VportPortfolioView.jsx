export default function VportBarberPortfolioView({ profile }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
      <h3 className="text-lg font-semibold">Portfolio</h3>
      <div className="mt-3 text-sm text-neutral-300">
        Haircut photos grid goes here (before/after, styles, tags).
      </div>
      <div className="mt-4 text-xs text-neutral-400">
        Barber: @{profile?.username || "unknown"}
      </div>
    </div>
  );
}
