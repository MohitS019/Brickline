import "server-only";
import { createClient } from "@supabase/supabase-js";
import {
  requireSupabasePublicConfig,
  requireSupabaseSecretKey,
} from "./config";

export function createAdminClient() {
  const { url } = requireSupabasePublicConfig();
  return createClient(url, requireSupabaseSecretKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

