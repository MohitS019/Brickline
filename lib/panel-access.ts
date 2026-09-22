import { env } from "cloudflare:workers";
import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import type { Role } from "@/lib/brickline-data";

export type AccessStatus = "pending" | "approved" | "declined" | "suspended" | null;
export type PanelAccess = {
  mode: "preview" | "signed-out" | "unavailable" | "member";
  isAdmin: boolean;
  status: AccessStatus;
  requestedRole: Role | null;
  allowedRoles: Role[];
  email: string | null;
};

export function isBricklineAdmin(user: ChatGPTUser): boolean {
  const configured = (env as { BRICKLINE_ADMIN_EMAIL?: string }).BRICKLINE_ADMIN_EMAIL;
  return Boolean(configured && user.email.toLowerCase() === configured.toLowerCase());
}

export function getPanelDb(): D1Database | null {
  return (env as { DB?: D1Database }).DB ?? null;
}

export async function getPanelAccess(): Promise<PanelAccess> {
  const user = await getChatGPTUser();
  if (!user) return process.env.NODE_ENV === "development"
    ? { mode: "preview", isAdmin: true, status: "approved", requestedRole: null, allowedRoles: ["Agent", "Builder", "Client"], email: null }
    : { mode: "signed-out", isAdmin: false, status: null, requestedRole: null, allowedRoles: [], email: null };
  if (isBricklineAdmin(user)) return { mode: "member", isAdmin: true, status: "approved", requestedRole: null, allowedRoles: ["Agent", "Builder", "Client"], email: user.email };
  const db = getPanelDb();
  if (!db) return { mode: "unavailable", isAdmin: false, status: null, requestedRole: null, allowedRoles: [], email: user.email };
  try {
    const row = await db.prepare("SELECT status, requested_role AS requestedRole, agent_access AS agentAccess, builder_access AS builderAccess, client_access AS clientAccess FROM builder_access_requests WHERE user_id = ?")
      .bind(user.userId).first<{ status: AccessStatus; requestedRole: Role; agentAccess: number; builderAccess: number; clientAccess: number }>();
    const allowedRoles: Role[] = row?.status === "approved" ? [
      ...(row.agentAccess ? ["Agent" as const] : []),
      ...(row.builderAccess ? ["Builder" as const] : []),
      ...(row.clientAccess ? ["Client" as const] : []),
    ] : [];
    return { mode: "member", isAdmin: false, status: row?.status ?? null, requestedRole: row?.requestedRole ?? null, allowedRoles, email: user.email };
  } catch {
    return { mode: "unavailable", isAdmin: false, status: null, requestedRole: null, allowedRoles: [], email: user.email };
  }
}
