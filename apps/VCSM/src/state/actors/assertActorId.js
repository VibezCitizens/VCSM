// src/state/actors/assertActorId.js

export function assertActorId(actor) {
  if (actor && typeof actor !== "string") {
    console.error("❌ ACTOR CONTRACT VIOLATION:", actor);
    throw new Error("Actor must be a UUID string");
  }
}
