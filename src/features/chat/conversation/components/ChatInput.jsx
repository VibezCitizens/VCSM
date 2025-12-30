// src/features/chat/components/conversation/ChatInput.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Paperclip, X } from 'lucide-react'

const DEFAULT_MAX = 4000

/* ============================================================
   iOS DETECTION (local, no deps)
   ============================================================ */
const isIOS =
  typeof navigator !== 'undefined' &&
  /iPad|iPhone|iPod/.test(navigator.userAgent)

export default function ChatInput({
  onSend,
  disabled,
  onAttach,
  maxLength = DEFAULT_MAX,
  isSending = false,

  // edit-in-input props (match ConversationView)
  editing = false,
  initialValue = '',
  onSaveEdit,
  onCancelEdit,
}) {
  const [value, setValue] = useState('')
  const composingRef = useRef(false)
  const inputRef = useRef(null)

  const inEdit = !!editing

  /* ============================================================
     DEBUG STATE (forces HUD refresh)
     ============================================================ */
  const [, forceRender] = useState(0)

  /* ============================================================
     EDIT MODE SYNC
     ============================================================ */
  const prevInEditRef = useRef(inEdit)
  useEffect(() => {
    if (prevInEditRef.current && !inEdit) {
      setValue('')
      requestAnimationFrame(() => inputRef.current?.focus())
    }
    prevInEditRef.current = inEdit
  }, [inEdit])

  useEffect(() => {
    if (inEdit) {
      setValue(initialValue || '')
      requestAnimationFrame(() => {
        if (inputRef.current) {
          const len = (initialValue || '').length
          inputRef.current.focus()
          inputRef.current.setSelectionRange(len, len)
        }
      })
    }
  }, [inEdit, initialValue])

  /* ============================================================
     iOS DEBUG LISTENERS (TEMP)
     ============================================================ */
  useEffect(() => {
    if (!isIOS) return

    const vv = window.visualViewport

    const log = () => {
      console.log('[iOS DEBUG]', {
        scrollY: window.scrollY,
        innerHeight: window.innerHeight,
        vvTop: vv?.offsetTop,
        vvHeight: vv?.height,
      })
      forceRender(x => x + 1)
    }

    window.addEventListener('scroll', log)
    vv?.addEventListener('resize', log)
    vv?.addEventListener('scroll', log)

    log()

    return () => {
      window.removeEventListener('scroll', log)
      vv?.removeEventListener('resize', log)
      vv?.removeEventListener('scroll', log)
    }
  }, [])

  /* ============================================================
     INPUT LOGIC
     ============================================================ */
  const remaining = maxLength - value.length
  const actuallyDisabled = !!disabled || !!isSending

  const clamp = useCallback(
    (s) => (s.length > maxLength ? s.slice(0, maxLength) : s),
    [maxLength]
  )

  const doPrimary = useCallback(() => {
    if (actuallyDisabled) return
    const text = value.trim()
    if (!text) return

    if (inEdit) {
      onSaveEdit?.(text)
      return
    }

    onSend?.(text)
    setValue('')
  }, [actuallyDisabled, inEdit, onSaveEdit, onSend, value])

  const handleBeforeInput = useCallback((e) => {
    if (!inputRef.current) return
    const el = inputRef.current
    const { selectionStart, selectionEnd } = el
    const data = e.data ?? ''
    if (!data) return

    const next =
      value.slice(0, selectionStart) +
      data +
      value.slice(selectionEnd)

    if (next.length > maxLength) {
      e.preventDefault()
      const allowed =
        maxLength - (value.length - (selectionEnd - selectionStart))
      if (allowed > 0) {
        const partial = data.slice(0, allowed)
        const patched =
          value.slice(0, selectionStart) +
          partial +
          value.slice(selectionEnd)
        setValue(patched)
        requestAnimationFrame(() => {
          const pos = selectionStart + partial.length
          el.setSelectionRange(pos, pos)
        })
      }
    }
  }, [maxLength, value])

  const handleChange = useCallback(
    (e) => setValue(clamp(e.target.value)),
    [clamp]
  )

  const handlePaste = useCallback((e) => {
    if (!inputRef.current) return
    const files = e.clipboardData?.files
    const text = e.clipboardData?.getData('text') ?? ''

    if (files && files.length > 0) {
      e.preventDefault()
      onAttach?.(files)
      return
    }

    const el = inputRef.current
    const { selectionStart, selectionEnd } = el
    const available =
      maxLength - (value.length - (selectionEnd - selectionStart))
    if (available <= 0) {
      e.preventDefault()
      return
    }

    const toInsert = text.slice(0, available)
    const next =
      value.slice(0, selectionStart) +
      toInsert +
      value.slice(selectionEnd)

    if (toInsert.length !== text.length) {
      e.preventDefault()
      setValue(next)
      requestAnimationFrame(() => {
        const pos = selectionStart + toInsert.length
        el.setSelectionRange(pos, pos)
      })
    }
  }, [maxLength, onAttach, value])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !composingRef.current) {
      e.preventDefault()
      doPrimary()
    }
    if (e.key === 'Escape' && !composingRef.current) {
      if (inEdit) onCancelEdit?.()
      else setValue('')
    }
  }, [doPrimary, inEdit, onCancelEdit])

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <>
      {/* ===============================
          iOS DEBUG HUD (TEMP)
          =============================== */}
      {isIOS && (
        <div
          style={{
            position: 'fixed',
            top: 4,
            right: 4,
            zIndex: 99999,
            background: '#000',
            color: '#0f0',
            fontSize: 10,
            padding: 6,
            fontFamily: 'monospace',
            lineHeight: 1.4,
          }}
        >
          <div>scrollY: {window.scrollY}</div>
          <div>vh: {window.innerHeight}</div>
          <div>vv.top: {window.visualViewport?.offsetTop}</div>
          <div>vv.h: {window.visualViewport?.height}</div>
        </div>
      )}

      <div
        className="bg-black/90 backdrop-blur pt-2 pb-3 border-t border-white/10"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
        aria-live="polite"
      >
        <div className="px-3">
          {inEdit && (
            <div className="flex items-center justify-between text-xs text-white/70 mb-2 px-1">
              <span>Editing</span>
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-white"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          )}

          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={() => onAttach?.()}
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white"
              disabled={actuallyDisabled}
            >
              <Paperclip size={18} />
            </button>

            <div className="flex-1">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={value}
                  onCompositionStart={() => { composingRef.current = true }}
                  onCompositionEnd={() => { composingRef.current = false }}
                  onBeforeInput={handleBeforeInput}
                  onChange={handleChange}
                  onPaste={handlePaste}
                  onKeyDown={handleKeyDown}

                  /* 🔒 iOS SAFARI FOCUS SCROLL FIX */
                  onMouseDown={(e) => {
                    if (!isIOS) return
                    e.preventDefault()
                    inputRef.current?.focus()
                  }}
                  onFocus={(e) => {
                    if (!isIOS) return
                    requestAnimationFrame(() => {
                      e.target.scrollIntoView({
                        block: 'nearest',
                        inline: 'nearest',
                      })
                    })
                  }}

                  placeholder={inEdit ? 'Edit message…' : 'Type a message…'}
                  className="w-full bg-transparent outline-none text-white placeholder-white/50"
                  disabled={actuallyDisabled}
                  inputMode="text"
                  autoComplete="off"
                  autoCorrect="on"
                  spellCheck
                  enterKeyHint={inEdit ? 'done' : 'send'}
                />
              </div>

              <div className="text-[11px] text-white/50 mt-1 pl-1">
                {remaining} characters left
              </div>
            </div>

            <button
              type="button"
              onClick={doPrimary}
              disabled={actuallyDisabled || !value.trim()}
              className={[
                'px-4 py-3 rounded-2xl font-medium',
                value.trim() && !actuallyDisabled
                  ? 'bg-[#7c3aed] hover:bg-[#6d28d9] text-white'
                  : 'bg-white/10 text-white/40 cursor-not-allowed',
              ].join(' ')}
            >
              {inEdit ? 'Save' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
