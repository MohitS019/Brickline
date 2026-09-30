import "server-only";
import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import type { Role } from "@/lib/brickline-data";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { ProfileRow } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

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

const OWNER_EMAIL = (process.env.BRICKLINE_ADMIN_EMAIL || "mohitsonje4@gmail.com").trim().toLowerCase();

export function isVerifiedOwner(user: ChatGPTUser) {
  return Boolean(user.emailConfirmedAt && user.email.trim().toLowerCase() === OWNER_EMAIL);
}

export async function getUserProfile(user?: ChatGPTUser | null): Promise<ProfileRow | null> {
  const currentUser = user ?? (await getChatGPTUser());
  if (!currentUser || !getSupabasePublicConfig()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", currentUser.userId).maybeSingle();
  return (data as ProfileRow | null) ?? null;
}
export async function isBricklineAdmin(user?: ChatGPTUser | null) {
  const currentUser = user ?? (await getChatGPTUser());
  if (!currentUser) return false;
  return isVerifiedOwner(currentUser) || Boolean((await getUserProfile(currentUser))?.is_admin);
}
export async function getPanelAccess(): Promise<PanelAccess> {
  const user = await getChatGPTUser();
  if (!user) return { mode: "signed-out", isAdmin: false, status: null, requestedRole: null, allowedRoles: [], email: null, needsConsent: false, verifiedAt: null, verificationLabel: null, rejectionReason: null };
  if (!getSupabasePublicConfig()) return { mode: "unavailable", isAdmin: false, status: null, requestedRole: null, allowedRoles: [], email: user.email, needsConsent: false, verifiedAt: null, verificationLabel: null, rejectionReason: null };

  const profile = await getUserProfile(user);
  if (!profile) return { mode: "member", isAdmin: false, status: "pending", requestedRole: null, allowedRoles: [], email: user.email, needsConsent: false, verifiedAt: null, verificationLabel: null, rejectionReason: null };
  const isAdmin = profile.is_admin || isVerifiedOwner(user);
  const allowedRoles: Role[] = profile.status !== "approved" && !isAdmin ? [] : [
    ...(isAdmin || profile.agent_access ? ["Agent" as const] : []),
    ...(isAdmin || profile.builder_access ? ["Builder" as const] : []),
    ...(isAdmin || profile.client_access ? ["Client" as const] : []),
  ];
  return {
    mode: "member",
    isAdmin,
    status: isAdmin ? "approved" : profile.status === "rejected" ? "declined" : profile.status,
    requestedRole: profile.role,
    allowedRoles,
    email: profile.email,
    needsConsent: !profile.consent_at || Boolean(profile.consent_withdrawn_at),
    verifiedAt: profile.reviewed_at ? Date.parse(profile.reviewed_at) : null,
    verificationLabel: isAdmin
      ? "Site administrator"
      : profile.verification_status === "rera-verified"
        ? "RERA verified"
        : profile.verification_status === "pending"
          ? "Pending verification"
          : "Unverified",
    rejectionReason: profile.rejection_reason,
  };
}
