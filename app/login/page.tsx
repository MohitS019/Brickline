import { AuthForm } from "@/components/brickline/auth-form";
import { safeRelativeReturnPath } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; mode?: string; error?: string }> }) {
  const { returnTo = "/", mode, error } = await searchParams;
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  const returnUrl = new URL(safeReturnTo, "https://app.local");
  const role = returnUrl.searchParams.get("role");
  return <AuthForm key={mode === "signup" ? "signup" : "login"} mode={mode === "signup" && returnUrl.pathname !== "/admin" ? "signup" : "login"} initialMessage={error === "confirmation" ? "The confirmation link is invalid or expired. Please sign in or request a new verification email." : ""} returnTo={safeReturnTo} initialRole={role === "Builder" || role === "Client" ? role : "Agent"} adminMode={returnUrl.pathname === "/admin"} />;
}

