import { generateMetadataForLocale } from "../../../../(seo)/[city]/[segment]/[service]/page";

export { generateStaticParams } from "../../../../(seo)/[city]/[segment]/[service]/page";
export function generateMetadata(args) {
  return generateMetadataForLocale(args, "en");
}
export { default } from "../../../../(seo)/[city]/[segment]/[service]/page";
