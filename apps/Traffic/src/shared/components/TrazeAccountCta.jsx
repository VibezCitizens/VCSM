"use client";

import { getPlatformOrigin } from "@/lib/env";
import { useTrafficLanguage } from "@/lib/language";
import { claimLandingPath } from "@/lib/claimLinks";

/**
 * Account-handoff CTA shared by the homepage/global surfaces and provider pages.
 *
 * Hands business owners off to their Vibez Citizens account so they can claim
 * or manage a profile. The PRIMARY button always carries claim/listing intent
 * (/claim-business); the SECONDARY button is a plain sign-in that still carries
 * intent params (/login?intent=claim-profile). The two never resolve to the same
 * plain login URL.
 *
 * This component only constructs handoff links — it does NOT touch auth,
 * onboarding, VPORT creation, claim RPCs, the database, or provider data.
 *
 * @param {object} props
 * @param {"global"|"provider"} [props.variant]
 * @param {string|null} [props.providerSlug] required for the provider variant
 */
function buildPlatformLink(path, params) {
  try {
    const url = new URL(path, getPlatformOrigin());
    for (const [key, value] of Object.entries(params || {})) {
      if (value) url.searchParams.set(key, value);
    }
    return url.toString();
  } catch {
    return path;
  }
}

export default function TrazeAccountCta({ variant = "global", providerSlug = null }) {
  const { t, lang } = useTrafficLanguage();
  const isProvider = variant === "provider" && Boolean(providerSlug);

  // TICKET-TRAZE-CLAIM-LANDING-001 — claim CTAs route through the VCSM
  // /claim-business landing. A provider slug flows straight into the claim form;
  // the global (referenceless) CTA opens the search-first landing.
  // TICKET-TRAZE-CLAIM-LANDING-002 — the global CTA is locale-aware
  // (EN /claim-business · ES /reclamar-negocio). The provider CTA is unchanged.
  const claimHref = isProvider
    ? buildPlatformLink("/claim-business", { provider: providerSlug, source: "traffic" })
    : buildPlatformLink(claimLandingPath(lang), { source: "traffic" });

  const signInHref = isProvider
    ? buildPlatformLink("/login", { intent: "claim-profile", provider: providerSlug, source: "traffic" })
    : buildPlatformLink("/login", { intent: "claim-profile", source: "traffic" });

  const copy = isProvider
    ? {
        title: t("accountCta.providerTitle"),
        body: t("accountCta.providerBody"),
        primary: t("accountCta.providerPrimary")
      }
    : {
        title: t("accountCta.globalTitle"),
        body: t("accountCta.globalBody"),
        primary: t("accountCta.globalPrimary")
      };

  return (
    <section
      className="homepage-section homepage-section--divider homepage-cta-panel homepage-directory-surface"
      id={isProvider ? undefined : "provider-cta"}
    >
      <h2 className="homepage-claim-title">{copy.title}</h2>
      <p className="homepage-hero-copy">{copy.body}</p>
      <div className="homepage-cta-row">
        <a className="pill pill--primary pill--strong" href={claimHref} target="_blank" rel="noreferrer">
          {copy.primary}
        </a>
        <a className="pill pill--ghost" href={signInHref} target="_blank" rel="noreferrer">
          {t("accountCta.signIn")}
        </a>
      </div>
    </section>
  );
}
