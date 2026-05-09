import { dalUpdatePassword } from '@/auth/dal/updatePassword.dal'

export async function ctrlUpdatePassword({ password, confirmPassword }) {
  if (!password) throw new Error('Password is required.')
  if (password.length < 8) throw new Error('Password must be at least 8 characters.')
  if (password !== confirmPassword) throw new Error('Passwords do not match.')
  await dalUpdatePassword({ password })
}
