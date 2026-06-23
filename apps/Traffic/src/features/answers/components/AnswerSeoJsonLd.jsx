import { getSiteOrigin } from "@/lib/env";
import { buildBreadcrumbSchema } from "@/seo/schemaOrg";

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function AnswerSeoJsonLd({ page }) {
  if (!page?.seo?.isIndexable || !page.question || !page.answer) return null;

  const qaPage = {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: {
      "@type": "Question",
      name: page.question.title,
      text: page.question.body,
      dateCreated: page.seo.askedAt,
      dateModified: page.seo.updatedAt,
      url: page.seo.canonicalUrl,
      answerCount: 1,
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

  const breadcrumb = buildBreadcrumbSchema([
    { label: "Home", href: "/" },
    { label: "Answers", href: "/answers" },
    { label: page.question.title }
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(qaPage) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(breadcrumb) }} />
    </>
  );
}
