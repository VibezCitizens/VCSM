import { AnswerDetailScreen } from "@/features/answers/adapters/answers.adapter";
import { listAnswerStaticParams, readAnswerPage } from "@/features/answers/controller/readAnswerPage.controller";
import { buildLocalizedAlternates } from "@/seo/locale";

export const dynamicParams = false;

export async function generateStaticParams() {
  return listAnswerStaticParams();
}

export async function generateMetadataForLocale({ params }, routeLocale = null) {
  const result = await readAnswerPage({ slug: params.slug });
  const { seo } = result.page;
  const alternates = buildLocalizedAlternates(seo.canonicalPath, { locale: routeLocale });

  return {
    title: seo.title,
    description: seo.description,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages
    },
    robots: seo.isIndexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export async function generateMetadata({ params }) {
  return generateMetadataForLocale({ params });
}

export default function AnswerPage({ params }) {
  return <AnswerDetailScreen slug={params.slug} />;
}
