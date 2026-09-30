"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicConfig } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  const { url, anonKey } = requireSupabasePublicConfig();
  browserClient ??= createBrowserClient(url, anonKey);
  return browserClient;
}

