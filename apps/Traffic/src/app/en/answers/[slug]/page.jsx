import { generateMetadataForLocale } from "../../../answers/[slug]/page";

export { generateStaticParams } from "../../../answers/[slug]/page";
export function generateMetadata(args) {
  return generateMetadataForLocale(args, "en");
}
export { default } from "../../../answers/[slug]/page";
