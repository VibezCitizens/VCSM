import { generateMetadataForLocale } from "../../../(seo)/pro/[providerSlug]/page";

export { generateStaticParams } from "../../../(seo)/pro/[providerSlug]/page";
export function generateMetadata(args) {
  return generateMetadataForLocale(args, "en");
}
export { default } from "../../../(seo)/pro/[providerSlug]/page";
