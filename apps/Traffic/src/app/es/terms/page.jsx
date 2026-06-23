import TermsScreen from "@/features/legal/screens/TermsScreen";
import { buildTermsMetadata } from "../../terms/page";

// Legal copy is maintained in English. The Spanish route renders the English
// document with a localized notice until a reviewed translation is approved.
// TODO(legal-i18n): replace with reviewed Spanish legal copy after sign-off.
export const metadata = buildTermsMetadata("es");

export default function TermsPageEs() {
  return <TermsScreen locale="es" />;
}
