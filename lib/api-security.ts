import "server-only";
import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import type { Role } from "@/lib/brickline-data";
import { getUserProfile, isVerifiedOwner } from "@/lib/panel-access";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export const secureJson = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

export function validateMutationOrigin(request: Request): Response | null {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return secureJson({ error: "Cross-site request blocked." }, 403);
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return secureJson({ error: "Cross-site request blocked." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return secureJson({ error: "JSON request required." }, 415);
  return null;
}

export async function requireVerifiedRole(role: Role): Promise<
  | { user: ChatGPTUser; profile: ProfileRow; supabase: Awaited<ReturnType<typeof createClient>> }
  | { response: Response }
> {
  const user = await getChatGPTUser();
  if (!user) return { response: secureJson({ error: "Sign in is required." }, 401) };
  const profile = await getUserProfile(user);
  if (!profile || profile.status !== "approved") return { response: secureJson({ error: `${role} verification is required.` }, 403) };
  const roleAllowed = profile.is_admin || (role === "Agent" ? profile.agent_access : role === "Builder" ? profile.builder_access : profile.client_access);
  if (!roleAllowed) return { response: secureJson({ error: `${role} verification is required.` }, 403) };
  if (!profile.consent_at || profile.consent_withdrawn_at) return { response: secureJson({ error: "Privacy consent is required before using this panel." }, 403) };
  return { user, profile, supabase: await createClient() };
}

export async function requireAdmin() {
  const user = await getChatGPTUser();
  if (!user) return { response: secureJson({ error: "Sign in is required." }, 401) } as const;
  const profile = await getUserProfile(user);
  if (!profile || (!profile.is_admin && !isVerifiedOwner(user))) return { response: secureJson({ error: "Admin permission is required." }, 403) } as const;
  return { user, profile, admin: createAdminClient() } as const;
}

export async function writeAudit(actorUserId: string | null, eventType: string, targetId: string | null, metadata: Record<string, unknown> = {}) {
  const admin = createAdminClient();
  await admin.from("audit_events").insert({ actor_id: actorUserId, event_type: eventType, target_id: targetId, metadata });
}

export async function isRateLimited(actorUserId: string, eventType: string, windowMs: number, maxEvents: number) {
  const admin = createAdminClient();
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count } = await admin.from("audit_events").select("id", { count: "exact", head: true }).eq("actor_id", actorUserId).eq("event_type", eventType).gte("created_at", since);
  return Number(count || 0) >= maxEvents;
}
