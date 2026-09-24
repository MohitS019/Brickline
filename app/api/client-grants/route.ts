import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isBricklineAdmin, getPanelDb } from "@/lib/panel-access";
import {
  isRateLimited,
  requireVerifiedRole,
  secureJson,
  validateMutationOrigin,
  writeAudit,
} from "@/lib/api-security";
import { createGrantToken, verifyGrantToken } from "@/lib/grant-token";
import { fingerprintSensitive } from "@/lib/sensitive-data";

export const dynamic = "force-dynamic";
const allowedMinutes = [15, 30, 60, 120];
const deviceLabel = (userAgent: string) =>
  `${/Mobile|Android|iPhone/i.test(userAgent) ? "Mobile" : "Desktop"} · ${/Edg\//.test(userAgent) ? "Edge" : /Chrome\//.test(userAgent) ? "Chrome" : /Safari\//.test(userAgent) ? "Safari" : /Firefox\//.test(userAgent) ? "Firefox" : "Browser"}`;

export async function GET(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return secureJson({ error: "Sign in is required." }, 401);
  const db = getPanelDb();
  if (!db) return secureJson({ error: "Access grants are unavailable." }, 503);
  const admin = isBricklineAdmin(user);
  const access: {
    status: string;
    agent: number | boolean;
    client: number | boolean;
    consentVersion?: string;
    consentWithdrawnAt?: number | null;
  } | null = admin
    ? { status: "approved", agent: true, client: true }
    : (await db
        .prepare(
          "SELECT status, agent_access AS agent, client_access AS client, consent_version AS consentVersion, consent_withdrawn_at AS consentWithdrawnAt FROM builder_access_requests WHERE user_id = ?",
        )
        .bind(user.userId)
        .first<{
          status: string;
          agent: number;
          client: number;
          consentVersion: string;
          consentWithdrawnAt: number | null;
        }>()) || null;
  if (!admin && access?.status !== "approved")
    return secureJson({ error: "Verified account required." }, 403);
  if (!admin && (!access?.consentVersion || access.consentWithdrawnAt))
    return secureJson({ error: "Privacy consent is required." }, 403);
  const requestedMode = new URL(request.url).searchParams.get("mode");
  if (requestedMode === "client" && access?.client) {
    const rows = await db
      .prepare(
        "SELECT g.id, g.builder_profile_id AS builderProfileId, g.project_id AS projectId, COALESCE(p.name, 'Builder profile access') AS projectName, g.expires_at AS expiresAt, g.created_at AS createdAt, g.first_opened_at AS firstOpenedAt, g.revoked_at AS revokedAt, g.open_count AS openCount, COALESCE(a.name, 'Brickline agent') AS agentName FROM client_access_grants g LEFT JOIN builder_access_requests a ON a.user_id = g.agent_user_id LEFT JOIN registered_projects p ON p.id = g.project_id WHERE g.client_user_id = ? ORDER BY g.created_at DESC LIMIT 100",
      )
      .bind(user.userId)
      .all();
    return secureJson({ mode: "client", grants: rows.results });
  }
  if (access?.agent) {
    const rows = await db
      .prepare(
        "SELECT g.id, g.client_email AS clientEmail, g.builder_profile_id AS builderProfileId, g.project_id AS projectId, COALESCE(p.name, 'Builder profile access') AS projectName, g.expires_at AS expiresAt, g.created_at AS createdAt, g.first_opened_at AS firstOpenedAt, g.revoked_at AS revokedAt, g.open_count AS openCount, g.last_opened_at AS lastOpenedAt, g.last_country AS lastCountry, g.device_label AS deviceLabel FROM client_access_grants g LEFT JOIN registered_projects p ON p.id = g.project_id WHERE g.agent_user_id = ? ORDER BY g.created_at DESC LIMIT 100",
      )
      .bind(user.userId)
      .all();
    return secureJson({ mode: "agent", grants: rows.results });
  }
  if (access?.client) {
    const rows = await db
      .prepare(
        "SELECT g.id, g.builder_profile_id AS builderProfileId, g.project_id AS projectId, COALESCE(p.name, 'Builder profile access') AS projectName, g.expires_at AS expiresAt, g.created_at AS createdAt, g.first_opened_at AS firstOpenedAt, g.revoked_at AS revokedAt, g.open_count AS openCount, COALESCE(a.name, 'Brickline agent') AS agentName FROM client_access_grants g LEFT JOIN builder_access_requests a ON a.user_id = g.agent_user_id LEFT JOIN registered_projects p ON p.id = g.project_id WHERE g.client_user_id = ? ORDER BY g.created_at DESC LIMIT 100",
      )
      .bind(user.userId)
      .all();
    return secureJson({ mode: "client", grants: rows.results });
  }
  return secureJson({ error: "Agent or Client access required." }, 403);
}

export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const auth = await requireVerifiedRole("Agent");
  if ("response" in auth) return auth.response;
  const body = (await request.json().catch(() => null)) as {
    clientEmail?: unknown;
    builderProfileId?: unknown;
    projectId?: unknown;
    minutes?: unknown;
  } | null;
  const clientEmail =
    typeof body?.clientEmail === "string"
      ? body.clientEmail.trim().toLowerCase()
      : "";
  const builderProfileId =
    typeof body?.builderProfileId === "string"
      ? body.builderProfileId.trim()
      : "";
  const minutes = Number(body?.minutes);
  const projectId =
    typeof body?.projectId === "string" ? body.projectId.trim() : "";
  if (
    !/^\S+@\S+\.\S+$/.test(clientEmail) ||
    !builderProfileId ||
    builderProfileId.length > 160 ||
    !allowedMinutes.includes(minutes) ||
    !projectId
  )
    return secureJson(
      {
        error: "Choose a verified client, builder, and valid access duration.",
      },
      400,
    );
  if (
    await isRateLimited(
      auth.db,
      auth.user.userId,
      "grant.created",
      60 * 60 * 1000,
      20,
    )
  )
    return secureJson({ error: "Grant limit reached. Try again later." }, 429);
  const client = await auth.db
    .prepare(
      "SELECT user_id AS userId FROM builder_access_requests WHERE lower(email) = ? AND status = 'approved' AND client_access = 1",
    )
    .bind(clientEmail)
    .first<{ userId: string }>();
  if (!client)
    return secureJson(
      { error: "That client must have an approved Client account first." },
      404,
    );
  const project = await auth.db
    .prepare(
      "SELECT id, name FROM registered_projects WHERE id = ? AND builder = ? AND published = 1",
    )
    .bind(projectId, builderProfileId)
    .first<{ id: string; name: string }>();
  if (!project)
    return secureJson(
      { error: "Choose a published project from that builder." },
      404,
    );
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const expiresAt = createdAt + minutes * 60_000;
  await auth.db
    .prepare(
      "INSERT INTO client_access_grants (id, agent_user_id, client_user_id, client_email, builder_profile_id, project_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(
      id,
      auth.user.userId,
      client.userId,
      clientEmail,
      builderProfileId,
      projectId,
      expiresAt,
      createdAt,
    )
    .run();
  await writeAudit(auth.db, auth.user.userId, "grant.created", id, {
    clientUserId: client.userId,
    builderProfileId,
    projectId,
    expiresAt,
  });
  const token = await createGrantToken({
    jti: id,
    sub: client.userId,
    aid: auth.user.userId,
    bid: builderProfileId,
    exp: Math.floor(expiresAt / 1000),
  });
  return secureJson(
    {
      grant: {
        id,
        clientEmail,
        builderProfileId,
        projectId,
        projectName: project.name,
        expiresAt,
        createdAt,
      },
      token,
    },
    201,
  );
}

export async function PATCH(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const user = await getChatGPTUser();
  if (!user) return secureJson({ error: "Sign in is required." }, 401);
  const db = getPanelDb();
  if (!db) return secureJson({ error: "Access grants are unavailable." }, 503);
  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    token?: unknown;
    grantId?: unknown;
  } | null;
  if (body?.action === "open" && typeof body.token === "string") {
    const claims = await verifyGrantToken(body.token);
    if (
      !claims ||
      claims.sub !== user.userId ||
      claims.exp * 1000 <= Date.now()
    )
      return secureJson(
        { error: "This secure link is invalid or expired." },
        403,
      );
    const grant = await db
      .prepare(
        "SELECT g.id, g.builder_profile_id AS builderProfileId, g.expires_at AS expiresAt, g.revoked_at AS revokedAt, g.open_count AS openCount, g.bound_device_hash AS boundDeviceHash, g.last_country AS lastCountry, COALESCE(a.name, 'Brickline agent') AS agentName FROM client_access_grants g LEFT JOIN builder_access_requests a ON a.user_id = g.agent_user_id WHERE g.id = ? AND g.client_user_id = ? AND g.agent_user_id = ?",
      )
      .bind(claims.jti, user.userId, claims.aid)
      .first<{
        id: string;
        builderProfileId: string;
        expiresAt: number;
        revokedAt: number | null;
        openCount: number;
        boundDeviceHash: string | null;
        lastCountry: string | null;
        agentName: string;
      }>();
    if (
      !grant ||
      grant.revokedAt ||
      grant.expiresAt <= Date.now() ||
      grant.builderProfileId !== claims.bid
    )
      return secureJson(
        { error: "This access grant is no longer active." },
        403,
      );
    if (grant.openCount >= 5) {
      await writeAudit(db, user.userId, "fraud.grant_open_limit", grant.id);
      return secureJson(
        { error: "This secure link has reached its five-open limit." },
        429,
      );
    }
    const userAgent = request.headers.get("user-agent") || "unknown-browser";
    const language =
      request.headers.get("accept-language") || "unknown-language";
    const deviceHash = await fingerprintSensitive(`${userAgent}|${language}`);
    const country =
      (request.headers.get("cf-ipcountry") || "").slice(0, 2).toUpperCase() ||
      null;
    if (grant.boundDeviceHash && grant.boundDeviceHash !== deviceHash) {
      await writeAudit(
        db,
        user.userId,
        "fraud.grant_device_mismatch",
        grant.id,
      );
      return secureJson(
        {
          error:
            "This link is bound to another device. Ask the agent for a new link.",
        },
        403,
      );
    }
    if (grant.lastCountry && country && grant.lastCountry !== country) {
      await writeAudit(
        db,
        user.userId,
        "fraud.grant_location_change",
        grant.id,
        { previousCountry: grant.lastCountry, country },
      );
      return secureJson(
        {
          error:
            "Location changed. Re-verification is required through your agent.",
        },
        403,
      );
    }
    const openedAt = Date.now();
    await db
      .prepare(
        "UPDATE client_access_grants SET first_opened_at = COALESCE(first_opened_at, ?), last_opened_at = ?, open_count = open_count + 1, bound_device_hash = COALESCE(bound_device_hash, ?), last_country = COALESCE(?, last_country), device_label = COALESCE(device_label, ?) WHERE id = ? AND open_count < 5",
      )
      .bind(
        openedAt,
        openedAt,
        deviceHash,
        country,
        deviceLabel(userAgent),
        grant.id,
      )
      .run();
    await writeAudit(db, user.userId, "grant.opened", grant.id, {
      builderProfileId: grant.builderProfileId,
      openNumber: grant.openCount + 1,
      country,
    });
    return secureJson({
      grant: {
        id: grant.id,
        builderProfileId: grant.builderProfileId,
        expiresAt: grant.expiresAt,
        openCount: grant.openCount + 1,
        agentName: grant.agentName,
      },
    });
  }
  if (body?.action === "revoke" && typeof body.grantId === "string") {
    const auth = await requireVerifiedRole("Agent");
    if ("response" in auth) return auth.response;
    const result = await auth.db
      .prepare(
        "UPDATE client_access_grants SET revoked_at = ? WHERE id = ? AND agent_user_id = ? AND revoked_at IS NULL",
      )
      .bind(Date.now(), body.grantId, auth.user.userId)
      .run();
    if (!result.meta.changes)
      return secureJson({ error: "Active grant not found." }, 404);
    await writeAudit(auth.db, auth.user.userId, "grant.revoked", body.grantId);
    return secureJson({ status: "revoked" });
  }
  return secureJson({ error: "Invalid grant action." }, 400);
}
