import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getPanelDb, isBricklineAdmin } from "@/lib/panel-access";
import { secureJson } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return secureJson({ error: "Sign in is required." }, 401);
  if (!isBricklineAdmin(user)) return secureJson({ error: "Admin permission is required." }, 403);
  const db = getPanelDb(); if (!db) return secureJson({ error: "Audit service is unavailable." }, 503);
  try {
    const events = await db.prepare("SELECT l.id, l.actor_user_id AS actorUserId, COALESCE(r.email, l.actor_user_id) AS actor, l.event_type AS eventType, l.target_id AS targetId, l.metadata, l.created_at AS createdAt FROM security_audit_log l LEFT JOIN builder_access_requests r ON r.user_id = l.actor_user_id ORDER BY l.created_at DESC LIMIT 200").all();
    const unusual = await db.prepare("SELECT l.actor_user_id AS actorUserId, COALESCE(r.email, l.actor_user_id) AS actor, COUNT(*) AS count FROM security_audit_log l LEFT JOIN builder_access_requests r ON r.user_id = l.actor_user_id WHERE l.event_type = 'grant.created' AND l.created_at >= ? GROUP BY l.actor_user_id HAVING COUNT(*) >= 10 ORDER BY count DESC").bind(Date.now() - 60 * 60 * 1000).all();
    return secureJson({ events: events.results, alerts: unusual.results });
  } catch { return secureJson({ error: "Audit activity could not be loaded." }, 503); }
}
