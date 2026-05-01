import { useMemo } from "react";

import WandersMailboxToolbar from "@/features/wanders/components/WandersMailboxToolbar";
import WandersMailboxList from "@/features/wanders/components/WandersMailboxList";
import WandersCardDetail from "@/features/wanders/components/WandersCardDetail";
import WandersRepliesList from "@/features/wanders/components/WandersRepliesList";
import WandersReplyComposer from "@/features/wanders/components/WandersReplyComposer";
import WandersEmptyState from "@/features/wanders/components/WandersEmptyState";
import WandersLoading from "@/features/wanders/components/WandersLoading";
import WandersShareVCSM from "@/features/wanders/components/WandersShareVCSM";

import useWandersMailboxExperience from "@/features/wanders/core/hooks/useWandersMailboxExperience.hook";
import { WANDERS_CHROME as C } from "@/features/wanders/utils/wandersChrome";
import { styles } from "@/features/wanders/screens/view/wandersMailboxView.styles";

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
                You're using a <b>guest inbox</b> tied to this browser's storage. If you clear site data, use private
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
                  <span style={styles.checkboxLabel}>Don't show again</span>
                </label>

                <div style={styles.modalBtns}>
                  <button type="button" onClick={actions.dontShowAgain} style={styles.modalBtnGhost}>
                    Dismiss
                  </button>
                </div>
              </div>

              <div style={styles.modalHint}>Tip: Account mailboxes are protected by login and won't open if your link leaks.</div>
            </div>
          </div>
        </div>
      ) : null}

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

      <main className={C.main}>
        <div style={splitStyle}>
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
                            currentAnonId={null}
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
