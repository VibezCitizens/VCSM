import { AnswerDetailView } from "@/features/answers/screens/AnswerDetail.view";

export function AnswerDetailScreen({ slug, initialResult = null, initialQuestion = null, initialAnswers = [] }) {
  return (
    <AnswerDetailView
      slug={slug}
      initialResult={initialResult}
      initialQuestion={initialQuestion}
      initialAnswers={initialAnswers}
    />
  );
}
