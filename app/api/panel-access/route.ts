import type { Role } from "@/lib/brickline-data";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getUserProfile } from "@/lib/panel-access";
import { isRateLimited, requireAdmin, secureJson, validateMutationOrigin, writeAudit } from "@/lib/api-security";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProfileRow } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic";
const roles: Role[] = ["Agent", "Builder", "Client"];
const validRera = (value: string) => /^[A-Za-z0-9/._ -]{3,80}$/.test(value);
const validGst = (value: string) => /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(value);

function present(row: ProfileRow) {
  return {
    userId: row.id,
    email: row.email,
    name: row.full_name,
    company: row.company_name,
    status: row.status === "rejected" ? "declined" : row.status,
    requestedRole: row.role,
    agentAccess: row.agent_access ? 1 : 0,
    builderAccess: row.builder_access ? 1 : 0,
    clientAccess: row.client_access ? 1 : 0,
    requestedAt: Date.parse(row.created_at),
    reviewedAt: row.reviewed_at ? Date.parse(row.reviewed_at) : null,
    businessAddress: row.business_address,
    contactPerson: row.contact_person,
    agencyName: row.agency_name,
    phone: row.phone,
    reraNumber: row.rera_number,
    gstNumber: row.gst_number,
    rejectionReason: row.rejection_reason,
    verifiedAt: row.verification_status === "rera-verified" && row.reviewed_at ? Date.parse(row.reviewed_at) : null,
    isDemo: false,
  };
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return secureJson({ error: "Sign in is required." }, 401);
  const profile = await getUserProfile(user);
  if (!profile) return secureJson({ isAdmin: false, request: null });
  if (!profile.is_admin) return secureJson({ isAdmin: false, request: present(profile) });
  const admin = createAdminClient();
  const { data, error } = await admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
  if (error) return secureJson({ error: "Accounts could not be loaded." }, 503);
  return secureJson({ isAdmin: true, requests: ((data || []) as ProfileRow[]).map(present) });
}

export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const user = await getChatGPTUser();
  if (!user) return secureJson({ error: "Sign in is required." }, 401);
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const field = (key: string, max: number) => typeof body?.[key] === "string" ? String(body[key]).trim().slice(0, max) : "";
  const role = field("role", 20) as Role;
  const company = field("company", 120);
  const name = field("name", 120) || user.displayName;
  const city = field("businessAddress", 120);
  const reraNumber = field("reraNumber", 80);
  const gstNumber = field("gstNumber", 15).toUpperCase();
  if (!roles.includes(role) || body?.consent !== true) return secureJson({ error: "Choose a profession and accept the Privacy Notice." }, 400);
  if (role !== "Client" && (!company || !city || !validRera(reraNumber) || !validGst(gstNumber))) return secureJson({ error: "Builders and Agents must provide company, city, valid RERA, and GST details." }, 400);
  if (await isRateLimited(user.userId, "access.requested", 3_600_000, 5)) return secureJson({ error: "Too many registration attempts. Try again later." }, 429);
  const admin = createAdminClient();
  const current = await getUserProfile(user);
  if (current && current.status !== "rejected") return secureJson({ error: current.status === "pending" ? "Your registration is already pending." : "Your access is managed by an admin." }, 409);
  const now = new Date().toISOString();
  const { error } = await admin.from("profiles").upsert({
    id: user.userId, email: user.email, full_name: name, role, status: "pending", company_name: company,
    city, rera_number: role === "Client" ? null : reraNumber, gst_number: role === "Client" ? null : gstNumber,
    agency_name: role === "Agent" ? company : null, business_address: city, contact_person: name,
    verification_status: "pending", rejection_reason: null, agent_access: false, builder_access: false, client_access: false,
    consent_version: "2026-09-23", consent_at: now, consent_withdrawn_at: null, updated_at: now,
  });
  if (error) return secureJson({ error: error.code === "23505" ? "This RERA or GST number is already attached to another account." : "Registration could not be saved." }, error.code === "23505" ? 409 : 503);
  await writeAudit(user.userId, "access.requested", user.userId, { role });
  return secureJson({ status: "pending", instant: false }, 201);
}

export async function PATCH(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = (await request.json().catch(() => null)) as { userId?: unknown; action?: unknown; panels?: unknown; reason?: unknown } | null;
  const userId = typeof body?.userId === "string" ? body.userId : "";
  const action = String(body?.action || "");
  if (!userId || !["approve", "decline", "suspend", "restore", "set-panels"].includes(action)) return secureJson({ error: "Invalid account action." }, 400);
  const { data: current } = await auth.admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!current) return secureJson({ error: "Account not found." }, 404);
  const now = new Date().toISOString();
  let changes: Record<string, unknown> = { reviewed_at: now, reviewed_by: auth.user.userId, updated_at: now };
  if (action === "approve") {
    if (current.status !== "pending") return secureJson({ error: "Only pending registrations can be approved." }, 409);
    changes = { ...changes, status: "approved", verification_status: "rera-verified", rejection_reason: null,
      agent_access: current.role === "Agent" || current.role === "Builder",
      builder_access: current.role === "Builder",
      client_access: current.role === "Client" || current.role === "Builder" };
  } else if (action === "decline") {
    const reason = typeof body?.reason === "string" ? body.reason.trim().slice(0, 500) : "";
    if (current.status !== "pending" || reason.length < 8) return secureJson({ error: "Enter a clear rejection reason of at least 8 characters." }, 400);
    changes = { ...changes, status: "rejected", verification_status: "unverified", rejection_reason: reason, agent_access: false, builder_access: false, client_access: false };
  } else if (action === "suspend") {
    changes = { ...changes, status: "suspended" };
  } else if (action === "restore") {
    changes = { ...changes, status: "approved" };
  } else {
    const panels = body?.panels as Record<Role, unknown> | null;
    if (!panels || typeof panels.Agent !== "boolean" || typeof panels.Builder !== "boolean" || typeof panels.Client !== "boolean") return secureJson({ error: "Choose access for all three panels." }, 400);
    changes = { ...changes, agent_access: panels.Agent, builder_access: panels.Builder, client_access: panels.Client };
  }
  const { data, error } = await auth.admin.from("profiles").update(changes).eq("id", userId).select("*").single();
  if (error || !data) return secureJson({ error: "This account changed; refresh and try again." }, 409);
  if (action === "approve" && data.role === "Builder") await auth.admin.from("builders").upsert({ profile_id: userId, name: data.company_name || data.full_name, verification_status: "rera-verified", locality: data.city, city: data.city }, { onConflict: "profile_id" });
  await writeAudit(auth.user.userId, `admin.${action}`, userId, action === "decline" ? { reason: body?.reason } : {});
  return secureJson({ account: present(data as ProfileRow) });
}
