"use client";

import { useCallback, useEffect, useState } from "react";

const TOKEN_STORAGE_KEY = "traze_answers_moderation_token";

async function requestModerationApi(path, { token, method = "GET", body = null } = {}) {
  const response = await fetch(path, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : null
  });
  const payload = await response.json();
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || "Moderation request failed.");
  }
  return payload;
}

export function useAnswersModeration() {
  const [token, setTokenState] = useState("");
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    setTokenState(window.sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? "");
  }, []);

  const setToken = useCallback((value) => {
    const nextToken = value.trim();
    setTokenState(nextToken);
    window.sessionStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    setStatus("loading");
    setError(null);
    try {
      const payload = await requestModerationApi("/api/answers/moderation/questions", {
        token,
        method: "POST"
      });
      setQuestions(payload.questions ?? []);
      setStatus("ready");
    } catch (requestError) {
      setError(requestError.message);
      setStatus("error");
    }
  }, [token]);

  const runAction = useCallback(
    async (path, body, method = "PATCH") => {
      setStatus("saving");
      setError(null);
      try {
        await requestModerationApi(path, { token, method, body });
        await refresh();
      } catch (requestError) {
        setError(requestError.message);
        setStatus("error");
      }
    },
    [refresh, token]
  );

  return {
    token,
    setToken,
    questions,
    status,
    error,
    refresh,
    approveQuestion: (id) => runAction("/api/answers/moderation/questions", { id, action: "approve" }, "POST"),
    rejectQuestion: (id) => runAction("/api/answers/moderation/questions", { id, action: "reject" }, "POST"),
    createAnswer: (body) => runAction("/api/answers/moderation/answers", body, "POST"),
    publishAnswer: (id) => runAction("/api/answers/moderation/answers", { id, action: "publish" }, "POST"),
    rejectAnswer: (id) => runAction("/api/answers/moderation/answers", { id, action: "reject" }, "POST")
  };
}
