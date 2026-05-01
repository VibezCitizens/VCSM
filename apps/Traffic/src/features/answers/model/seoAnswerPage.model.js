import { mapAnswerRowToAnswer } from "@/features/answers/model/answer.model";
import { mapQuestionRowToQuestion } from "@/features/answers/model/question.model";
import { mapTopicRowToTopic } from "@/features/answers/model/topic.model";

const PUBLIC_ORIGIN = "https://traze.vibezcitizens.com";

function buildDescription(question, answer) {
  if (answer?.body) {
    return answer.body.replace(/\s+/g, " ").slice(0, 155);
  }

  if (question?.body) {
    return question.body.replace(/\s+/g, " ").slice(0, 155);
  }

  return "Public expert answers from TRAZE.";
}

export function mapTopicRowsToTopicList(rows = []) {
  return rows.map(mapTopicRowToTopic).filter(Boolean);
}

export function mapAnswerPageRowsToSeoAnswerPage({
  questionRow,
  answerRow,
  topicRow,
  isIndexable = false
}) {
  const question = mapQuestionRowToQuestion(questionRow);
  const answer = mapAnswerRowToAnswer(answerRow);
  const topic = mapTopicRowToTopic(topicRow);
  const slug = question?.slug || "";
  const canonicalPath = slug ? `/answers/${slug}` : "/answers";
  const title = question?.title ? `${question.title} | TRAZE Answers` : "TRAZE Answers";

  return {
    question,
    answer,
    topic,
    seo: {
      title,
      description: buildDescription(question, answer),
      canonicalPath,
      canonicalUrl: `${PUBLIC_ORIGIN}${canonicalPath}`,
      isIndexable: Boolean(isIndexable),
      robotsContent: isIndexable ? "index,follow" : "noindex,nofollow",
      askedAt: question?.askedAt ?? null,
      updatedAt: question?.updatedAt ?? answer?.updatedAt ?? null,
      answeredAt: answer?.answeredAt ?? null
    }
  };
}
