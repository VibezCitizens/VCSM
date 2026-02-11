// C:\Users\trest\OneDrive\Desktop\VCSM\src\features\wanders\screens\WandersInboxPublic.screen.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import useWandersGuest from "@/features/wanders/core/hooks/useWandersGuest";
import { useWandersInboxes } from "@/features/wanders/core/hooks/useWandersInboxes.hook";
import { useWandersCards } from "@/features/wanders/core/hooks/useWandersCards.hook";

import WandersSendCardForm from "../components/WandersSendCardForm";
import WandersCardPreview from "../components/WandersCardPreview";
import WandersLoading from "../components/WandersLoading";
import WandersEmptyState from "../components/WandersEmptyState";

export default function WandersInboxPublicScreen() {
  const navigate = useNavigate();
  const { publicId } = useParams();

  const { ensureAnon } = useWandersAnon();
  const { readByPublicId } = useWandersInboxes();
  const { sendToInbox } = useWandersCards();

  const [inbox, setInbox] = useState(null);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxError, setInboxError] = useState(null);

  const [draftPayload, setDraftPayload] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    // Ensure anonymous identity for sender (anon can send)
    // If your hook returns a promise, we await it safely.
    let cancelled = false;

    (async () => {
      try {
        await Promise.resolve(ensureAnon?.());
      } catch (e) {
        // If anon identity fails, we still attempt to render the page;
        // sending may fail and show submitError.
        if (!cancelled) setInboxError(e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ensureAnon]);

  useEffect(() => {
    if (!publicId) return;

    let cancelled = false;

    (async () => {
      setInboxLoading(true);
      setInboxError(null);

      try {
        const result = await Promise.resolve(readByPublicId?.(publicId));
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
  }, [publicId, readByPublicId]);

  const isInboxValid = useMemo(() => {
    if (!inbox) return false;
    // Common patterns: inbox.active, inbox.isActive, inbox.status === 'active'
    if (typeof inbox.active === "boolean") return inbox.active;
    if (typeof inbox.isActive === "boolean") return inbox.isActive;
    if (typeof inbox.status === "string") return inbox.status.toLowerCase() === "active";
    return true;
  }, [inbox]);

  const inboxIdentity = useMemo(() => {
    if (!inbox) return null;
    // sendToInbox accepts inboxPublicId or inboxId; we provide both if present.
    return {
      inboxPublicId: publicId,
      inboxId: inbox.id || inbox.inboxId || inbox._id,
    };
  }, [inbox, publicId]);

  const handleDraftChange = (nextDraft) => {
    setDraftPayload(nextDraft || {});
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async (payloadFromForm) => {
    if (!inboxIdentity?.inboxPublicId && !inboxIdentity?.inboxId) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const finalPayload = payloadFromForm ?? draftPayload ?? {};
      await Promise.resolve(
        sendToInbox?.({
          ...(inboxIdentity.inboxPublicId ? { inboxPublicId: inboxIdentity.inboxPublicId } : {}),
          ...(inboxIdentity.inboxId ? { inboxId: inboxIdentity.inboxId } : {}),
          ...finalPayload,
        })
      );

      // Navigate to sent confirmation screen (preferred),
      // but if your app doesn’t have it, you can replace with inline success UI.
      navigate("sent", { replace: true });
    } catch (e) {
      setSubmitError(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (inboxLoading) return <WandersLoading />;

  if (!publicId || !inbox || !isInboxValid) {
    return (
      <WandersEmptyState
        title="Inbox not found"
        subtitle="This link is invalid or the inbox is inactive."
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
        <div style={styles.grid}>
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
              <div style={styles.notice}>
                {String(inboxError?.message || inboxError)}
              </div>
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

// Simple responsive enhancement without depending on external CSS.
// If your app already has a responsive system, you can remove this and rely on your CSS.
if (typeof window !== "undefined") {
  const applyResponsive = () => {
    const isWide = window.innerWidth >= 980;
    styles.grid.gridTemplateColumns = isWide ? "1.05fr 0.95fr" : "1fr";
    styles.formPane.order = isWide ? 1 : 1; // left/top
    styles.previewPane.order = isWide ? 2 : 2; // right/below
  };
  applyResponsive();
  window.addEventListener("resize", applyResponsive);
}