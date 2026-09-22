import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
});

export const panelContent = sqliteTable("panel_content", {
  role: text("role", { enum: ["Agent", "Builder", "Client"] }).primaryKey(),
  headline: text("headline").notNull(),
  accent: text("accent").notNull(),
  description: text("description").notNull(),
  updatedAt: integer("updated_at").notNull(),
  updatedBy: text("updated_by").notNull(),
});
