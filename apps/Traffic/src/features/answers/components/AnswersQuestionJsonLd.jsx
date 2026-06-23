import { buildCanonical } from "@/seo/canonical";
import { buildBreadcrumbSchema } from "@/seo/schemaOrg";
import { getSiteOrigin } from "@/lib/env";

// Server-rendered structured data for community published questions
// (answers.questions + answers.answers). Public-safe fields only — never
// asker_email, contact_email, moderation_note, or moderated_by_actor_id.

function safeJson(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function toAnswerNode(answer, url) {
  return {
    "@type": "Answer",
    text: answer.body,
    ...(answer.publishedAt
      ? { dateCreated: answer.publishedAt, datePublished: answer.publishedAt }
      : {}),
    url,
    author: {
      "@type": "Person",
      name: answer.expertDisplayName,
      ...(answer.expertProfileSlug
        ? { url: `${getSiteOrigin()}/pro/${answer.expertProfileSlug}` }
        : {})
    }
  };
}

export function AnswersQuestionJsonLd({ question, answers = [], slug }) {
  if (!question?.title || !slug) return null;

  const url = buildCanonical(`/answers/${slug}`);
  const published = answers.filter((answer) => answer && answer.body);
  const accepted = published.find((answer) => answer.isAccepted) || null;
  const suggested = published.filter((answer) => answer !== accepted);

  const scripts = [];

  // Emit QAPage only when at least one published answer exists, so we never
  // publish an answerless QAPage (which search engines flag as incomplete).
  if (published.length > 0) {
    scripts.push({
      "@context": "https://schema.org",
      "@type": "QAPage",
      mainEntity: {
        "@type": "Question",
        name: question.title,
        text: question.body || question.title,
        ...(question.publishedAt
          ? { dateCreated: question.publishedAt, datePublished: question.publishedAt }
          : {}),
        url,
        answerCount: published.length,
        ...(accepted ? { acceptedAnswer: toAnswerNode(accepted, url) } : {}),
        ...(suggested.length > 0
          ? { suggestedAnswer: suggested.map((answer) => toAnswerNode(answer, url)) }
          : {})
      }
    });
  }

  scripts.push(
    buildBreadcrumbSchema([
      { label: "Home", href: "/" },
      { label: "Answers", href: "/answers" },
      { label: question.title }
    ])
  );

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
