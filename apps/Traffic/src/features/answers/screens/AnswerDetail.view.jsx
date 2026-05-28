import { AnswerCard } from "@/features/answers/components/AnswerCard";
import { AnswerSeoJsonLd } from "@/features/answers/components/AnswerSeoJsonLd";
import { QuestionHeader } from "@/features/answers/components/QuestionHeader";
import { AnswerDetailNotFound } from "@/features/answers/components/AnswerDetailNotFound";
import { AnswerReadTracker } from "@/features/answers/components/AnswerReadTracker";
import { fetchAnswerPage } from "@/features/answers/hooks/useAnswerPage";

export async function AnswerDetailView({ slug }) {
  const result = await fetchAnswerPage({ slug });
  const page = result.page;

  return (
    <article className="answers-detail" data-answer-status={result.status}>
      <AnswerSeoJsonLd page={page} />
      {result.status === "ready" && page.seo?.isIndexable ? (
        <AnswerReadTracker answerSlug={page.question?.slug} topicSlug={page.topic?.slug} />
      ) : null}
      <QuestionHeader question={page.question} topic={page.topic} seo={page.seo} />
      {result.status === "not_found" ? (
        <AnswerDetailNotFound />
      ) : (
        <AnswerCard answer={page.answer} />
      )}
    </article>
  );
}
