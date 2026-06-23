// Maps an answers.list_published_questions() row into the camelCase shape the
// public Answers page consumes. Only public fields are present by design.

export function mapPublishedQuestionRow(row = {}) {
  return {
    id: row.id,
    slug: row.slug ?? null,
    title: row.title ?? "",
    body: row.body ?? "",
    serviceKey: row.service_key ?? null,
    city: row.city ?? null,
    region: row.region ?? null,
    country: row.country ?? null,
    publishedAt: row.published_at ?? null
  };
}
