import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Paperclip, X, Send, Loader2 } from 'lucide-react'

const DEFAULT_MAX = 4000

export default function ChatInput({
  onSend,
  disabled,
  onAttach,
  maxLength = DEFAULT_MAX,
  isSending = false,
  editing = false,
  initialValue = '',
  onSaveEdit,
  onCancelEdit,
  onTyping,
  onAttachError,
}) {
  const [value, setValue] = useState('')
  const [topBarOpen, setTopBarOpen] = useState(false)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [submitBusy, setSubmitBusy] = useState(false)

  const composingRef = useRef(false)
  const topInputRef = useRef(null)
  const fileRef = useRef(null)

  const inEdit = !!editing
  const actionDisabled = !!disabled || !!isSending || submitBusy
  const inputDisabled = !!disabled || !!isSending

  const focusInput = useCallback(() => {
    const el = topInputRef.current
    if (!el) return

    const trigger = () => {
      el.focus()
      const len = el.value?.length ?? 0
      try {
        el.setSelectionRange(len, len)
      } catch {
        // noop
      }
    }

    trigger()
    requestAnimationFrame(trigger)
    setTimeout(trigger, 50)
    setTimeout(trigger, 150)
  }, [])

  useEffect(() => {
    if (inEdit) {
      setValue(initialValue || '')
      setTopBarOpen(true)
      requestAnimationFrame(() => focusInput())
    }
  }, [inEdit, initialValue, focusInput])

  const clamp = useCallback((s) => (s.length > maxLength ? s.slice(0, maxLength) : s), [maxLength])

  const openKeyboard = useCallback(
    (e) => {
      if (e?.preventDefault) e.preventDefault()
      if (inputDisabled) return
      setTopBarOpen(true)
      focusInput()
      requestAnimationFrame(() => focusInput())
    },
    [inputDisabled, focusInput]
  )

  const doPrimary = useCallback(async () => {
    if (actionDisabled) return
    const text = value.trim()
    if (!text && !mediaPreview) return

    setSubmitBusy(true)

    try {
      let mediaSent = true
      let textSent = true

      if (mediaPreview) {
        if (!onAttach) {
          mediaSent = false
          onAttachError?.('Attach is unavailable right now.')
        } else {
          const attachResult = await onAttach([mediaPreview.file])
          mediaSent =
            typeof attachResult === 'boolean'
              ? attachResult
              : Boolean(attachResult?.ok)

          if (!mediaSent) {
            onAttachError?.(attachResult?.error || 'Image failed to send. Please try again.')
          }
        }

        if (mediaSent && mediaPreview?.url) {
          URL.revokeObjectURL(mediaPreview.url)
          setMediaPreview(null)
        }
      }

      if (text) {
        const sendResult = inEdit ? await onSaveEdit?.(text) : await onSend?.(text)
        textSent =
          typeof sendResult === 'boolean'
            ? sendResult
            : sendResult?.ok !== false

        if (!textSent) {
          onAttachError?.(sendResult?.error || 'Message failed to send. Please try again.')
        }
      }

      const sentOk = (!mediaPreview || mediaSent) && (!text || textSent)
      if (sentOk) {
        setValue('')

        if (!inEdit) {
          setTopBarOpen(false)
          topInputRef.current?.blur()
        }
      }
    } finally {
      setSubmitBusy(false)
    }
  }, [actionDisabled, value, mediaPreview, onAttach, inEdit, onSaveEdit, onSend, onAttachError])

  const handleChange = (e) => {
    setValue(clamp(e.target.value))
    onTyping?.()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !composingRef.current) {
      e.preventDefault()
      doPrimary()
    }

    if (e.key === 'Escape' && !composingRef.current) {
      if (inEdit) onCancelEdit?.()
      else {
        setValue('')
        setTopBarOpen(false)
      }
    }
  }

  const handleFilePick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const t = String(file.type || '')
    if (!t.startsWith('image/') && !t.startsWith('video/')) {
      e.target.value = ''
      return
    }

    if (mediaPreview?.url) {
      URL.revokeObjectURL(mediaPreview.url)
    }

    const url = URL.createObjectURL(file)
    setMediaPreview({ file, url, type: file.type })

    e.target.value = ''
    requestAnimationFrame(() => focusInput())
  }

  const removeMedia = () => {
    if (mediaPreview?.url) URL.revokeObjectURL(mediaPreview.url)
    setMediaPreview(null)
  }

  useEffect(() => {
    return () => {
      if (mediaPreview?.url) URL.revokeObjectURL(mediaPreview.url)
    }
  }, [mediaPreview])

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFilePick} className="hidden" />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          doPrimary()
        }}
        className={`chat-topbar transition-all duration-200 ${
          topBarOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <div className="mx-auto flex w-full max-w-[760px] items-center gap-2 px-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-indigo-300 transition hover:bg-slate-900/40 hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={actionDisabled}
              aria-label="Attach"
            >
              <Paperclip size={18} />
            </button>

            {mediaPreview && (
              <div className="relative shrink-0">
                {String(mediaPreview.type || '').startsWith('video/') ? (
                  <video src={mediaPreview.url} className="h-12 w-12 rounded-xl border border-indigo-300/35 object-cover" muted playsInline />
                ) : (
                  <img src={mediaPreview.url} alt="" className="h-12 w-12 rounded-xl border border-indigo-300/35 object-cover" />
                )}

                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute -right-2 -top-2 rounded-full bg-black p-1 text-white"
                  aria-label="Remove media"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            <input
              ref={topInputRef}
              type="text"
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => (composingRef.current = true)}
              onCompositionEnd={() => (composingRef.current = false)}
              placeholder={inEdit ? 'Edit message...' : 'Type a message...'}
              className="module-modern-input h-10 flex-1 rounded-[14px] px-4"
              disabled={inputDisabled}
              autoComplete="off"
              inputMode="text"
              enterKeyHint={inEdit ? 'done' : 'send'}
            />

            <button
              type="submit"
              disabled={actionDisabled || (!value.trim() && !mediaPreview)}
              className={
                value.trim() || mediaPreview
                  ? 'module-modern-btn module-modern-btn--primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white'
                  : 'module-modern-btn flex h-10 w-10 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-slate-600/30 bg-slate-800/40 text-slate-500'
              }
              aria-label={inEdit ? 'Save' : 'Send'}
            >
              {submitBusy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
        </div>
      </form>

      <button
        type="button"
        className="chat-bottom-t"
        onPointerDown={openKeyboard}
        onClick={openKeyboard}
        aria-label="Open keyboard"
      >
        T
      </button>
    </>
  )
}
