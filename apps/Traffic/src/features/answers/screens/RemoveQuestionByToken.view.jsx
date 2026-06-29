"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTrafficLanguage } from "@/lib/language";
import { useRemoveQuestionWithToken } from "@/features/answers/hooks/useRemoveQuestionWithToken";

// Reads the one-time token from the URL query string (?t=...) on the client.
// Using window.location (not useSearchParams) keeps this static-export safe and
// avoids a Suspense boundary requirement. The token is never rendered.
function useTokenFromUrl() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("t") ?? "");
  }, []);

  return token;
}

const STATUS_COPY_KEY = {
  working: "answers.removeConfirmWorking",
  removed: "answers.removeConfirmRemoved",
  expired: "answers.removeConfirmExpired",
  invalid: "answers.removeConfirmInvalid",
  already_removed: "answers.removeConfirmAlready",
  error: "answers.removeConfirmInvalid"
};

export function RemoveQuestionByTokenView() {
  const { t } = useTrafficLanguage();
  const token = useTokenFromUrl();

  // token === null → still reading the URL; "" or value → resolved.
  const ready = token !== null;
  const { status } = useRemoveQuestionWithToken(ready ? token : null);

  const effectiveStatus = ready ? status : "working";
  const messageKey = STATUS_COPY_KEY[effectiveStatus] ?? "answers.removeConfirmInvalid";

  return (
    <section className="answers-remove-confirm" aria-label={t("answers.removeConfirmTitle")}>
      <h1 className="answers-remove-confirm__title">{t("answers.removeConfirmTitle")}</h1>
      <p
        className="answers-remove-confirm__message"
        role={effectiveStatus === "working" ? "status" : "alert"}
      >
        {t(messageKey)}
      </p>
      <div className="answers-remove-confirm__back">
        <Link href="/answers">{t("answers.backToAnswers")}</Link>
      </div>
    </section>
  );
}

export default RemoveQuestionByTokenView;
