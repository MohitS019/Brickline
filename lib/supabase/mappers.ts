import type { AreaSignal, Project } from "@/lib/brickline-data";
import type {
  AreaSignalRow,
  BuilderRow,
  ProjectRow,
} from "./database.types";

export type ProjectWithBuilder = ProjectRow & {
  builders: Pick<BuilderRow, "name" | "profile_id" | "verification_status"> | null;
};

export function mapProject(row: ProjectWithBuilder, currentUserId?: string): Project {
  return {
    id: row.id,
    name: row.name,
    area: [row.locality, row.city].filter(Boolean).join(", "),
    country: row.country,
    siteAddress: row.site_address || undefined,
    currency: row.currency,
    reraNumber: row.rera_number || undefined,
    status: row.status,
    builder: row.builders?.name || "Independent builder",
    value: Number(row.est_value),
    homes: row.homes,
    completion: row.completion_date,
    confidence: row.verification_status === "rera-verified" ? 100 : 72,
    updated: new Date(row.updated_at).toLocaleDateString("en-IN"),
    description: row.description,
    tags: [],
    coordinates: {
      latitude: row.latitude ?? undefined,
      longitude: row.longitude ?? undefined,
    },
    published: row.published,
    viewCount: row.view_count,
    ownedByMe: Boolean(currentUserId && row.builders?.profile_id === currentUserId),
    isDemo: row.is_demo_record,
    verificationState: row.verification_status,
  };
}

export function mapAreaSignal(row: AreaSignalRow): AreaSignal {
  return {
    id: row.id,
    title: row.title,
    area: [row.locality, row.city].filter(Boolean).join(", "),
    state: row.state,
    category: row.status_tag,
    detail: row.description,
    sourceNote: row.source_label,
    eventDate: row.event_date,
    createdAt: Date.parse(row.created_at),
    isDemo: row.is_demo_record,
  };
}

