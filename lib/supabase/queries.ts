import type { Project } from "@/lib/brickline-data";
import { getSupabasePublicConfig } from "./config";
import { mapProject, type ProjectWithBuilder } from "./mappers";
import { createClient } from "./server";

const projectSelect = "id,name,builder_id,locality,city,country,site_address,currency,rera_number,status,est_value,homes,completion_date,description,latitude,longitude,published,view_count,verification_status,is_demo_record,created_at,updated_at,builders(name,profile_id,verification_status)";

export async function getPublicProjects(limit?: number): Promise<Project[]> {
  if (!getSupabasePublicConfig()) return [];
  const supabase = await createClient();
  let query = supabase.from("projects").select(projectSelect).eq("published", true).order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) return [];
  return ((data || []) as unknown as ProjectWithBuilder[]).map((row) => mapProject(row));
}

export { projectSelect };
