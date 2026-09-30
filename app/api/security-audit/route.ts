import { requireAdmin, secureJson } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const { data, error } = await auth.admin.from("audit_events").select("*, profiles(email)").order("created_at", { ascending: false }).limit(200);
  if (error) return secureJson({ error: "Audit activity could not be loaded." }, 503);
  const events = (data || []).map((row) => ({ id: row.id, actorUserId: row.actor_id, actor: (row.profiles as unknown as { email?: string } | null)?.email || row.actor_id || "System", eventType: row.event_type, targetId: row.target_id, metadata: JSON.stringify(row.metadata || {}), createdAt: Date.parse(row.created_at) }));
  const recent = events.filter((row) => row.eventType === "grant.created" && row.createdAt >= Date.now() - 3_600_000);
  const counts = new Map<string, { actorUserId: string; actor: string; count: number }>();
  recent.forEach((row) => { const key = row.actorUserId || "system"; const current = counts.get(key) || { actorUserId: key, actor: row.actor, count: 0 }; current.count += 1; counts.set(key, current); });
  return secureJson({ events, alerts: [...counts.values()].filter((item) => item.count >= 10), fraudAlerts: events.filter((row) => row.eventType.startsWith("fraud.")).slice(0, 50) });
}
