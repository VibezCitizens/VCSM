import { dalHydrateAuthSession } from '@/features/auth/shared/dal/authSession.read.dal'

export async function hydrateAuthSession() {
  return dalHydrateAuthSession()
}
