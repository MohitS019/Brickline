import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getPanelDb, isBricklineAdmin } from "@/lib/panel-access";
import { getPanelContent, type PanelCopy } from "@/lib/panel-content";
import type { Role } from "@/lib/brickline-data";
import { validateMutationOrigin, writeAudit } from "@/lib/api-security";

export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in is required." }, 401);
  return json({ content: await getPanelContent() });
}

export async function PATCH(request: Request) {
  const invalid = validateMutationOrigin(request); if (invalid) return invalid;
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in is required." }, 401);
  if (!isBricklineAdmin(user)) return json({ error: "Admin permission is required." }, 403);
  const db = getPanelDb();
  if (!db) return json({ error: "Content storage is unavailable." }, 503);
  const body = await request.json().catch(() => null) as (Partial<PanelCopy> & { role?: Role }) | null;
  if (!body || !["Agent", "Builder", "Client"].includes(body.role || "") ||
    typeof body.headline !== "string" || typeof body.accent !== "string" || typeof body.description !== "string") return json({ error: "Complete all three content fields." }, 400);
  const content = { headline: body.headline.trim(), accent: body.accent.trim(), description: body.description.trim() };
  if (!content.headline || !content.accent || !content.description || content.headline.length > 120 || content.accent.length > 120 || content.description.length > 1000) return json({ error: "Use a headline and accent under 120 characters and description under 1,000 characters." }, 400);
  try {
    await db.prepare("INSERT INTO panel_content (role, headline, accent, description, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(role) DO UPDATE SET headline = excluded.headline, accent = excluded.accent, description = excluded.description, updated_at = excluded.updated_at, updated_by = excluded.updated_by")
      .bind(body.role, content.headline, content.accent, content.description, Date.now(), user.userId).run();
    await writeAudit(db, user.userId, "content.updated", body.role || null);
    return json({ role: body.role, content });
  } catch { return json({ error: "Content could not be saved. Please try again." }, 503); }
}
