import { dalSendResetPasswordEmail } from '@/features/auth/dal/resetPassword.dal'

export async function ctrlSendResetPasswordEmail(email) {
  const normalizedEmail = String(email || '').trim()
  if (!normalizedEmail) throw new Error('Email is required.')

  await dalSendResetPasswordEmail({
    email: normalizedEmail,
    redirectTo: `${window.location.origin}/reset-password`,
  })
}
