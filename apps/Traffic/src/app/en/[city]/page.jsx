import { generateMetadataForLocale } from "../../(seo)/[city]/page";

export { generateStaticParams } from "../../(seo)/[city]/page";
export function generateMetadata(args) {
  return generateMetadataForLocale(args, "en");
}
export { default } from "../../(seo)/[city]/page";
