import { env } from "cloudflare:workers";
import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import type { Role } from "@/lib/brickline-data";
import { decryptSensitive } from "@/lib/sensitive-data";

export type AccessStatus = "pending" | "approved" | "declined" | "suspended" | null;
export type PanelAccess = {
  mode: "signed-out" | "unavailable" | "member";
  isAdmin: boolean;
  status: AccessStatus;
  requestedRole: Role | null;
  allowedRoles: Role[];
  email: string | null;
  needsConsent: boolean;
  verifiedAt: number | null;
  verificationLabel: string | null;
  rejectionReason: string | null;
};

export function isBricklineAdmin(user: ChatGPTUser): boolean {
  const configured = (env as { BRICKLINE_ADMIN_EMAIL?: string }).BRICKLINE_ADMIN_EMAIL;
  const email = user.email.trim().toLowerCase();
  return Boolean(user.userId && email && configured?.split(",").some(allowed => allowed.trim().toLowerCase() === email));
}

export function getPanelDb(): D1Database | null {
  return (env as { DB?: D1Database }).DB ?? null;
}

export async function getPanelAccess(): Promise<PanelAccess> {
  const user = await getChatGPTUser();
  if (!user) return { mode: "signed-out", isAdmin: false, status: null, requestedRole: null, allowedRoles: [], email: null, needsConsent: false, verifiedAt: null, verificationLabel: null, rejectionReason: null };
  if (isBricklineAdmin(user)) return { mode: "member", isAdmin: true, status: "approved", requestedRole: null, allowedRoles: ["Agent", "Builder", "Client"], email: user.email, needsConsent: false, verifiedAt: null, verificationLabel: "Site administrator", rejectionReason: null };
  const db = getPanelDb();
  if (!db) return { mode: "unavailable", isAdmin: false, status: null, requestedRole: null, allowedRoles: [], email: user.email, needsConsent: false, verifiedAt: null, verificationLabel: null, rejectionReason: null };
  try {
    const row = await db.prepare("SELECT status, requested_role AS requestedRole, agent_access AS agentAccess, builder_access AS builderAccess, client_access AS clientAccess, consent_version AS consentVersion, consent_withdrawn_at AS consentWithdrawnAt, account_rera_encrypted AS reraEncrypted, verified_at AS verifiedAt, rejection_reason AS rejectionReason FROM builder_access_requests WHERE user_id = ?")
      .bind(user.userId).first<{ status: AccessStatus; requestedRole: Role; agentAccess: number; builderAccess: number; clientAccess: number; consentVersion: string; consentWithdrawnAt: number | null; reraEncrypted: string | null; verifiedAt: number | null; rejectionReason: string | null }>();
    const allowedRoles: Role[] = row?.status === "approved" ? [
      ...(row.agentAccess ? ["Agent" as const] : []),
      ...(row.builderAccess ? ["Builder" as const] : []),
      ...(row.clientAccess ? ["Client" as const] : []),
    ] : [];
    const needsConsent = Boolean(row?.status === "approved" && (!row.consentVersion || row.consentWithdrawnAt));
    const rawRera = row?.reraEncrypted ? await decryptSensitive(row.reraEncrypted) : "";
    const verificationLabel = row?.verifiedAt ? row.requestedRole === "Client" ? "Email verified by sign-in provider" : `RERA reviewed · ••••${rawRera.slice(-4)}` : null;
    return { mode: "member", isAdmin: false, status: row?.status ?? null, requestedRole: row?.requestedRole ?? null, allowedRoles, email: user.email, needsConsent, verifiedAt: row?.verifiedAt ?? null, verificationLabel, rejectionReason: row?.rejectionReason ?? null };
  } catch {
    return { mode: "unavailable", isAdmin: false, status: null, requestedRole: null, allowedRoles: [], email: user.email, needsConsent: false, verifiedAt: null, verificationLabel: null, rejectionReason: null };
  }
}
