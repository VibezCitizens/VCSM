// src/features/wanders/screens/view/WandersMailbox.view.jsx
// ============================================================================
// WANDERS VIEW SCREEN — MAILBOX
// Owns rendering + view-local composition. Calls hooks only.
// No DAL, no controllers, no supabase.
// ============================================================================

import React, { useMemo } from "react";

import WandersMailboxToolbar from "../../components/WandersMailboxToolbar";
import WandersMailboxList from "../../components/WandersMailboxList";
import WandersCardDetail from "../../components/WandersCardDetail";
import WandersRepliesList from "../../components/WandersRepliesList";
import WandersReplyComposer from "../../components/WandersReplyComposer";

import WandersEmptyState from "../../components/WandersEmptyState";
import WandersLoading from "../../components/WandersLoading";
import WandersShareVCSM from "../../components/WandersShareVCSM";

import useWandersMailboxExperience from "@/features/wanders/core/hooks/useWandersMailboxExperience.hook";

import { WANDERS_CHROME as C } from "@/features/wanders/utils/wandersChrome";

export default function WandersMailboxView({ mode }) {
  const vm = useWandersMailboxExperience({ mode });
  const { mailbox, replies, ui, actions } = vm;

  const splitStyle = useMemo(
    () => ({
      ...styles.split,
      gridTemplateColumns: ui?.splitStyle?.gridTemplateColumns || "1fr",
    }),
    [ui?.splitStyle?.gridTemplateColumns]
  );

  if (mailbox.loading) return <WandersLoading />;

  if (mailbox.error) {
    return (
      <WandersEmptyState
        title="Mailbox unavailable"
        subtitle={String(mailbox.error?.message || mailbox.error)}
      />
    );
  }

  return (
    <div className={C.shell}>
      <div aria-hidden className={C.bgGlow} />

      {/* Guest warning modal */}
      {ui.showGuestModal ? (
        <div style={styles.modalOverlay} role="dialog" aria-modal="true" aria-label="Guest inbox notice">
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>Temporary inbox (Guest Mode)</div>
              <button type="button" onClick={actions.dismissGuestModal} style={styles.modalCloseBtn} aria-label="Close">
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.modalText}>
                You’re using a <b>guest inbox</b> tied to this browser’s storage. If you clear site data, use private
                browsing, switch devices, or storage/cookies are blocked, this inbox can become <b>unrecoverable</b>.
              </div>

              <div style={{ marginTop: 12 }}>
                <WandersShareVCSM
                  fromPath="/wanders/mailbox"
                  title="Save your WVOX forever"
                  subtitle="Create an account to keep your mailbox across devices and never lose access."
                />
              </div>

              <div style={styles.modalActionsRow}>
                <label style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={ui.guestModalDontShow}
                    onChange={(e) => actions.setGuestModalDontShow(!!e.target.checked)}
                  />
                  <span style={styles.checkboxLabel}>Don’t show again</span>
                </label>

                <div style={styles.modalBtns}>
                  <button type="button" onClick={actions.dontShowAgain} style={styles.modalBtnGhost}>
                    Dismiss
                  </button>
                </div>
              </div>

              <div style={styles.modalHint}>Tip: Account mailboxes are protected by login and won’t open if your link leaks.</div>
            </div>
          </div>
        </div>
      ) : null}

      {/* “Header” area (toolbar) using global chrome container spacing */}
      <header className={C.header}>
        <div className={C.container}>
          <div className={C.headerPad}>
            <div style={styles.toolbar}>
              <WandersMailboxToolbar
                {...ui.toolbarProps}
                showAccountButtons={ui.isGuest}
                fromPath="/wanders/mailbox"
                accountTitle="Save your WVOX forever"
                accountSubtitle="Guest mode is browser-bound and can be lost. Create an account to persist your mailbox securely."
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className={C.main}>
        <div style={splitStyle}>
          {/* LEFT LIST */}
          <div className={C.dashBox}>
            <div aria-hidden className={C.glowTL} />
            <div aria-hidden className={C.glowBR} />

            {mailbox.items.length ? (
              <WandersMailboxList
                items={mailbox.items}
                loading={false}
                onItemClick={actions.onItemClick}
                selectedItemId={mailbox.selectedId}
                empty={
                  <WandersEmptyState
                    title="No messages"
                    subtitle={ui.search ? "No items match your search." : "Your mailbox is empty in this folder."}
                  />
                }
              />
            ) : (
              <WandersEmptyState
                title="No messages"
                subtitle={ui.search ? "No items match your search." : "Your mailbox is empty in this folder."}
              />
            )}
          </div>

          {/* RIGHT DETAIL */}
          <div className={C.dashBox}>
            <div aria-hidden className={C.glowTL} />
            <div aria-hidden className={C.glowBR} />

            {!mailbox.selectedItem ? (
              <div style={styles.detailWrap}>
                <WandersEmptyState title="Select a message" subtitle="Choose an item to view it." />
              </div>
            ) : !mailbox.selectedCardForDetail ? (
              <div style={styles.detailWrap}>
                <WandersEmptyState
                  title="Card unavailable"
                  subtitle="This item loaded, but its card preview is not accessible (embed card is missing)."
                />
              </div>
            ) : (
              <div style={styles.detailWrap}>
                <div style={styles.subPanel}>
                  <WandersCardDetail
                    card={mailbox.selectedCardForDetail}
                    replies={
                      <div>
                        <div style={styles.sectionTitle}>Replies</div>

                        {replies.loading ? (
                          <div style={styles.loadingText}>Loading replies…</div>
                        ) : (
                          <WandersRepliesList
                            replies={replies.items}
                            currentAnonId={
                              mailbox.selectedItem?.owner_anon_id || mailbox.selectedItem?.ownerAnonId || null
                            }
                            labelMode="fully-neutral"
                          />
                        )}
                      </div>
                    }
                  />
                </div>

                <div style={styles.subPanel}>
                  {replies.replyError ? <div style={styles.replyError}>{replies.replyError}</div> : null}

                  <WandersReplyComposer
                    onSubmit={actions.handleReplySubmit}
                    onSent={actions.handleReplySent}
                    loading={replies.replySending}
                    disabled={!mailbox.selectedCardId}
                    placeholder="Write a reply…"
                    buttonLabel="Send"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  toolbar: {
    position: "relative",
  },

  split: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: 12,
    alignItems: "start",
  },

  detailWrap: {
    position: "relative",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    boxSizing: "border-box",
  },

  subPanel: {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(0,0,0,0.30)",
    padding: 10,
    boxSizing: "border-box",
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 10,
    color: "rgba(255,255,255,0.80)",
  },

  loadingText: {
    padding: "24px 0",
    textAlign: "center",
    fontSize: 14,
    color: "rgba(255,255,255,0.55)",
  },

  replyError: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 700,
    color: "rgba(252,165,165,0.95)",
  },

  // modal styles
  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    background: "rgba(0,0,0,0.70)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  },

  modalCard: {
    width: "min(720px, 100%)",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(0,0,0,0.72)",
    boxShadow: "0 22px 70px rgba(0,0,0,0.72), 0 0 42px rgba(124,58,237,0.16)",
    overflow: "hidden",
  },

  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "12px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.10)",
  },

  modalTitle: {
    fontSize: 14,
    fontWeight: 900,
    letterSpacing: "0.02em",
    color: "rgba(255,255,255,0.95)",
  },

  modalCloseBtn: {
    appearance: "none",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.85)",
    borderRadius: 10,
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 900,
    lineHeight: 1,
  },

  modalBody: {
    padding: 14,
  },

  modalText: {
    fontSize: 13,
    lineHeight: 1.55,
    color: "rgba(255,255,255,0.78)",
  },

  modalActionsRow: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    flexWrap: "wrap",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    userSelect: "none",
  },

  checkboxLabel: {
    lineHeight: 1.3,
  },

  modalBtns: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  modalBtnGhost: {
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "rgba(255,255,255,0.90)",
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 800,
  },

  modalHint: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 1.45,
    color: "rgba(255,255,255,0.45)",
  },
};
