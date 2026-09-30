import "server-only";
import { createClient } from "@supabase/supabase-js";
import {
  requireSupabasePublicConfig,
  requireSupabaseServiceRoleKey,
} from "./config";

export function createAdminClient() {
  const { url } = requireSupabasePublicConfig();
  return createClient(url, requireSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

