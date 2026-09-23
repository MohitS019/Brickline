import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getPanelDb, isBricklineAdmin } from "@/lib/panel-access";
import type { Role } from "@/lib/brickline-data";
import { isRateLimited, validateMutationOrigin, writeAudit } from "@/lib/api-security";

export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const roles: Role[] = ["Agent", "Builder", "Client"];
type AccessRow = { userId: string; email: string; name: string; company: string; status: string; requestedRole: Role; agentAccess: number; builderAccess: number; clientAccess: number; requestedAt: number; reviewedAt: number | null };

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in is required." }, 401);
  const db = getPanelDb();
  if (!db) return json({ error: "Panel access is temporarily unavailable." }, 503);
  try {
    if (isBricklineAdmin(user)) {
      const rows = await db.prepare("SELECT user_id AS userId, email, name, company, status, requested_role AS requestedRole, agent_access AS agentAccess, builder_access AS builderAccess, client_access AS clientAccess, requested_at AS requestedAt, reviewed_at AS reviewedAt FROM builder_access_requests ORDER BY requested_at DESC LIMIT 200").all<AccessRow>();
      return json({ isAdmin: true, requests: rows.results });
    }
    const row = await db.prepare("SELECT status, requested_role AS requestedRole, agent_access AS agentAccess, builder_access AS builderAccess, client_access AS clientAccess, company, requested_at AS requestedAt, reviewed_at AS reviewedAt FROM builder_access_requests WHERE user_id = ?")
      .bind(user.userId).first();
    return json({ isAdmin: false, request: row ?? null });
  } catch {
    return json({ error: "Panel access could not be loaded." }, 503);
  }
}

export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request); if (invalid) return invalid;
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in is required." }, 401);
  if (isBricklineAdmin(user)) return json({ error: "Admin access is already granted." }, 409);
  const db = getPanelDb();
  if (!db) return json({ error: "Panel access is temporarily unavailable." }, 503);
  const body = await request.json().catch(() => null) as { role?: unknown; company?: unknown; consent?: unknown } | null;
  const role = body?.role;
  const company = typeof body?.company === "string" ? body.company.trim() : "";
  if (!roles.includes(role as Role) || (role === "Builder" && company.length < 2) || company.length > 120) return json({ error: "Choose a profession and enter a valid company name for Builder access." }, 400);
  if (body?.consent !== true) return json({ error: "Accept the Privacy Notice before requesting access." }, 400);
  try {
    if (await isRateLimited(db, user.userId, "access.requested", 60 * 60 * 1000, 5)) return json({ error: "Too many access requests. Try again later." }, 429);
    const existing = await db.prepare("SELECT status FROM builder_access_requests WHERE user_id = ?").bind(user.userId).first<{ status: string }>();
    if (existing && existing.status !== "declined") return json({ error: existing.status === "pending" ? "Your request is already pending." : "Your access is managed by an admin." }, 409);
    const now = Date.now();
    await db.prepare("INSERT INTO builder_access_requests (user_id, email, name, company, status, requested_role, agent_access, builder_access, client_access, requested_at, reviewed_at, reviewed_by, consent_version, consent_at, consent_withdrawn_at) VALUES (?, ?, ?, ?, 'pending', ?, 0, 0, 0, ?, NULL, NULL, '2026-09-23', ?, NULL) ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, name = excluded.name, company = excluded.company, status = 'pending', requested_role = excluded.requested_role, agent_access = 0, builder_access = 0, client_access = 0, requested_at = excluded.requested_at, reviewed_at = NULL, reviewed_by = NULL, consent_version = excluded.consent_version, consent_at = excluded.consent_at, consent_withdrawn_at = NULL")
      .bind(user.userId, user.email, user.displayName, company, role, now, now).run();
    await writeAudit(db, user.userId, "privacy.consent", user.userId, { version: "2026-09-23" });
    await writeAudit(db, user.userId, "access.requested", user.userId, { role });
    return json({ status: "pending" }, 201);
  } catch {
    return json({ error: "Request could not be saved. Please try again." }, 503);
  }
}

export async function PATCH(request: Request) {
  const invalid = validateMutationOrigin(request); if (invalid) return invalid;
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in is required." }, 401);
  if (!isBricklineAdmin(user)) return json({ error: "Admin permission is required." }, 403);
  const db = getPanelDb();
  if (!db) return json({ error: "Panel access is temporarily unavailable." }, 503);
  const body = await request.json().catch(() => null) as { userId?: unknown; action?: unknown; panels?: unknown } | null;
  if (typeof body?.userId !== "string" || !body.userId || body.userId.length > 200) return json({ error: "Invalid account." }, 400);
  const action = body.action;
  if (!["approve", "decline", "suspend", "restore", "set-panels"].includes(String(action))) return json({ error: "Invalid action." }, 400);
  try {
    const current = await db.prepare("SELECT status, requested_role AS requestedRole FROM builder_access_requests WHERE user_id = ?")
      .bind(body.userId).first<{ status: string; requestedRole: Role }>();
    if (!current) return json({ error: "Account not found." }, 404);
    let result: D1Result;
    if (action === "approve") {
      if (current.status !== "pending") return json({ error: "Only pending requests can be approved." }, 409);
      const all = current.requestedRole === "Builder";
      result = await db.prepare("UPDATE builder_access_requests SET status = 'approved', agent_access = ?, builder_access = ?, client_access = ?, reviewed_at = ?, reviewed_by = ? WHERE user_id = ? AND status = 'pending'")
        .bind(all || current.requestedRole === "Agent" ? 1 : 0, all ? 1 : 0, all || current.requestedRole === "Client" ? 1 : 0, Date.now(), user.userId, body.userId).run();
    } else if (action === "decline") {
      if (current.status !== "pending") return json({ error: "Only pending requests can be declined." }, 409);
      result = await db.prepare("UPDATE builder_access_requests SET status = 'declined', agent_access = 0, builder_access = 0, client_access = 0, reviewed_at = ?, reviewed_by = ? WHERE user_id = ? AND status = 'pending'")
        .bind(Date.now(), user.userId, body.userId).run();
    } else if (action === "suspend") {
      if (current.status !== "approved") return json({ error: "Only approved accounts can be suspended." }, 409);
      result = await db.prepare("UPDATE builder_access_requests SET status = 'suspended', reviewed_at = ?, reviewed_by = ? WHERE user_id = ? AND status = 'approved'")
        .bind(Date.now(), user.userId, body.userId).run();
    } else if (action === "restore") {
      if (current.status !== "suspended") return json({ error: "Only suspended accounts can be restored." }, 409);
      result = await db.prepare("UPDATE builder_access_requests SET status = 'approved', reviewed_at = ?, reviewed_by = ? WHERE user_id = ? AND status = 'suspended'")
        .bind(Date.now(), user.userId, body.userId).run();
    } else {
      if (current.status !== "approved" && current.status !== "suspended") return json({ error: "Approve the account before changing panels." }, 409);
      const panels = body.panels as { Agent?: unknown; Builder?: unknown; Client?: unknown } | null;
      if (!panels || typeof panels.Agent !== "boolean" || typeof panels.Builder !== "boolean" || typeof panels.Client !== "boolean") return json({ error: "Choose access for all three panels." }, 400);
      result = await db.prepare("UPDATE builder_access_requests SET agent_access = ?, builder_access = ?, client_access = ?, reviewed_at = ?, reviewed_by = ? WHERE user_id = ? AND status IN ('approved', 'suspended')")
        .bind(panels.Agent ? 1 : 0, panels.Builder ? 1 : 0, panels.Client ? 1 : 0, Date.now(), user.userId, body.userId).run();
    }
    if (!result.meta.changes) return json({ error: "This account changed; refresh and try again." }, 409);
    const updated = await db.prepare("SELECT user_id AS userId, email, name, company, status, requested_role AS requestedRole, agent_access AS agentAccess, builder_access AS builderAccess, client_access AS clientAccess, requested_at AS requestedAt, reviewed_at AS reviewedAt FROM builder_access_requests WHERE user_id = ?")
      .bind(body.userId).first<AccessRow>();
    await writeAudit(db, user.userId, `admin.${String(action)}`, body.userId);
    return json({ account: updated });
  } catch {
    return json({ error: "Change could not be saved. Please try again." }, 503);
  }
}
