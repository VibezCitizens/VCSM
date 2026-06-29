"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTrafficLanguage } from "@/lib/language";
import { useRequestQuestionRemoval } from "@/features/answers/hooks/useRequestQuestionRemoval";

// "Remove this question" control for community questions. The trigger is a glass
// danger card; clicking it opens a modal (portaled to <body> so no parent
// stacking context can clip it). The modal asks for the email used at submission
// and triggers the server-side request flow. It ALWAYS shows the same generic
// confirmation — it never reveals whether the email matched the question.
export function QuestionRemovalRequestPanel({ slug }) {
  const { t } = useTrafficLanguage();
  const { status, errors, isSubmitting, requestRemoval, reset } = useRequestQuestionRemoval();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const inputRef = useRef(null);

  const emailId = `remove-email-${slug}`;
  const titleId = `remove-title-${slug}`;

  async function handleSubmit(event) {
    event.preventDefault();
    await requestRemoval({ slug, email });
  }

  // While open: lock body scroll, focus the field, close on Escape.
  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.cancelAnimationFrame(raf);
    };
  }, [open]);

  // Reset request state + field when the modal closes, so reopening starts fresh.
  useEffect(() => {
    if (open) return;
    reset();
    setEmail("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!slug) return null;

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="answers-remove-modal__overlay" onMouseDown={() => setOpen(false)}>
            <div
              className="answers-remove-modal__dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="answers-remove-modal__header">
                <span className="answers-remove-modal__badge" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </span>
                <h2 id={titleId} className="answers-remove-modal__title">
                  {t("answers.removeQuestionCta")}
                </h2>
                <button
                  type="button"
                  className="answers-remove-modal__close"
                  onClick={() => setOpen(false)}
                  aria-label={t("answers.removeClose")}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" />
                    <path d="M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {status === "requested" ? (
                <div className="answers-remove-modal__body">
                  <p className="answers-remove-modal__generic" role="status">
                    {t("answers.removeRequestGeneric")}
                  </p>
                  <button
                    type="button"
                    className="answers-remove-modal__done"
                    onClick={() => setOpen(false)}
                  >
                    {t("answers.removeDone")}
                  </button>
                </div>
              ) : (
                <form className="answers-remove-modal__body" onSubmit={handleSubmit} noValidate>
                  <p className="answers-remove-modal__intro">{t("answers.removeQuestionIntro")}</p>
                  <label className="answers-remove-modal__label" htmlFor={emailId}>
                    {t("answers.removeEmailLabel")}
                  </label>
                  <input
                    ref={inputRef}
                    id={emailId}
                    type="email"
                    className="answers-remove-modal__input"
                    placeholder={t("answers.removeEmailPlaceholder")}
                    value={email}
                    maxLength={254}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={isSubmitting}
                  />
                  {errors.email ? (
                    <p className="answers-remove-modal__error">{t("answers.removeRequestError")}</p>
                  ) : null}
                  <button
                    type="submit"
                    className="answers-remove-modal__submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t("answers.removeSubmitting") : t("answers.removeSubmit")}
                  </button>
                </form>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <section className="answers-remove-panel" aria-label={t("answers.removeQuestionCta")}>
      <button
        type="button"
        className="answers-remove-card"
        onClick={() => setOpen(true)}
        aria-label={t("answers.removeQuestionCta")}
      >
        <span className="answers-remove-card__badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </span>
        <span className="answers-remove-card__text">
          <span className="answers-remove-card__title">{t("answers.removeQuestionCta")}</span>
          <span className="answers-remove-card__subtitle">{t("answers.removeQuestionCardSubtitle")}</span>
        </span>
        <span className="answers-remove-card__chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      </button>
      {modal}
    </section>
  );
}
