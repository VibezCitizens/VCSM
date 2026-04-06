export const FOLLOW_RELATION_STATES = Object.freeze({
  NOT_FOLLOWING: "not_following",
  REQUEST_PENDING: "request_pending",
  FOLLOWING: "following",
});

const FOLLOW_BUTTON_LABELS = Object.freeze({
  [FOLLOW_RELATION_STATES.NOT_FOLLOWING]: "Subscribe",
  [FOLLOW_RELATION_STATES.REQUEST_PENDING]: "Requested",
  [FOLLOW_RELATION_STATES.FOLLOWING]: "Unsubscribe",
});

export function normalizeFollowRelationState(value) {
  const raw = String(value ?? "").trim().toLowerCase();

  if (
    raw === FOLLOW_RELATION_STATES.NOT_FOLLOWING ||
    raw === FOLLOW_RELATION_STATES.REQUEST_PENDING ||
    raw === FOLLOW_RELATION_STATES.FOLLOWING
  ) {
    return raw;
  }

  return FOLLOW_RELATION_STATES.NOT_FOLLOWING;
}

export function resolveFollowRelationStateModel({
  isFollowing = false,
  requestStatus = null,
} = {}) {
  if (isFollowing) {
    return FOLLOW_RELATION_STATES.FOLLOWING;
  }

  const status = String(requestStatus ?? "").trim().toLowerCase();
  if (status === "pending") {
    return FOLLOW_RELATION_STATES.REQUEST_PENDING;
  }

  return FOLLOW_RELATION_STATES.NOT_FOLLOWING;
}

export function getFollowButtonLabelModel(state) {
  const normalized = normalizeFollowRelationState(state);
  return FOLLOW_BUTTON_LABELS[normalized];
}

export function isFollowingRelationState(state) {
  return normalizeFollowRelationState(state) === FOLLOW_RELATION_STATES.FOLLOWING;
}
