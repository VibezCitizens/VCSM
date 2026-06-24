"use client";

import TrazeAccountCta from "@/shared/components/TrazeAccountCta";

// Homepage account-handoff CTA. Renders the shared <TrazeAccountCta> in its
// "global" variant (claim/create a business profile via a Vibez Citizens
// account). The site footer is the separate global <TrazePublicFooter> in the
// root layout, so it is intentionally not rendered here.
export default function HomepageCtaFooter() {
  return <TrazeAccountCta variant="global" />;
}
