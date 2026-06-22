import { validateEmail } from '@/features/auth/shared/model/authInputValidation.model'
import { dalSendResetPasswordEmail } from '@/features/auth/password-recovery/dal/resetPassword.dal'
import { captureVcsmError } from '@/services/monitoring/vcsmMonitoring'

export async function ctrlSendResetPasswordEmail(email) {
  const normalizedEmail = validateEmail(email)

  try {
    await dalSendResetPasswordEmail({
      email: normalizedEmail,
      redirectTo: `${window.location.origin}/reset-password`,
    })
  } catch (error) {
    captureVcsmError({
      feature: 'auth',
      module: 'sendResetPassword.controller',
      severity: 'error',
      message: `ctrlSendResetPasswordEmail: dalSendResetPasswordEmail failed — ${error?.message ?? 'unknown'}`,
      error_name: error?.name,
      operation: 'dalSendResetPasswordEmail',
      is_handled: false,
    })
    throw error
  }
}
