import { useEffect, useMemo, useState } from "react";
import { useWanderExSubmit } from "@/features/wanderex/hooks/useWanderExSubmit";

const INITIAL_VALUES = Object.freeze({ name: "", phone: "", email: "", message: "" });

export function WanderExLeadActionModal({
  open,
  slug,
  actionType = "message",
  actionTitle = "Send request",
  actionSubtitle = "No login required.",
  defaultMessage = "",
  submitLabel = "Send request",
  onClose,
  onSubmitted,
}) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const source = useMemo(() => {
    const key = String(actionType || "message").trim().toLowerCase();
    return `wanderex_action_${key}`;
  }, [actionType]);

  const { submitting, submit } = useWanderExSubmit({ slug, source });

  useEffect(() => {
    if (!open) return;
    setValues((prev) => ({ ...prev, message: defaultMessage || prev.message }));
    setFieldErrors({});
    setError("");
    setSubmitted(false);
  }, [open, defaultMessage]);

  if (!open) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setFieldErrors({});

    const userAgent =
      typeof navigator !== "undefined" && navigator.userAgent ? navigator.userAgent : null;

    const result = await submit({
      name: values.name,
      phone: values.phone,
      email: values.email,
      message: values.message,
      userAgent,
    });

    if (!result.ok) {
      setError(result.error?.message || "Could not send request.");
      setFieldErrors(result.error?.fieldErrors || {});
      return;
    }

    setSubmitted(true);
    if (typeof onSubmitted === "function") {
      onSubmitted({ ...values, source });
    }
  }

  function setField(key, value) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setError("");
    if (fieldErrors[key] || fieldErrors.contact) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        if (key === "phone" || key === "email") delete next.contact;
        return next;
      });
    }
  }

  return (
    <div className="wx-modal-backdrop" role="dialog" aria-modal="true">
      <div className="wx-modal-card">
        <button type="button" className="wx-modal-close" onClick={onClose}>
          Close
        </button>

        <h3 className="wx-modal-title">{actionTitle}</h3>
        <p className="wx-modal-subtitle">{actionSubtitle}</p>

        {submitted ? (
          <div className="wx-success-box">
            Request sent. The provider will follow up soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="wx-modal-form" noValidate>
            <label className="wx-field-label" htmlFor="wx-lead-name">
              Name
            </label>
            <input
              id="wx-lead-name"
              className="wx-input"
              value={values.name}
              onChange={(event) => setField("name", event.target.value)}
              autoComplete="name"
              placeholder="Your name"
            />
            {fieldErrors.name ? <p className="wx-field-error">{fieldErrors.name}</p> : null}

            <label className="wx-field-label" htmlFor="wx-lead-phone">
              Phone
            </label>
            <input
              id="wx-lead-phone"
              className="wx-input"
              value={values.phone}
              onChange={(event) => setField("phone", event.target.value)}
              autoComplete="tel"
              inputMode="tel"
              placeholder="(555) 555-5555"
            />

            <label className="wx-field-label" htmlFor="wx-lead-email">
              Email
            </label>
            <input
              id="wx-lead-email"
              className="wx-input"
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
              autoComplete="email"
              placeholder="you@email.com"
            />
            {fieldErrors.email ? <p className="wx-field-error">{fieldErrors.email}</p> : null}
            {fieldErrors.contact ? <p className="wx-field-error">{fieldErrors.contact}</p> : null}

            <label className="wx-field-label" htmlFor="wx-lead-message">
              Request
            </label>
            <textarea
              id="wx-lead-message"
              className="wx-input wx-textarea"
              value={values.message}
              onChange={(event) => setField("message", event.target.value)}
              rows={4}
              placeholder="Tell the provider what you need"
            />
            {fieldErrors.message ? <p className="wx-field-error">{fieldErrors.message}</p> : null}

            {error ? <p className="wx-field-error">{error}</p> : null}

            <button type="submit" className="wx-primary-btn" disabled={submitting}>
              {submitting ? "Sending..." : submitLabel}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default WanderExLeadActionModal;
