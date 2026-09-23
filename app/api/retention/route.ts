import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getPanelDb, isBricklineAdmin } from "@/lib/panel-access";
import { secureJson, validateMutationOrigin, writeAudit } from "@/lib/api-security";

export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request); if (invalid) return invalid;
  const user = await getChatGPTUser();
  if (!user || !isBricklineAdmin(user)) return secureJson({ error: "Admin permission is required." }, 403);
  const db = getPanelDb(); if (!db) return secureJson({ error: "Retention service is unavailable." }, 503);
  const now = Date.now();
  const grantCutoff = now - 180 * 24 * 60 * 60 * 1000;
  const auditCutoff = now - 365 * 24 * 60 * 60 * 1000;
  const rejectedCutoff = now - 90 * 24 * 60 * 60 * 1000;
  const completedPrivacyCutoff = auditCutoff;
  const grants = await db.prepare("DELETE FROM client_access_grants WHERE expires_at < ?").bind(grantCutoff).run();
  const declined = await db.prepare("DELETE FROM builder_access_requests WHERE status = 'declined' AND reviewed_at IS NOT NULL AND reviewed_at < ? AND NOT EXISTS (SELECT 1 FROM registered_projects WHERE owner_user_id = builder_access_requests.user_id)").bind(rejectedCutoff).run();
  const privacy = await db.prepare("DELETE FROM privacy_requests WHERE status != 'pending' AND resolved_at IS NOT NULL AND resolved_at < ?").bind(completedPrivacyCutoff).run();
  await writeAudit(db, user.userId, "retention.cleanup", null, { grants: grants.meta.changes, declined: declined.meta.changes, privacy: privacy.meta.changes });
  const audit = await db.prepare("DELETE FROM security_audit_log WHERE created_at < ?").bind(auditCutoff).run();
  return secureJson({ removed: { grants: grants.meta.changes, declinedRequests: declined.meta.changes, privacyRequests: privacy.meta.changes, auditEvents: audit.meta.changes } });
}
