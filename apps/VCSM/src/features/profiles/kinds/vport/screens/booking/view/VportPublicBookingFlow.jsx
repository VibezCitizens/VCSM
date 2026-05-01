import { useVportPublicBooking } from "@/features/profiles/kinds/vport/screens/booking/hooks/useVportPublicBooking";
import { StepProgress } from "@/features/profiles/kinds/vport/screens/booking/view/BookingFlowShared";
import { StepServiceSelect, StepBarberSelect } from "@/features/profiles/kinds/vport/screens/booking/view/BookingStepService";
import { StepDateSelect } from "@/features/profiles/kinds/vport/screens/booking/view/BookingStepDate";
import { StepTimeSelect, StepDetailsForm, StepConfirm } from "@/features/profiles/kinds/vport/screens/booking/view/BookingStepConfirm";

export default function VportPublicBookingFlow({ profile }) {
  const {
    step,
    stepName,
    totalSteps,
    goNext,
    goBack,
    canAdvanceFromStep,
    dataReady,
    services,
    barbers,
    dateStrip,
    selectedServiceId,
    selectedService,
    setSelectedServiceId,
    selectedBarberActorId,
    selectedBarber,
    setSelectedBarberActorId,
    selectedDateKey,
    setSelectedDateKey,
    selectedSlot,
    setSelectedSlot,
    selectedDaySlotsBySegment,
    clientName,
    setClientName,
    clientNote,
    setClientNote,
    handleSubmit,
    submitting,
    submitError,
    submitted,
    reset,
    resourceId,
    hasAvailabilityRules,
    hasUpcomingSlots,
    availabilityLoading,
  } = useVportPublicBooking({ profile });

  const profileName = profile?.name ?? profile?.username ?? "this barber";
  const isLastStep = stepName === "confirm";

  return (
    <section className="profiles-card p-4 sm:p-5">
      <header className="mb-4">
        <p className="text-xs font-semibold text-white/30 uppercase tracking-wide mb-0.5">
          Book an appointment
        </p>
        <h3 className="text-base font-bold text-white">{profileName}</h3>
      </header>

      {!submitted && <StepProgress current={step} total={totalSteps} />}

      <div className="min-h-60">
        {!dataReady ? (
          <div className="flex items-center gap-3 py-8 justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
            <span className="text-sm text-white/40">Loading...</span>
          </div>
        ) : stepName === "service" ? (
          <StepServiceSelect
            services={services}
            selectedServiceId={selectedServiceId}
            onSelect={setSelectedServiceId}
            resourceId={resourceId}
            availabilityLoading={availabilityLoading}
            hasAvailabilityRules={hasAvailabilityRules}
            hasUpcomingSlots={hasUpcomingSlots}
          />
        ) : stepName === "barber" ? (
          <StepBarberSelect
            barbers={barbers}
            selectedBarberActorId={selectedBarberActorId}
            onSelect={setSelectedBarberActorId}
          />
        ) : stepName === "date" ? (
          <StepDateSelect
            dateStrip={dateStrip}
            selectedDateKey={selectedDateKey}
            onSelect={setSelectedDateKey}
          />
        ) : stepName === "time" ? (
          <StepTimeSelect
            selectedDaySlotsBySegment={selectedDaySlotsBySegment}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
            selectedDateKey={selectedDateKey}
            availabilityLoading={availabilityLoading}
          />
        ) : stepName === "details" ? (
          <StepDetailsForm
            clientName={clientName}
            setClientName={setClientName}
            clientNote={clientNote}
            setClientNote={setClientNote}
          />
        ) : stepName === "confirm" ? (
          <StepConfirm
            selectedService={selectedService}
            selectedBarber={selectedBarber}
            selectedDateKey={selectedDateKey}
            selectedSlot={selectedSlot}
            clientName={clientName}
            onSubmit={handleSubmit}
            submitting={submitting}
            submitError={submitError}
            submitted={submitted}
            onReset={reset}
          />
        ) : null}
      </div>

      {!submitted && !isLastStep && (
        <div className="flex gap-2 mt-5">
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-white/60 hover:bg-white/[0.06] transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={!canAdvanceFromStep(stepName)}
            className="flex-1 rounded-xl py-3 text-sm font-bold transition-all"
            style={{
              background: canAdvanceFromStep(stepName) ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
              color: canAdvanceFromStep(stepName) ? "#000" : "rgba(255,255,255,0.4)",
            }}
          >
            Continue
          </button>
        </div>
      )}
    </section>
  );
}
