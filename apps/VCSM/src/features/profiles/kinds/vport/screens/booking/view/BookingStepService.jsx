import { StepHeader, OptionCard, RadioOption } from "@/features/profiles/kinds/vport/screens/booking/view/BookingFlowShared";

function AvailabilityGate({ resourceId, availabilityLoading, hasAvailabilityRules, hasUpcomingSlots }) {
  if (!resourceId) {
    return (
      <div className="mt-3 rounded-xl border px-4 py-3.5 space-y-0.5"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
          Booking not available yet
        </div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          This shop hasn't added any barbers to their team yet.
        </div>
      </div>
    );
  }

  if (availabilityLoading) {
    return (
      <div className="mt-3 flex items-center gap-2.5 px-1 py-2">
        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.1)", borderTopColor: "rgba(255,255,255,0.4)" }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          Checking availability…
        </span>
      </div>
    );
  }

  if (!hasAvailabilityRules) {
    return (
      <div className="mt-3 rounded-xl border px-4 py-3.5 space-y-0.5"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>
          Booking not open yet
        </div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          This shop has not opened booking availability yet. Check back soon.
        </div>
      </div>
    );
  }

  if (!hasUpcomingSlots) {
    return (
      <div className="mt-3 rounded-xl border px-4 py-3.5 space-y-0.5"
        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}>
        <div className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
          No open times right now
        </div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          No available times in the next 14 days. Try again later.
        </div>
      </div>
    );
  }

  return null;
}

export function StepServiceSelect({
  services,
  selectedServiceId,
  onSelect,
  resourceId,
  availabilityLoading,
  hasAvailabilityRules,
  hasUpcomingSlots,
}) {
  return (
    <div>
      <StepHeader title="Select a service" subtitle="Choose what you'd like to book" />
      <div className="space-y-2">
        <OptionCard selected={selectedServiceId === null} onClick={() => onSelect(null)}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Any service</div>
              <div className="text-xs text-white/40 mt-0.5">General appointment</div>
            </div>
            <RadioOption selected={selectedServiceId === null} />
          </div>
        </OptionCard>
        {services.map((svc) => (
          <OptionCard key={svc.id} selected={selectedServiceId === svc.id} onClick={() => onSelect(svc.id)}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{svc.label || svc.key}</div>
                {svc.description && (
                  <div className="text-xs text-white/40 mt-0.5 truncate">{svc.description}</div>
                )}
              </div>
              <RadioOption selected={selectedServiceId === svc.id} />
            </div>
          </OptionCard>
        ))}
      </div>
      <AvailabilityGate
        resourceId={resourceId}
        availabilityLoading={availabilityLoading}
        hasAvailabilityRules={hasAvailabilityRules}
        hasUpcomingSlots={hasUpcomingSlots}
      />
    </div>
  );
}

export function StepBarberSelect({ barbers, selectedBarberActorId, onSelect }) {
  return (
    <div>
      <StepHeader title="Choose your barber" subtitle="Select who you'd like your appointment with" />
      <div className="space-y-2">
        <OptionCard selected={selectedBarberActorId === null} onClick={() => onSelect(null)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center text-sm font-bold text-white/50">
                ?
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Any barber</div>
                <div className="text-xs text-white/40">Next available</div>
              </div>
            </div>
            <RadioOption selected={selectedBarberActorId === null} />
          </div>
        </OptionCard>
        {barbers.map((barber) => {
          const initial = String(barber.name || "?")[0].toUpperCase();
          const barberId = barber.member_actor_id ?? barber.id;
          const isSelected = selectedBarberActorId === barberId;
          return (
            <OptionCard key={barber.id} selected={isSelected} onClick={() => onSelect(barberId)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/8 flex items-center justify-center text-sm font-bold text-white/70">
                    {initial}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{barber.name}</div>
                    <div className="text-xs text-white/40">Barber · Staff</div>
                  </div>
                </div>
                <RadioOption selected={isSelected} />
              </div>
            </OptionCard>
          );
        })}
      </div>
    </div>
  );
}
