export function isEmailVerifiedModel(user) {
  if (!user) return false
  return Boolean(user.email_confirmed_at)
}
