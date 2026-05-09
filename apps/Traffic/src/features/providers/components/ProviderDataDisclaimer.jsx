"use client";

import { useTrafficLanguage } from "@/lib/language";

const SUPPORT_EMAIL = "support@vibezcitizens.com";
const TERMS_URL = "https://vibezcitizens.com/legal/terms-of-service";

function buildReportMailto(providerName, providerSlug) {
  const subject = encodeURIComponent(`Report listing: ${providerName}`);
  const body = encodeURIComponent(
    `I would like to report or request changes for the following listing:\n\nBusiness name: ${providerName}\nListing ID: ${providerSlug}\n\nReason for report:\n[Please describe the issue or correction needed]\n\nThank you.`
  );
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

function buildClaimMailto(providerName, providerSlug) {
  const subject = encodeURIComponent(`Claim listing: ${providerName}`);
  const body = encodeURIComponent(
    `I am the owner or authorized representative of:\n\nBusiness name: ${providerName}\nListing ID: ${providerSlug}\n\nI would like to claim and manage this listing on the platform.\n\nMy contact information:\n[Please include your name, role, and contact details]`
  );
  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

export function ProviderDataDisclaimer({ providerName, providerSlug, claimStatus }) {
  const { t } = useTrafficLanguage();

  const isClaimed = claimStatus === "claimed";
  const reportHref = buildReportMailto(providerName, providerSlug);
  const claimHref = buildClaimMailto(providerName, providerSlug);

  return (
    <div className="pro-data-disclaimer">
      <p className="pro-data-disclaimer-text">
        {t("disclaimer.profileData")}
        {" "}
        {!isClaimed ? (
          <a className="pro-data-disclaimer-link" href={claimHref}>
            {t("disclaimer.ownerClaim")}
          </a>
        ) : null}
      </p>

      <div className="pro-data-disclaimer-actions">
        <a
          className="pro-data-disclaimer-report"
          href={reportHref}
        >
          {t("disclaimer.report")}
        </a>
        <span className="pro-data-disclaimer-sep" aria-hidden="true">·</span>
        <a
          className="pro-data-disclaimer-terms"
          href={TERMS_URL}
          target="_blank"
          rel="noreferrer"
        >
          {t("homepage.terms")}
        </a>
      </div>
    </div>
  );
}
