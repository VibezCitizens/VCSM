export async function submitLead() {
  await fetch("/api/leads", { method: "POST" });
}
