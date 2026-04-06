import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";

import { useAuth } from "@/app/providers/AuthProvider";
import { useIdentity } from "@/state/identity/identityContext";

import { useProfileUploads } from "@/features/settings/profile/hooks/useProfileUploads";
import { ctrlResolveVportIdByActorId } from "@/features/settings/profile/controller/resolveVportIdByActorId.controller";
import {
  loadProfileCore,
  saveProfileCore,
} from "@/features/settings/profile/controller/Profile.controller.core";

const UUID_RX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function useProfileController() {
  const { user } = useAuth();
  const { identity } = useIdentity();

  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();

  const mode = useMemo(() => {
    const qp = searchParams.get("mode");
    if (qp === "vport") return "vport";

    if (identity?.kind === "vport") return "vport";

    const segs = location.pathname.split("/").filter(Boolean);
    if (segs.includes("vport")) return "vport";

    return "user";
  }, [searchParams, identity?.kind, location.pathname]);

  const [subjectId, setSubjectId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (mode !== "vport") {
        if (!cancelled) setSubjectId(user?.id || null);
        return;
      }

      if (params.vportId) {
        if (!cancelled) setSubjectId(params.vportId);
        return;
      }

      const actorId = identity?.actorId || null;
      if (!actorId) {
        if (!cancelled) setSubjectId(null);
        return;
      }

      try {
        const vportId = await ctrlResolveVportIdByActorId(actorId);
        if (!cancelled) setSubjectId(vportId || null);
      } catch (error) {
        console.error(
          "[ProfileController] resolveVportIdFromActor failed",
          error
        );
        if (!cancelled) setSubjectId(null);
      }
    }

    resolve();
    return () => {
      cancelled = true;
    };
  }, [mode, params.vportId, identity?.actorId, user?.id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  const uploads = useProfileUploads({ mode, subjectId });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError("");
      setProfile(null);

      if (!subjectId) {
        setLoading(false);
        return;
      }

      if (mode === "vport" && !UUID_RX.test(subjectId)) {
        setError("Invalid VPORT id.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const mapped = await loadProfileCore({ subjectId, mode });
        if (cancelled) return;

        setProfile(mapped);
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Failed to load profile.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [subjectId, mode]);

  const saveProfile = useCallback(
    async (draft) => {
      if (!subjectId) return;

      setSaving(true);
      setError("");

      try {
        const updatedUi = await saveProfileCore({
          subjectId,
          mode,
          draft,
          uploads,
        });

        setProfile((p) => ({
          ...(p || {}),
          ...updatedUi,
        }));
      } catch (e) {
        setError(e?.message || "Could not save changes.");
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [subjectId, mode, uploads]
  );

  const profilePath =
    mode === "vport"
      ? subjectId
        ? `/vport/${subjectId}`
        : "#"
      : user
      ? "/me"
      : "#";

  return {
    ready: !!subjectId && !loading,
    loading,
    saving,
    error,
    mode,
    subjectId,
    profile,
    profilePath,
    saveProfile,
  };
}
