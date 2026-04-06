import { useMemo, useState } from "react";

function Panel({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <div className="p-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        {subtitle ? <div className="mt-1 text-xs text-white/70">{subtitle}</div> : null}
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function Button({ children, onClick, variant = "ghost", disabled = false }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition " +
    "focus:outline-none focus:ring-2 focus:ring-violet-400/30 disabled:opacity-60 disabled:cursor-not-allowed";
  const tone =
    variant === "primary"
      ? "bg-violet-600 text-white hover:bg-violet-500"
      : variant === "soft"
        ? "bg-white/10 text-white hover:bg-white/15 border border-white/10"
        : "bg-white/5 text-white hover:bg-white/10 border border-white/10";
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${tone}`}>
      {children}
    </button>
  );
}

function WideButton({ children, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400/30 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export default function WandersSendCardSentView({
  messageText = "",
  fromName = "",
  isAnonymous = false,
  imageDataUrl = null,
  shareUrl = "",
  mailboxUrl = "",
  onSendAnother,
  onCreateNewCard,
  onOpenMailbox,
  onCreateAccount,
  onLogin,
}) {
  const [copied, setCopied] = useState(false);
  const shareText = useMemo(() => String(shareUrl || "").trim(), [shareUrl]);

  const safeClipboardCopy = async (text) => {
    try {
      if (!text) return;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      // UI no-op
    }
  };

  const openEmail = () => {
    const body = encodeURIComponent(shareText || "");
    window.location.href = `mailto:?subject=${encodeURIComponent("Wander Card")}&body=${body}`;
  };

  const openSMS = () => {
    const body = encodeURIComponent(shareText || "");
    window.location.href = `sms:&body=${body}`;
  };

  return (
    <div className="min-h-[60vh] w-full">
      <div className="mb-4">
        <div className="text-xl font-bold text-white">Sent</div>
        <div className="mt-1 text-sm text-white/70">Your card is ready. Share it or manage your inbox.</div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Preview">
          <div className="overflow-hidden rounded-2xl bg-white shadow-inner">
            <div className="p-6">
              <div className="whitespace-pre-wrap break-words text-lg font-semibold text-zinc-900">
                {String(messageText || "").trim() || "-"}
              </div>
              <div className="mt-20 text-sm text-zinc-700">- {String(fromName || "").trim() || (isAnonymous ? "" : "")}</div>
            </div>
            {imageDataUrl ? (
              <div className="border-t border-zinc-200">
                <img src={imageDataUrl} alt="Uploaded" className="h-40 w-full object-cover" />
              </div>
            ) : null}
          </div>
        </Panel>

        <Panel title="Share" subtitle="Copy the message or share via email or SMS.">
          <div className="text-xs font-semibold text-white/70">Share text</div>
          <div className="mt-2 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="whitespace-pre-wrap break-words text-sm text-white">{shareText || "-"}</div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button onClick={() => safeClipboardCopy(shareText)} disabled={!shareText}>
              {copied ? "Copied" : "Copy text"}
            </Button>
            <Button onClick={openEmail} disabled={!shareText}>
              Email
            </Button>
            <Button onClick={openSMS} disabled={!shareText}>
              SMS
            </Button>
          </div>

          <div className="mt-3">
            <Button onClick={onSendAnother} disabled={typeof onSendAnother !== "function"}>
              Send another
            </Button>
          </div>
        </Panel>

        <Panel title="Your WWOX" subtitle="View your incoming and sent cards.">
          <div className="flex gap-3">
            <WideButton onClick={onOpenMailbox} disabled={typeof onOpenMailbox !== "function"}>
              Open WWOX
            </WideButton>
            <WideButton
              onClick={() => safeClipboardCopy(String(mailboxUrl || "").trim())}
              disabled={!String(mailboxUrl || "").trim()}
            >
              Copy Link
            </WideButton>
          </div>
        </Panel>

        <Panel title="Send another" subtitle="Create a new Wander card and share it.">
          <WideButton onClick={onCreateNewCard} disabled={typeof onCreateNewCard !== "function"}>
            Create a Wander Card
          </WideButton>
        </Panel>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Save your WWOX forever</div>
              <div className="mt-1 text-xs text-white/70">
                You are using guest mode right now. Create an account to keep your mailbox across devices.
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
              Free
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onCreateAccount}
              disabled={typeof onCreateAccount !== "function"}
              className="w-full rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Create account
            </button>
            <button
              type="button"
              onClick={onLogin}
              disabled={typeof onLogin !== "function"}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400/30 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
