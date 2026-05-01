import { AnswerDetailScreen } from "@/features/answers/adapters/answers.adapter";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: "schema-pending" }];
}

export default function AnswerPage({ params }) {
  return <AnswerDetailScreen slug={params.slug} />;
}
