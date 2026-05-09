// Adapter: re-exports chat/start internals for use by communication feature screens.
// This is the public API boundary — communication screens must NOT import
// directly from @/features/chat/start/.

export { default as StartConversationModal } from '@/features/chat/start/screens/StartConversationModal'
export { useStartConversation } from '@/features/chat/start/hooks/useStartConversation'
