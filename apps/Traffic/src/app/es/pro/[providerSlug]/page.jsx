import { generateMetadataForLocale } from "../../../(seo)/pro/[providerSlug]/page";

export { generateStaticParams } from "../../../(seo)/pro/[providerSlug]/page";
export function generateMetadata(args) {
  return generateMetadataForLocale(args, "es");
}
export { default } from "../../../(seo)/pro/[providerSlug]/page";
