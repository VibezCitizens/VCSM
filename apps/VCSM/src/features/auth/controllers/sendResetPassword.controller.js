import { dalSendResetPasswordEmail } from '@/features/auth/dal/resetPassword.dal'

const DEFAULT_RESET_REDIRECT = 'https://vibezcitizens.com/reset-confirm'

export async function ctrlSendResetPasswordEmail(email) {
  const normalizedEmail = String(email || '').trim()
  if (!normalizedEmail) throw new Error('Email is required.')

  await dalSendResetPasswordEmail({
    email: normalizedEmail,
    redirectTo: DEFAULT_RESET_REDIRECT,
  })
}
