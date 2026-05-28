"use client";

import { useState } from "react";
import { useTrafficLanguage } from "@/lib/language";
import { useSubmitQuestion } from "@/features/answers/hooks/useSubmitQuestion";

export function AskQuestionForm() {
  const { t } = useTrafficLanguage();
  const submission = useSubmitQuestion();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await submission.submitQuestion({ title, body });

    if (result.ok) {
      setTitle("");
      setBody("");
    }
  }

  return (
    <section id="ask-question" className="answers-ask-card" aria-label={t("answers.askTitle")}>
      <div>
        <p className="answers-ask-card__eyebrow">{t("answers.askEyebrow")}</p>
        <h2>{t("answers.askTitle")}</h2>
        <p>{t("answers.askBody")}</p>
      </div>

      {submission.status === "submitted" ? (
        <div className="answers-form-success" role="status">
          <strong>{t("answers.submittedTitle")}</strong>
          <span>{t("answers.submittedBody")}</span>
          <button type="button" className="btn btn--ghost" onClick={submission.reset}>
            {t("answers.askAnother")}
          </button>
        </div>
      ) : (
        <form className="answers-question-form" onSubmit={handleSubmit}>
          <label className="answers-field">
            <span>{t("answers.questionTitleLabel")}</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={140}
              required
              placeholder={t("answers.questionTitlePlaceholder")}
            />
          </label>

          <label className="answers-field">
            <span>{t("answers.questionBodyLabel")}</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={1000}
              placeholder={t("answers.questionBodyPlaceholder")}
            />
          </label>

          {submission.errors?.title ? (
            <p className="answers-form-error">{submission.errors.title}</p>
          ) : null}
          {submission.errors?.form ? (
            <p className="answers-form-error">{submission.errors.form}</p>
          ) : null}

          <button className="btn btn--primary" type="submit" disabled={submission.isSubmitting}>
            {submission.isSubmitting ? t("answers.submitting") : t("answers.submitQuestion")}
          </button>
        </form>
      )}
    </section>
  );
}
