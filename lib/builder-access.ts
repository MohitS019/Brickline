import { env } from "cloudflare:workers";
import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";

export type BuilderAccessStatus = "pending" | "approved" | "declined" | null;
export type BuilderAccess = {
  mode: "preview" | "signed-out" | "unavailable" | "member";
  isAdmin: boolean;
  status: BuilderAccessStatus;
  email: string | null;
};

export function isBricklineAdmin(user: ChatGPTUser): boolean {
  const configured = (env as { BRICKLINE_ADMIN_EMAIL?: string }).BRICKLINE_ADMIN_EMAIL;
  return Boolean(configured && user.email.toLowerCase() === configured.toLowerCase());
}

export function getBuilderDb(): D1Database | null {
  return (env as { DB?: D1Database }).DB ?? null;
}

export async function getBuilderAccess(): Promise<BuilderAccess> {
  const user = await getChatGPTUser();
  if (!user) return process.env.NODE_ENV === "development"
    ? { mode: "preview", isAdmin: false, status: null, email: null }
    : { mode: "signed-out", isAdmin: false, status: null, email: null };
  const isAdmin = isBricklineAdmin(user);
  if (isAdmin) return { mode: "member", isAdmin: true, status: "approved", email: user.email };
  const db = getBuilderDb();
  if (!db) return { mode: "unavailable", isAdmin: false, status: null, email: user.email };
  try {
    const row = await db.prepare("SELECT status FROM builder_access_requests WHERE user_id = ?")
      .bind(user.userId).first<{ status: BuilderAccessStatus }>();
    return { mode: "member", isAdmin: false, status: row?.status ?? null, email: user.email };
  } catch {
    return { mode: "unavailable", isAdmin: false, status: null, email: user.email };
  }
}
