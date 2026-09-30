"use client";

import { createBrowserClient } from "@supabase/ssr";
import { requireSupabasePublicConfig } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  const { url, publishableKey } = requireSupabasePublicConfig();
  browserClient ??= createBrowserClient(url, publishableKey);
  return browserClient;
}

