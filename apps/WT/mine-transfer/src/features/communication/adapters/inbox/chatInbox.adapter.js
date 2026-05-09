// Adapter: re-exports chat/inbox internals for use by communication feature screens.
// This is the public API boundary — communication screens must NOT import
// directly from @/features/chat/inbox/.

// Hooks
export { default as useInbox } from '@/features/chat/inbox/hooks/useInbox'
export { default as useInboxActions } from '@/features/chat/inbox/hooks/useInboxActions'
export { default as useInboxFolder } from '@/features/chat/inbox/hooks/useInboxFolder'
export { default as useVexSettings } from '@/features/chat/inbox/hooks/useVexSettings'

// Components
export { default as InboxList } from '@/features/chat/inbox/components/InboxList'
export { default as InboxListSkeleton } from '@/features/chat/inbox/components/InboxListSkeleton'
export { default as InboxEmptyState } from '@/features/chat/inbox/components/InboxEmptyState'

// Lib
export { default as buildInboxPreview } from '@/features/chat/inbox/lib/buildInboxPreview'

// Model
export { shouldShowInboxEntry } from '@/features/chat/inbox/model/vexSettings.model'

// Constants
export { inboxOnSearch } from '@/features/chat/inbox/constants/inboxSearchAdapter'
