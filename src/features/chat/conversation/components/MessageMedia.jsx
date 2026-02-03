// src/features/chat/conversation/components/MessageMedia.jsx
import React, { useMemo } from 'react'
import { FileText, Play, Download } from 'lucide-react'

/**
 * MessageMedia (PURE UI)
 * ------------------------------------------------------------
 * Vibez Citizens media preview holder (1 attachment per message)
 *
 * Props:
 * - type: 'image' | 'video' | 'file'
 * - url: string
 * - onOpen?: () => void
 * - filename?: string
 * - className?: string
 * - createdAt?: string | number | Date
 * - isMine?: boolean
 */
export default function MessageMedia({
  type,
  url,
  onOpen,
  filename,
  className = '',
  createdAt,
  isMine = false,
}) {
  if (!url) return null

  const t = String(type || '').toLowerCase()
  const isImage = t === 'image'
  const isVideo = t === 'video'
  const isFile = t === 'file'

  // Click should not select text in bubble
  const handleOpen = (e) => {
    if (!onOpen) return
    e.preventDefault()
    e.stopPropagation()
    onOpen()
  }

  const timeText = useMemo(() => {
    if (!createdAt) return ''
    const d = createdAt instanceof Date ? createdAt : new Date(createdAt)
    if (Number.isNaN(d.getTime())) return ''
    try {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    } catch {
      return ''
    }
  }, [createdAt])

  const TimestampChip = () => {
    if (!timeText) return null
    return (
      <div className="pointer-events-none absolute bottom-2 right-2">
        <div className="px-2 py-1 rounded-md text-[10px] leading-none text-white/90 bg-black/55 backdrop-blur-sm border border-white/10">
          {timeText}
        </div>
      </div>
    )
  }

  /**
   * ✅ Make the "outside bubble" always visible:
   * - OUTER frame: 1px padding + gradient (or solid) background
   * - INNER shell: real rounded container that holds the media
   */
  const outerFrameClass = [
    'mb-1',
    'w-full max-w-full',
    'rounded-2xl',
    'p-[3px]', // the “border thickness”
    // visible on both dark and bright media
    isMine
      ? 'bg-gradient-to-br from-purple-400/70 via-purple-500/30 to-fuchsia-400/15'
      : 'bg-gradient-to-br from-purple-500/70 via-purple-500/30 to-fuchsia-500/15',
    className,
  ].join(' ')

  const innerShellClass = [
    'rounded-[calc(1rem-1px)]', // 2xl minus the frame thickness
    'overflow-hidden',
    'bg-black/20',
    'ring-1 ring-black/10', // subtle separation on white images
  ].join(' ')

  if (isImage) {
    return (
      <div className={outerFrameClass}>
        <div className={innerShellClass}>
          <button
            type="button"
            onClick={handleOpen}
            className="relative block w-full text-left active:opacity-95"
            aria-label="Open image"
          >
            <img
              src={url}
              alt=""
              className="block w-full object-cover max-h-[520px]"
              loading="lazy"
              draggable={false}
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
            <TimestampChip />
          </button>
        </div>
      </div>
    )
  }

  if (isVideo) {
    return (
      <div className={outerFrameClass}>
        <div className={innerShellClass}>
          <button
            type="button"
            onClick={handleOpen}
            className="relative block w-full text-left active:opacity-95"
            aria-label="Open video"
          >
            <video
              src={url}
              muted
              playsInline
              preload="metadata"
              className="block w-full object-cover max-h-[520px]"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-purple-700/65 border border-purple-300/20 shadow-lg flex items-center justify-center">
                <Play size={18} className="text-white translate-x-[1px]" />
              </div>
            </div>

            <TimestampChip />
          </button>
        </div>
      </div>
    )
  }

  if (isFile) {
    return (
      <div className={outerFrameClass}>
        <div className={innerShellClass}>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 p-3 hover:bg-white/5 active:opacity-90"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-700/20 border border-purple-500/25 flex items-center justify-center">
              <FileText size={18} className="text-purple-200" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm text-purple-100 truncate">
                {filename || 'Attachment'}
              </div>
              <div className="text-[11px] text-purple-200/70">Tap to download</div>
            </div>

            <div className="w-9 h-9 rounded-full bg-purple-700/30 border border-purple-400/25 flex items-center justify-center">
              <Download size={16} className="text-purple-100" />
            </div>
          </a>
        </div>
      </div>
    )
  }

  return null
}
