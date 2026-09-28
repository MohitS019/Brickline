import WorkspaceApp from "@/components/brickline/workspace-app";
import { PublicLanding } from "@/components/brickline/public-landing";
import { getChatGPTUser, chatGPTSignInPath } from "@/app/chatgpt-auth";
import { demoPublicProjects } from "@/lib/demo-seed";
import { getPanelAccess } from "@/lib/panel-access";
import { getPanelContent } from "@/lib/panel-content";

export const dynamic = "force-dynamic";
export default async function Home() {
  const user = await getChatGPTUser();
  if (!user)
    return (
      <PublicLanding
        projects={demoPublicProjects}
        signInHref={chatGPTSignInPath("/")}
      />
    );
  const [panelAccess, panelContent] = await Promise.all([
    getPanelAccess(),
    getPanelContent(),
  ]);
  return <WorkspaceApp panelAccess={panelAccess} panelContent={panelContent} />;
}
