import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getPanelDb, isBricklineAdmin } from "@/lib/panel-access";
import { isRateLimited, requireVerifiedRole, secureJson, validateMutationOrigin, writeAudit } from "@/lib/api-security";
import { decryptSensitive, encryptSensitive, fingerprintSensitive } from "@/lib/sensitive-data";
import type { ProjectStatus } from "@/lib/brickline-data";

export const dynamic = "force-dynamic";
const statuses: ProjectStatus[] = ["New construction", "Redevelopment", "Approval stage", "Construction started"];
type ProjectRow = { id: string; ownerUserId: string; name: string; area: string; country: string; siteAddress: string | null; currency: string; reraEncrypted: string | null; status: ProjectStatus; builder: string; value: number; homes: number; description: string; updatedAt: number };

export async function GET() {
  const user = await getChatGPTUser(); if (!user) return secureJson({ error: "Sign in is required." }, 401);
  const db = getPanelDb(); if (!db) return secureJson({ error: "Projects are unavailable." }, 503);
  const admin = isBricklineAdmin(user);
  if (!admin) {
    const access = await db.prepare("SELECT status, agent_access AS agent, builder_access AS builder, client_access AS client, consent_version AS consentVersion, consent_withdrawn_at AS consentWithdrawnAt FROM builder_access_requests WHERE user_id = ?").bind(user.userId).first<{ status: string; agent: number; builder: number; client: number; consentVersion: string; consentWithdrawnAt: number | null }>();
    if (!access || access.status !== "approved" || !(access.agent || access.builder || access.client)) return secureJson({ error: "Verified account required." }, 403);
    if (!access.consentVersion || access.consentWithdrawnAt) return secureJson({ error: "Privacy consent is required." }, 403);
  }
  const rows = await db.prepare("SELECT id, owner_user_id AS ownerUserId, name, area, country, site_address AS siteAddress, currency, rera_encrypted AS reraEncrypted, status, builder, value, homes, description, updated_at AS updatedAt FROM registered_projects ORDER BY updated_at DESC LIMIT 500").all<ProjectRow>();
  const projects = await Promise.all(rows.results.map(async row => ({ id: row.id, name: row.name, area: row.area, country: row.country, siteAddress: row.siteAddress || undefined, currency: row.currency, reraNumber: row.reraEncrypted && (admin || row.ownerUserId === user.userId) ? await decryptSensitive(row.reraEncrypted) : undefined, status: row.status, builder: row.builder, value: row.value, homes: row.homes, completion: "Not scheduled", confidence: 100, updated: "Registered", description: row.description, tags: ["Verified account submission"], coordinates: { x: 50, y: 50 } })));
  return secureJson({ projects });
}

export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request); if (invalid) return invalid;
  const auth = await requireVerifiedRole("Builder"); if ("response" in auth) return auth.response;
  if (await isRateLimited(auth.db, auth.user.userId, "project.registered", 24 * 60 * 60 * 1000, 50)) return secureJson({ error: "Daily project registration limit reached." }, 429);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const text = (key: string, max: number) => typeof body?.[key] === "string" ? String(body[key]).trim().slice(0, max) : "";
  const project = { name: text("name", 160), area: text("area", 120), country: text("country", 120), siteAddress: text("siteAddress", 240), currency: text("currency", 3).toUpperCase(), reraNumber: text("reraNumber", 80), status: text("status", 40) as ProjectStatus, builder: text("builder", 160), description: text("notes", 2000), value: Number(body?.value), homes: Number(body?.homes) };
  if (!project.name || !project.area || !project.country || !project.builder || !project.description || !/^[A-Z]{3}$/.test(project.currency) || !statuses.includes(project.status) || !Number.isFinite(project.value) || project.value < 0 || !Number.isInteger(project.homes) || project.homes < 0) return secureJson({ error: "Complete all project fields with valid values." }, 400);
  if (project.country.toLowerCase() === "india" && !project.reraNumber) return secureJson({ error: "RERA registration number is required for Indian projects." }, 400);
  if (project.reraNumber && !/^[A-Za-z0-9/._ -]{3,80}$/.test(project.reraNumber)) return secureJson({ error: "RERA number contains unsupported characters." }, 400);
  const id = crypto.randomUUID(); const now = Date.now(); const encrypted = project.reraNumber ? await encryptSensitive(project.reraNumber) : null;
  const fingerprint = project.reraNumber ? await fingerprintSensitive(project.reraNumber) : null;
  if (fingerprint) {
    const missing = await auth.db.prepare("SELECT id, rera_encrypted AS reraEncrypted FROM registered_projects WHERE rera_encrypted IS NOT NULL AND rera_fingerprint IS NULL LIMIT 500").all<{ id: string; reraEncrypted: string }>();
    for (const existing of missing.results) {
      const existingFingerprint = await fingerprintSensitive(await decryptSensitive(existing.reraEncrypted));
      await auth.db.prepare("UPDATE registered_projects SET rera_fingerprint = ? WHERE id = ? AND rera_fingerprint IS NULL").bind(existingFingerprint, existing.id).run();
    }
    const duplicate = await auth.db.prepare("SELECT id, owner_user_id AS ownerUserId FROM registered_projects WHERE rera_fingerprint = ? LIMIT 1").bind(fingerprint).first<{ id: string; ownerUserId: string }>();
    if (duplicate) { await writeAudit(auth.db, auth.user.userId, "fraud.duplicate_rera", duplicate.id, { differentOwner: duplicate.ownerUserId !== auth.user.userId }); return secureJson({ error: "This RERA number is already registered and has been flagged for admin review." }, 409); }
  }
  await auth.db.prepare("INSERT INTO registered_projects (id, owner_user_id, name, area, country, site_address, currency, rera_encrypted, rera_fingerprint, status, builder, value, homes, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(id, auth.user.userId, project.name, project.area, project.country, project.siteAddress || null, project.currency, encrypted, fingerprint, project.status, project.builder, project.value, project.homes, project.description, now, now).run();
  await writeAudit(auth.db, auth.user.userId, "project.registered", id, { country: project.country, status: project.status });
  return secureJson({ project: { id, ...project, siteAddress: project.siteAddress || undefined, reraNumber: project.reraNumber || undefined, completion: "Not scheduled", confidence: 100, updated: "Just registered", description: project.description, tags: ["Verified account submission"], coordinates: { x: 50, y: 50 } } }, 201);
}
