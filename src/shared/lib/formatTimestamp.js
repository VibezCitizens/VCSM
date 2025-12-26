// src/lib/datetime/formatTimestamp.js

export function formatTimestamp(value) {
  if (!value) return ""

  const date = new Date(value)

  // Options for month + day formatting like: Dec 4, Nov 21
  const options = {
    month: "short",
    day: "numeric"
  }

  try {
    return date.toLocaleDateString("en-US", options)
  } catch (err) {
    console.error("formatTimestamp error:", err)
    return ""
  }
}
