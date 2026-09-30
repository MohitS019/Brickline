import type { Role } from "@/lib/brickline-data";
import { getPanelContent, type PanelCopy } from "@/lib/panel-content";
import { requireAdmin, secureJson, validateMutationOrigin, writeAudit } from "@/lib/api-security";

export async function GET() {
  return secureJson({ content: await getPanelContent() });
}
export async function PATCH(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null) as (Partial<PanelCopy> & { role?: Role }) | null;
  if (!body || !["Agent", "Builder", "Client"].includes(body.role || "") || typeof body.headline !== "string" || typeof body.accent !== "string" || typeof body.description !== "string") return secureJson({ error: "Complete all three content fields." }, 400);
  const content = { headline: body.headline.trim(), accent: body.accent.trim(), description: body.description.trim() };
  if (!content.headline || !content.accent || !content.description || content.headline.length > 120 || content.accent.length > 120 || content.description.length > 1000) return secureJson({ error: "Use a headline and accent under 120 characters and description under 1,000 characters." }, 400);
  const { error } = await auth.admin.from("panel_content").upsert({ role: body.role, ...content, updated_at: new Date().toISOString(), updated_by: auth.user.userId });
  if (error) return secureJson({ error: "Content could not be saved. Please try again." }, 503);
  await writeAudit(auth.user.userId, "content.updated", body.role || null);
  return secureJson({ role: body.role, content });
}
