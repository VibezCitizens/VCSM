// ============================================================
//  FRIENDS SYSTEM — FRIEND GRAPH DERIVATION (ACTOR-BASED)
// ------------------------------------------------------------
//  @File: friendGraph.utils.js
//  @System: FriendsModule
//  @RefactorBatch: 2025-12
//  @Status: FINAL
//  @Scope:
//    • Derive social buckets from follow graph
//    • Actor-based only
// ------------------------------------------------------------
//  INPUT:
//    following: Set<actorId>
//    followers: Set<actorId>
//
//  OUTPUT:
//    {
//      mutual:  actorId[],
//      iAmFan:  actorId[],
//      myFans:  actorId[]
//    }
//
//  RULES:
//   • actorId is the ONLY identity
//   • No DB access
//   • No UI logic
//   • Pure function
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

  // ------------------------------------------------------------
  // People I follow
  // ------------------------------------------------------------
  for (const actorId of following) {
    if (followers.has(actorId)) {
      mutual.push(actorId);
    } else {
      iAmFan.push(actorId);
    }
  }

  // ------------------------------------------------------------
  // People who follow me but I don't follow back
  // ------------------------------------------------------------
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
