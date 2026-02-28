import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Paperclip, X, Send } from 'lucide-react'

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
}) {
  const [value, setValue] = useState('')
  const [topBarOpen, setTopBarOpen] = useState(false)
  const [mediaPreview, setMediaPreview] = useState(null)

  const composingRef = useRef(false)
  const topInputRef = useRef(null)
  const fileRef = useRef(null)

  const inEdit = !!editing
  const actuallyDisabled = !!disabled || !!isSending

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
      if (actuallyDisabled) return
      setTopBarOpen(true)
      focusInput()
      requestAnimationFrame(() => focusInput())
    },
    [actuallyDisabled, focusInput]
  )

  const doPrimary = useCallback(async () => {
    if (actuallyDisabled) return
    const text = value.trim()
    if (!text && !mediaPreview) return

    if (mediaPreview) {
      try {
        await onAttach?.([mediaPreview.file])
      } finally {
        if (mediaPreview?.url) URL.revokeObjectURL(mediaPreview.url)
        setMediaPreview(null)
      }
    }

    if (text) {
      if (inEdit) onSaveEdit?.(text)
      else onSend?.(text)
    }

    setValue('')
  }, [actuallyDisabled, value, mediaPreview, onAttach, inEdit, onSaveEdit, onSend])

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
        <div className="w-full px-3 py-2">
          <div className="module-modern-shell flex items-center gap-2 rounded-2xl px-2 py-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="shrink-0 p-2 text-indigo-300 transition hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={actuallyDisabled}
              aria-label="Attach"
            >
              <Paperclip size={20} />
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
              className="module-modern-input flex-1 rounded-2xl px-4 py-2.5"
              disabled={actuallyDisabled}
              autoComplete="off"
              inputMode="text"
              enterKeyHint={inEdit ? 'done' : 'send'}
            />

            <button
              type="submit"
              disabled={actuallyDisabled || (!value.trim() && !mediaPreview)}
              className={
                value.trim() || mediaPreview
                  ? 'module-modern-btn module-modern-btn--primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white'
                  : 'module-modern-btn flex h-10 w-10 shrink-0 cursor-not-allowed items-center justify-center rounded-full border border-slate-600/30 bg-slate-800/40 text-slate-500'
              }
              aria-label={inEdit ? 'Save' : 'Send'}
            >
              <Send size={16} />
            </button>
          </div>
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
