import { PrivacyScreen } from "@/features/legal/adapters/legal.adapter";
import { buildContentMetadata } from "@/seo/metadata";

export function buildPrivacyMetadata(routeLocale = null) {
  return buildContentMetadata({
    title: "Privacy Policy | Traze",
    description:
      "Learn how Vibez Citizens and Traze collect, use, and protect information when you use our directory, provider discovery tools, and public content features.",
    path: "/privacy",
    routeLocale
  });
}

export const metadata = buildPrivacyMetadata();

export default function PrivacyPage() {
  return <PrivacyScreen locale="en" />;
}
