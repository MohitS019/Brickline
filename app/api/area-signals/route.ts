import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getPanelDb, isBricklineAdmin } from "@/lib/panel-access";
import { requireVerifiedRole, secureJson, validateMutationOrigin, writeAudit } from "@/lib/api-security";
import type { ProjectStatus } from "@/lib/brickline-data";

const categories: ProjectStatus[] = ["New construction", "Redevelopment", "Approval stage", "Construction started"];

export async function GET() {
  const auth = await requireVerifiedRole("Agent"); if ("response" in auth) return auth.response;
  const rows = await auth.db.prepare("SELECT id,title,area,state,category,detail,source_note AS sourceNote,event_date AS eventDate,created_at AS createdAt FROM area_signals ORDER BY event_date DESC, created_at DESC LIMIT 300").all();
  return secureJson({ signals: rows.results });
}

export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request); if (invalid) return invalid;
  const user = await getChatGPTUser(); if (!user || !isBricklineAdmin(user)) return secureJson({ error: "Admin permission is required." }, 403);
  const db = getPanelDb(); if (!db) return secureJson({ error: "Signal storage is unavailable." }, 503);
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const field = (key: string, max: number) => typeof body?.[key] === "string" ? String(body[key]).trim().slice(0, max) : "";
  const signal = { title: field("title", 160), area: field("area", 120), state: field("state", 120), category: field("category", 40) as ProjectStatus, detail: field("detail", 1500), sourceNote: field("sourceNote", 300), eventDate: field("eventDate", 10) };
  if (!signal.title || !signal.area || !signal.state || !categories.includes(signal.category) || !signal.detail || !signal.sourceNote || !/^\d{4}-\d{2}-\d{2}$/.test(signal.eventDate)) return secureJson({ error: "Complete every signal field with a valid India location, category, source, and date." }, 400);
  const id = crypto.randomUUID(); const createdAt = Date.now();
  await db.prepare("INSERT INTO area_signals (id,title,area,state,category,detail,source_note,event_date,created_at,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(id, signal.title, signal.area, signal.state, signal.category, signal.detail, signal.sourceNote, signal.eventDate, createdAt, user.userId).run();
  await writeAudit(db, user.userId, "signal.published", id, { area: signal.area, state: signal.state, category: signal.category });
  return secureJson({ signal: { id, ...signal, createdAt } }, 201);
}
