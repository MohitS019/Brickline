import WorkspaceApp from "@/components/brickline/workspace-app";
import { getPanelAccess } from "@/lib/panel-access";
import { getPanelContent } from "@/lib/panel-content";
import { getExternalAppUrl } from "@/lib/platform/runtime";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const externalAppUrl = getExternalAppUrl();
  if (externalAppUrl) {
    redirect(
      `${externalAppUrl}/projects/${encodeURIComponent(decodeURIComponent(projectId))}`,
    );
  }
  const [panelAccess, panelContent] = await Promise.all([
    getPanelAccess(),
    getPanelContent(),
  ]);

  return (
    <WorkspaceApp
      panelAccess={panelAccess}
      panelContent={panelContent}
      initialProjectId={decodeURIComponent(projectId)}
    />
  );
}
