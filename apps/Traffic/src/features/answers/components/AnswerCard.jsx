function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function renderParagraphs(text) {
  return String(text || "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 12)}`}>{paragraph}</p>);
}

export function AnswerCard({ answer }) {
  if (!answer) {
    return (
      <section className="answer-card answer-card--pending" aria-label="Pending expert answer">
        <p className="answer-card__eyebrow">Expert answer pending</p>
        <h2>We are preparing the public expert answer.</h2>
        <p>This page will become indexable after an expert answer is published and moderated.</p>
      </section>
    );
  }

  const answeredDate = formatDate(answer.answeredAt);

  return (
    <section className="answer-card" aria-label="Expert answer">
      <p className="answer-card__eyebrow">Answered by expert{answeredDate ? ` - ${answeredDate}` : ""}</p>
      <h2>{answer.expert.displayName}</h2>
      {answer.expert.serviceLabel ? <p>{answer.expert.serviceLabel}</p> : null}
      <div className="answer-card__body">{renderParagraphs(answer.body)}</div>
      {answer.expert.profileSlug ? (
        <a className="answer-card__link" href={`/pro/${answer.expert.profileSlug}`}>
          View expert profile
        </a>
      ) : null}
    </section>
  );
}
