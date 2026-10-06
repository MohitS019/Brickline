import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRelativeReturnPath } from "@/app/chatgpt-auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createClient();
  await supabase.auth.signOut();
  const requested = url.searchParams.get("returnTo") || "/";
  const destination = safeRelativeReturnPath(requested);
  return NextResponse.redirect(new URL(destination, url.origin));
}
