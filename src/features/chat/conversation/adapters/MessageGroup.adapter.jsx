// src/features/chat/conversation/adapters/MessageGroup.adapter.jsx

import MessageRow from './MessageRow.adapter'

import { editMessageController }
  from '@/features/chat/conversation/controllers/editMessage.controller'
import { unsendMessageController }
  from '@/features/chat/conversation/controllers/unsendMessage.controller'
import { deleteMessageForMeController }
  from '@/features/chat/conversation/controllers/deleteMessageForMe.controller'

export default function MessageGroupAdapter({
  messages = [],
  senderActor,
  currentActorId,

  // infrastructure
  actorId,
  supabase, // kept for compatibility even if controllers don't use it

  // lifecycle hooks
  onEdited,
  onDeleted,
}) {
  if (!messages.length) return null

  // derive conversationId from any message in this group (all are same conversation)
  const conversationId = messages?.[0]?.conversationId ?? null

  return (
    <div className="flex flex-col gap-1 my-1">
      {messages.map((message) => {
        const isMine = message.senderActorId === currentActorId

        return (
          <MessageRow
            key={message.id}
            message={message}
            senderActor={senderActor}
            isMine={isMine}

            /* intent wiring */
            onRequestEdit={async (msg) => {
              await editMessageController({
                actorId,
                messageId: msg.id,
                body: msg.__pendingEditBody ?? '',
              })
              onEdited?.()
            }}

            onRequestUnsend={async (msg) => {
              await unsendMessageController({
                actorId,
                messageId: msg.id,
              })
              onDeleted?.()
            }}

            onRequestDeleteForMe={async (msg) => {
              if (!conversationId) {
                throw new Error(
                  '[MessageGroupAdapter] conversationId missing on message payload'
                )
              }

              await deleteMessageForMeController({
                actorId,
                messageId: msg.id,
                conversationId,
              })

              onDeleted?.()
            }}
          />
        )
      })}
    </div>
  )
}
