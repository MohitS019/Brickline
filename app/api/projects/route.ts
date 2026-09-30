import { getChatGPTUser } from "@/app/chatgpt-auth";
import { geocodeIndiaProject } from "@/lib/geocoding";
import type { ProjectStatus } from "@/lib/brickline-data";
import { isRateLimited, requireVerifiedRole, secureJson, validateMutationOrigin, writeAudit } from "@/lib/api-security";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { mapProject, type ProjectWithBuilder } from "@/lib/supabase/mappers";
import { projectSelect } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const statuses: ProjectStatus[] = ["New construction", "Redevelopment", "Approval stage", "Construction started"];

export async function GET() {
  if (!getSupabasePublicConfig()) return secureJson({ projects: [] });
  const user = await getChatGPTUser();
  const supabase = await createClient();
  const { data, error } = await supabase.from("projects").select(projectSelect).order("updated_at", { ascending: false }).limit(500);
  if (error) return secureJson({ error: "Projects could not be loaded." }, 503);
  return secureJson({ projects: ((data || []) as unknown as ProjectWithBuilder[]).map((row) => mapProject(row, user?.userId)) });
}

export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const auth = await requireVerifiedRole("Builder");
  if ("response" in auth) return auth.response;
  if (await isRateLimited(auth.user.userId, "project.registered", 86_400_000, 50)) return secureJson({ error: "Daily project registration limit reached." }, 429);

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const field = (key: string, max: number) => typeof body?.[key] === "string" ? String(body[key]).trim().slice(0, max) : "";
  const project = {
    name: field("name", 160), area: field("area", 120), country: field("country", 120), siteAddress: field("siteAddress", 240),
    currency: field("currency", 3).toUpperCase(), reraNumber: field("reraNumber", 80), status: field("status", 40) as ProjectStatus,
    builder: field("builder", 160), description: field("notes", 2000), value: Number(body?.value), homes: Number(body?.homes),
  };
  if (!project.name || !project.area || project.country.toLowerCase() !== "india" || !project.description || !/^[A-Z]{3}$/.test(project.currency) || !statuses.includes(project.status) || !Number.isFinite(project.value) || project.value < 0 || !Number.isInteger(project.homes) || project.homes < 0) return secureJson({ error: "Brickline's MVP accepts valid India project records only." }, 400);
  if (!/^[A-Za-z0-9/._ -]{3,80}$/.test(project.reraNumber)) return secureJson({ error: "RERA registration number is required for every project." }, 400);

  const admin = createAdminClient();
  const { data: duplicate } = await admin.from("projects").select("id").eq("rera_number", project.reraNumber).maybeSingle();
  if (duplicate) {
    await writeAudit(auth.user.userId, "fraud.duplicate_rera", duplicate.id);
    return secureJson({ error: "This RERA number is already registered and has been flagged for admin review." }, 409);
  }
  let { data: builder } = await admin.from("builders").select("id,name,profile_id,verification_status").eq("profile_id", auth.user.userId).maybeSingle();
  if (!builder) {
    const created = await admin.from("builders").insert({ profile_id: auth.user.userId, name: project.builder || auth.profile.company_name, locality: project.area, city: auth.profile.city, verification_status: auth.profile.verification_status }).select("id,name,profile_id,verification_status").single();
    if (created.error) return secureJson({ error: "Builder profile could not be created." }, 503);
    builder = created.data;
  }
  const location = await geocodeIndiaProject(project.siteAddress ? `${project.siteAddress}, ${project.area}` : project.area);
  const locality = project.area.split(",")[0]?.trim() || project.area;
  const city = project.area.split(",").slice(1).join(",").trim() || auth.profile.city;
  const { data, error } = await admin.from("projects").insert({
    name: project.name, builder_id: builder.id, locality, city, country: "India", site_address: project.siteAddress || null,
    currency: project.currency, rera_number: project.reraNumber, status: project.status, est_value: project.value, homes: project.homes,
    completion_date: "Not scheduled", description: project.description, latitude: location?.latitude ?? null, longitude: location?.longitude ?? null,
    published: false, verification_status: auth.profile.verification_status, is_demo_record: false,
  }).select(projectSelect).single();
  if (error || !data) return secureJson({ error: "Project could not be registered." }, 503);
  await writeAudit(auth.user.userId, "project.registered", data.id, { status: project.status });
  return secureJson({ project: mapProject(data as unknown as ProjectWithBuilder, auth.user.userId) }, 201);
}

export async function PATCH(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = typeof body?.action === "string" ? body.action : "";
  const projectId = typeof body?.projectId === "string" ? body.projectId : "";
  if (!projectId) return secureJson({ error: "Valid project required." }, 400);

  if (action === "view") {
    const user = await getChatGPTUser();
    if (!user) return secureJson({ error: "Sign in is required." }, 401);
    const admin = createAdminClient();
    const { data } = await admin.from("projects").select("view_count,builder_id,builders(profile_id)").eq("id", projectId).eq("published", true).maybeSingle();
    const ownerId = (data?.builders as unknown as { profile_id?: string } | null)?.profile_id;
    if (data && ownerId !== user.userId) await admin.from("projects").update({ view_count: Number(data.view_count || 0) + 1 }).eq("id", projectId);
    return secureJson({ status: "recorded" });
  }

  const auth = await requireVerifiedRole("Builder");
  if ("response" in auth) return auth.response;
  const admin = createAdminClient();
  const { data: owned } = await admin.from("projects").select("id,site_address,builder_id,builders!inner(profile_id)").eq("id", projectId).eq("builders.profile_id", auth.user.userId).maybeSingle();
  if (!owned) return secureJson({ error: "Project not found in your Builder account." }, 404);

  if (action === "publish") {
    const published = body?.published === true;
    await admin.from("projects").update({ published, updated_at: new Date().toISOString() }).eq("id", projectId);
    await writeAudit(auth.user.userId, published ? "project.published" : "project.unpublished", projectId);
    return secureJson({ projectId, published });
  }
  if (action === "edit") {
    const name = typeof body?.name === "string" ? body.name.trim().slice(0, 160) : "";
    const area = typeof body?.area === "string" ? body.area.trim().slice(0, 120) : "";
    const status = typeof body?.status === "string" ? body.status as ProjectStatus : "" as ProjectStatus;
    const description = typeof body?.description === "string" ? body.description.trim().slice(0, 2000) : "";
    if (!name || !area || !description || !statuses.includes(status)) return secureJson({ error: "Enter a valid project name, locality, status, and description." }, 400);
    const location = await geocodeIndiaProject(owned.site_address ? `${owned.site_address}, ${area}` : area);
    const locality = area.split(",")[0]?.trim() || area;
    const city = area.split(",").slice(1).join(",").trim() || auth.profile.city;
    await admin.from("projects").update({ name, locality, city, status, description, latitude: location?.latitude, longitude: location?.longitude, updated_at: new Date().toISOString() }).eq("id", projectId);
    await writeAudit(auth.user.userId, "project.edited", projectId, { status, area });
    return secureJson({ projectId, name, area, status, description, coordinates: location || undefined });
  }
  return secureJson({ error: "Invalid project action." }, 400);
}
