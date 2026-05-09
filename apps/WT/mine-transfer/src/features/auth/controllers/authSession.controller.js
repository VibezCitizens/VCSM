import { dalHydrateAuthSession } from '@/auth/dal/authSession.read.dal'

export async function hydrateAuthSession() {
  return dalHydrateAuthSession()
}
