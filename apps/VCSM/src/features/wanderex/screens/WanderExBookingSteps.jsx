import { WanderExBookingLaneCalendar } from "@/features/wanderex/components/WanderExBookingLaneCalendar";

function formatDateLabel(dateKey) {
  const [y, mo, d] = String(dateKey || "").split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return dateKey;
  return new Date(y, mo - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function ServiceStep({ flow }) {
  return (
    <div className="wx-step-list">
      {flow.serviceOptions.map((service) => (
        <button
          key={service.id}
          type="button"
          className={`wx-step-btn ${flow.selectedServiceId === service.id ? "is-selected" : ""}`}
          onClick={() => flow.setService(service.id)}
        >
          <div className="wx-space-between">
            <strong>{service.label}</strong>
            <span className="wx-price">{service.priceLabel || "Price on request"}</span>
          </div>
          <div className="wx-muted">{service.durationMinutes} min</div>
        </button>
      ))}
    </div>
  );
}

export function BarberStep({ flow }) {
  return (
    <div className="wx-step-list">
      <button
        type="button"
        className={`wx-step-btn ${!flow.selectedBarberActorId ? "is-selected" : ""}`}
        onClick={() => flow.setBarber(null)}
      >
        <strong>Auto-assign</strong>
        <div className="wx-muted">Let the shop assign the best available barber.</div>
      </button>
      {flow.teamOptions.map((member) => (
        <button
          key={member.id}
          type="button"
          className={`wx-step-btn ${
            flow.selectedBarberActorId === (member.actorId || member.id)
              ? "is-selected"
              : ""
          }`}
          onClick={() => flow.setBarber(member.actorId || member.id)}
        >
          <strong>{member.name}</strong>
          <div className="wx-muted">Choose this barber lane</div>
        </button>
      ))}
    </div>
  );
}

export function TimeStep({ flow }) {
  return (
    <>
      <div className="wx-chip-row" style={{ marginTop: 10 }}>
        {flow.dateStrip.map((day) => {
          const enabled = flow.isDateBookable(day.key);
          return (
            <button
              key={day.key}
              type="button"
              className={`wx-filter-btn ${flow.selectedDateKey === day.key ? "is-on" : ""}`}
              onClick={() => flow.chooseDate(day.key)}
              disabled={!enabled}
              style={{ opacity: enabled ? 1 : 0.5 }}
            >
              {formatDateLabel(day.key)}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 10, overflowX: "auto" }}>
        <div style={{ minWidth: 620, "--wx-lane-count": flow.activeResources.length }}>
          <WanderExBookingLaneCalendar
            resources={flow.activeResources}
            dateKey={flow.selectedDateKey}
            calendarByResource={flow.availabilityCalendarByResource}
            durationMinutes={flow.durationMinutes}
            selectedResourceId={flow.selectedResourceId}
            selectedStartMinutes={flow.selectedStartMinutes}
            onSelectRange={flow.selectLaneRange}
          />
        </div>
      </div>

      {flow.selectionError ? <p className="wx-field-error">{flow.selectionError}</p> : null}
      {flow.selectedTimeLabel ? (
        <p className="wx-muted" style={{ marginTop: 8 }}>
          Selected: {flow.selectedTimeLabel}
        </p>
      ) : null}
    </>
  );
}

export function DetailsStep({ flow }) {
  return (
    <div className="wx-step-list">
      <label className="wx-field-label" htmlFor="wx-book-name">
        Name
      </label>
      <input
        id="wx-book-name"
        className="wx-input"
        value={flow.customerName}
        onChange={(event) => flow.setCustomerName(event.target.value)}
        autoComplete="name"
        placeholder="Your full name"
      />

      <label className="wx-field-label" htmlFor="wx-book-phone">
        Phone
      </label>
      <input
        id="wx-book-phone"
        className="wx-input"
        value={flow.customerPhone}
        onChange={(event) => flow.setCustomerPhone(event.target.value)}
        autoComplete="tel"
        inputMode="tel"
        placeholder="(555) 555-5555"
      />

      <label className="wx-field-label" htmlFor="wx-book-email">
        Email
      </label>
      <input
        id="wx-book-email"
        className="wx-input"
        value={flow.customerEmail}
        onChange={(event) => flow.setCustomerEmail(event.target.value)}
        autoComplete="email"
        placeholder="you@email.com"
      />

      <label className="wx-field-label" htmlFor="wx-book-note">
        Notes
      </label>
      <textarea
        id="wx-book-note"
        className="wx-textarea"
        value={flow.customerNote}
        onChange={(event) => flow.setCustomerNote(event.target.value)}
        rows={4}
        placeholder="Any extra details for the provider"
      />
    </div>
  );
}

export function ConfirmStep({ flow, selectedBarberLabel }) {
  return (
    <div className="wx-step-list">
      <div className="wx-service-btn">
        <div className="wx-space-between">
          <strong>Service</strong>
          <span>{flow.selectedService?.label}</span>
        </div>
        <div className="wx-muted">{flow.selectedService?.durationMinutes} minutes</div>
      </div>

      <div className="wx-service-btn">
        <div className="wx-space-between">
          <strong>Barber</strong>
          <span>{selectedBarberLabel}</span>
        </div>
      </div>

      <div className="wx-service-btn">
        <div className="wx-space-between">
          <strong>Requested time</strong>
          <span>{flow.selectedTimeLabel}</span>
        </div>
      </div>

      <div className="wx-service-btn">
        <div className="wx-space-between">
          <strong>Contact</strong>
          <span>{flow.customerName}</span>
        </div>
        <div className="wx-muted">
          {[flow.customerPhone, flow.customerEmail].filter(Boolean).join(" · ")}
        </div>
      </div>

      {flow.submitError ? <p className="wx-field-error">{flow.submitError}</p> : null}

      <button
        type="button"
        className="wx-primary-btn"
        disabled={flow.submitting}
        onClick={flow.submitLeadRequest}
      >
        {flow.submitting ? "Submitting..." : "Confirm booking request"}
      </button>
    </div>
  );
}
