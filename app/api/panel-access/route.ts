import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getPanelDb, isBricklineAdmin } from "@/lib/panel-access";
import type { Role } from "@/lib/brickline-data";
import {
  isRateLimited,
  validateMutationOrigin,
  writeAudit,
} from "@/lib/api-security";
import {
  decryptSensitive,
  encryptSensitive,
  fingerprintSensitive,
} from "@/lib/sensitive-data";
import { ensureDemoData } from "@/lib/demo-seed";

export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
const roles: Role[] = ["Agent", "Builder", "Client"];
const validRera = (value: string) => /^[A-Za-z0-9/._ -]{3,80}$/.test(value);
const validGst = (value: string) =>
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(value);
const validPhone = (value: string) => /^\+?[0-9][0-9 -]{7,19}$/.test(value);
type AccessRow = {
  userId: string;
  email: string;
  name: string;
  company: string;
  status: string;
  requestedRole: Role;
  agentAccess: number;
  builderAccess: number;
  clientAccess: number;
  requestedAt: number;
  reviewedAt: number | null;
  businessAddress: string | null;
  contactPerson: string | null;
  agencyName: string | null;
  phoneEncrypted: string | null;
  reraEncrypted: string | null;
  gstEncrypted: string | null;
  rejectionReason: string | null;
  verifiedAt: number | null;
  isDemo: number;
};

async function present(row: AccessRow) {
  return {
    ...row,
    isDemo: Boolean(row.isDemo),
    phone: row.phoneEncrypted
      ? await decryptSensitive(row.phoneEncrypted)
      : null,
    reraNumber: row.reraEncrypted
      ? await decryptSensitive(row.reraEncrypted)
      : null,
    gstNumber: row.gstEncrypted
      ? await decryptSensitive(row.gstEncrypted)
      : null,
    phoneEncrypted: undefined,
    reraEncrypted: undefined,
    gstEncrypted: undefined,
  };
}

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in is required." }, 401);
  const db = getPanelDb();
  if (!db)
    return json({ error: "Panel access is temporarily unavailable." }, 503);
  try {
    if (isBricklineAdmin(user)) {
      await ensureDemoData(db);
      const rows = await db
        .prepare(
          "SELECT user_id AS userId, email, name, company, status, requested_role AS requestedRole, agent_access AS agentAccess, builder_access AS builderAccess, client_access AS clientAccess, requested_at AS requestedAt, reviewed_at AS reviewedAt, business_address AS businessAddress, contact_person AS contactPerson, agency_name AS agencyName, phone_encrypted AS phoneEncrypted, account_rera_encrypted AS reraEncrypted, gst_encrypted AS gstEncrypted, rejection_reason AS rejectionReason, verified_at AS verifiedAt, is_demo AS isDemo FROM builder_access_requests ORDER BY requested_at DESC LIMIT 200",
        )
        .all<AccessRow>();
      return json({
        isAdmin: true,
        requests: await Promise.all(rows.results.map(present)),
      });
    }
    const row = await db
      .prepare(
        "SELECT status, requested_role AS requestedRole, agent_access AS agentAccess, builder_access AS builderAccess, client_access AS clientAccess, company, rejection_reason AS rejectionReason, requested_at AS requestedAt, reviewed_at AS reviewedAt, verified_at AS verifiedAt FROM builder_access_requests WHERE user_id = ?",
      )
      .bind(user.userId)
      .first();
    return json({ isAdmin: false, request: row ?? null });
  } catch {
    return json({ error: "Panel access could not be loaded." }, 503);
  }
}

export async function POST(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const user = await getChatGPTUser();
  if (!user) return json({ error: "Sign in is required." }, 401);
  if (isBricklineAdmin(user))
    return json({ error: "Admin access is already granted." }, 409);
  const db = getPanelDb();
  if (!db)
    return json({ error: "Panel access is temporarily unavailable." }, 503);
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const field = (key: string, max: number) =>
    typeof body?.[key] === "string"
      ? String(body[key]).trim().slice(0, max)
      : "";
  const role = field("role", 20) as Role;
  const isPublicRequest = body?.source === "public-request";
  const company = field("company", 120);
  const name = field("name", 120) || user.displayName;
  const businessAddress = field("businessAddress", 300);
  const contactPerson = field("contactPerson", 120);
  const agencyName = field("agencyName", 120);
  const phone = field("phone", 24);
  const reraNumber = field("reraNumber", 80);
  const gstNumber = field("gstNumber", 15).toUpperCase();
  if (!roles.includes(role) || body?.consent !== true)
    return json(
      { error: "Choose a profession and accept the Privacy Notice." },
      400,
    );
  if (
    role === "Builder" &&
    (!company ||
      !businessAddress ||
      !contactPerson ||
      (!isPublicRequest && !validPhone(phone)) ||
      !validRera(reraNumber) ||
      !validGst(gstNumber))
  )
    return json(
      {
        error:
          "Builders must provide company, registered address, contact person, valid phone, RERA, and GST details.",
      },
      400,
    );
  if (
    role === "Agent" &&
    (!name ||
      (isPublicRequest && !businessAddress) ||
      (!isPublicRequest && !validPhone(phone)) ||
      !validRera(reraNumber) ||
      (isPublicRequest && !validGst(gstNumber)))
  )
    return json(
      {
        error:
          "Agents must provide full name, city, RERA agent registration, and GST details.",
      },
      400,
    );
  if (role === "Client" && !name)
    return json({ error: "Enter your name." }, 400);
  try {
    if (
      await isRateLimited(
        db,
        user.userId,
        "access.requested",
        60 * 60 * 1000,
        5,
      )
    )
      return json(
        { error: "Too many registration attempts. Try again later." },
        429,
      );
    const existing = await db
      .prepare("SELECT status FROM builder_access_requests WHERE user_id = ?")
      .bind(user.userId)
      .first<{ status: string }>();
    if (existing && existing.status !== "declined")
      return json(
        {
          error:
            existing.status === "pending"
              ? "Your registration is already pending."
              : "Your access is managed by an admin.",
        },
        409,
      );
    const reraFingerprint = reraNumber
      ? await fingerprintSensitive(reraNumber)
      : null;
    const gstFingerprint = gstNumber
      ? await fingerprintSensitive(gstNumber)
      : null;
    if (
      reraFingerprint &&
      (await db
        .prepare(
          "SELECT user_id FROM builder_access_requests WHERE account_rera_fingerprint = ? AND user_id != ? LIMIT 1",
        )
        .bind(reraFingerprint, user.userId)
        .first())
    ) {
      await writeAudit(
        db,
        user.userId,
        "fraud.duplicate_account_rera",
        user.userId,
      );
      return json(
        {
          error:
            "This RERA number is already attached to another account and was flagged for review.",
        },
        409,
      );
    }
    if (
      gstFingerprint &&
      (await db
        .prepare(
          "SELECT user_id FROM builder_access_requests WHERE gst_fingerprint = ? AND user_id != ? LIMIT 1",
        )
        .bind(gstFingerprint, user.userId)
        .first())
    ) {
      await writeAudit(db, user.userId, "fraud.duplicate_gst", user.userId);
      return json(
        {
          error:
            "This GST number is already attached to another account and was flagged for review.",
        },
        409,
      );
    }
    const now = Date.now();
    const instant = role === "Client";
    const status = instant ? "approved" : "pending";
    const encryptedPhone = phone ? await encryptSensitive(phone) : null;
    const encryptedRera = reraNumber
      ? await encryptSensitive(reraNumber)
      : null;
    const encryptedGst = gstNumber ? await encryptSensitive(gstNumber) : null;
    await db
      .prepare(
        "INSERT INTO builder_access_requests (user_id,email,name,company,status,requested_role,agent_access,builder_access,client_access,requested_at,reviewed_at,reviewed_by,consent_version,consent_at,consent_withdrawn_at,business_address,contact_person,agency_name,phone_encrypted,account_rera_encrypted,gst_encrypted,account_rera_fingerprint,gst_fingerprint,rejection_reason,verified_at) VALUES (?,?,?,?,?,?,0,0,?,?,?,?, '2026-09-23',?,NULL,?,?,?,?,?,?,?,?,NULL,?) ON CONFLICT(user_id) DO UPDATE SET email=excluded.email,name=excluded.name,company=excluded.company,status=excluded.status,requested_role=excluded.requested_role,agent_access=0,builder_access=0,client_access=excluded.client_access,requested_at=excluded.requested_at,reviewed_at=excluded.reviewed_at,reviewed_by=excluded.reviewed_by,consent_version=excluded.consent_version,consent_at=excluded.consent_at,consent_withdrawn_at=NULL,business_address=excluded.business_address,contact_person=excluded.contact_person,agency_name=excluded.agency_name,phone_encrypted=excluded.phone_encrypted,account_rera_encrypted=excluded.account_rera_encrypted,gst_encrypted=excluded.gst_encrypted,account_rera_fingerprint=excluded.account_rera_fingerprint,gst_fingerprint=excluded.gst_fingerprint,rejection_reason=NULL,verified_at=excluded.verified_at",
      )
      .bind(
        user.userId,
        user.email,
        name,
        company || agencyName,
        status,
        role,
        instant ? 1 : 0,
        now,
        instant ? now : null,
        instant ? "automatic:verified-provider-email" : null,
        now,
        businessAddress || null,
        contactPerson || null,
        agencyName || null,
        encryptedPhone,
        encryptedRera,
        encryptedGst,
        reraFingerprint,
        gstFingerprint,
        instant ? now : null,
      )
      .run();
    await writeAudit(db, user.userId, "privacy.consent", user.userId, {
      version: "2026-09-23",
    });
    await writeAudit(
      db,
      user.userId,
      instant ? "access.client_auto_approved" : "access.requested",
      user.userId,
      { role },
    );
    return json({ status, instant }, 201);
  } catch {
    return json(
      { error: "Registration could not be saved. Please try again." },
      503,
    );
  }
}

export async function PATCH(request: Request) {
  const invalid = validateMutationOrigin(request);
  if (invalid) return invalid;
  const user = await getChatGPTUser();
  if (!user || !isBricklineAdmin(user))
    return json({ error: "Admin permission is required." }, 403);
  const db = getPanelDb();
  if (!db)
    return json({ error: "Panel access is temporarily unavailable." }, 503);
  const body = (await request.json().catch(() => null)) as {
    userId?: unknown;
    action?: unknown;
    panels?: unknown;
    reason?: unknown;
  } | null;
  if (
    typeof body?.userId !== "string" ||
    !body.userId ||
    body.userId.length > 200
  )
    return json({ error: "Invalid account." }, 400);
  const action = String(body.action || "");
  if (
    !["approve", "decline", "suspend", "restore", "set-panels"].includes(action)
  )
    return json({ error: "Invalid action." }, 400);
  const current = await db
    .prepare(
      "SELECT status, requested_role AS requestedRole FROM builder_access_requests WHERE user_id = ?",
    )
    .bind(body.userId)
    .first<{ status: string; requestedRole: Role }>();
  if (!current) return json({ error: "Account not found." }, 404);
  let result: D1Result;
  const now = Date.now();
  if (action === "approve") {
    if (current.status !== "pending")
      return json(
        { error: "Only pending registrations can be approved." },
        409,
      );
    const all = current.requestedRole === "Builder";
    result = await db
      .prepare(
        "UPDATE builder_access_requests SET status='approved',agent_access=?,builder_access=?,client_access=?,reviewed_at=?,reviewed_by=?,verified_at=?,rejection_reason=NULL WHERE user_id=? AND status='pending'",
      )
      .bind(
        all || current.requestedRole === "Agent" ? 1 : 0,
        all ? 1 : 0,
        all || current.requestedRole === "Client" ? 1 : 0,
        now,
        user.userId,
        now,
        body.userId,
      )
      .run();
  } else if (action === "decline") {
    const reason =
      typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
    if (current.status !== "pending" || reason.length < 8)
      return json(
        { error: "Enter a clear rejection reason of at least 8 characters." },
        400,
      );
    result = await db
      .prepare(
        "UPDATE builder_access_requests SET status='declined',agent_access=0,builder_access=0,client_access=0,reviewed_at=?,reviewed_by=?,rejection_reason=? WHERE user_id=? AND status='pending'",
      )
      .bind(now, user.userId, reason, body.userId)
      .run();
  } else if (action === "suspend")
    result = await db
      .prepare(
        "UPDATE builder_access_requests SET status='suspended',reviewed_at=?,reviewed_by=? WHERE user_id=? AND status='approved'",
      )
      .bind(now, user.userId, body.userId)
      .run();
  else if (action === "restore")
    result = await db
      .prepare(
        "UPDATE builder_access_requests SET status='approved',reviewed_at=?,reviewed_by=? WHERE user_id=? AND status='suspended'",
      )
      .bind(now, user.userId, body.userId)
      .run();
  else {
    const panels = body.panels as Record<Role, unknown> | null;
    if (
      !panels ||
      typeof panels.Agent !== "boolean" ||
      typeof panels.Builder !== "boolean" ||
      typeof panels.Client !== "boolean"
    )
      return json({ error: "Choose access for all three panels." }, 400);
    result = await db
      .prepare(
        "UPDATE builder_access_requests SET agent_access=?,builder_access=?,client_access=?,reviewed_at=?,reviewed_by=? WHERE user_id=? AND status IN ('approved','suspended')",
      )
      .bind(
        panels.Agent ? 1 : 0,
        panels.Builder ? 1 : 0,
        panels.Client ? 1 : 0,
        now,
        user.userId,
        body.userId,
      )
      .run();
  }
  if (!result.meta.changes)
    return json({ error: "This account changed; refresh and try again." }, 409);
  await writeAudit(
    db,
    user.userId,
    `admin.${action}`,
    body.userId,
    action === "decline" ? { reason: body.reason } : {},
  );
  return json({
    account: await db
      .prepare(
        "SELECT user_id AS userId,email,name,company,status,requested_role AS requestedRole,agent_access AS agentAccess,builder_access AS builderAccess,client_access AS clientAccess,requested_at AS requestedAt,reviewed_at AS reviewedAt,rejection_reason AS rejectionReason,verified_at AS verifiedAt,business_address AS businessAddress,contact_person AS contactPerson,agency_name AS agencyName,is_demo AS isDemo FROM builder_access_requests WHERE user_id=?",
      )
      .bind(body.userId)
      .first(),
  });
}
