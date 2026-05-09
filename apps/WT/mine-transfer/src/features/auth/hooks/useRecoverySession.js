import { useEffect, useState } from 'react'
import { supabase } from '@/services/supabase/supabaseClient'

function readRecoveryError() {
  if (typeof window === 'undefined') return ''

  const serializedParams = [window.location.search, window.location.hash]
    .filter(Boolean)
    .map((value) => value.replace(/^[?#]/, ''))

  for (const serializedValue of serializedParams) {
    const params = new URLSearchParams(serializedValue)
    const rawMessage = params.get('error_description') || params.get('error')

    if (!rawMessage) continue

    const decodedMessage = rawMessage.replace(/\+/g, ' ').trim()

    if (/expired|invalid/i.test(decodedMessage)) {
      return 'Your reset link has expired or is invalid. Please request a new one.'
    }

    return decodedMessage
  }

  return ''
}

export function useRecoverySession() {
  const [ready, setReady] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    let isMounted = true
    const initialError = readRecoveryError()

    if (initialError) {
      setSessionError(initialError)
      setVerifying(false)
      return undefined
    }

    async function resolveRecoverySession() {
      const { data } = await supabase.auth.getSession()

      if (!isMounted) return

      if (data?.session) {
        setReady(true)
        setSessionError('')
        setVerifying(false)
      }
    }

    resolveRecoverySession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      if (session) {
        setReady(true)
        setSessionError('')
        setVerifying(false)
        return
      }

      if (event === 'SIGNED_OUT') {
        setReady(false)
        setVerifying(false)
        setSessionError('Your reset link has expired. Please request a new one.')
      }
    })

    const timeoutId = window.setTimeout(async () => {
      const { data } = await supabase.auth.getSession()

      if (!isMounted) return

      if (data?.session) {
        setReady(true)
        setSessionError('')
      } else {
        setReady(false)
        setSessionError('Your reset link has expired or is invalid. Please request a new one.')
      }

      setVerifying(false)
    }, 4000)

    return () => {
      isMounted = false
      subscription.unsubscribe()
      window.clearTimeout(timeoutId)
    }
  }, [])

  return { ready, sessionError, verifying }
}
