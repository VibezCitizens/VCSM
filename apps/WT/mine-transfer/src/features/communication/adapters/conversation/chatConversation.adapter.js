// Adapter: re-exports chat/conversation internals for use by communication feature.
// This is the public API boundary — communication must NOT import
// directly from @/features/chat/conversation/.

export { default as MessageMedia } from '@/features/chat/conversation/components/MessageMedia'
