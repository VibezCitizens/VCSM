import {
  listPublicAnswerCandidateRows,
  listPublicAnswerPageRows,
  listPublicAnswerSlugRows,
  readPublicAnswerPageRowsBySlug
} from "@/features/answers/dal/publicAnswerPages.read.dal";
import { listPublicTopicRows } from "@/features/answers/dal/publicTopics.read.dal";
import {
  mapPublicAnswerCandidateRowToPageCandidate,
  mapPublicAnswerPageRowToPageRows,
  mapPublicTopicRowToTopicRow
} from "@/features/answers/model/publicAnswerPage.model";
import { mapAnswerPageRowsToSeoAnswerPage, mapTopicRowsToTopicList } from "@/features/answers/model/seoAnswerPage.model";

const EMPTY_STATIC_PARAMS = [{ slug: "answers-unavailable" }];

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

function pickFirstPublicAnswerPageRow(rows = []) {
  return rows[0] ?? null;
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

  const publicRows = await readPublicAnswerPageRowsBySlug({ slug: safeSlug });
  const publicRow = pickFirstPublicAnswerPageRow(publicRows);
  if (!publicRow) return emptyAnswerPage("not_found", "question_not_found");

  const { questionRow, answerRow, topicRow } = mapPublicAnswerPageRowToPageRows(publicRow);
  if (!isPublicQuestionRow(questionRow)) {
    return emptyAnswerPage("not_indexable", "question_not_published_or_moderated");
  }
  const page = mapAnswerPageRowsToSeoAnswerPage({
    questionRow,
    answerRow,
    topicRow,
    isIndexable: isPublicAnswerRow(answerRow)
  });

  return {
    status: answerRow ? "ready" : "pending_answer",
    reason: answerRow ? null : "question_has_no_public_answer",
    page
  };
}

export async function readAnswersIndex({ limit = 20 } = {}) {
  const [publicRows, publicTopicRows] = await Promise.all([
    listPublicAnswerPageRows({ limit }),
    listPublicTopicRows({ limit: 12 })
  ]);

  const rowsBySlug = new Map();
  publicRows.forEach((row) => {
    if (!row?.slug || rowsBySlug.has(row.slug)) {
      return;
    }
    rowsBySlug.set(row.slug, row);
  });

  const pages = Array.from(rowsBySlug.values())
    .map((row) => {
      const { questionRow, answerRow, topicRow } = mapPublicAnswerPageRowToPageRows(row);
      return mapAnswerPageRowsToSeoAnswerPage({
        questionRow,
        answerRow,
        topicRow,
        isIndexable: isPublicQuestionRow(questionRow) && isPublicAnswerRow(answerRow)
      });
    })
    .filter((page) => page.seo.isIndexable);
  const topicRows = publicTopicRows.map(mapPublicTopicRowToTopicRow).filter(Boolean);

  return {
    status: "ready",
    pages,
    topics: mapTopicRowsToTopicList(topicRows).filter((topic) => topic.isActive)
  };
}

export async function listAnswerStaticParams() {
  const rows = await listPublicAnswerSlugRows();
  const slugs = new Set();

  rows.forEach((row) => {
    const safeSlug = normalizeSlug(row?.slug);
    if (safeSlug) slugs.add(safeSlug);
  });

  if (slugs.size === 0) {
    return EMPTY_STATIC_PARAMS;
  }

  return Array.from(slugs).map((slug) => ({ slug }));
}

export async function listAnswerPageCandidates() {
  const rows = await listPublicAnswerCandidateRows();
  const candidatesByPath = new Map();

  rows.forEach((row) => {
    const candidate = mapPublicAnswerCandidateRowToPageCandidate(row);
    if (!candidate?.path) return;
    candidatesByPath.set(candidate.path, candidate);
  });

  return Array.from(candidatesByPath.values());
}
