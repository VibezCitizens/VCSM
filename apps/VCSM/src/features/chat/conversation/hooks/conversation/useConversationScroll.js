import { useState, useCallback, useEffect, useRef } from 'react'

export function useConversationScroll({ messagesRef, messagesLength }) {
  const [showJumpButton, setShowJumpButton] = useState(false)
  const initialScrollDoneRef = useRef(false)
  // Tracks whether the user was at the bottom BEFORE a new message renders.
  // The scroll listener updates this continuously so that when messagesLength
  // changes (new message appended, scrollHeight grows), we already know the
  // pre-arrival scroll position — checking dist AFTER render always overshoots.
  const wasAtBottomRef = useRef(true)

  const scrollToBottom = useCallback((behavior = 'auto') => {
    const el = messagesRef.current
    if (!el) return
    if (behavior === 'smooth') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    } else {
      // Direct assignment is more reliable than scrollTo() on iOS Safari/WKWebView
      el.scrollTop = el.scrollHeight
    }
  }, [messagesRef])

  useEffect(() => {
    const container = messagesRef.current
    if (!container) return

    const handleScroll = () => {
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight
      setShowJumpButton(dist > 120)
      wasAtBottomRef.current = dist < 100
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [messagesRef])

  // Re-anchor when scroll container grows (e.g. images finish loading after scroll fired).
  // ResizeObserver fires after layout — scrollHeight is the real post-load value.
  // Only scrolls if the user was already at the bottom before the resize.
  useEffect(() => {
    const container = messagesRef.current
    if (!container) return

    const ro = new ResizeObserver(() => {
      if (wasAtBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom('auto'))
      }
    })

    ro.observe(container)
    return () => ro.disconnect()
  }, [messagesRef, scrollToBottom])

  useEffect(() => {
    const container = messagesRef.current
    if (!container || messagesLength === 0) return

    if (!initialScrollDoneRef.current) {
      // First message batch — always jump to bottom regardless of current position.
      // Double rAF lets iOS finish its layout pass before scrollHeight is measured.
      initialScrollDoneRef.current = true
      requestAnimationFrame(() => requestAnimationFrame(() => scrollToBottom('auto')))
      return
    }

    // For subsequent messages: scroll only if the user was already at the bottom
    // when the message arrived (wasAtBottomRef reflects pre-render scroll position).
    if (wasAtBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom('auto'))
    }
  }, [messagesLength, scrollToBottom])

  return { showJumpButton, setShowJumpButton, scrollToBottom }
}
