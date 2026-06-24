"use client";

import {
  buildPlatformLoginLink,
  buildPlatformRegisterLink
} from "@/features/conversion/lib/deepLinkBuilder";
import { useTrafficLanguage } from "@/lib/language";
import { trackProviderAction } from "@/lib/analytics";

/**
 * Standalone "create an account" box shown beside the lead-capture card on
 * unclaimed provider pages. It only builds Vibez Citizens handoff links
 * (sign up / log in) — it does not touch the lead form, claim flow, or data.
 */
export default function ProviderAccountPromptCard({ providerSlug, providerSource }) {
  const { t } = useTrafficLanguage();

  const signUpLink = buildPlatformRegisterLink();
  const logInLink = buildPlatformLoginLink();

  return (
    <section
      className="card pro-account-banner"
      aria-label={t("leadCapture.accountPromptTitle")}
    >
      <div className="pro-account-banner__text">
        <h2 className="pro-cta-title">{t("leadCapture.accountPromptTitle")}</h2>
        <p className="pro-cta-desc">{t("leadCapture.accountPromptBody")}</p>
      </div>

      <div className="pro-account-banner__actions">
        <a
          className="btn btn--primary"
          href={signUpLink}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackProviderAction({ action: "signup_click", providerSlug, providerSource })
          }
        >
          {t("leadCapture.signUp")}
        </a>
        <a
          className="btn btn--ghost"
          href={logInLink}
          target="_blank"
          rel="noreferrer"
          onClick={() =>
            trackProviderAction({ action: "login_click", providerSlug, providerSource })
          }
        >
          {t("leadCapture.logIn")}
        </a>
      </div>
    </section>
  );
}
