import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const builderAccessRequests = sqliteTable("builder_access_requests", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  company: text("company").notNull(),
  status: text("status", { enum: ["pending", "approved", "declined"] }).notNull().default("pending"),
  requestedAt: integer("requested_at").notNull(),
  reviewedAt: integer("reviewed_at"),
  reviewedBy: text("reviewed_by"),
});
