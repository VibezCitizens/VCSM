import { forwardRef } from "react";
import FS from "@/features/public/vportBusinessCard/view/businessCardFormStyles";

const BusinessCardLeadForm = forwardRef(function BusinessCardLeadForm(
  { card, values, setField, fieldErrors, formError, submitting, submitted, submit },
  ref
) {
  return (
    <section ref={ref} style={FS.formCard}>
      <h2 style={FS.formTitle}>Send a request</h2>
      <p style={FS.formSubtitle}>
        Tell {card.businessName} what you need. No signup required.
      </p>

      <form onSubmit={submit} noValidate>
        <div style={FS.field}>
          <label style={FS.label} htmlFor="lead-name">Name</label>
          <input
            id="lead-name"
            value={values.name}
            onChange={(e) => setField("name", e.target.value)}
            style={FS.input}
            placeholder="Your name"
            autoComplete="name"
          />
          {fieldErrors.name ? <div style={FS.errorText}>{fieldErrors.name}</div> : null}
        </div>

        <div style={FS.field}>
          <label style={FS.label} htmlFor="lead-phone">Phone</label>
          <input
            id="lead-phone"
            value={values.phone}
            onChange={(e) => setField("phone", e.target.value)}
            style={FS.input}
            placeholder="(555) 555-5555"
            autoComplete="tel"
            inputMode="tel"
          />
        </div>

        <div style={FS.field}>
          <label style={FS.label} htmlFor="lead-email">Email</label>
          <input
            id="lead-email"
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            style={FS.input}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
          />
          {fieldErrors.email ? <div style={FS.errorText}>{fieldErrors.email}</div> : null}
        </div>

        {fieldErrors.contact ? <div style={FS.errorText}>{fieldErrors.contact}</div> : null}

        <div style={FS.field}>
          <label style={FS.label} htmlFor="lead-message">Message</label>
          <textarea
            id="lead-message"
            value={values.message}
            onChange={(e) => setField("message", e.target.value)}
            style={{ ...FS.input, ...FS.textarea }}
            placeholder="How can this business help you?"
          />
          {fieldErrors.message ? <div style={FS.errorText}>{fieldErrors.message}</div> : null}
        </div>

        {formError ? <div style={FS.formError}>{formError}</div> : null}

        {submitted ? (
          <div style={FS.successText}>Your message was sent successfully.</div>
        ) : null}

        <button type="submit" disabled={submitting} style={FS.submitBtn}>
          {submitting ? "Sending…" : "Submit request"}
        </button>
      </form>
    </section>
  );
});

export default BusinessCardLeadForm;
