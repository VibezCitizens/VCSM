import { useCallback, useEffect, useRef, useState } from 'react'

export function useFeedConfirmToast() {
  const confirmResolverRef = useRef(null)
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    tone: 'danger',
  })
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const closeConfirm = useCallback((accepted) => {
    const resolve = confirmResolverRef.current
    confirmResolverRef.current = null
    setConfirmState((prev) => ({ ...prev, open: false }))
    if (typeof resolve === 'function') resolve(Boolean(accepted))
  }, [])

  const requestConfirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      confirmResolverRef.current = resolve
      setConfirmState({
        open: true,
        title: options.title ?? 'Confirm',
        message: options.message ?? 'Are you sure?',
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        tone: options.tone ?? 'danger',
      })
    })
  }, [])

  const showToast = useCallback((message) => {
    const next = String(message || '')
    setToastMessage(next)
    setToastOpen(false)
    setTimeout(() => setToastOpen(true), 0)
  }, [])

  useEffect(() => {
    return () => {
      const resolve = confirmResolverRef.current
      confirmResolverRef.current = null
      if (typeof resolve === 'function') resolve(false)
    }
  }, [])

  return {
    confirmState,
    closeConfirm,
    requestConfirm,
    toastOpen,
    setToastOpen,
    toastMessage,
    showToast,
  }
}
