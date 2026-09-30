import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserProfile } from "@/lib/panel-access";
import { isRateLimited, requireVerifiedRole, secureJson, validateMutationOrigin, writeAudit } from "@/lib/api-security";
import { createGrantToken, verifyGrantToken } from "@/lib/grant-token";
import { fingerprintSensitive } from "@/lib/sensitive-data";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const allowedMinutes = [15, 30, 60, 120];
const deviceLabel = (userAgent: string) => `${/Mobile|Android|iPhone/i.test(userAgent) ? "Mobile" : "Desktop"} · ${/Edg\//.test(userAgent) ? "Edge" : /Chrome\//.test(userAgent) ? "Chrome" : /Safari\//.test(userAgent) ? "Safari" : /Firefox\//.test(userAgent) ? "Firefox" : "Browser"}`;

async function recordExpired() {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { data } = await admin.from("introductions").select("id,agent_id").lt("expires_at", now).is("revoked_at", null).is("expiry_logged_at", null).limit(100);
  for (const row of data || []) {
    await admin.from("introductions").update({ expiry_logged_at: now }).eq("id", row.id).is("expiry_logged_at", null);
    await writeAudit(row.agent_id, "grant.expired", row.id);
  }
}

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return secureJson({ error: "Sign in is required." }, 401);
  const profile = await getUserProfile(user);
  if (!profile || profile.status !== "approved") return secureJson({ error: "Verified account required." }, 403);
  await recordExpired();
  const admin = createAdminClient();
  const mode = new URL(request.url).searchParams.get("mode");
  if (mode === "client" || (!profile.agent_access && profile.client_access)) {
    if (!profile.client_access && !profile.is_admin) return secureJson({ error: "Client access required." }, 403);
    const { data, error } = await admin.from("introductions").select("*, builders(name), projects(name), profiles!introductions_agent_id_fkey(full_name)").eq("client_id", user.userId).order("created_at", { ascending: false }).limit(100);
    if (error) return secureJson({ error: "Could not load introductions." }, 503);
    const grants = await Promise.all((data || []).map(async (row) => {
      const builder = row.builders as unknown as { name?: string } | null;
      const project = row.projects as unknown as { name?: string } | null;
      const agent = row.profiles as unknown as { full_name?: string } | null;
      const expiresAt = Date.parse(row.expires_at);
      return {
        id: row.id, builderProfileId: builder?.name || "Builder profile", projectId: row.project_id, projectName: project?.name || "Builder profile access",
        expiresAt, createdAt: Date.parse(row.created_at), firstOpenedAt: row.opened_at ? Date.parse(row.opened_at) : null,
        revokedAt: row.revoked_at ? Date.parse(row.revoked_at) : null, openCount: row.open_count, agentName: agent?.full_name || "Brickline agent",
        token: !row.revoked_at && expiresAt > Date.now() && row.project_id ? await createGrantToken({ jti: row.id, sub: user.userId, aid: row.agent_id, bid: row.builder_id, pid: row.project_id, exp: Math.floor(expiresAt / 1000) }) : undefined,
      };
    }));
    return secureJson({ mode: "client", grants });
  }
  if (!profile.agent_access && !profile.is_admin) return secureJson({ error: "Agent access required." }, 403);
  const { data, error } = await admin.from("introductions").select("*, builders(name), projects(name), profiles!introductions_client_id_fkey(email)").eq("agent_id", user.userId).order("created_at", { ascending: false }).limit(100);
  if (error) return secureJson({ error: "Could not load introductions." }, 503);
  return secureJson({ mode: "agent", grants: (data || []).map((row) => ({
    id: row.id, clientEmail: (row.profiles as unknown as { email?: string } | null)?.email || "Client",
    builderProfileId: (row.builders as unknown as { name?: string } | null)?.name || "Builder profile", projectId: row.project_id,
    projectName: (row.projects as unknown as { name?: string } | null)?.name || "Builder profile access",
    expiresAt: Date.parse(row.expires_at), createdAt: Date.parse(row.created_at), firstOpenedAt: row.opened_at ? Date.parse(row.opened_at) : null,
    revokedAt: row.revoked_at ? Date.parse(row.revoked_at) : null, openCount: row.open_count,
    lastOpenedAt: row.last_opened_at ? Date.parse(row.last_opened_at) : null, lastCountry: row.last_country, deviceLabel: row.device_label,
  })) });
}

export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const auth = await requireVerifiedRole("Agent");
  if ("response" in auth) return auth.response;
  const body = (await request.json().catch(() => null)) as { clientEmail?: unknown; builderProfileId?: unknown; projectId?: unknown; minutes?: unknown } | null;
  const clientEmail = typeof body?.clientEmail === "string" ? body.clientEmail.trim().toLowerCase() : "";
  const builderName = typeof body?.builderProfileId === "string" ? body.builderProfileId.trim() : "";
  const projectId = typeof body?.projectId === "string" ? body.projectId.trim() : "";
  const minutes = Number(body?.minutes);
  if (!/^\S+@\S+\.\S+$/.test(clientEmail) || !builderName || !projectId || !allowedMinutes.includes(minutes)) return secureJson({ error: "Choose a verified client, builder, and valid access duration." }, 400);
  if (await isRateLimited(auth.user.userId, "grant.created", 3_600_000, 20)) return secureJson({ error: "Grant limit reached. Try again later." }, 429);
  const admin = createAdminClient();
  const { data: client } = await admin.from("profiles").select("id").ilike("email", clientEmail).eq("status", "approved").eq("client_access", true).maybeSingle();
  if (!client) return secureJson({ error: "That client must have an approved Client account first." }, 404);
  const { data: builder } = await admin.from("builders").select("id,name").eq("name", builderName).maybeSingle();
  if (!builder) return secureJson({ error: "Choose a verified builder." }, 404);
  const { data: project } = await admin.from("projects").select("id,name,builder_id").eq("id", projectId).eq("builder_id", builder.id).eq("published", true).maybeSingle();
  if (!project) return secureJson({ error: "Choose a published project from that builder." }, 404);
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + minutes * 60_000);
  const { data: grant, error } = await admin.from("introductions").insert({ agent_id: auth.user.userId, client_id: client.id, builder_id: builder.id, project_id: project.id, duration_minutes: minutes, created_at: createdAt.toISOString(), expires_at: expiresAt.toISOString() }).select("id").single();
  if (error || !grant) return secureJson({ error: "Introduction could not be created." }, 503);
  await writeAudit(auth.user.userId, "grant.created", grant.id, { clientId: client.id, builderId: builder.id, projectId, expiresAt: expiresAt.toISOString() });
  const token = await createGrantToken({ jti: grant.id, sub: client.id, aid: auth.user.userId, bid: builder.id, pid: project.id, exp: Math.floor(expiresAt.getTime() / 1000) });
  return secureJson({ grant: { id: grant.id, clientEmail, builderProfileId: builder.name, projectId, projectName: project.name, expiresAt: expiresAt.getTime(), createdAt: createdAt.getTime() }, token }, 201);
}

export async function PATCH(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const user = await getChatGPTUser();
  if (!user) return secureJson({ error: "Sign in is required." }, 401);
  const body = (await request.json().catch(() => null)) as { action?: unknown; token?: unknown; grantId?: unknown } | null;
  const admin = createAdminClient();
  if ((body?.action === "open" || body?.action === "validate") && typeof body.token === "string") {
    const claims = await verifyGrantToken(body.token);
    if (!claims) return secureJson({ error: "This secure link is invalid.", code: "invalid" }, 403);
    if (claims.sub !== user.userId) return secureJson({ error: "This introduction belongs to a different client account.", code: "account" }, 403);
    const { data: grant } = await admin.from("introductions").select("*, builders(name), projects(name), profiles!introductions_agent_id_fkey(full_name)").eq("id", claims.jti).eq("client_id", user.userId).eq("agent_id", claims.aid).maybeSingle();
    if (!grant || grant.builder_id !== claims.bid || grant.project_id !== claims.pid) return secureJson({ error: "This secure link is invalid.", code: "invalid" }, 403);
    if (grant.revoked_at) return secureJson({ error: "This introduction was revoked by the agent.", code: "revoked" }, 403);
    if (Date.parse(grant.expires_at) <= Date.now() || claims.exp * 1000 <= Date.now()) return secureJson({ error: "This introduction has expired.", code: "expired" }, 403);
    if (body.action === "open" && grant.open_count >= 5) return secureJson({ error: "This secure link has reached its five-open limit." }, 429);
    const userAgent = request.headers.get("user-agent") || "unknown-browser";
    const language = request.headers.get("accept-language") || "unknown-language";
    const deviceHash = await fingerprintSensitive(`${userAgent}|${language}`);
    const country = (request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || "").slice(0, 2).toUpperCase() || null;
    if (grant.bound_device_hash && grant.bound_device_hash !== deviceHash) return secureJson({ error: "This link is bound to another device. Ask the agent for a new link." }, 403);
    if (grant.last_country && country && grant.last_country !== country) return secureJson({ error: "Location changed. Re-verification is required through your agent." }, 403);
    if (body.action === "open") {
      const openedAt = new Date().toISOString();
      await admin.from("introductions").update({ opened_at: grant.opened_at || openedAt, last_opened_at: openedAt, open_count: grant.open_count + 1, bound_device_hash: grant.bound_device_hash || deviceHash, last_country: grant.last_country || country, device_label: grant.device_label || deviceLabel(userAgent) }).eq("id", grant.id).lt("open_count", 5);
      await writeAudit(user.userId, "grant.opened", grant.id, { projectId: grant.project_id, openNumber: grant.open_count + 1, country });
    }
    return secureJson({ grant: { id: grant.id, builderProfileId: (grant.builders as unknown as { name?: string } | null)?.name || "Builder profile", projectId: grant.project_id, projectName: (grant.projects as unknown as { name?: string } | null)?.name || "Builder profile access", expiresAt: Date.parse(grant.expires_at), openCount: grant.open_count + (body.action === "open" ? 1 : 0), agentName: (grant.profiles as unknown as { full_name?: string } | null)?.full_name || "Brickline agent" } });
  }
  if (body?.action === "revoke" && typeof body.grantId === "string") {
    const auth = await requireVerifiedRole("Agent");
    if ("response" in auth) return auth.response;
    const now = new Date().toISOString();
    const { data } = await admin.from("introductions").update({ revoked_at: now }).eq("id", body.grantId).eq("agent_id", auth.user.userId).is("revoked_at", null).gt("expires_at", now).select("id").maybeSingle();
    if (!data) return secureJson({ error: "Active grant not found." }, 404);
    await writeAudit(auth.user.userId, "grant.revoked", body.grantId);
    return secureJson({ status: "revoked" });
  }
  return secureJson({ error: "Invalid grant action." }, 400);
}
