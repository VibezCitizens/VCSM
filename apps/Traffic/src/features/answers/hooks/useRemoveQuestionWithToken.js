"use client";

import { useEffect, useState } from "react";
import { removeQuestionWithToken } from "@/features/answers/controllers/removeQuestionWithToken.controller";

// Drives the confirm page. Reads the token once on mount and runs the removal.
// Result states mirror the RPC: removed | expired | invalid | already_removed,
// plus "working" while pending and "error" on transport failure.
export function useRemoveQuestionWithToken(token) {
  const [status, setStatus] = useState("working");

  useEffect(() => {
    let cancelled = false;

    const clean = String(token ?? "").trim();
    if (!clean) {
      setStatus("invalid");
      return undefined;
    }

    setStatus("working");
    removeQuestionWithToken(clean).then((result) => {
      if (!cancelled) setStatus(result.status ?? "invalid");
    });

    return () => {
      cancelled = true;
    };
  }, [token]);

  return { status };
}
