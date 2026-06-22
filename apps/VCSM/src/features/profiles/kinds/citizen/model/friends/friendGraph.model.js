// [CITIZEN_ONLY] — user actors only
// ============================================================
//  FRIENDS SYSTEM — FRIEND GRAPH DERIVATION (ACTOR-BASED)
// ------------------------------------------------------------
//  Derive social buckets from follow graph.
//  Pure function — no DB access, no UI logic.
//
//  INPUT:
//    following: Set<actorId>
//    followers: Set<actorId>
//
//  OUTPUT:
//    { mutual: actorId[], iAmFan: actorId[], myFans: actorId[] }
// ============================================================

export function deriveFriendLists({ following, followers }) {
  if (!following || !followers) {
    return {
      mutual: [],
      iAmFan: [],
      myFans: [],
    };
  }

  const mutual = [];
  const iAmFan = [];
  const myFans = [];

  for (const actorId of following) {
    if (followers.has(actorId)) {
      mutual.push(actorId);
    } else {
      iAmFan.push(actorId);
    }
  }

  for (const actorId of followers) {
    if (!following.has(actorId)) {
      myFans.push(actorId);
    }
  }

  return {
    mutual,
    iAmFan,
    myFans,
  };
}
