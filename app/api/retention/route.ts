import { requireAdmin, secureJson, validateMutationOrigin, writeAudit } from "@/lib/api-security";

export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const isoBefore = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
  const grants = await auth.admin.from("introductions").delete({ count: "exact" }).lt("expires_at", isoBefore(180));
  const privacy = await auth.admin.from("privacy_requests").delete({ count: "exact" }).neq("status", "pending").lt("completed_at", isoBefore(365));
  const declined = await auth.admin.from("profiles").delete({ count: "exact" }).eq("status", "rejected").lt("reviewed_at", isoBefore(90)).eq("is_admin", false);
  await writeAudit(auth.user.userId, "retention.cleanup", null, { grants: grants.count || 0, declined: declined.count || 0, privacy: privacy.count || 0 });
  const audit = await auth.admin.from("audit_events").delete({ count: "exact" }).lt("created_at", isoBefore(365));
  return secureJson({ removed: { grants: grants.count || 0, declinedRequests: declined.count || 0, privacyRequests: privacy.count || 0, auditEvents: audit.count || 0 } });
}
