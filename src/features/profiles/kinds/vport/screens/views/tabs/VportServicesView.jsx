export default function VportBarberServicesView({ profile }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
      <h3 className="text-lg font-semibold">Services</h3>
      <div className="mt-3 text-sm text-neutral-300 whitespace-pre-wrap">
        Services + pricing placeholder.
        {"\n"}- Fade $30
        {"\n"}- Beard trim $15
        {"\n"}- Line up $10
      </div>
      <div className="mt-4 text-xs text-neutral-400">
        Barber: @{profile?.username || "unknown"}
      </div>
    </div>
  );
}
