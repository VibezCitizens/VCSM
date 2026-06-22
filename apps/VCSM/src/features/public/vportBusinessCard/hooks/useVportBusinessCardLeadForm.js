import { useCallback, useMemo, useState } from "react";
import { submitVportBusinessCardLeadController } from "@/features/public/vportBusinessCard/controller/vportBusinessCard.controller";

const EMPTY_VALUES = Object.freeze({
  name: "",
  phone: "",
  email: "",
  message: "",
});

export function useVportBusinessCardLeadForm({ slug, vportName = null, providerProfileUrl = null } = {}) {
  const [values, setValues] = useState({ ...EMPTY_VALUES });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Dev-only: lets a debug/capture surface show why the lead notification fired
  // or failed. Stays null in production — raw errors are never shown to users.
  const [notificationDiagnostics, setNotificationDiagnostics] = useState(null);

  const canSubmit = useMemo(() => !submitting, [submitting]);

  const setField = useCallback((key, value) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key] && !prev.contact) return prev;
      const next = { ...prev };
      delete next[key];
      if (key === "phone" || key === "email") delete next.contact;
      return next;
    });
    setFormError("");
    setSubmitted(false);
  }, []);

  const reset = useCallback(() => {
    setValues({ ...EMPTY_VALUES });
    setFieldErrors({});
    setFormError("");
    setSubmitting(false);
    setSubmitted(false);
  }, []);

  const submit = useCallback(
    async (event) => {
      if (event?.preventDefault) event.preventDefault();
      if (!canSubmit) return false;

      setSubmitting(true);
      setFormError("");
      setFieldErrors({});

      try {
        const outcome = await submitVportBusinessCardLeadController({
          slug,
          name: values.name,
          phone: values.phone,
          email: values.email,
          message: values.message,
          source: "business_card",
          vportName,
          providerProfileUrl,
          userAgent:
            typeof navigator !== "undefined" && navigator.userAgent
              ? navigator.userAgent
              : null,
        });

        if (import.meta.env.DEV && outcome?.notification) {
          setNotificationDiagnostics(outcome.notification);
        }

        setSubmitted(true);
        setValues((prev) => ({
          ...prev,
          message: "",
        }));
        return true;
      } catch (error) {
        setFormError(error?.message || "Failed to send message.");
        setFieldErrors(error?.fieldErrors || {});
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [canSubmit, slug, values.email, values.message, values.name, values.phone]
  );

  return {
    values,
    setField,
    fieldErrors,
    formError,
    submitting,
    submitted,
    canSubmit,
    submit,
    reset,
    // Dev-only diagnostics for a debug/capture surface; null in production.
    notificationDiagnostics,
  };
}

export default useVportBusinessCardLeadForm;
