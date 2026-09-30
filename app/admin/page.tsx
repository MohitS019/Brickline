import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LogOut, ShieldX } from "lucide-react";
import { chatGPTSignInPath, chatGPTSignOutPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { BrandLogo } from "@/components/brickline/brand-logo";
import WorkspaceApp from "@/components/brickline/workspace-app";
import { getPanelAccess } from "@/lib/panel-access";
import { getPanelContent } from "@/lib/panel-content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin | Brickline",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const user = await getChatGPTUser();
  if (!user) redirect(chatGPTSignInPath("/admin"));

  const [panelAccess, panelContent] = await Promise.all([
    getPanelAccess(),
    getPanelContent(),
  ]);

  if (!panelAccess.isAdmin) {
    return (
      <main className="approval-shell">
        <div className="approval-brand"><BrandLogo descriptor /></div>
        <section className="approval-card">
          <div className="approval-icon"><ShieldX size={26} /></div>
          <span className="micro-label">ADMIN ACCESS</span>
          <h1>This account is not an administrator.</h1>
          <p>The Admin panel is available only to the verified Brickline owner account. No Admin data was loaded.</p>
          <div className="approval-actions">
            <Link className="reference-primary" href="/"><ArrowLeft size={15} />Return to workspace</Link>
            <Link className="reference-secondary" href={chatGPTSignOutPath("/login?returnTo=/admin")}><LogOut size={15} />Use another account</Link>
          </div>
          <small>Signed in as {user.email}</small>
        </section>
      </main>
    );
  }

  return <WorkspaceApp panelAccess={panelAccess} panelContent={panelContent} initialView="admin" />;
}
