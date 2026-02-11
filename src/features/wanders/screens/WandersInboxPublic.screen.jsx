// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\screens\WandersInboxPublic.screen.jsx

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";
import { useWandersInboxes } from "@/features/wanders/core/hooks/useWandersInboxes"; // ✅ FIXED PATH (.js)
import { useWandersCards } from "@/features/wanders/core/hooks/useWandersCards.hook";

import WandersSendCardForm from "../components/WandersSendCardForm";
import WandersCardPreview from "../components/WandersCardPreview";
import WandersLoading from "../components/WandersLoading";
import WandersEmptyState from "../components/WandersEmptyState";

export default function WandersInboxPublicScreen() {
  const navigate = useNavigate();
  const { publicId } = useParams();

  // ✅ Ensure auth user exists (anonymous sign-in) so RLS auth.uid() works
  const { ensureUser } = useWandersGuest({ auto: true });

  const { readByPublicId } = useWandersInboxes();
  const { sendToInbox } = useWandersCards();

  const [inbox, setInbox] = useState(null);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxError, setInboxError] = useState(null);

  const [draftPayload, setDraftPayload] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const [isWide, setIsWide] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 980;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => setIsWide(window.innerWidth >= 980);
    onResize();

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await Promise.resolve(ensureUser?.());
      } catch (e) {
        if (!cancelled) setInboxError(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureUser]);

  const readByPublicIdStable = useCallback(
    (id) => Promise.resolve(readByPublicId?.(id)),
    [readByPublicId]
  );

  useEffect(() => {
    if (!publicId) return;

    let cancelled = false;

    (async () => {
      setInboxLoading(true);
      setInboxError(null);

      try {
        const result = await readByPublicIdStable(publicId);
        if (cancelled) return;
        setInbox(result || null);
      } catch (e) {
        if (cancelled) return;
        setInbox(null);
        setInboxError(e);
      } finally {
        if (!cancelled) setInboxLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [publicId, readByPublicIdStable]);

  const isInboxValid = useMemo(() => {
    if (!inbox) return false;
    if (typeof inbox.active === "boolean") return inbox.active;
    if (typeof inbox.isActive === "boolean") return inbox.isActive;
    if (typeof inbox.status === "string") return inbox.status.toLowerCase() === "active";
    return true;
  }, [inbox]);

  const inboxIdentity = useMemo(() => {
    if (!inbox) return null;
    return {
      inboxPublicId: publicId,
      inboxId: inbox.id || inbox.inboxId || inbox._id,
    };
  }, [inbox, publicId]);

  const handleDraftChange = useCallback(
    (nextDraft) => {
      setDraftPayload(nextDraft || {});
      if (submitError) setSubmitError(null);
    },
    [submitError]
  );

  const handleSubmit = useCallback(
    async (payloadFromForm) => {
      if (!inboxIdentity?.inboxPublicId && !inboxIdentity?.inboxId) return;

      setSubmitting(true);
      setSubmitError(null);

      try {
        // ensure user exists before sending
        await Promise.resolve(ensureUser?.());

        const finalPayload = payloadFromForm ?? draftPayload ?? {};
        await Promise.resolve(
          sendToInbox?.({
            ...(inboxIdentity.inboxPublicId ? { inboxPublicId: inboxIdentity.inboxPublicId } : {}),
            ...(inboxIdentity.inboxId ? { inboxId: inboxIdentity.inboxId } : {}),
            ...finalPayload,
          })
        );

        navigate("sent", { replace: true });
      } catch (e) {
        setSubmitError(e);
      } finally {
        setSubmitting(false);
      }
    },
    [draftPayload, ensureUser, inboxIdentity, navigate, sendToInbox]
  );

  const gridStyle = useMemo(
    () => ({
      ...styles.grid,
      gridTemplateColumns: isWide ? "1.05fr 0.95fr" : "1fr",
    }),
    [isWide]
  );

  if (inboxLoading) return <WandersLoading />;

  if (!publicId || !inbox || !isInboxValid) {
    return (
      <WandersEmptyState
        title="Inbox not found"
        subtitle={
          inboxError
            ? String(inboxError?.message || inboxError)
            : "This link is invalid or the inbox is inactive."
        }
      />
    );
  }

  return (
    <div className="wanders-inbox-public" style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerText}>
          <h1 style={styles.title}>Send to Inbox</h1>
          <div style={styles.subtitle}>
            {inbox?.displayName || inbox?.name ? (
              <>
                Sending to <strong>{inbox.displayName || inbox.name}</strong>
              </>
            ) : (
              "Send a card to this inbox"
            )}
          </div>
        </div>
      </div>

      <div style={styles.body}>
        <div style={gridStyle}>
          <div style={styles.formPane}>
            <WandersSendCardForm
              inbox={inbox}
              value={draftPayload}
              onChange={handleDraftChange}
              onSubmit={handleSubmit}
              submitting={submitting}
              error={submitError}
            />

            {!!inboxError && (
              <div style={styles.notice}>{String(inboxError?.message || inboxError)}</div>
            )}
          </div>

          <div style={styles.previewPane}>
            <WandersCardPreview inbox={inbox} draftPayload={draftPayload} />
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    minHeight: "100%",
    padding: "16px",
    boxSizing: "border-box",
  },
  header: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "8px 0 16px 0",
    boxSizing: "border-box",
  },
  headerText: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  title: {
    margin: 0,
    fontSize: 24,
    lineHeight: "32px",
  },
  subtitle: {
    opacity: 0.8,
    fontSize: 14,
    lineHeight: "20px",
  },
  body: {
    maxWidth: 1200,
    margin: "0 auto",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 16,
  },
  formPane: {
    order: 1,
  },
  previewPane: {
    order: 2,
  },
  notice: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "rgba(0,0,0,0.03)",
    fontSize: 13,
    lineHeight: "18px",
    wordBreak: "break-word",
  },
};
