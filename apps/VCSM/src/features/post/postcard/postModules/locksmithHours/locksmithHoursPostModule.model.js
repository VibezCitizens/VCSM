const WEEKDAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h < 12 ? "AM" : "PM";
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, "0")} ${period}`;
}

function blocksToScheduleRows(blocks) {
  return blocks.map(({ weekday, startMinutes, endMinutes }) => ({
    day: WEEKDAY_NAMES[weekday] ?? `Day ${weekday}`,
    range: `${minutesToTime(startMinutes)} – ${minutesToTime(endMinutes)}`,
  }));
}

function textToScheduleRows(text) {
  return (text ?? "")
    .split("\n\n")
    .slice(1)
    .join("\n\n")
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.+?):\s+(.+)$/);
      return match ? { day: match[1].trim(), range: match[2].trim() } : null;
    })
    .filter(Boolean);
}

export function parseLocksmithHoursPostModule(text, payload = null) {
  const rawText = text ?? "";
  const actorName =
    rawText.split("\n")[0].replace(/^.+?\bat\s+/i, "").trim() || null;

  if (payload !== null && Array.isArray(payload.blocks)) {
    return { actorName, scheduleRows: blocksToScheduleRows(payload.blocks) };
  }

  return { actorName, scheduleRows: textToScheduleRows(rawText) };
}
