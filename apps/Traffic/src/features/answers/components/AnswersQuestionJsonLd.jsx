import { buildCanonical } from "@/seo/canonical";
import { buildBreadcrumbSchema, buildQAPageSchema } from "@/seo/schemaOrg";

// Server-rendered structured data for community published questions
// (answers.questions + answers.answers). Public-safe fields only — never
// asker_email, contact_email, moderation_note, or moderated_by_actor_id.
// QAPage JSON-LD comes from the single canonical builder (buildQAPageSchema),
// which omits the QAPage entirely when there are no answers.

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function AnswersQuestionJsonLd({ question, answers = [], slug }) {
  if (!question?.title || !slug) return null;

  const url = buildCanonical(`/answers/${slug}`);

  const qaPage = buildQAPageSchema({
    question: {
      name: question.title,
      text: question.body || question.title,
      url,
      dateCreated: question.publishedAt || undefined,
      datePublished: question.publishedAt || undefined
    },
    answers: answers.map((answer) => ({
      text: answer?.body,
      url,
      dateCreated: answer?.publishedAt || undefined,
      datePublished: answer?.publishedAt || undefined,
      authorName: answer?.expertDisplayName,
      isAccepted: answer?.isAccepted
    }))
  });

  const breadcrumb = buildBreadcrumbSchema([
    { label: "Home", href: "/" },
    { label: "Answers", href: "/answers" },
    { label: question.title }
  ]);

  const scripts = [...(qaPage ? [qaPage] : []), breadcrumb];

  return (
    <>
      {scripts.map((node, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJson(node) }}
        />
      ))}
    </>
  );
}
