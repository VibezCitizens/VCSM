import { AnswerDetailScreen } from "@/features/answers/adapters/answers.adapter";
import { listAnswerStaticParams } from "@/features/answers/controller/readAnswerPage.controller";
import { generateMetadataForLocale } from "../../../answers/[slug]/page";

export const dynamicParams = false;

export async function generateStaticParams() {
  return listAnswerStaticParams();
}

export function generateMetadata(args) {
  return generateMetadataForLocale(args, "en");
}

export default function EnglishAnswerPage({ params }) {
  return <AnswerDetailScreen slug={params.slug} />;
}
