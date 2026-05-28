import { fetchAnswersIndex } from "@/features/answers/hooks/useAnswerPage";
import { AnswerIndexClient } from "@/features/answers/components/AnswerIndexClient";

export async function AnswersIndexView() {
  const { pages, topics } = await fetchAnswersIndex();

  return <AnswerIndexClient pages={pages} topics={topics} />;
}
