import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isBricklineAdmin, getPanelDb } from "@/lib/panel-access";
import { isRateLimited, requireVerifiedRole, secureJson, validateMutationOrigin, writeAudit } from "@/lib/api-security";
import { createGrantToken, verifyGrantToken } from "@/lib/grant-token";

export const dynamic = "force-dynamic";
const allowedMinutes = [15, 30, 60, 120];

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return secureJson({ error: "Sign in is required." }, 401);
  const db = getPanelDb();
  if (!db) return secureJson({ error: "Access grants are unavailable." }, 503);
  const admin = isBricklineAdmin(user);
  const access: { status: string; agent: number | boolean; client: number | boolean } | null = admin ? { status: "approved", agent: true, client: true } : await db.prepare("SELECT status, agent_access AS agent, client_access AS client FROM builder_access_requests WHERE user_id = ?").bind(user.userId).first<{ status: string; agent: number; client: number }>() || null;
  if (!admin && access?.status !== "approved") return secureJson({ error: "Verified account required." }, 403);
  const now = Date.now();
  if (access?.agent) {
    const rows = await db.prepare("SELECT id, client_email AS clientEmail, builder_profile_id AS builderProfileId, expires_at AS expiresAt, created_at AS createdAt, first_opened_at AS firstOpenedAt, revoked_at AS revokedAt FROM client_access_grants WHERE agent_user_id = ? ORDER BY created_at DESC LIMIT 100").bind(user.userId).all();
    return secureJson({ mode: "agent", grants: rows.results });
  }
  if (access?.client) {
    const rows = await db.prepare("SELECT id, builder_profile_id AS builderProfileId, expires_at AS expiresAt, created_at AS createdAt, first_opened_at AS firstOpenedAt FROM client_access_grants WHERE client_user_id = ? AND revoked_at IS NULL AND expires_at > ? ORDER BY created_at DESC LIMIT 100").bind(user.userId, now).all();
    return secureJson({ mode: "client", grants: rows.results });
  }
  return secureJson({ error: "Agent or Client access required." }, 403);
}

export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request); if (invalid) return invalid;
  const auth = await requireVerifiedRole("Agent"); if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null) as { clientEmail?: unknown; builderProfileId?: unknown; minutes?: unknown } | null;
  const clientEmail = typeof body?.clientEmail === "string" ? body.clientEmail.trim().toLowerCase() : "";
  const builderProfileId = typeof body?.builderProfileId === "string" ? body.builderProfileId.trim() : "";
  const minutes = Number(body?.minutes);
  if (!/^\S+@\S+\.\S+$/.test(clientEmail) || !builderProfileId || builderProfileId.length > 160 || !allowedMinutes.includes(minutes)) return secureJson({ error: "Choose a verified client, builder, and valid access duration." }, 400);
  if (await isRateLimited(auth.db, auth.user.userId, "grant.created", 60 * 60 * 1000, 20)) return secureJson({ error: "Grant limit reached. Try again later." }, 429);
  const client = await auth.db.prepare("SELECT user_id AS userId FROM builder_access_requests WHERE lower(email) = ? AND status = 'approved' AND client_access = 1").bind(clientEmail).first<{ userId: string }>();
  if (!client) return secureJson({ error: "That client must have an approved Client account first." }, 404);
  const id = crypto.randomUUID(); const createdAt = Date.now(); const expiresAt = createdAt + minutes * 60_000;
  await auth.db.prepare("INSERT INTO client_access_grants (id, agent_user_id, client_user_id, client_email, builder_profile_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(id, auth.user.userId, client.userId, clientEmail, builderProfileId, expiresAt, createdAt).run();
  await writeAudit(auth.db, auth.user.userId, "grant.created", id, { clientUserId: client.userId, builderProfileId, expiresAt });
  const token = await createGrantToken({ jti: id, sub: client.userId, aid: auth.user.userId, bid: builderProfileId, exp: Math.floor(expiresAt / 1000) });
  return secureJson({ grant: { id, clientEmail, builderProfileId, expiresAt, createdAt }, token }, 201);
}

export async function PATCH(request: Request) {
  const invalid = validateMutationOrigin(request); if (invalid) return invalid;
  const user = await getChatGPTUser(); if (!user) return secureJson({ error: "Sign in is required." }, 401);
  const db = getPanelDb(); if (!db) return secureJson({ error: "Access grants are unavailable." }, 503);
  const body = await request.json().catch(() => null) as { action?: unknown; token?: unknown; grantId?: unknown } | null;
  if (body?.action === "open" && typeof body.token === "string") {
    const claims = await verifyGrantToken(body.token);
    if (!claims || claims.sub !== user.userId || claims.exp * 1000 <= Date.now()) return secureJson({ error: "This secure link is invalid or expired." }, 403);
    const grant = await db.prepare("SELECT id, builder_profile_id AS builderProfileId, expires_at AS expiresAt, revoked_at AS revokedAt FROM client_access_grants WHERE id = ? AND client_user_id = ? AND agent_user_id = ?").bind(claims.jti, user.userId, claims.aid).first<{ id: string; builderProfileId: string; expiresAt: number; revokedAt: number | null }>();
    if (!grant || grant.revokedAt || grant.expiresAt <= Date.now() || grant.builderProfileId !== claims.bid) return secureJson({ error: "This access grant is no longer active." }, 403);
    await db.prepare("UPDATE client_access_grants SET first_opened_at = COALESCE(first_opened_at, ?) WHERE id = ?").bind(Date.now(), grant.id).run();
    await writeAudit(db, user.userId, "grant.opened", grant.id, { builderProfileId: grant.builderProfileId });
    return secureJson({ grant: { id: grant.id, builderProfileId: grant.builderProfileId, expiresAt: grant.expiresAt } });
  }
  if (body?.action === "revoke" && typeof body.grantId === "string") {
    const auth = await requireVerifiedRole("Agent"); if ("response" in auth) return auth.response;
    const result = await auth.db.prepare("UPDATE client_access_grants SET revoked_at = ? WHERE id = ? AND agent_user_id = ? AND revoked_at IS NULL").bind(Date.now(), body.grantId, auth.user.userId).run();
    if (!result.meta.changes) return secureJson({ error: "Active grant not found." }, 404);
    await writeAudit(auth.db, auth.user.userId, "grant.revoked", body.grantId);
    return secureJson({ status: "revoked" });
  }
  return secureJson({ error: "Invalid grant action." }, 400);
}
