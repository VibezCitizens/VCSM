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
  supabase,

  // lifecycle hooks
  onEdited,
  onDeleted,
}) {
  if (!messages.length) return null

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
                supabase,
                actorId,
                messageId: msg.id,
                newBody: msg.__pendingEditBody, // or via UI flow
              })
              onEdited?.()
            }}

            onRequestUnsend={async (msg) => {
              await unsendMessageController({
                supabase,
                actorId,
                messageId: msg.id,
              })
              onDeleted?.()
            }}

            onRequestDeleteForMe={async (msg) => {
              await deleteMessageForMeController({
                supabase,
                actorId,
                messageId: msg.id,
              })
            }}
          />
        )
      })}
    </div>
  )
}
