import { AnswerDetailScreen } from "@/features/answers/adapters/answers.adapter";
import {
  generateMetadataForLocale,
  generateStaticParams as baseGenerateStaticParams,
  loadAnswerDetailProps
} from "../../../answers/[slug]/page";

export const dynamicParams = false;

export function generateStaticParams() {
  return baseGenerateStaticParams();
}

export function generateMetadata(args) {
  return generateMetadataForLocale(args, "es");
}

export default async function SpanishAnswerPage({ params }) {
  const { slug } = await params;
  const props = await loadAnswerDetailProps(slug);
  return <AnswerDetailScreen {...props} />;
}
