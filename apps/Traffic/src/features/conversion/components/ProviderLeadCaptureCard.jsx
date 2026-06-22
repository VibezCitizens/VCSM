"use client";

import { useProviderLeadCapture } from "@/features/conversion/hooks/useProviderLeadCapture";
import { useTrafficLanguage } from "@/lib/language";
import { trackProviderAction } from "@/lib/analytics";
import LeadNotificationDebugCard from "@/features/conversion/components/LeadNotificationDebugCard";

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
  providerSource,
  supabaseUrl,
  supabaseAnonKey
}) {
  const { t } = useTrafficLanguage();

  const {
    values,
    fieldErrors,
    formError,
    isSubmitting,
    isSubmitted,
    isUnavailable,
    setField,
    handleSubmit,
    notificationDiagnostics
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
      aria-label={t("leadCapture.contactProviderAria")}
    >
      <h2 className="pro-cta-title">
        {t("leadCapture.contactProviderTitle")}
      </h2>
      <p className="pro-cta-desc">{t("leadCapture.contactProviderBody")}</p>

      <div className="pro-lead-quick-actions">
        {phoneHref ? (
          <a
            className="btn btn--ghost"
            href={phoneHref}
            onClick={() => trackProviderAction({ action: "call_click", providerSlug, providerSource })}
          >
            {t("leadCapture.callNow")}
          </a>
        ) : (
          <button className="btn btn--ghost" type="button" disabled>
            {t("leadCapture.callNow")}
          </button>
        )}
        {profileHref ? (
          <a
            className="btn btn--primary"
            href={profileHref}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              trackProviderAction({ action: "full_profile_click", providerSlug, providerSource })
            }
          >
            {t("leadCapture.viewFullProfile")}
          </a>
        ) : null}
      </div>

      {isSubmitted ? (
        <div className="pro-lead-success" role="status" aria-live="polite">
          <p className="pro-lead-success-title">
            {t("leadCapture.messageSent")}
          </p>
          <p className="pro-lead-success-copy">{t("leadCapture.messageSentBody")}</p>
        </div>
      ) : isUnavailable ? (
        <div className="pro-lead-success" role="status" aria-live="polite">
          <p className="pro-lead-success-title">
            {t("leadCapture.contactUnavailable")}
          </p>
          <p className="pro-lead-success-copy">
            {phoneHref
              ? t("leadCapture.unavailableWithPhone")
              : t("leadCapture.unavailableNoPhone")}
          </p>
        </div>
      ) : (
        <form className="pro-lead-form" onSubmit={handleSubmit} noValidate>
          <label className="pro-lead-field" htmlFor="lead-name">
            <span className="pro-lead-label">
              {t("common.name")}
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
              {t("common.phone")}
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
              {t("common.email")}
            </span>
            <input
              id="lead-email"
              className="pro-lead-input"
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder={t("common.optional")}
            />
          </label>

          <label className="pro-lead-field" htmlFor="lead-message">
            <span className="pro-lead-label">
              {t("common.message")}
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
              ? t("leadCapture.sending")
              : t("leadCapture.sendRequest")}
          </button>
        </form>
      )}

      {process.env.NODE_ENV !== "production" && notificationDiagnostics ? (
        <LeadNotificationDebugCard diagnostics={notificationDiagnostics} />
      ) : null}

      {claimStatus !== "claimed" && claimLink ? (
        <a
          className="btn btn--claim"
          href={claimLink}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackProviderAction({ action: "claim_click", providerSlug, providerSource })}
        >
          {t("leadCapture.claimThisProfile")}
        </a>
      ) : null}
    </section>
  );
}
