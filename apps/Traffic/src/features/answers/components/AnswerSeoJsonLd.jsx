import { getSiteOrigin } from "@/lib/env";

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function AnswerSeoJsonLd({ page }) {
  if (!page?.seo?.isIndexable || !page.question || !page.answer) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: page.question.title,
      text: page.question.body,
      dateCreated: page.seo.askedAt,
      dateModified: page.seo.updatedAt,
      url: page.seo.canonicalUrl,
      acceptedAnswer: {
        "@type": "Answer",
        text: page.answer.body,
        dateCreated: page.seo.answeredAt,
        url: page.seo.canonicalUrl,
        author: {
          "@type": "Person",
          name: page.answer.expert.displayName,
          url: page.answer.expert.profileSlug
            ? `${getSiteOrigin()}/pro/${page.answer.expert.profileSlug}`
            : undefined
        }
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJson(jsonLd) }}
    />
  );
}
