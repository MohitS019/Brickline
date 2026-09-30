import type { ProjectStatus } from "@/lib/brickline-data";
import { requireAdmin, secureJson, validateMutationOrigin, writeAudit } from "@/lib/api-security";
import { mapAreaSignal } from "@/lib/supabase/mappers";
import { createClient } from "@/lib/supabase/server";

const categories: ProjectStatus[] = ["New construction", "Redevelopment", "Approval stage", "Construction started"];

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from("area_signals").select("*").order("event_date", { ascending: false }).limit(300);
    if (error) throw error;
    return secureJson({ signals: (data || []).map(mapAreaSignal) });
  } catch {
    return secureJson({ signals: [] });
  }
}

export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const field = (key: string, max: number) => typeof body?.[key] === "string" ? String(body[key]).trim().slice(0, max) : "";
  const signal = { title: field("title", 160), area: field("area", 120), state: field("state", 120), category: field("category", 40) as ProjectStatus, detail: field("detail", 1500), sourceNote: field("sourceNote", 300), eventDate: field("eventDate", 10) };
  if (!signal.title || !signal.area || !signal.state || !categories.includes(signal.category) || !signal.detail || !signal.sourceNote || !/^\d{4}-\d{2}-\d{2}$/.test(signal.eventDate)) return secureJson({ error: "Complete every signal field with a valid India location, category, source, and date." }, 400);
  const [locality, ...cityParts] = signal.area.split(",").map((part) => part.trim());
  const { data, error } = await auth.admin.from("area_signals").insert({ title: signal.title, description: signal.detail, status_tag: signal.category, locality, city: cityParts.join(", ") || locality, state: signal.state, source_label: signal.sourceNote, event_date: signal.eventDate }).select("*").single();
  if (error || !data) return secureJson({ error: "Signal could not be published." }, 503);
  await writeAudit(auth.user.userId, "signal.published", data.id, { area: signal.area, state: signal.state, category: signal.category });
  return secureJson({ signal: mapAreaSignal(data) }, 201);
}
