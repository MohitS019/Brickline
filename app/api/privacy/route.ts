import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserProfile } from "@/lib/panel-access";
import { requireAdmin, secureJson, validateMutationOrigin, writeAudit } from "@/lib/api-security";
import { createAdminClient } from "@/lib/supabase/admin";

export const PRIVACY_VERSION = "2026-09-23";

const present = (row: Record<string, unknown>) => ({ id: row.id, userId: row.user_id, email: (row.profiles as { email?: string } | null)?.email, requestType: row.request_type, details: row.details, status: row.status, createdAt: Date.parse(String(row.requested_at)), resolvedAt: row.completed_at ? Date.parse(String(row.completed_at)) : null });

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return secureJson({ error: "Sign in is required." }, 401);
  const profile = await getUserProfile(user);
  const admin = createAdminClient();
  let query = admin.from("privacy_requests").select("*, profiles(email)").order("requested_at", { ascending: false }).limit(profile?.is_admin ? 200 : 50);
  if (!profile?.is_admin) query = query.eq("user_id", user.userId);
  const { data, error } = await query;
  if (error) return secureJson({ error: "Privacy requests could not be loaded." }, 503);
  return secureJson({ requests: (data || []).map((row) => present(row as unknown as Record<string, unknown>)) });
}
export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const user = await getChatGPTUser();
  if (!user) return secureJson({ error: "Sign in is required." }, 401);
  const body = await request.json().catch(() => null) as { action?: unknown; details?: unknown } | null;
  const action = String(body?.action || "");
  const admin = createAdminClient();
  const now = new Date().toISOString();
  if (action === "consent" || action === "withdraw-consent") {
    const changes = action === "consent" ? { consent_version: PRIVACY_VERSION, consent_at: now, consent_withdrawn_at: null } : { consent_withdrawn_at: now };
    const { data } = await admin.from("profiles").update(changes).eq("id", user.userId).select("id").maybeSingle();
    if (!data) return secureJson({ error: "Request panel access before recording consent." }, 404);
    await writeAudit(user.userId, action === "consent" ? "privacy.consent" : "privacy.consent_withdrawn", user.userId, { version: PRIVACY_VERSION });
    return secureJson({ status: action === "consent" ? "accepted" : "withdrawn", version: PRIVACY_VERSION });
  }
  if (!["deletion", "correction", "export"].includes(action)) return secureJson({ error: "Choose a valid privacy request." }, 400);
  const details = typeof body?.details === "string" ? body.details.trim().slice(0, 1000) : "";
  const { data: existing } = await admin.from("privacy_requests").select("id").eq("user_id", user.userId).eq("request_type", action).eq("status", "pending").maybeSingle();
  if (existing) return secureJson({ error: "A request of this type is already pending." }, 409);
  const { data, error } = await admin.from("privacy_requests").insert({ user_id: user.userId, request_type: action, details }).select("*").single();
  if (error || !data) return secureJson({ error: "Privacy request could not be saved." }, 503);
  if (action === "deletion") await admin.from("profiles").update({ deletion_requested_at: now }).eq("id", user.userId);
  await writeAudit(user.userId, `privacy.${action}_requested`, data.id);
  return secureJson({ request: present(data as unknown as Record<string, unknown>) }, 201);
}
export async function PATCH(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = await request.json().catch(() => null) as { id?: unknown; status?: unknown } | null;
  if (typeof body?.id !== "string" || !["completed", "rejected"].includes(String(body.status))) return secureJson({ error: "Choose a valid privacy request and outcome." }, 400);
  const { data } = await auth.admin.from("privacy_requests").update({ status: body.status, completed_at: new Date().toISOString(), completed_by: auth.user.userId }).eq("id", body.id).eq("status", "pending").select("id").maybeSingle();
  if (!data) return secureJson({ error: "Pending privacy request not found." }, 404);
  await writeAudit(auth.user.userId, `privacy.${body.status}`, body.id);
  return secureJson({ status: body.status });
}
