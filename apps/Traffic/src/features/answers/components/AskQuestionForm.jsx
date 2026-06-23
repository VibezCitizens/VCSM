"use client";

import { useState } from "react";
import { useTrafficLanguage } from "@/lib/language";
import { useSubmitQuestion } from "@/features/answers/hooks/useSubmitQuestion";

export function AskQuestionForm() {
  const { t } = useTrafficLanguage();
  const submission = useSubmitQuestion();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [askerName, setAskerName] = useState("");
  const [askerEmail, setAskerEmail] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await submission.submitQuestion({
      title: title.trim(),
      body: body.trim(),
      askerName: askerName.trim(),
      askerEmail: askerEmail.trim()
    });

    if (result.ok) {
      setTitle("");
      setBody("");
      setAskerName("");
      setAskerEmail("");
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

          <label className="answers-field">
            <span>{t("answers.questionNameLabel")}</span>
            <input
              value={askerName}
              onChange={(event) => setAskerName(event.target.value)}
              maxLength={120}
              autoComplete="name"
              placeholder={t("answers.questionNamePlaceholder")}
            />
          </label>

          <label className="answers-field">
            <span>{t("answers.questionEmailLabel")}</span>
            <input
              type="email"
              value={askerEmail}
              onChange={(event) => setAskerEmail(event.target.value)}
              maxLength={254}
              autoComplete="email"
              placeholder={t("answers.questionEmailPlaceholder")}
            />
            <small className="answers-field-hint">{t("answers.questionEmailHint")}</small>
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
