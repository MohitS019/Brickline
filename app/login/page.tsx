import { AuthForm } from "@/components/brickline/auth-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo = "/" } = await searchParams;
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  const returnUrl = new URL(safeReturnTo, "https://app.local");
  const role = returnUrl.searchParams.get("role");
  return <AuthForm returnTo={safeReturnTo} initialRole={role === "Builder" || role === "Client" ? role : "Agent"} adminMode={returnUrl.pathname === "/admin"} />;
}

