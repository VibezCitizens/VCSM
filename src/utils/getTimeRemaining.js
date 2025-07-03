// utils/getTimeRemaining.js
export function getTimeRemaining(lastTimestamp) {
  const now = new Date();
  const last = new Date(lastTimestamp);
  const limitMs = 3 * 60 * 60 * 1000; // 3 hours in ms
  const diffMs = limitMs - (now - last);

  if (diffMs <= 0) return { hours: 0, minutes: 0 };

  const totalMinutes = Math.ceil(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes };
}
