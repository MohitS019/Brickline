import WorkspaceApp from "@/components/brickline/workspace-app";
import { getBuilderAccess } from "@/lib/builder-access";

export const dynamic = "force-dynamic";
export default async function Home() {
  const builderAccess = await getBuilderAccess();
  return <WorkspaceApp builderAccess={builderAccess}/>;
}
