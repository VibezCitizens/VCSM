import { generateMetadataForLocale } from "../../../(seo)/[city]/[segment]/page";

export { generateStaticParams } from "../../../(seo)/[city]/[segment]/page";
export function generateMetadata(args) {
  return generateMetadataForLocale(args, "es");
}
export { default } from "../../../(seo)/[city]/[segment]/page";
