import { ContactScreen } from "@/features/legal/adapters/legal.adapter";
import { buildContactMetadata } from "../../contact/page";

// Support copy is maintained in English. The Spanish route renders the English
// page with a localized notice until a reviewed translation is approved.
export const metadata = buildContactMetadata("es");

export default function ContactPageEs() {
  return <ContactScreen locale="es" />;
}
