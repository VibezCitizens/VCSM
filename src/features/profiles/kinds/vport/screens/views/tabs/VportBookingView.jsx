export default function VportBarberBookView({ profile }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-5">
      <h3 className="text-lg font-semibold">Book</h3>
      <div className="mt-3 text-sm text-neutral-300">
        Booking placeholder (calendar + time slots + pay deposit).
      </div>

      <button
        className="
          mt-4 w-full rounded-xl
          bg-white text-black font-semibold
          py-3
          hover:bg-white/90
        "
        onClick={() => window.alert("Booking flow coming soon")}
      >
        Book Appointment
      </button>

      <div className="mt-4 text-xs text-neutral-400">
        Barber: @{profile?.username || "unknown"}
      </div>
    </div>
  );
}
