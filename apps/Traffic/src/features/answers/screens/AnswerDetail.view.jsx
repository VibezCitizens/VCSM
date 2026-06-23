import { AnswerCard } from "@/features/answers/components/AnswerCard";
import { AnswerSeoJsonLd } from "@/features/answers/components/AnswerSeoJsonLd";
import { AnswersQuestionJsonLd } from "@/features/answers/components/AnswersQuestionJsonLd";
import { QuestionHeader } from "@/features/answers/components/QuestionHeader";
import { AnswerReadTracker } from "@/features/answers/components/AnswerReadTracker";
import { QuestionAnswerWorkspace } from "@/features/answers/components/QuestionAnswerWorkspace";
import { fetchAnswerPage } from "@/features/answers/hooks/useAnswerPage";

export async function AnswerDetailView({ slug, initialResult = null, initialQuestion = null, initialAnswers = [] }) {
  const result = initialResult ?? (await fetchAnswerPage({ slug }));
  const page = result.page;

  // A build-time SEO answer page exists when the question resolved server-side.
  // Otherwise this is a community question (published, no expert answer page yet)
  // and the workspace renders the question + its answers client-side.
  const hasServerQuestion = result.status !== "not_found" && Boolean(page.question);

  return (
    <article className="answers-detail" data-answer-status={result.status}>
      <AnswerSeoJsonLd page={page} />
      {!hasServerQuestion && initialQuestion ? (
        <AnswersQuestionJsonLd question={initialQuestion} answers={initialAnswers} slug={slug} />
      ) : null}
      {result.status === "ready" && page.seo?.isIndexable ? (
        <AnswerReadTracker answerSlug={page.question?.slug} topicSlug={page.topic?.slug} />
      ) : null}

      {hasServerQuestion ? (
        <>
          <QuestionHeader question={page.question} topic={page.topic} seo={page.seo} />
          <AnswerCard answer={page.answer} />
        </>
      ) : null}

      <QuestionAnswerWorkspace
        slug={slug}
        initialQuestion={hasServerQuestion ? null : initialQuestion}
        initialAnswers={hasServerQuestion ? [] : initialAnswers}
        showQuestionFallback={!hasServerQuestion}
      />
    </article>
  );
}
