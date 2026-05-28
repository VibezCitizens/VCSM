"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getProviderLeadPrefill,
  submitProviderLead
} from "@/features/conversion/controller/submitProviderLead.controller";
import { trackProviderLeadSubmitted } from "@/lib/analytics";
const DEFAULT_MESSAGE = "Hi, I'm interested in your services.";

function createInitialValues() {
  return {
    name: "",
    phone: "",
    email: "",
    message: DEFAULT_MESSAGE
  };
}

function formatPhoneInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function useProviderLeadCapture({
  providerSlug,
  providerName,
  profileHref,
  supabaseUrl,
  supabaseAnonKey
}) {
  const [values, setValues] = useState(() => createInitialValues());
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [status, setStatus] = useState("idle");
  const [actorId, setActorId] = useState(null);
  const [prefilled, setPrefilled] = useState(false);

  const config = useMemo(
    () => ({ supabaseUrl, supabaseAnonKey }),
    [supabaseUrl, supabaseAnonKey]
  );

  useEffect(() => {
    let active = true;
    if (prefilled) return undefined;

    getProviderLeadPrefill(config).then((prefill) => {
      if (!active) return;

      if (prefill.actorId) {
        setActorId(prefill.actorId);
      }

      setValues((prev) => ({
        ...prev,
        name: prev.name || prefill.name,
        email: prev.email || prefill.email
      }));
      setPrefilled(true);
    });

    return () => {
      active = false;
    };
  }, [config, prefilled]);

  const setField = useCallback((field, value) => {
    const nextValue = field === "phone" ? formatPhoneInput(value) : value;

    setValues((prev) => ({
      ...prev,
      [field]: nextValue
    }));

    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

    setFormError("");
  }, []);

  const handleSubmit = useCallback(async (event) => {
    event?.preventDefault?.();
    if (status === "submitting") return;

    setStatus("submitting");
    setFormError("");

    try {
      const result = await submitProviderLead({
        config,
        providerSlug,
        providerName,
        profileHref,
        actorId,
        name: values.name,
        phone: values.phone,
        email: values.email,
        message: values.message,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : null
      });

      if (result.status === "validation_error") {
        setFieldErrors(result.fieldErrors);
        setStatus("idle");
        return;
      }

      if (result.status === "unavailable") {
        setFieldErrors({});
        setStatus("unavailable");
        return;
      }

      setFieldErrors({});
      setStatus("success");
      trackProviderLeadSubmitted({
        providerSlug,
        surface: "provider",
        hasEmail: Boolean(values.email),
        hasPhone: Boolean(values.phone)
      });
    } catch (error) {
      console.error("[providerLeadCapture] submit failed", error);
      setFormError("Something went wrong. Try again.");
      setStatus("error");
    }
  }, [actorId, config, profileHref, providerName, providerSlug, status, values]);

  return {
    values,
    fieldErrors,
    formError,
    status,
    isSubmitting: status === "submitting",
    isSubmitted: status === "success",
    isUnavailable: status === "unavailable",
    setField,
    handleSubmit
  };
}
