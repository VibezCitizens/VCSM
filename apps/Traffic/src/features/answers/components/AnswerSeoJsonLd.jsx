import { buildBreadcrumbSchema, buildQAPageSchema } from "@/seo/schemaOrg";

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

// Build-time SEO answer page: one expert answer, treated as the accepted answer.
// QAPage JSON-LD comes from the single canonical builder (buildQAPageSchema).
export function AnswerSeoJsonLd({ page }) {
  if (!page?.seo?.isIndexable || !page.question || !page.answer) return null;

  const qaPage = buildQAPageSchema({
    question: {
      name: page.question.title,
      text: page.question.body,
      url: page.seo.canonicalUrl,
      dateCreated: page.seo.askedAt,
      dateModified: page.seo.updatedAt
    },
    answers: [
      {
        text: page.answer.body,
        url: page.seo.canonicalUrl,
        dateCreated: page.seo.answeredAt,
        authorName: page.answer.expert.displayName,
        isAccepted: true
      }
    ]
  });

  const breadcrumb = buildBreadcrumbSchema([
    { label: "Home", href: "/" },
    { label: "Answers", href: "/answers" },
    { label: page.question.title }
  ]);

  return (
    <>
      {qaPage ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(qaPage) }} />
      ) : null}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson(breadcrumb) }} />
    </>
  );
}
