import { updateProfile } from "@/features/settings/profile/dal/profile.write.dal";

export async function saveProfile({
  profileId,
  displayName,
  bio,
  photoUrl,
  bannerUrl,
}) {
  return updateProfile(profileId, "user", {
    display_name: displayName,
    bio,
    photo_url: photoUrl,
    banner_url: bannerUrl,
  });
}
