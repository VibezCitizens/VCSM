import { VISITOR_SLOT_DURATION_MINUTES } from "@/features/booking/adapters/booking.adapter";
import { StepHeader } from "@/features/profiles/kinds/vport/screens/booking/view/BookingFlowShared";
import { formatSlot, formatDateFull } from "@/features/profiles/kinds/vport/screens/booking/view/bookingFlowHelpers";

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-xs text-white/40 shrink-0">{label}</span>
      <span className="text-xs text-white/80 text-right">{value}</span>
    </div>
  );
}

function BookingSummaryCard({ selectedService, selectedBarber, selectedDateKey, selectedSlot, clientName }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 space-y-2.5">
      {selectedDateKey && <SummaryRow label="Date" value={formatDateFull(selectedDateKey)} />}
      {selectedSlot && <SummaryRow label="Time" value={formatSlot(selectedSlot)} />}
      <SummaryRow label="Duration" value={`${VISITOR_SLOT_DURATION_MINUTES} min`} />
      <SummaryRow label="Service" value={selectedService?.label || selectedService?.key || "General appointment"} />
      {selectedBarber && <SummaryRow label="Barber" value={selectedBarber.name} />}
      {clientName && <SummaryRow label="Name" value={clientName} />}
    </div>
  );
}

export function StepTimeSelect({ selectedDaySlotsBySegment, selectedSlot, onSelect, selectedDateKey, availabilityLoading }) {
  const SEGMENTS = [
    { key: "morning", label: "Morning" },
    { key: "afternoon", label: "Afternoon" },
    { key: "evening", label: "Evening" },
  ];

  const hasAnySlots = SEGMENTS.some((s) => (selectedDaySlotsBySegment[s.key] ?? []).length > 0);

  return (
    <div>
      <StepHeader
        title="Choose a time"
        subtitle={selectedDateKey ? formatDateFull(selectedDateKey) : "Select a time slot"}
      />
      {availabilityLoading ? (
        <div className="flex items-center gap-3 py-8 justify-center">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          <span className="text-sm text-white/40">Loading availability...</span>
        </div>
      ) : !hasAnySlots ? (
        <div className="py-8 text-center text-sm text-white/40">
          No available times for this date.
        </div>
      ) : (
        <div className="space-y-4">
          {SEGMENTS.map(({ key, label }) => {
            const slots = selectedDaySlotsBySegment[key] ?? [];
            if (!slots.length) return null;
            return (
              <div key={key}>
                <div className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-2">
                  {label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => {
                    const isSelected = slot === selectedSlot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => onSelect(slot)}
                        className={[
                          "rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all",
                          isSelected
                            ? "border-white/40 bg-white/12 text-white"
                            : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.07]",
                        ].join(" ")}
                      >
                        {formatSlot(slot)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StepDetailsForm({ clientName, setClientName, clientNote, setClientNote }) {
  return (
    <div>
      <StepHeader title="Your details" subtitle="Who is this appointment for?" />
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Your name <span className="text-white/30">*</span>
          </label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Enter your name"
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-all"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5">
            Note <span className="text-white/25">(optional)</span>
          </label>
          <textarea
            value={clientNote}
            onChange={(e) => setClientNote(e.target.value)}
            placeholder="Any special requests..."
            rows={3}
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-white/25 outline-none focus:border-white/25 focus:bg-white/[0.06] transition-all resize-none"
          />
        </div>
      </div>
    </div>
  );
}

export function StepConfirm({
  selectedService, selectedBarber, selectedDateKey, selectedSlot,
  clientName, onSubmit, submitting, submitError, submitted, onReset,
}) {
  if (submitted) {
    return (
      <div className="flex flex-col items-center py-8 gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)" }}
        >
          ✓
        </div>
        <div className="text-center">
          <div className="text-base font-bold text-white">Booking Requested!</div>
          <div className="text-sm text-white/40 mt-1">
            The shop will confirm your appointment shortly.
          </div>
        </div>
        <BookingSummaryCard
          selectedService={selectedService}
          selectedBarber={selectedBarber}
          selectedDateKey={selectedDateKey}
          selectedSlot={selectedSlot}
          clientName={clientName}
        />
        <button
          type="button"
          onClick={onReset}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-medium text-white/60 hover:bg-white/[0.06] transition-colors"
        >
          Book another
        </button>
      </div>
    );
  }

  return (
    <div>
      <StepHeader title="Confirm your booking" subtitle="Review your appointment details" />
      <BookingSummaryCard
        selectedService={selectedService}
        selectedBarber={selectedBarber}
        selectedDateKey={selectedDateKey}
        selectedSlot={selectedSlot}
        clientName={clientName}
      />
      {submitError && (
        <div className="mt-3 rounded-xl border border-red-500/25 bg-red-500/8 px-3 py-2 text-sm text-red-200">
          {submitError}
        </div>
      )}
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className="mt-4 w-full rounded-xl py-4 text-sm font-bold text-black disabled:opacity-50 transition-all"
        style={{ background: "rgba(255,255,255,0.92)" }}
      >
        {submitting ? "Booking..." : "Book Appointment"}
      </button>
    </div>
  );
}
