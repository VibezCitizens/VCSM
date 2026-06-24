import { ContactScreen } from "@/features/legal/adapters/legal.adapter";
import { buildContentMetadata } from "@/seo/metadata";

export function buildContactMetadata(routeLocale = null) {
  return buildContentMetadata({
    title: "Contact | Traze",
    description:
      "Contact Vibez Citizens and Traze for support, privacy requests, reports, and business listing corrections.",
    path: "/contact",
    routeLocale
  });
}

export const metadata = buildContactMetadata();

export default function ContactPage() {
  return <ContactScreen locale="en" />;
}
