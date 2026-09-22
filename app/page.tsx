import WorkspaceApp from "@/components/brickline/workspace-app";
import { getPanelAccess } from "@/lib/panel-access";
import { getPanelContent } from "@/lib/panel-content";

export const dynamic = "force-dynamic";
export default async function Home() {
  const [panelAccess, panelContent] = await Promise.all([getPanelAccess(), getPanelContent()]);
  return <WorkspaceApp panelAccess={panelAccess} panelContent={panelContent}/>;
}
