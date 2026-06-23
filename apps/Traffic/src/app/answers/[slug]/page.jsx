import {
  AnswerDetailScreen,
  listAnswerStaticParams,
  readAnswerPage
} from "@/features/answers/adapters/answers.adapter";
import { listPublishedQuestions } from "@/features/answers/dal/publishedQuestions.read.dal";
import {
  getPublishedQuestion,
  listPublishedAnswersForQuestion
} from "@/features/answers/dal/answerDetail.read.dal";
import { mapPublishedQuestionRow } from "@/features/answers/models/publishedQuestion.model";
import { mapPublishedAnswerRow } from "@/features/answers/models/publishedAnswer.model";
import { buildContentMetadata } from "@/seo/metadata";

export const dynamicParams = false;

// Public-safe meta description: question body + first published answer preview +
// service/location context. Never includes private fields (asker_email, etc.).
function buildQuestionSeoDescription({ body, answerPreview, service, location, fallback }) {
  const segments = [body, answerPreview]
    .map((value) => String(value || "").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  const context = [service, location].filter(Boolean).join(", ");
  let text = segments.join(" — ");
  if (context) text = text ? `${text} — ${context}` : context;
  text = text.slice(0, 160).trim();
  return text || fallback || "";
}

// Static export needs every detail slug at build time. Union the existing SEO
// answer-page slugs with all currently-published question slugs so published
// community questions get a real page instead of a 404.
export async function generateStaticParams() {
  const [answerParams, published] = await Promise.all([
    listAnswerStaticParams(),
    listPublishedQuestions()
      .then((result) => result.data ?? [])
      .catch(() => [])
  ]);

  const slugs = new Set();
  answerParams.forEach((param) => {
    if (param?.slug && param.slug !== "answers-unavailable") slugs.add(param.slug);
  });
  published.forEach((row) => {
    if (row?.slug) slugs.add(row.slug);
  });

  if (slugs.size === 0) slugs.add("answers-unavailable");

  return Array.from(slugs).map((slug) => ({ slug }));
}

// Build-time props loader, shared by the localized routes. Seeds the community
// question (via the public RPC) so it is present in the prerendered HTML for SEO.
export async function loadAnswerDetailProps(slug) {
  const result = await readAnswerPage({ slug });

  let initialQuestion = null;
  let initialAnswers = [];
  if (result.status === "not_found") {
    // Seed BOTH the question and its published answers server-side so the answer
    // bodies are present in the prerendered HTML (crawlable), not only in client
    // state. Reads are public-safe and degrade to empty on failure.
    const [{ data: questionRow }, { data: answerRows }] = await Promise.all([
      getPublishedQuestion(slug),
      listPublishedAnswersForQuestion(slug)
    ]);
    initialQuestion = questionRow ? mapPublishedQuestionRow(questionRow) : null;
    initialAnswers = (answerRows ?? []).map(mapPublishedAnswerRow);
  }

  return { slug, initialResult: result, initialQuestion, initialAnswers };
}

export async function generateMetadataForLocale({ params }, routeLocale = null) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const result = await readAnswerPage({ slug });
  let { seo } = result.page;
  let publishedTime;
  const modifiedTime = seo?.updatedAt;

  // Community-question fallback so the prerendered <title>/description are real.
  if (result.status === "not_found") {
    const [{ data: questionRow }, { data: answerRows }] = await Promise.all([
      getPublishedQuestion(slug),
      listPublishedAnswersForQuestion(slug)
    ]);
    if (questionRow) {
      const question = mapPublishedQuestionRow(questionRow);
      const firstAnswer = (answerRows ?? [])[0];
      const answerPreview = firstAnswer ? mapPublishedAnswerRow(firstAnswer).body : "";
      const location = [question.city, question.region, question.country].filter(Boolean).join(", ");
      seo = {
        ...seo,
        title: question.title ? `${question.title} | TRAZE Answers` : seo.title,
        description: buildQuestionSeoDescription({
          body: question.body,
          answerPreview,
          service: question.serviceKey,
          location,
          fallback: seo.description
        }),
        canonicalPath: question.slug ? `/answers/${question.slug}` : seo.canonicalPath,
        isIndexable: true
      };
      publishedTime = question.publishedAt || undefined;
    }
  }

  // buildContentMetadata preserves the locale/canonical strategy (alternates +
  // x-default) and adds Open Graph + Twitter tags. Robots default to indexable;
  // only non-indexable pages get an explicit noindex.
  return buildContentMetadata({
    title: seo.title,
    description: seo.description,
    canonicalPath: seo.canonicalPath,
    routeLocale,
    ...(seo.isIndexable ? {} : { robots: { index: false, follow: true } }),
    ...(publishedTime ? { publishedTime } : {}),
    ...(modifiedTime ? { modifiedTime } : {})
  });
}

export async function generateMetadata({ params }) {
  return generateMetadataForLocale({ params });
}

export default async function AnswerPage({ params }) {
  const { slug } = await params;
  const props = await loadAnswerDetailProps(slug);
  return <AnswerDetailScreen {...props} />;
}
