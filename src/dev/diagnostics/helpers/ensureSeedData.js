import { ensureActorContext } from "@/dev/diagnostics/helpers/ensureActorContext";
import { ensureRealm } from "@/dev/diagnostics/helpers/ensureRealm";
import {
  ensureOnboardingStepSeed,
  ensureVibeTagSeed,
} from "@/dev/diagnostics/helpers/ensureOnboardingVibeSeeds";
import {
  ensureBasicPost,
  ensureBasicConversation,
  ensureReportableObject,
} from "@/dev/diagnostics/helpers/ensureContentSeeds";
import { ensureBasicVport } from "@/dev/diagnostics/helpers/ensureVportSeed";
import { ensureBasicBookingObjects } from "@/dev/diagnostics/helpers/ensureBookingSeed";

export {
  ensureOnboardingStepSeed,
  ensureVibeTagSeed,
  ensureBasicPost,
  ensureBasicConversation,
  ensureBasicVport,
  ensureReportableObject,
  ensureBasicBookingObjects,
};

export async function ensureSeedData(shared) {
  if (shared?.cache?.allSeedData) return shared.cache.allSeedData;

  const [authActor, realm, onboardingStep, vibeTag, post, conversation] = await Promise.all([
    ensureActorContext(shared),
    ensureRealm(shared),
    ensureOnboardingStepSeed(shared),
    ensureVibeTagSeed(shared),
    ensureBasicPost(shared),
    ensureBasicConversation(shared),
  ]);

  const [vport, reportable, booking] = await Promise.all([
    ensureBasicVport(shared).catch((error) => ({ error })),
    ensureReportableObject(shared),
    ensureBasicBookingObjects(shared).catch((error) => ({ error })),
  ]);

  const payload = {
    authActor,
    realm,
    onboardingStep,
    vibeTag,
    post,
    conversation,
    vport,
    reportable,
    booking,
  };

  if (shared?.cache) shared.cache.allSeedData = payload;
  return payload;
}
