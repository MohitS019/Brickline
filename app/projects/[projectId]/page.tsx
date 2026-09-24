import WorkspaceApp from "@/components/brickline/workspace-app";
import { getPanelAccess } from "@/lib/panel-access";
import { getPanelContent } from "@/lib/panel-content";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const [{ projectId }, panelAccess, panelContent] = await Promise.all([
    params,
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
