// src/season/lovedrop/components/LovedropCreateForm.jsx

import { useEffect, useMemo, useState } from 'react'

export function LovedropCreateForm({
  onSubmit,
  onDraftChange,
  loading = false,
  disabled = false,
}) {
  const [toName, setToName] = useState('')
  const [fromName, setFromName] = useState('')
  const [messageText, setMessageText] = useState('')
  const [templateKey, setTemplateKey] = useState('classic')
  const [isAnonymous, setIsAnonymous] = useState(true)

  const draftPayload = useMemo(
    () => ({
      toName: toName || null,
      fromName: isAnonymous ? null : fromName || null,
      messageText: messageText,
      templateKey,
      isAnonymous,
      customization: {}, // reserved for future (colors, emojis, etc.)
    }),
    [toName, fromName, messageText, templateKey, isAnonymous]
  )

  // 🔥 LIVE PREVIEW: push draft up as user types
  useEffect(() => {
    if (typeof onDraftChange === 'function') {
      onDraftChange(draftPayload)
    }
  }, [draftPayload, onDraftChange])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!messageText.trim()) return

    onSubmit({
      ...draftPayload,
      messageText: messageText.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* To */}
      <div>
        <label className="block text-sm mb-1">To</label>
        <input
          type="text"
          value={toName}
          onChange={(e) => setToName(e.target.value)}
          placeholder="Their name (optional)"
          className="w-full rounded border px-3 py-2"
        />
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm mb-1">Message *</label>
        <textarea
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Write something sweet, funny, or secret…"
          rows={4}
          className="w-full rounded border px-3 py-2"
          required
        />
      </div>

      {/* Template */}
      <div>
        <label className="block text-sm mb-1">Style</label>
        <select
          value={templateKey}
          onChange={(e) => setTemplateKey(e.target.value)}
          className="w-full rounded border px-3 py-2"
        >
          <option value="classic">Classic 💌</option>
          <option value="cute">Cute 💖</option>
          <option value="spicy">Spicy 🔥</option>
          <option value="mystery">Secret Admirer 👀</option>
        </select>
      </div>

      {/* Anonymous toggle */}
      <div className="flex items-center gap-2">
        <input
          id="anon"
          type="checkbox"
          checked={isAnonymous}
          onChange={(e) => setIsAnonymous(e.target.checked)}
        />
        <label htmlFor="anon" className="text-sm">
          Send anonymously
        </label>
      </div>

      {/* From (only if not anonymous) */}
      {!isAnonymous && (
        <div>
          <label className="block text-sm mb-1">From</label>
          <input
            type="text"
            value={fromName}
            onChange={(e) => setFromName(e.target.value)}
            placeholder="Your name"
            className="w-full rounded border px-3 py-2"
          />
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || disabled}
        className="w-full rounded bg-pink-600 text-white py-2 disabled:opacity-50"
      >
        {loading ? 'Creating…' : 'Create LoveDrop 💌'}
      </button>
    </form>
  )
}

export default LovedropCreateForm
