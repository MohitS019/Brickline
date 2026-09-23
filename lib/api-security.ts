import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { getPanelDb, isBricklineAdmin } from "@/lib/panel-access";
import type { Role } from "@/lib/brickline-data";

export const secureJson = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

export function validateMutationOrigin(request: Request): Response | null {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return secureJson({ error: "Cross-site request blocked." }, 403);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return secureJson({ error: "Cross-site request blocked." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return secureJson({ error: "JSON request required." }, 415);
  return null;
}

export async function requireVerifiedRole(role: Role): Promise<{ user: ChatGPTUser; db: D1Database } | { response: Response }> {
  const user = await getChatGPTUser();
  if (!user) return { response: secureJson({ error: "Sign in is required." }, 401) };
  const db = getPanelDb();
  if (!db) return { response: secureJson({ error: "Security service is unavailable." }, 503) };
  if (isBricklineAdmin(user)) return { user, db };
  const column = role === "Agent" ? "agent_access" : role === "Builder" ? "builder_access" : "client_access";
  const row = await db.prepare(`SELECT status, ${column} AS allowed, consent_version AS consentVersion, consent_withdrawn_at AS consentWithdrawnAt FROM builder_access_requests WHERE user_id = ?`).bind(user.userId).first<{ status: string; allowed: number; consentVersion: string; consentWithdrawnAt: number | null }>();
  if (!row || row.status !== "approved" || !row.allowed) return { response: secureJson({ error: `${role} verification is required.` }, 403) };
  if (!row.consentVersion || row.consentWithdrawnAt) return { response: secureJson({ error: "Privacy consent is required before using this panel." }, 403) };
  return { user, db };
}

export async function writeAudit(db: D1Database, actorUserId: string, eventType: string, targetId: string | null, metadata: Record<string, unknown> = {}) {
  await db.prepare("INSERT INTO security_audit_log (id, actor_user_id, event_type, target_id, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .bind(crypto.randomUUID(), actorUserId, eventType, targetId, JSON.stringify(metadata).slice(0, 2000), Date.now()).run();
}

export async function isRateLimited(db: D1Database, actorUserId: string, eventType: string, windowMs: number, maxEvents: number) {
  const row = await db.prepare("SELECT COUNT(*) AS count FROM security_audit_log WHERE actor_user_id = ? AND event_type = ? AND created_at >= ?")
    .bind(actorUserId, eventType, Date.now() - windowMs).first<{ count: number }>();
  return Number(row?.count || 0) >= maxEvents;
}
