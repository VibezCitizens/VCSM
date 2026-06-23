import TermsScreen from "@/features/legal/screens/TermsScreen";
import { buildContentMetadata } from "@/seo/metadata";

export function buildTermsMetadata(routeLocale = null) {
  return buildContentMetadata({
    title: "Vibez Citizens / Traze Terms of Use",
    description:
      "Terms of Use for Vibez Citizens and the Traze local services directory, covering listings, claims, questions and answers, and provider discovery.",
    path: "/terms",
    routeLocale
  });
}

export const metadata = buildTermsMetadata();

export default function TermsPage() {
  return <TermsScreen locale="en" />;
}
