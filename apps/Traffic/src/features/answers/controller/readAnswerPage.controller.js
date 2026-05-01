import { readAnswerRowsByQuestionId, listAnswerRowsByQuestionIds } from "@/features/answers/dal/answers.read.dal";
import { listQuestionRows, readQuestionRowBySlug } from "@/features/answers/dal/questions.read.dal";
import { listTopicRows, readTopicRowsByIds } from "@/features/answers/dal/topics.read.dal";
import { mapAnswerPageRowsToSeoAnswerPage, mapTopicRowsToTopicList } from "@/features/answers/model/seoAnswerPage.model";

function normalizeSlug(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isPublicQuestionRow(row) {
  return row?.is_published === true && row?.is_moderated === true;
}

function isPublicAnswerRow(row) {
  return row?.is_published === true;
}

function pickPublicAnswerRow(rows = []) {
  const publicRows = rows.filter(isPublicAnswerRow);
  return publicRows.find((row) => row.is_accepted === true) ?? publicRows[0] ?? null;
}

function emptyAnswerPage(status, reason = null) {
  return {
    status,
    reason,
    page: mapAnswerPageRowsToSeoAnswerPage({
      questionRow: null,
      answerRow: null,
      topicRow: null,
      isIndexable: false
    })
  };
}

export async function readAnswerPage({ slug }) {
  const safeSlug = normalizeSlug(slug);
  if (!safeSlug) return emptyAnswerPage("not_found", "missing_slug");

  const questionRow = await readQuestionRowBySlug({ slug: safeSlug });
  if (!questionRow) return emptyAnswerPage("not_found", "question_not_found");

  if (!isPublicQuestionRow(questionRow)) {
    return emptyAnswerPage("not_indexable", "question_not_published_or_moderated");
  }

  const [answerRows, topicRows] = await Promise.all([
    readAnswerRowsByQuestionId({ questionId: questionRow.id }),
    questionRow.topic_id ? readTopicRowsByIds({ topicIds: [questionRow.topic_id] }) : []
  ]);
  const answerRow = pickPublicAnswerRow(answerRows);
  const page = mapAnswerPageRowsToSeoAnswerPage({
    questionRow,
    answerRow,
    topicRow: topicRows[0] ?? null,
    isIndexable: Boolean(answerRow)
  });

  return {
    status: answerRow ? "ready" : "pending_answer",
    reason: answerRow ? null : "question_has_no_public_answer",
    page
  };
}

export async function readAnswersIndex({ limit = 20 } = {}) {
  const [questionRows, topicRows] = await Promise.all([
    listQuestionRows({ limit }),
    listTopicRows({ limit: 12 })
  ]);
  const publicQuestionRows = questionRows.filter(isPublicQuestionRow);
  const answerRows = await listAnswerRowsByQuestionIds({
    questionIds: publicQuestionRows.map((row) => row.id)
  });
  const topicRowsById = new Map(topicRows.map((row) => [row.id, row]));
  const answerRowsByQuestionId = new Map();

  answerRows.forEach((row) => {
    if (!isPublicAnswerRow(row)) return;
    const current = answerRowsByQuestionId.get(row.question_id);
    if (!current || row.is_accepted === true) {
      answerRowsByQuestionId.set(row.question_id, row);
    }
  });

  const pages = publicQuestionRows
    .map((questionRow) => {
      const answerRow = answerRowsByQuestionId.get(questionRow.id) ?? null;
      return mapAnswerPageRowsToSeoAnswerPage({
        questionRow,
        answerRow,
        topicRow: topicRowsById.get(questionRow.topic_id) ?? null,
        isIndexable: Boolean(answerRow)
      });
    })
    .filter((page) => page.seo.isIndexable);

  return {
    status: "ready",
    pages,
    topics: mapTopicRowsToTopicList(topicRows).filter((topic) => topic.isActive)
  };
}
