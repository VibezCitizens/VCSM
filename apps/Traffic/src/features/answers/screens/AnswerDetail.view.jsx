import { AnswerCard } from "@/features/answers/components/AnswerCard";
import { AnswerSeoJsonLd } from "@/features/answers/components/AnswerSeoJsonLd";
import { QuestionHeader } from "@/features/answers/components/QuestionHeader";
import { useAnswerPage } from "@/features/answers/hooks/useAnswerPage";

export async function AnswerDetailView({ slug }) {
  const result = await useAnswerPage({ slug });
  const page = result.page;

  return (
    <article className="answers-detail" data-answer-status={result.status}>
      <AnswerSeoJsonLd page={page} />
      <QuestionHeader question={page.question} topic={page.topic} seo={page.seo} />
      {result.status === "not_found" ? (
        <section className="answers-detail__empty">
          <h2>We could not find that answer.</h2>
          <p>The answer may not exist yet, or the slug may have changed before publication.</p>
          <a href="/answers">Browse TRAZE Answers</a>
        </section>
      ) : (
        <AnswerCard answer={page.answer} />
      )}
    </article>
  );
}
