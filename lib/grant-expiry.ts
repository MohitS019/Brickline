export async function recordExpiredGrantAudits(db: D1Database) {
  const now = Date.now();
  const expired = await db
    .prepare(
      "SELECT id, agent_user_id AS agentUserId, client_user_id AS clientUserId, builder_profile_id AS builderProfileId, project_id AS projectId, expires_at AS expiresAt FROM client_access_grants WHERE expires_at <= ? AND revoked_at IS NULL AND expiry_logged_at IS NULL ORDER BY expires_at LIMIT 100",
    )
    .bind(now)
    .all<{
      id: string;
      agentUserId: string;
      clientUserId: string;
      builderProfileId: string;
      projectId: string | null;
      expiresAt: number;
    }>();

  for (const grant of expired.results) {
    const metadata = JSON.stringify({
      clientUserId: grant.clientUserId,
      builderProfileId: grant.builderProfileId,
      projectId: grant.projectId,
      expiresAt: grant.expiresAt,
    });
    await db.batch([
      db
        .prepare(
          "INSERT OR IGNORE INTO security_audit_log (id, actor_user_id, event_type, target_id, metadata, created_at) VALUES (?, ?, 'grant.expired', ?, ?, ?)",
        )
        .bind(
          `grant-expired:${grant.id}`,
          grant.agentUserId,
          grant.id,
          metadata,
          grant.expiresAt,
        ),
      db
        .prepare(
          "UPDATE client_access_grants SET expiry_logged_at = ? WHERE id = ? AND expiry_logged_at IS NULL",
        )
        .bind(now, grant.id),
    ]);
  }
}
