import { generateMetadataForLocale } from "../../(seo)/[city]/page";

export { generateStaticParams } from "../../(seo)/[city]/page";
export function generateMetadata(args) {
  return generateMetadataForLocale(args, "es");
}
export { default } from "../../(seo)/[city]/page";
