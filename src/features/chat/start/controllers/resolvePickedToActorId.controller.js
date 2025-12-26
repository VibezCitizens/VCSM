// KEEP FILE NAME
// KEEP LOGIC
// ADD EXPORT ALIAS

export async function resolvePickedActor(picked) {
  if (!picked) {
    throw new Error('resolvePickedActor: missing picked')
  }

  if (!picked.actorId && !picked.id) {
    throw new Error('resolvePickedActor: picked item missing actorId')
  }

  const actorId = picked.actorId || picked.id

  if (typeof actorId !== 'string') {
    throw new Error('resolvePickedActor: invalid actorId')
  }

  return actorId
}

// 👇 ALIAS — THIS FIXES EVERYTHING
export const resolvePickedToActorId = resolvePickedActor
