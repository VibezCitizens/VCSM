// utils/messageGrouping.js
export function shouldShowAvatar(messages, index) {
  if (index === 0) return true;

  const current = messages[index];
  const previous = messages[index - 1];

  const sameSender = current.sender_id === previous.sender_id;
  const timeGap = Math.abs(new Date(current.created_at) - new Date(previous.created_at));
  const minutesGap = timeGap / 1000 / 60;

  return !sameSender || minutesGap > 2;
}
