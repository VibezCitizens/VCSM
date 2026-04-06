import { useOutletContext } from "react-router-dom";

const EMPTY_LEARNING_CONTEXT = {
  supabase: null,
  user: null,
  identity: null,
  actorId: null,
  identityRealmId: null,
  realm: null,
  realmId: null,
  isLoading: false,
  isReady: false,
  error: null,
  reload: async () => ({ ok: false }),
};

export function useLearningRouteContext() {
  return useOutletContext() ?? EMPTY_LEARNING_CONTEXT;
}

export default useLearningRouteContext;
