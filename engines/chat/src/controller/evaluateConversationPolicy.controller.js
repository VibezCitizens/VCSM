import { resolveConversationPolicy } from '../services/conversationPolicyService.js'

export async function evaluateConversationPolicyController(params) {
  const { decision } = await resolveConversationPolicy({
    request: params,
  })

  return decision
}
