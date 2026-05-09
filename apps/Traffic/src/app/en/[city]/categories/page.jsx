import { generateMetadataForLocale } from "../../../(seo)/[city]/categories/page";

export { generateStaticParams } from "../../../(seo)/[city]/categories/page";
export function generateMetadata(args) {
  return generateMetadataForLocale(args, "en");
}
export { default } from "../../../(seo)/[city]/categories/page";
