"use client";

import { useState } from "react";
import { useTrafficLanguage } from "@/lib/language";
import { useSubmitAnswer } from "@/features/answers/hooks/useSubmitAnswer";

export function AnswerSubmitForm({ questionSlug }) {
  const { t } = useTrafficLanguage();
  const submission = useSubmitAnswer();
  const [expertDisplayName, setExpertDisplayName] = useState("");
  const [expertProfileSlug, setExpertProfileSlug] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [body, setBody] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const result = await submission.submitAnswer({
      questionSlug,
      expertDisplayName: expertDisplayName.trim(),
      expertProfileSlug: expertProfileSlug.trim(),
      contactEmail: contactEmail.trim(),
      body: body.trim()
    });

    if (result.ok) {
      setExpertDisplayName("");
      setExpertProfileSlug("");
      setContactEmail("");
      setBody("");
    }
  }

  return (
    <section className="answers-ask-card" aria-label={t("answers.answerFormTitle")}>
      <div>
        <p className="answers-ask-card__eyebrow">{t("answers.answerFormEyebrow")}</p>
        <h2>{t("answers.answerFormTitle")}</h2>
        <p>{t("answers.answerFormBody")}</p>
      </div>

      {submission.status === "submitted" ? (
        <div className="answers-form-success" role="status">
          <strong>{t("answers.answerSubmittedTitle")}</strong>
          <span>{t("answers.answerSubmittedBody")}</span>
          <button type="button" className="btn btn--ghost" onClick={submission.reset}>
            {t("answers.answerAnother")}
          </button>
        </div>
      ) : (
        <form className="answers-question-form" onSubmit={handleSubmit}>
          <label className="answers-field">
            <span>{t("answers.answerNameLabel")}</span>
            <input
              value={expertDisplayName}
              onChange={(event) => setExpertDisplayName(event.target.value)}
              maxLength={120}
              required
              autoComplete="name"
              placeholder={t("answers.answerNamePlaceholder")}
            />
          </label>

          <label className="answers-field">
            <span>{t("answers.answerBusinessLabel")}</span>
            <input
              value={expertProfileSlug}
              onChange={(event) => setExpertProfileSlug(event.target.value)}
              maxLength={120}
              placeholder={t("answers.answerBusinessPlaceholder")}
            />
          </label>

          <label className="answers-field">
            <span>{t("answers.answerEmailLabel")}</span>
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              maxLength={254}
              autoComplete="email"
              placeholder={t("answers.answerEmailPlaceholder")}
            />
            <small className="answers-field-hint">{t("answers.questionEmailHint")}</small>
          </label>

          <label className="answers-field">
            <span>{t("answers.answerBodyLabel")}</span>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={4000}
              required
              rows={6}
              placeholder={t("answers.answerBodyPlaceholder")}
            />
          </label>

          {submission.errors?.expertDisplayName ? (
            <p className="answers-form-error">{submission.errors.expertDisplayName}</p>
          ) : null}
          {submission.errors?.body ? (
            <p className="answers-form-error">{submission.errors.body}</p>
          ) : null}
          {submission.errors?.form ? (
            <p className="answers-form-error">{submission.errors.form}</p>
          ) : null}

          <button className="btn btn--primary" type="submit" disabled={submission.isSubmitting}>
            {submission.isSubmitting ? t("answers.submittingAnswer") : t("answers.submitAnswer")}
          </button>
        </form>
      )}
    </section>
  );
}
