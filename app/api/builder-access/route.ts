import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getBuilderDb, isBricklineAdmin } from "@/lib/builder-access";

export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in is required." }, 401);
  const db = getBuilderDb();
  if (!db) return json({ error: "Builder access is temporarily unavailable." }, 503);
  try {
    if (isBricklineAdmin(user)) {
      const rows = await db.prepare("SELECT user_id AS userId, email, name, company, status, requested_at AS requestedAt, reviewed_at AS reviewedAt FROM builder_access_requests ORDER BY requested_at DESC LIMIT 100").all();
      return json({ isAdmin: true, requests: rows.results });
    }
    const row = await db.prepare("SELECT status, company, requested_at AS requestedAt, reviewed_at AS reviewedAt FROM builder_access_requests WHERE user_id = ?")
      .bind(user.userId).first();
    return json({ isAdmin: false, request: row ?? null });
  } catch {
    return json({ error: "Builder access could not be loaded." }, 503);
  }
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in is required." }, 401);
  if (isBricklineAdmin(user)) return json({ error: "Admin access is already granted." }, 409);
  const db = getBuilderDb();
  if (!db) return json({ error: "Builder access is temporarily unavailable." }, 503);
  const body = await request.json().catch(() => null) as { company?: unknown } | null;
  const company = typeof body?.company === "string" ? body.company.trim() : "";
  if (company.length < 2 || company.length > 120) return json({ error: "Enter a company name (2–120 characters)." }, 400);
  try {
    const existing = await db.prepare("SELECT status FROM builder_access_requests WHERE user_id = ?").bind(user.userId).first<{ status: string }>();
    if (existing?.status === "approved") return json({ error: "Access is already approved." }, 409);
    await db.prepare("INSERT INTO builder_access_requests (user_id, email, name, company, status, requested_at, reviewed_at, reviewed_by) VALUES (?, ?, ?, ?, 'pending', ?, NULL, NULL) ON CONFLICT(user_id) DO UPDATE SET email = excluded.email, name = excluded.name, company = excluded.company, status = 'pending', requested_at = excluded.requested_at, reviewed_at = NULL, reviewed_by = NULL")
      .bind(user.userId, user.email, user.displayName, company, Date.now()).run();
    return json({ status: "pending" }, 201);
  } catch {
    return json({ error: "Request could not be saved. Please try again." }, 503);
  }
}

export async function PATCH(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in is required." }, 401);
  if (!isBricklineAdmin(user)) return json({ error: "Admin permission is required." }, 403);
  const db = getBuilderDb();
  if (!db) return json({ error: "Builder access is temporarily unavailable." }, 503);
  const body = await request.json().catch(() => null) as { userId?: unknown; status?: unknown } | null;
  if (typeof body?.userId !== "string" || body.userId.length > 200 || !["approved", "declined"].includes(String(body.status))) return json({ error: "Invalid review decision." }, 400);
  try {
    const result = await db.prepare("UPDATE builder_access_requests SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE user_id = ? AND status = 'pending'")
      .bind(body.status, Date.now(), user.userId, body.userId).run();
    if (!result.meta.changes) return json({ error: "This request is no longer pending." }, 409);
    return json({ status: body.status });
  } catch {
    return json({ error: "Review could not be saved. Please try again." }, 503);
  }
}
