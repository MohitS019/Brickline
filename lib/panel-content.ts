import type { Role } from "@/lib/brickline-data";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type PanelCopy = { headline: string; accent: string; description: string };
export type PanelContent = Record<Role, PanelCopy>;

export const defaultPanelContent: PanelContent = {
  Agent: { headline: "From discovery to", accent: "a trusted introduction.", description: "Find a builder on the map, prepare a client-specific invitation, then choose an access window from 15 minutes to 2 hours when secure sharing is connected." },
  Builder: { headline: "Keep your profile", accent: "in your control.", description: "Project summaries and their map locations help agents and clients discover your work. Your builder profile stays behind an agent introduction for clients." },
  Client: { headline: "Explore freely.", accent: "Meet the builder through your agent.", description: "Browse locations, project summaries, and area intelligence. Builder contact details and private profile information are not part of public browsing." },
};

export async function getPanelContent(): Promise<PanelContent> {
  const content: PanelContent = { ...defaultPanelContent };
  if (!getSupabasePublicConfig()) return content;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("panel_content").select("role,headline,accent,description");
    for (const row of data || []) if (row.role in content) content[row.role as Role] = { headline: row.headline, accent: row.accent, description: row.description };
  } catch { /* Keep default copy while a migration or database is unavailable. */ }
  return content;
}
