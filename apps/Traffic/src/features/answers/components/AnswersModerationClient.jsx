"use client";

import { useState } from "react";
import { useAnswersModeration } from "@/features/answers/hooks/useAnswersModeration";

function AnswerModerationList({ question, moderation }) {
  if (!question.answers.length) {
    return <p className="answers-moderation__muted">No answer has been drafted yet.</p>;
  }

  return (
    <ul className="answers-moderation__answers">
      {question.answers.map((answer) => (
        <li key={answer.id}>
          <div>
            <strong>{answer.expertDisplayName}</strong>
            <span>{answer.moderationStatus || answer.status}</span>
          </div>
          <p>{answer.body}</p>
          <div className="answers-moderation__actions">
            <button type="button" onClick={() => moderation.publishAnswer(answer.id)}>
              Publish answer
            </button>
            <button type="button" onClick={() => moderation.rejectAnswer(answer.id)}>
              Reject answer
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function QuestionModerationCard({ question, moderation }) {
  const [answerBody, setAnswerBody] = useState("");

  async function handleCreateAnswer(event) {
    event.preventDefault();
    await moderation.createAnswer({
      questionId: question.id,
      body: answerBody,
      expertDisplayName: "TRAZE"
    });
    setAnswerBody("");
  }

  return (
    <article className="answers-moderation-card">
      <div className="answers-moderation-card__header">
        <div>
          <span>{question.moderationStatus || question.status}</span>
          <h2>{question.title}</h2>
        </div>
        <div className="answers-moderation__actions">
          <button type="button" onClick={() => moderation.approveQuestion(question.id)}>
            Approve question
          </button>
          <button type="button" onClick={() => moderation.rejectQuestion(question.id)}>
            Reject question
          </button>
        </div>
      </div>

      {question.body ? <p>{question.body}</p> : null}
      <AnswerModerationList question={question} moderation={moderation} />

      <form className="answers-moderation__answer-form" onSubmit={handleCreateAnswer}>
        <label>
          <span>Expert/admin answer</span>
          <textarea
            value={answerBody}
            onChange={(event) => setAnswerBody(event.target.value)}
            required
            placeholder="Write the expert answer. It will stay pending until published."
          />
        </label>
        <button type="submit">Create answer draft</button>
      </form>
    </article>
  );
}

export function AnswersModerationClient() {
  const moderation = useAnswersModeration();

  return (
    <section className="answers-moderation">
      <header>
        <p className="answers-kicker">Internal workflow</p>
        <h1>TRAZE Answers moderation</h1>
        <p>Review pending questions, create expert answers, and publish approved Q&A pages.</p>
      </header>

      <form
        className="answers-moderation__token"
        onSubmit={(event) => {
          event.preventDefault();
          moderation.refresh();
        }}
      >
        <label>
          <span>Moderation token</span>
          <input
            value={moderation.token}
            onChange={(event) => moderation.setToken(event.target.value)}
            type="password"
            placeholder="Paste internal moderation token"
          />
        </label>
        <button type="submit">Load queue</button>
      </form>

      {moderation.error ? <p className="answers-form-error">{moderation.error}</p> : null}
      {moderation.status === "loading" ? <p>Loading moderation queue...</p> : null}

      <div className="answers-moderation__queue">
        {moderation.questions.length > 0 ? (
          moderation.questions.map((question) => (
            <QuestionModerationCard key={question.id} question={question} moderation={moderation} />
          ))
        ) : (
          <p className="answers-moderation__muted">No moderation queue loaded.</p>
        )}
      </div>
    </section>
  );
}
