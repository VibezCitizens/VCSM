import { dalHydrateAuthSession } from '@/features/auth/dal/authSession.read.dal'

export async function hydrateAuthSession() {
  return dalHydrateAuthSession()
}
