import { useState, useCallback } from 'react'
import { useIdentity } from '@/features/identity/adapters/identity.adapter'
import { ctrlSendCitizenInvite } from '../controller/invite.controller'

const CODE_MESSAGES = {
  USER_ALREADY_REGISTERED: 'This email already has an account.',
  SELF_INVITE:             "You can't invite yourself.",
  INVITE_FAILED:           'Invite could not be sent. Try again.',
  EMAIL_SEND_FAILED:       'Invite saved but the email could not be sent. Try again.',
  INVALID_EMAIL:           'Enter a valid email address.',
  INVALID_INVITER_TYPE:    'Inviter type is missing.',
}

function codeToMessage(code) {
  return CODE_MESSAGES[code] ?? 'Something went wrong. Please try again.'
}

export function useInvite() {
  const { identity } = useIdentity()

  const [email, setEmail]           = useState('')
  const [sending, setSending]       = useState(false)
  const [success, setSuccess]       = useState(false)
  const [error, setError]           = useState(null)
  const [rawDebugError, setRawDebugError] = useState(null) // DEV PROBE — remove after CORS confirmed

  const inviterType    = identity?.kind === 'vport' ? 'vport' : 'citizen'
  const inviterActorId = identity?.kind === 'vport' ? (identity?.actorId ?? null) : null

  const send = useCallback(async () => {
    setError(null)
    setSuccess(false)

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter an email address.')
      return
    }

    setSending(true)
    try {
      const result = await ctrlSendCitizenInvite({
        targetEmail:     trimmed,
        inviterType,
        inviterActorId,
      })

      if (result?.ok === false) {
        if (import.meta.env.DEV) setRawDebugError(JSON.stringify(result, null, 2)) // DEV PROBE
        setError(codeToMessage(result.code))
      } else {
        if (import.meta.env.DEV) setRawDebugError(JSON.stringify(result, null, 2)) // DEV PROBE
        // Edge Function handles actor_onboarding_steps upsert server-side.
        setSuccess(true)
        setEmail('')
      }
    } catch (err) {
      const msg = err?.message ?? ''
      if (import.meta.env.DEV) setRawDebugError(msg || String(err)) // DEV PROBE
      setError(codeToMessage(msg) || 'Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }, [email, inviterType, inviterActorId])

  const reset = useCallback(() => {
    setEmail('')
    setError(null)
    setSuccess(false)
  }, [])

  return {
    email,
    setEmail,
    sending,
    success,
    error,
    rawDebugError, // DEV PROBE — remove after CORS confirmed
    send,
    reset,
    inviterName: identity?.displayName ?? null,
    inviterType,
  }
}
