// src/features/chat/components/ChatMessage.jsx
import React, { memo } from 'react';
import clsx from 'clsx';

function ChatMessage({
  message,
  myActorId,
  isOwn: isOwnProp,
  onDeleteForMe,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}) {
  const isOwn = typeof isOwnProp === 'boolean'
    ? isOwnProp
    : (message?.sender_actor_id === myActorId);

  const ts = message?.created_at ? new Date(message.created_at) : null;

  return (
    <div className={clsx('px-2 py-1 select-none', selectionMode && 'cursor-pointer')}>
      <div className="flex items-start gap-2 w-full">
        {selectionMode && !isOwn && (
          <div className="pt-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/30 bg-transparent"
              checked={!!selected}
              onChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div
          className={clsx(
            'inline-block max-w-[78%]',
            'rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap',
            'break-words [overflow-wrap:anywhere]',
            isOwn ? 'ml-auto bg-violet-700/80 text-white' : 'bg-neutral-800 text-white',
            selected && 'ring-2 ring-violet-400'
            // removed the dimming that caused the “black out” look:
            // message?._optimistic && 'opacity-60',
            // message?._error && 'opacity-60 ring-1 ring-red-500/60'
          )}
        >
          <div>{message?.body}</div>
          {ts && (
            <div className="mt-1 text-[11px] opacity-60 leading-none">
              <time dateTime={ts.toISOString()} title={ts.toLocaleString()}>
                {ts.toLocaleString()}
              </time>
            </div>
          )}
        </div>

        {selectionMode && isOwn && (
          <div className="pt-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/30 bg-transparent"
              checked={!!selected}
              onChange={onToggleSelect}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ChatMessage);
