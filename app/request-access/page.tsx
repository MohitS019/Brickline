import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { RequestAccessForm } from "@/components/brickline/request-access-form";
import { getPanelAccess } from "@/lib/panel-access";
import type { Role } from "@/lib/brickline-data";
import { getExternalAppUrl } from "@/lib/platform/runtime";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RequestAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const initialRole: Role = ["Agent", "Builder", "Client"].includes(
    params.role || "",
  )
    ? (params.role as Role)
    : "Agent";
  const externalAppUrl = getExternalAppUrl();
  if (externalAppUrl) {
    redirect(
      `${externalAppUrl}/request-access?role=${encodeURIComponent(initialRole)}`,
    );
  }
  const user = await getChatGPTUser();
  const access = user ? await getPanelAccess() : null;
  const returnTo = `/request-access?role=${initialRole}`;
  return (
    <RequestAccessForm
      initialRole={initialRole}
      email={user?.email || ""}
      signedIn={Boolean(user)}
      signInHref={chatGPTSignInPath(returnTo)}
      currentStatus={access?.status || null}
    />
  );
}
