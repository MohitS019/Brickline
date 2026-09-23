import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getPanelDb, isBricklineAdmin } from "@/lib/panel-access";
import { secureJson, validateMutationOrigin, writeAudit } from "@/lib/api-security";

export const dynamic = "force-dynamic";
export const PRIVACY_VERSION = "2026-09-23";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return secureJson({ error: "Sign in is required." }, 401);
  const db = getPanelDb();
  if (!db) return secureJson({ error: "Privacy service is unavailable." }, 503);
  if (isBricklineAdmin(user)) {
    const rows = await db.prepare("SELECT id, user_id AS userId, email, request_type AS requestType, details, status, created_at AS createdAt, resolved_at AS resolvedAt FROM privacy_requests ORDER BY created_at DESC LIMIT 200").all();
    return secureJson({ requests: rows.results });
  }
  const rows = await db.prepare("SELECT id, request_type AS requestType, details, status, created_at AS createdAt, resolved_at AS resolvedAt FROM privacy_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").bind(user.userId).all();
  return secureJson({ requests: rows.results });
}

export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request); if (invalid) return invalid;
  const user = await getChatGPTUser();
  if (!user) return secureJson({ error: "Sign in is required." }, 401);
  const db = getPanelDb();
  if (!db) return secureJson({ error: "Privacy service is unavailable." }, 503);
  const body = await request.json().catch(() => null) as { action?: unknown; details?: unknown } | null;
  const action = String(body?.action || "");
  const now = Date.now();
  if (action === "consent") {
    const result = await db.prepare("UPDATE builder_access_requests SET consent_version = ?, consent_at = ?, consent_withdrawn_at = NULL WHERE user_id = ?").bind(PRIVACY_VERSION, now, user.userId).run();
    if (!result.meta.changes) return secureJson({ error: "Request panel access before recording consent." }, 404);
    await writeAudit(db, user.userId, "privacy.consent", user.userId, { version: PRIVACY_VERSION });
    return secureJson({ status: "accepted", version: PRIVACY_VERSION });
  }
  if (action === "withdraw-consent") {
    await db.prepare("UPDATE builder_access_requests SET consent_withdrawn_at = ? WHERE user_id = ?").bind(now, user.userId).run();
    await writeAudit(db, user.userId, "privacy.consent_withdrawn", user.userId, { version: PRIVACY_VERSION });
    return secureJson({ status: "withdrawn" });
  }
  if (!["deletion", "correction", "export"].includes(action)) return secureJson({ error: "Choose a valid privacy request." }, 400);
  const details = typeof body?.details === "string" ? body.details.trim().slice(0, 1000) : "";
  const existing = await db.prepare("SELECT id FROM privacy_requests WHERE user_id = ? AND request_type = ? AND status = 'pending'").bind(user.userId, action).first();
  if (existing) return secureJson({ error: "A request of this type is already pending." }, 409);
  const id = crypto.randomUUID();
  await db.prepare("INSERT INTO privacy_requests (id, user_id, email, request_type, details, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)").bind(id, user.userId, user.email, action, details, now).run();
  if (action === "deletion") await db.prepare("UPDATE builder_access_requests SET deletion_requested_at = ? WHERE user_id = ?").bind(now, user.userId).run();
  await writeAudit(db, user.userId, `privacy.${action}_requested`, id);
  return secureJson({ request: { id, requestType: action, details, status: "pending", createdAt: now } }, 201);
}

export async function PATCH(request: Request) {
  const invalid = validateMutationOrigin(request); if (invalid) return invalid;
  const user = await getChatGPTUser();
  if (!user || !isBricklineAdmin(user)) return secureJson({ error: "Admin permission is required." }, 403);
  const db = getPanelDb(); if (!db) return secureJson({ error: "Privacy service is unavailable." }, 503);
  const body = await request.json().catch(() => null) as { id?: unknown; status?: unknown } | null;
  if (typeof body?.id !== "string" || !["completed", "rejected"].includes(String(body?.status))) return secureJson({ error: "Choose a valid privacy request and outcome." }, 400);
  const result = await db.prepare("UPDATE privacy_requests SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ? AND status = 'pending'").bind(body.status, Date.now(), user.userId, body.id).run();
  if (!result.meta.changes) return secureJson({ error: "Pending privacy request not found." }, 404);
  await writeAudit(db, user.userId, `privacy.${body.status}`, body.id);
  return secureJson({ status: body.status });
}
