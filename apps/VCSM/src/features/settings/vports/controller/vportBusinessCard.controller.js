import { setVportBusinessCardPublishStateDAL } from '@/features/settings/vports/dal/vports.write.dal'

export async function ctrlSetVportBusinessCardPublishState({ vportId, published }) {
  return setVportBusinessCardPublishStateDAL(vportId, published)
}
