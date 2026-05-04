"use client";

import { useProviderLeadCapture } from "@/features/conversion/hooks/useProviderLeadCapture";
import { useTrafficLanguage } from "@/lib/language";

function toPhoneHref(value) {
  const digits = String(value ?? "").replace(/[^\d+]/g, "");
  if (!digits) return "";
  return `tel:${digits}`;
}

export default function ProviderLeadCaptureCard({
  providerSlug,
  providerPhone,
  providerName,
  profileHref,
  claimStatus,
  claimLink,
  supabaseUrl,
  supabaseAnonKey
}) {
  const { lang } = useTrafficLanguage();

  const {
    values,
    fieldErrors,
    formError,
    isSubmitting,
    isSubmitted,
    isUnavailable,
    setField,
    handleSubmit
  } = useProviderLeadCapture({
    providerSlug,
    providerName,
    profileHref,
    supabaseUrl,
    supabaseAnonKey
  });

  const phoneHref = toPhoneHref(providerPhone);

  return (
    <section
      className="card card--cta pro-cta"
      aria-label={lang === "es" ? "Contactar proveedor" : "Contact provider"}
    >
      <h2 className="pro-cta-title">
        {lang === "es" ? "Contactar este proveedor" : "Contact this provider"}
      </h2>
      <p className="pro-cta-desc">
        {lang === "es"
          ? "Envía un mensaje y te responderán"
          : "Send a message and they'll get back to you"}
      </p>

      <div className="pro-lead-quick-actions">
        {phoneHref ? (
          <a className="btn btn--ghost" href={phoneHref}>
            {lang === "es" ? "Llamar ahora" : "Call now"}
          </a>
        ) : (
          <button className="btn btn--ghost" type="button" disabled>
            {lang === "es" ? "Llamar ahora" : "Call now"}
          </button>
        )}
        <a className="btn btn--primary" href={profileHref} target="_blank" rel="noreferrer">
          {lang === "es" ? "Ver perfil completo" : "View full profile"}
        </a>
      </div>

      {isSubmitted ? (
        <div className="pro-lead-success" role="status" aria-live="polite">
          <p className="pro-lead-success-title">
            {lang === "es" ? "Mensaje enviado ✅" : "Message sent ✅"}
          </p>
          <p className="pro-lead-success-copy">
            {lang === "es"
              ? "El proveedor te contactará pronto."
              : "The provider will contact you soon."}
          </p>
        </div>
      ) : isUnavailable ? (
        <div className="pro-lead-success" role="status" aria-live="polite">
          <p className="pro-lead-success-title">
            {lang === "es" ? "Contacto no disponible" : "Contact unavailable"}
          </p>
          <p className="pro-lead-success-copy">
            {phoneHref
              ? (lang === "es"
                  ? "Este proveedor no está recibiendo mensajes aquí. Llámales o revisa su perfil completo."
                  : "This provider isn't accepting messages here right now. Give them a call or view their full profile.")
              : (lang === "es"
                  ? "Este proveedor no está recibiendo mensajes aquí. Ve a su perfil para contactarles."
                  : "This provider isn't accepting messages here right now. View their full profile to get in touch.")}
          </p>
        </div>
      ) : (
        <form className="pro-lead-form" onSubmit={handleSubmit} noValidate>
          <label className="pro-lead-field" htmlFor="lead-name">
            <span className="pro-lead-label">
              {lang === "es" ? "Nombre" : "Name"}
            </span>
            <input
              id="lead-name"
              className="pro-lead-input"
              value={values.name}
              onChange={(event) => setField("name", event.target.value)}
              autoComplete="name"
              required
            />
            {fieldErrors.name ? <span className="pro-lead-error">{fieldErrors.name}</span> : null}
          </label>

          <label className="pro-lead-field" htmlFor="lead-phone">
            <span className="pro-lead-label">
              {lang === "es" ? "Teléfono" : "Phone"}
            </span>
            <input
              id="lead-phone"
              className="pro-lead-input pro-lead-input--phone"
              value={values.phone}
              onChange={(event) => setField("phone", event.target.value)}
              autoComplete="tel"
              inputMode="tel"
              placeholder="(555) 555-1234"
              maxLength={14}
            />
          </label>

          <label className="pro-lead-field" htmlFor="lead-email">
            <span className="pro-lead-label">
              {lang === "es" ? "Correo" : "Email"}
            </span>
            <input
              id="lead-email"
              className="pro-lead-input"
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder={lang === "es" ? "Opcional" : "Optional"}
            />
          </label>

          <label className="pro-lead-field" htmlFor="lead-message">
            <span className="pro-lead-label">
              {lang === "es" ? "Mensaje" : "Message"}
            </span>
            <textarea
              id="lead-message"
              className="pro-lead-input pro-lead-textarea"
              value={values.message}
              onChange={(event) => setField("message", event.target.value)}
              required
            />
            {fieldErrors.message ? (
              <span className="pro-lead-error">{fieldErrors.message}</span>
            ) : null}
          </label>

          {formError ? (
            <p className="pro-lead-form-error" role="alert">
              {formError}
            </p>
          ) : null}

          <button className="btn btn--primary pro-lead-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? (lang === "es" ? "Enviando..." : "Sending...")
              : (lang === "es" ? "Enviar solicitud" : "Send request")}
          </button>
        </form>
      )}

      {claimStatus !== "claimed" && claimLink ? (
        <a className="btn btn--claim" href={claimLink} target="_blank" rel="noreferrer">
          {lang === "es" ? "Reclamar este perfil" : "Claim This Profile"}
        </a>
      ) : null}
    </section>
  );
}
