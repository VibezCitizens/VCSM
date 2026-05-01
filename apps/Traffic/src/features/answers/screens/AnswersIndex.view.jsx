import { useAnswersIndex } from "@/features/answers/hooks/useAnswerPage";

export async function AnswersIndexView() {
  const { pages, topics } = await useAnswersIndex();

  return (
    <section className="answers-index">
      <header className="answers-index__hero">
        <p>TRAZE Answers</p>
        <h1>Expert answers for local service decisions.</h1>
        <p>
          Public Q&A pages will connect search intent to trusted VPORT experts, services,
          bookings, and messages.
        </p>
        <a href="/ask" aria-disabled="true">
          Ask a question soon
        </a>
      </header>

      {topics.length > 0 ? (
        <section className="answers-index__topics" aria-label="Answer topics">
          <h2>Topics</h2>
          <ul>
            {topics.map((topic) => (
              <li key={topic.id}>{topic.name}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="answers-index__list" aria-label="Published answers">
        <h2>Published answers</h2>
        {pages.length > 0 ? (
          <ul>
            {pages.map((page) => (
              <li key={page.question.id}>
                <a href={page.seo.canonicalPath}>{page.question.title}</a>
                <p>{page.seo.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No public answers are published yet. The read-only architecture is ready for the answers schema.</p>
        )}
      </section>
    </section>
  );
}
