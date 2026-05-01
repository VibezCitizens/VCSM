import {
  buildPlatformClaimLink,
  buildPlatformExploreLink,
  buildPlatformProviderLink
} from "@/features/conversion/lib/deepLinkBuilder";
import ProviderLeadCaptureCard from "@/features/conversion/components/ProviderLeadCaptureCard";

export function DirectoryCtaModules({ context }) {
  return (
    <div className="card stack-grid">
      <h3 className="homepage-card-title">Continue on Vibez Citizens</h3>
      <p>
        Open live provider profiles, compare availability, and continue booking workflows on the platform.
      </p>
      <div className="row-wrap">
        <a
          className="pill pill--primary pill--strong"
          href={buildPlatformExploreLink(context, "directory")}
          target="_blank"
          rel="noreferrer"
        >
          Explore on Vibez Citizens
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
  vcsmSlug
}) {
  const claimLink = buildPlatformClaimLink(providerSlug, vcsmActorId, "provider");
  const profileHref = buildPlatformProviderLink(providerSlug, vcsmSlug, "provider");
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
