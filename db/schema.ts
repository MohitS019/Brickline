import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const builderAccessRequests = sqliteTable("builder_access_requests", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  status: text("status", { enum: ["pending", "approved", "declined", "suspended"] }).notNull().default("pending"),
  requestedRole: text("requested_role", { enum: ["Agent", "Builder", "Client"] }).notNull().default("Builder"),
  agentAccess: integer("agent_access", { mode: "boolean" }).notNull().default(true),
  builderAccess: integer("builder_access", { mode: "boolean" }).notNull().default(true),
  clientAccess: integer("client_access", { mode: "boolean" }).notNull().default(true),
  requestedAt: integer("requested_at").notNull(),
  reviewedAt: integer("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  consentVersion: text("consent_version").notNull().default(""),
  consentAt: integer("consent_at"),
  consentWithdrawnAt: integer("consent_withdrawn_at"),
  deletionRequestedAt: integer("deletion_requested_at"),
  businessAddress: text("business_address"),
  contactPerson: text("contact_person"),
  agencyName: text("agency_name"),
  phoneEncrypted: text("phone_encrypted"),
  reraEncrypted: text("account_rera_encrypted"),
  gstEncrypted: text("gst_encrypted"),
  reraFingerprint: text("account_rera_fingerprint"),
  gstFingerprint: text("gst_fingerprint"),
  rejectionReason: text("rejection_reason"),
  verifiedAt: integer("verified_at"),
});

export const panelContent = sqliteTable("panel_content", {
  role: text("role", { enum: ["Agent", "Builder", "Client"] }).primaryKey(),
  headline: text("headline").notNull(),
  accent: text("accent").notNull(),
  description: text("description").notNull(),
  updatedAt: integer("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
});

export const clientAccessGrants = sqliteTable("client_access_grants", {
  id: text("id").primaryKey(),
  agentUserId: text("agent_user_id").notNull(),
  clientUserId: text("client_user_id").notNull(),
  clientEmail: text("client_email").notNull(),
  builderProfileId: text("builder_profile_id").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
  firstOpenedAt: integer("first_opened_at"),
  revokedAt: integer("revoked_at"),
  openCount: integer("open_count").notNull().default(0),
  boundDeviceHash: text("bound_device_hash"),
  lastOpenedAt: integer("last_opened_at"),
  lastCountry: text("last_country"),
  deviceLabel: text("device_label"),
}, table => [index("idx_grants_client_expiry").on(table.clientUserId, table.expiresAt), index("idx_grants_agent_created").on(table.agentUserId, table.createdAt)]);

export const securityAuditLog = sqliteTable("security_audit_log", {
  id: text("id").primaryKey(),
  actorUserId: text("actor_user_id").notNull(),
  eventType: text("event_type").notNull(),
  targetId: text("target_id"),
  metadata: text("metadata").notNull().default("{}"),
  createdAt: integer("created_at").notNull(),
}, table => [index("idx_audit_actor_created").on(table.actorUserId, table.createdAt), index("idx_audit_event_created").on(table.eventType, table.createdAt)]);

export const registeredProjects = sqliteTable("registered_projects", {
  id: text("id").primaryKey(), ownerUserId: text("owner_user_id").notNull(), name: text("name").notNull(),
  area: text("area").notNull(), country: text("country").notNull(), siteAddress: text("site_address"), currency: text("currency").notNull(),
  latitude: real("latitude"), longitude: real("longitude"),
  reraEncrypted: text("rera_encrypted"), status: text("status").notNull(), builder: text("builder").notNull(),
  reraFingerprint: text("rera_fingerprint"),
  value: integer("value").notNull(), homes: integer("homes").notNull(), description: text("description").notNull(),
  createdAt: integer("created_at").notNull(), updatedAt: integer("updated_at").notNull(),
}, table => [index("idx_projects_owner_updated").on(table.ownerUserId, table.updatedAt), index("idx_projects_country_status").on(table.country, table.status), index("idx_projects_rera_fingerprint").on(table.reraFingerprint)]);

export const privacyRequests = sqliteTable("privacy_requests", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  email: text("email").notNull(),
  requestType: text("request_type", { enum: ["deletion", "correction", "export"] }).notNull(),
  details: text("details").notNull().default(""),
  status: text("status", { enum: ["pending", "completed", "rejected"] }).notNull().default("pending"),
  createdAt: integer("created_at").notNull(),
  resolvedAt: integer("resolved_at"),
  resolvedBy: text("resolved_by"),
}, table => [index("idx_privacy_user_created").on(table.userId, table.createdAt), index("idx_privacy_status_created").on(table.status, table.createdAt)]);

export const areaSignals = sqliteTable("area_signals", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  area: text("area").notNull(),
  state: text("state").notNull(),
  category: text("category", { enum: ["New construction", "Redevelopment", "Approval stage", "Construction started"] }).notNull(),
  detail: text("detail").notNull(),
  sourceNote: text("source_note").notNull(),
  eventDate: text("event_date").notNull(),
  createdAt: integer("created_at").notNull(),
  createdBy: text("created_by").notNull(),
}, table => [index("idx_signals_created").on(table.createdAt), index("idx_signals_area").on(table.state, table.area)]);
