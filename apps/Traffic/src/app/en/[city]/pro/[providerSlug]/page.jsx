import { generateMetadataForLocale } from "../../../../(seo)/[city]/pro/[providerSlug]/page";

export { generateStaticParams } from "../../../../(seo)/[city]/pro/[providerSlug]/page";
export function generateMetadata(args) {
  return generateMetadataForLocale(args, "en");
}
export { default } from "../../../../(seo)/[city]/pro/[providerSlug]/page";
