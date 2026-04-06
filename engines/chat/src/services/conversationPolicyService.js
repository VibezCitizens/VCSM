import { getConversationPolicyResolver } from '../config.js'
import {
  assertConversationPolicyDecision,
  buildDefaultConversationPolicyDecision,
  normalizeConversationPolicyRequest,
} from '../rules/conversationPolicy.rules.js'

export async function resolveConversationPolicy({ request }) {
  const normalizedRequest = normalizeConversationPolicyRequest(request)
  const resolver = getConversationPolicyResolver()

  const rawDecision = resolver
    ? await resolver(normalizedRequest)
    : buildDefaultConversationPolicyDecision(normalizedRequest)

  return {
    request: normalizedRequest,
    decision: assertConversationPolicyDecision(rawDecision, normalizedRequest),
  }
}
