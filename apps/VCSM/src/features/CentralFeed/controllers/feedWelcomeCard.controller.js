import {
  readWelcomeFeedCardStateDAL,
  markWelcomeFeedCardSeenDAL,
} from '@/features/CentralFeed/dal/feedWelcomeCard.dal'

export async function ctrlGetWelcomeCardVisible({ actorId }) {
  const row = await readWelcomeFeedCardStateDAL({ actorId })
  const show = !row || row.status !== 'completed'
  return { show }
}

export async function ctrlMarkWelcomeCardSeen({ actorId }) {
  await markWelcomeFeedCardSeenDAL({ actorId })
}
