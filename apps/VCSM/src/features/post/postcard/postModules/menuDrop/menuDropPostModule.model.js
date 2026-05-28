export function parseMenuDropPostModule(text, payload = null) {
  const restaurantName = (text ?? "").replace(/^Menu updated at\s*/i, "").split("\n")[0].trim();

  if (payload?.subject) {
    return {
      restaurantName,
      action: payload.action,
      subject: payload.subject,
      itemName: payload.subjectName ?? null,
      categoryName: payload.categoryName ?? null,
    };
  }

  const parts = (text ?? "").split("\n\n");
  const updateLine = (parts[1] ?? "").trim();
  const update = updateLine.match(/^(Added|Updated)\s+(item|category):\s+(.+)$/i);

  if (!update) {
    return { restaurantName, action: null, subject: null, itemName: null, categoryName: null };
  }

  const detail = update[3].trim();
  const item = detail.match(/^(.+?)\s+\((.+)\)$/);

  return {
    restaurantName,
    action: update[1],
    subject: update[2],
    itemName: item ? item[1].trim() : detail,
    categoryName: item ? item[2].trim() : null,
  };
}
