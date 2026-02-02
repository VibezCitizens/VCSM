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

  // ✅ media preview state
  const [mediaPreview, setMediaPreview] = useState(null)
  // { file, url, type }

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
      } catch {}
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

  const clamp = useCallback(
    (s) => (s.length > maxLength ? s.slice(0, maxLength) : s),
    [maxLength]
  )

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

    // ✅ send media first (await upload handler)
    if (mediaPreview) {
      try {
        await onAttach?.([mediaPreview.file])
      } finally {
        if (mediaPreview?.url) URL.revokeObjectURL(mediaPreview.url)
        setMediaPreview(null)
      }
    }

    // ✅ then send text (or edit)
    if (text) {
      if (inEdit) onSaveEdit?.(text)
      else onSend?.(text)
    }

    setValue('')
  }, [actuallyDisabled, value, mediaPreview, onAttach, onSend, inEdit, onSaveEdit])

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

  // ✅ Handle file pick + preview
  const handleFilePick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // only allow images/videos
    const t = String(file.type || '')
    if (!t.startsWith('image/') && !t.startsWith('video/')) {
      e.target.value = ''
      return
    }

    // cleanup any previous preview url
    if (mediaPreview?.url) {
      URL.revokeObjectURL(mediaPreview.url)
    }

    const url = URL.createObjectURL(file)

    setMediaPreview({
      file,
      url,
      type: file.type,
    })

    e.target.value = ''
    requestAnimationFrame(() => focusInput())
  }

  const removeMedia = () => {
    if (mediaPreview?.url) URL.revokeObjectURL(mediaPreview.url)
    setMediaPreview(null)
  }

  // ✅ prevent leaking objectURLs on unmount
  useEffect(() => {
    return () => {
      if (mediaPreview?.url) URL.revokeObjectURL(mediaPreview.url)
    }
  }, [mediaPreview])

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFilePick}
        className="hidden"
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          doPrimary()
        }}
        className={`chat-topbar transition-all duration-200 ${
          topBarOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 px-3 py-2 w-full">
          {/* Attach */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="shrink-0 p-2 rounded-full text-purple-400 hover:text-purple-300 active:opacity-80"
            disabled={actuallyDisabled}
            aria-label="Attach"
          >
            <Paperclip size={22} />
          </button>

          {/* Media preview pill */}
          {mediaPreview && (
            <div className="relative shrink-0">
              {String(mediaPreview.type || '').startsWith('video/') ? (
                <video
                  src={mediaPreview.url}
                  className="w-12 h-12 rounded-xl object-cover border border-purple-700"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={mediaPreview.url}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover border border-purple-700"
                />
              )}

              <button
                type="button"
                onClick={removeMedia}
                className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1"
                aria-label="Remove media"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Text input */}
          <input
            ref={topInputRef}
            type="text"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => (composingRef.current = true)}
            onCompositionEnd={() => (composingRef.current = false)}
            placeholder={inEdit ? 'Edit message…' : 'Type a message…'}
            className="
              flex-1
              w-full px-4 py-3
              rounded-2xl
              bg-neutral-900 text-white
              border border-purple-700
              focus:ring-2 focus:ring-purple-500
              outline-none
              placeholder:text-neutral-400
            "
            disabled={actuallyDisabled}
            autoComplete="off"
            inputMode="text"
            enterKeyHint={inEdit ? 'done' : 'send'}
          />

          {/* Send */}
          <button
            type="submit"
            disabled={actuallyDisabled || (!value.trim() && !mediaPreview)}
            className={
              value.trim() || mediaPreview
                ? 'shrink-0 w-11 h-11 rounded-full bg-purple-600 text-white flex items-center justify-center active:opacity-90'
                : 'shrink-0 w-11 h-11 rounded-full bg-purple-900/40 text-purple-400 cursor-not-allowed flex items-center justify-center'
            }
            aria-label={inEdit ? 'Save' : 'Send'}
          >
            <Send size={18} />
          </button>
        </div>
      </form>

      {/* Floating T button unchanged */}
      <button
        type="button"
        className="chat-bottom-t fixed bottom-6 right-6 w-12 h-12 bg-white shadow-lg rounded-full flex items-center justify-center font-bold text-xl z-40 border"
        onPointerDown={openKeyboard}
        onClick={openKeyboard}
        aria-label="Open keyboard"
      >
        T
      </button>
    </>
  )
}
