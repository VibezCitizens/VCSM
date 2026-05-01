function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatLocation(location) {
  return [location?.city, location?.region, location?.country].filter(Boolean).join(", ");
}

export function QuestionHeader({ question, topic, seo }) {
  if (!question) {
    return (
      <header className="question-header">
        <p className="question-header__eyebrow">TRAZE Answers</p>
        <h1>Answer page unavailable</h1>
        <p>This answer is not published yet, or it is still waiting for moderation.</p>
      </header>
    );
  }

  const location = formatLocation(question.location);

  return (
    <header className="question-header">
      <p className="question-header__eyebrow">TRAZE Answers{topic?.name ? ` - ${topic.name}` : ""}</p>
      <h1>{question.title}</h1>
      {question.body ? <p className="question-header__body">{question.body}</p> : null}
      <dl className="question-header__dates">
        <div>
          <dt>Asked</dt>
          <dd>{formatDate(seo?.askedAt)}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatDate(seo?.updatedAt)}</dd>
        </div>
        <div>
          <dt>Answered by expert</dt>
          <dd>{formatDate(seo?.answeredAt)}</dd>
        </div>
      </dl>
      {location ? <p className="question-header__location">Serving {location}</p> : null}
    </header>
  );
}
