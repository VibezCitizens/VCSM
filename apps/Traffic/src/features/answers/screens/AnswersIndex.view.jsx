import { fetchAnswersIndex } from "@/features/answers/hooks/useAnswerPage";
import { AnswerIndexHero, AnswerIndexTopics, AnswerIndexList } from "@/features/answers/components/AnswerIndexHero";

export async function AnswersIndexView() {
  const { pages, topics } = await fetchAnswersIndex();

  return (
    <section className="answers-index">
      <AnswerIndexHero />
      <AnswerIndexTopics topics={topics} />
      <AnswerIndexList pages={pages} />
    </section>
  );
}
