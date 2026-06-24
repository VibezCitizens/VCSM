"use client";

import Link from "next/link";
import { useTrafficLanguage } from "@/lib/language";

const SUPPORT_EMAIL = "support@vibezcitizens.com";
const TERMS_URL = "/terms";
const PRIVACY_URL = "/privacy";

function buildReportMailto(providerName, providerSlug) {
  const subject = encodeURIComponent(`Report listing: ${providerName}`);
  const body = encodeURIComponent(
    `I would like to report or request changes for the following listing:\n\nBusiness name: ${providerName}\nListing ID: ${providerSlug}\n\nReason for report:\n[Please describe the issue or correction needed]\n\nThank you.`
  );
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

export function ProviderDataDisclaimer({ providerName, providerSlug }) {
  const { t } = useTrafficLanguage();

  // Informational/legal disclaimer only. The ownership/claim CTA lives in the
  // TrazeAccountCta "Own this business?" panel on the provider page — keeping it
  // here too produced a duplicate ownership CTA (BUG-TRAZE-CLAIM-CTA-REDUNDANCY).
  const reportHref = buildReportMailto(providerName, providerSlug);

  return (
    <div className="pro-data-disclaimer">
      <p className="pro-data-disclaimer-text">
        {t("disclaimer.profileData")}
      </p>

      <div className="pro-data-disclaimer-actions">
        <a
          className="pro-data-disclaimer-report"
          href={reportHref}
        >
          {t("disclaimer.report")}
        </a>
        <span className="pro-data-disclaimer-sep" aria-hidden="true">·</span>
        <Link className="pro-data-disclaimer-terms" href={TERMS_URL}>
          {t("homepage.terms")}
        </Link>
        <span className="pro-data-disclaimer-sep" aria-hidden="true">·</span>
        <Link className="pro-data-disclaimer-terms" href={PRIVACY_URL}>
          {t("homepage.privacy")}
        </Link>
      </div>
    </div>
  );
}
