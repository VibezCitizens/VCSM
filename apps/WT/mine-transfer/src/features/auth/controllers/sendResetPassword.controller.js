import { dalSendResetPasswordEmail } from '@/auth/dal/resetPassword.dal'

export async function ctrlSendResetPasswordEmail(email) {
  const normalizedEmail = String(email || '').trim()
  if (!normalizedEmail) throw new Error('Email is required.')

  const redirectTo =
    import.meta.env.VITE_AUTH_RESET_REDIRECT ||
    (typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined)

  await dalSendResetPasswordEmail({
    email: normalizedEmail,
    redirectTo,
  })
}
