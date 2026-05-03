import { AnswerDetailScreen } from "@/features/answers/adapters/answers.adapter";
import { readAnswerPage } from "@/features/answers/controller/readAnswerPage.controller";

export const dynamicParams = false;

export function generateStaticParams() {
  return [{ slug: "schema-pending" }];
}

export async function generateMetadata({ params }) {
  const result = await readAnswerPage({ slug: params.slug });
  const { seo } = result.page;

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: seo.canonicalUrl,
    },
    robots: seo.isIndexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default function AnswerPage({ params }) {
  return <AnswerDetailScreen slug={params.slug} />;
}
