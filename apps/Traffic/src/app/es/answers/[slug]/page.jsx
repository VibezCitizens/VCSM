import {
  AnswerDetailScreen,
  listAnswerStaticParams
} from "@/features/answers/adapters/answers.adapter";
import { generateMetadataForLocale } from "../../../answers/[slug]/page";

export const dynamicParams = false;

export async function generateStaticParams() {
  return listAnswerStaticParams();
}

export function generateMetadata(args) {
  return generateMetadataForLocale(args, "es");
}

export default function SpanishAnswerPage({ params }) {
  return <AnswerDetailScreen slug={params.slug} />;
}
