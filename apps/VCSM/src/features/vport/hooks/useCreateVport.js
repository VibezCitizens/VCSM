// features/vport/hooks/useCreateVport.js
// Manages submission lifecycle for vport creation.
// Business logic delegated to submitCreateVportController.
// React-aware services (navigation, service upsert mutation) handled here.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/app/providers/AuthProvider";
import useUpsertVportServices from "@/features/profiles/adapters/kinds/vport/hooks/services/useUpsertVportServices.adapter";
import { submitCreateVportController } from "@/features/vport/controller/submitCreateVport.controller";

export function useCreateVport({ onCreated } = {}) {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const upsertServices = useUpsertVportServices();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [_bbDebug, _setBbDebug] = useState(null);

  const isBusy = submitting || upsertServices.isPending;

  async function submit({ name, type, description, avatarFile, avatarUrl, directoryVisible, selectedServiceKeys }) {
    if (!user?.id) return { ok: false };

    setSubmitting(true);
    setError("");

    const normalizedType = String(type).toLowerCase();

    if (import.meta.env.DEV) {
      _setBbDebug({
        stage: "sending",
        payload: { name: name.trim(), vportType: normalizedType, bio: (description || "").trim() || null, avatarUrl: avatarUrl || null },
        result: null,
        error: null,
      });
    }

    try {
      const { res, list } = await submitCreateVportController({
        name,
        type,
        description,
        avatarFile,
        avatarUrl,
        directoryVisible,
        withList: !!onCreated,
      });

      if (import.meta.env.DEV) _setBbDebug((p) => ({ ...p, stage: "success", result: res }));

      if (selectedServiceKeys.size > 0 && res?.actorId) {
        const selectedItems = [...selectedServiceKeys].map((key) => ({ key, enabled: true }));
        try {
          await upsertServices.mutate({
            targetActorId: res.actorId,
            vportType: normalizedType,
            items: selectedItems,
          });
        } catch {
          // non-fatal — services can be added later
        }
      }

      if (onCreated) {
        onCreated({ created: res, list });
      } else {
        if (res?.actorId) navigate(`/profile/${res.actorId}`);
        else navigate("/settings?tab=vports");
      }

      return { ok: true };
    } catch (err) {
      if (import.meta.env.DEV) _setBbDebug((p) => ({ ...(p || {}), stage: "error", error: { message: err.message, meta: err.meta ?? null } }));
      setError(err.message || "Failed to create Vport.");
      return { ok: false };
    } finally {
      setSubmitting(false);
    }
  }

  return { submit, isBusy, error, _bbDebug, _setBbDebug };
}
