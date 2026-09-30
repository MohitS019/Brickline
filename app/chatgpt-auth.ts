import { redirect } from "next/navigation";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
  emailConfirmedAt: string | null;
};

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  if (!getSupabasePublicConfig()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.email) return null;
  const fullName = typeof data.user.user_metadata?.full_name === "string" ? data.user.user_metadata.full_name : null;
  return {
    userId: data.user.id,
    displayName: fullName || data.user.email,
    email: data.user.email,
    fullName,
    emailConfirmedAt: data.user.email_confirmed_at || null,
  };
}
export async function requireChatGPTUser(returnTo: string) {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect(chatGPTSignInPath(returnTo));
}
export function chatGPTSignInPath(returnTo: string) {
  return `/login?returnTo=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}
export function chatGPTSignOutPath(returnTo = "/") {
  return `/auth/signout?returnTo=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`;
}
function safeRelativeReturnPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://app.local");
    return url.origin === "https://app.local" ? `${url.pathname}${url.search}${url.hash}` : "/";
  } catch {
    return "/";
  }
}
