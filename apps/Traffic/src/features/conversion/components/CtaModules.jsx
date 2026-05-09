"use client";

import {
  buildPlatformClaimLink,
  buildPlatformExploreLink,
  buildPlatformProviderLink
} from "@/features/conversion/lib/deepLinkBuilder";
import ProviderLeadCaptureCard from "@/features/conversion/components/ProviderLeadCaptureCard";
import { useTrafficLanguage } from "@/lib/language";

export function DirectoryCtaModules({ context }) {
  const { t } = useTrafficLanguage();

  return (
    <div className="card stack-grid">
      <h3 className="homepage-card-title">
        {t("cta.continueOnVc")}
      </h3>
      <p>{t("cta.continueBody")}</p>
      <div className="row-wrap">
        <a
          className="pill pill--primary pill--strong"
          href={buildPlatformExploreLink(context, "directory")}
          target="_blank"
          rel="noreferrer"
        >
          {t("cta.exploreOnVc")}
        </a>
      </div>
    </div>
  );
}

export function ProviderCtaModules({
  providerSlug,
  providerProfileId,
  providerPhone,
  providerName,
  claimStatus,
  vcsmActorId,
  vcsmSlug,
  providerSource
}) {
  const claimLink = buildPlatformClaimLink(providerSlug, vcsmActorId, "provider");
  const profileHref =
    providerSource === "seed" && !vcsmActorId && !vcsmSlug
      ? null
      : buildPlatformProviderLink(providerSlug, vcsmSlug, "provider");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";

  return (
    <ProviderLeadCaptureCard
      providerSlug={providerSlug}
      providerProfileId={providerProfileId}
      providerPhone={providerPhone}
      providerName={providerName}
      profileHref={profileHref}
      claimStatus={claimStatus}
      claimLink={claimLink}
      supabaseUrl={supabaseUrl}
      supabaseAnonKey={supabaseAnonKey}
    />
  );
}
