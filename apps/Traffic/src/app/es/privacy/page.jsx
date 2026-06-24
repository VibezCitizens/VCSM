import { PrivacyScreen } from "@/features/legal/adapters/legal.adapter";
import { buildPrivacyMetadata } from "../../privacy/page";

// Legal copy is maintained in English. The Spanish route renders the English
// document with a localized notice until a reviewed translation is approved.
// TODO(legal-i18n): replace with reviewed Spanish legal copy after sign-off.
export const metadata = buildPrivacyMetadata("es");

export default function PrivacyPageEs() {
  return <PrivacyScreen locale="es" />;
}
