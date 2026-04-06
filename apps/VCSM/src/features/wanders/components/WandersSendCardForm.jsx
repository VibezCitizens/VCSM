import { useEffect, useMemo, useRef, useState } from "react";
import WandersSendCardSentView from "@/features/wanders/components/WandersSendCardSentView";
import { WANDERS_TEMPLATE_STYLES } from "@/features/wanders/components/model/wandersSendCardTemplates";

export function WandersSendCardForm({
  onSubmit,
  onDraftChange,
  loading = false,
  disabled = false,
  initialDraft,
  allowAnonymousToggle = false,
  requireFromNameWhenNotAnonymous = true,
  variant = "form",
  shareUrl = "",
  mailboxUrl = "",
  onSendAnother,
  onCreateNewCard,
  onOpenMailbox,
  onCreateAccount,
  onLogin,
}) {
  const [toName, setToName] = useState(() => initialDraft?.customization?.toName ?? "");
  const [fromName, setFromName] = useState(() => initialDraft?.customization?.fromName ?? "");
  const [messageText, setMessageText] = useState(() => initialDraft?.messageText ?? "");
  const [templateKey, setTemplateKey] = useState(() => initialDraft?.templateKey ?? "classic");
  const [isAnonymous, setIsAnonymous] = useState(() => initialDraft?.isAnonymous ?? false);

  const [imageDataUrl, setImageDataUrl] = useState(
    () => initialDraft?.customization?.imageDataUrl ?? null
  );
  const [imageError, setImageError] = useState(null);
  const fileRef = useRef(null);

  const draftPayload = useMemo(
    () => ({
      templateKey,
      messageText,
      isAnonymous,
      customization: {
        toName: String(toName || "").trim() ? toName : null,
        fromName: String(fromName || "").trim() ? fromName : null,
        imageDataUrl: imageDataUrl || null,
      },
    }),
    [toName, fromName, messageText, templateKey, isAnonymous, imageDataUrl]
  );

  useEffect(() => {
    if (typeof onDraftChange === "function") onDraftChange(draftPayload);
  }, [draftPayload, onDraftChange]);

  const onPickImage = () => {
    setImageError(null);
    fileRef.current?.click?.();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    e.target.value = "";

    if (!file.type?.startsWith("image/")) {
      setImageError("Please choose an image file.");
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setImageError("Image is too large (max 2MB).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => setImageError("Could not read that file. Try another image.");
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageDataUrl(null);
    setImageError(null);
  };

  const canSubmit = useMemo(() => {
    const hasMsg = !!String(messageText || "").trim();
    if (!hasMsg) return false;
    if (!requireFromNameWhenNotAnonymous) return true;
    if (isAnonymous) return true;
    return !!String(fromName || "").trim();
  }, [messageText, fromName, isAnonymous, requireFromNameWhenNotAnonymous]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    const cleaned = {
      ...draftPayload,
      messageText: String(draftPayload.messageText || "").trim(),
      customization: {
        ...draftPayload.customization,
        toName: String(draftPayload.customization.toName || "").trim() || null,
        fromName: String(draftPayload.customization.fromName || "").trim() || null,
      },
    };

    onSubmit(cleaned);
  };

  if (variant === "sent") {
    return (
      <WandersSendCardSentView
        messageText={messageText}
        fromName={fromName}
        isAnonymous={isAnonymous}
        imageDataUrl={imageDataUrl}
        shareUrl={shareUrl}
        mailboxUrl={mailboxUrl}
        onSendAnother={onSendAnother}
        onCreateNewCard={onCreateNewCard}
        onOpenMailbox={onOpenMailbox}
        onCreateAccount={onCreateAccount}
        onLogin={onLogin}
      />
    );
  }

  const inputBase =
    "w-full rounded-xl border bg-white/5 px-3.5 py-2.5 text-[15px] leading-6 shadow-sm " +
    "border-white/10 text-white placeholder:text-white/40 transition duration-150 " +
    "focus:outline-none focus:ring-2 focus:ring-violet-400/25 focus:border-violet-400/40 focus:bg-white/5 " +
    "disabled:opacity-60 disabled:cursor-not-allowed";
  const labelBase = "mb-1.5 block text-sm font-medium text-white/80";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelBase}>To</label>
        <input
          type="text"
          value={toName}
          onChange={(e) => setToName(e.target.value)}
          placeholder="Their name (optional)"
          className={inputBase}
          disabled={disabled || loading}
        />
      </div>

      <div>
        <label className={labelBase}>Message *</label>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Write something sweet, funny, or secret..."
          rows={5}
          className={`${inputBase} resize-none`}
          required
          disabled={disabled || loading}
        />
      </div>

      {allowAnonymousToggle ? (
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5">
          <div className="text-sm font-medium text-white">Send anonymously</div>
          <button
            type="button"
            onClick={() => setIsAnonymous((v) => !v)}
            disabled={disabled || loading}
            className={[
              "rounded-full border border-white/10 px-3 py-1 text-sm font-semibold transition",
              isAnonymous ? "bg-violet-600 text-white" : "bg-white/5 text-white/80",
              disabled || loading ? "cursor-not-allowed opacity-60" : "hover:bg-white/10",
            ].join(" ")}
          >
            {isAnonymous ? "On" : "Off"}
          </button>
        </div>
      ) : null}

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label className={`${labelBase} mb-0`}>Customize</label>
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
            <button
              type="button"
              onClick={onPickImage}
              disabled={disabled || loading}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {imageDataUrl ? "Change photo" : "Add photo"}
            </button>
            {imageDataUrl ? (
              <button
                type="button"
                onClick={removeImage}
                disabled={disabled || loading}
                className="rounded-xl border border-white/10 bg-transparent px-3 py-1.5 text-xs text-white/80 shadow-sm transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-1.5">
          {WANDERS_TEMPLATE_STYLES.map((styleItem) => {
            const active = templateKey === styleItem.key;
            return (
              <button
                key={styleItem.key}
                type="button"
                onClick={() => setTemplateKey(styleItem.key)}
                disabled={disabled || loading}
                className={[
                  "group rounded-xl border text-left shadow-sm transition hover:shadow",
                  "px-3 py-2 md:px-2.5 md:py-1.5",
                  active ? "border-violet-400/60 ring-2 ring-violet-400/20" : "border-white/10",
                  styleItem.pillClass,
                  disabled || loading ? "cursor-not-allowed opacity-60" : "",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold text-white md:text-[13px] md:leading-5">{styleItem.label}</div>
                  <span
                    className={[
                      "mt-0.5 inline-block rounded-full h-2.5 w-2.5 md:h-2 md:w-2",
                      styleItem.dotClass,
                      active ? "" : "opacity-70",
                    ].join(" ")}
                    aria-hidden
                  />
                </div>
              </button>
            );
          })}
        </div>

        {imageError ? <div className="mt-2 text-xs text-red-300">{imageError}</div> : null}
        {imageDataUrl ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <img src={imageDataUrl} alt="Uploaded" className="h-32 w-full object-cover" />
          </div>
        ) : null}
      </div>

      <div>
        <label className={labelBase}>From{requireFromNameWhenNotAnonymous && !isAnonymous ? " *" : ""}</label>
        <input
          type="text"
          value={fromName}
          onChange={(e) => setFromName(e.target.value)}
          placeholder={isAnonymous ? "Your name (optional)" : "Your name"}
          className={inputBase}
          required={requireFromNameWhenNotAnonymous && !isAnonymous}
          disabled={disabled || loading}
        />
        {requireFromNameWhenNotAnonymous && !isAnonymous && !String(fromName || "").trim() ? (
          <div className="mt-2 text-xs text-white/60">Required when not anonymous.</div>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={loading || disabled || !canSubmit}
        className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/30 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send"}
      </button>
    </form>
  );
}

export default WandersSendCardForm;
