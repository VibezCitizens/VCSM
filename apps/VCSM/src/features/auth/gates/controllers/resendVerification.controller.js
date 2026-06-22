import { dalResendVerificationEmail } from '@/features/auth/gates/dal/emailVerification.dal'

export async function resendVerificationEmailController({ email }) {
  if (!email) throw new Error('Email is required to resend verification.')
  await dalResendVerificationEmail({ email })
}
