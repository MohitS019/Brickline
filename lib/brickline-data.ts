export type Role = "Agent" | "Builder";
export type ViewId = "overview" | "map" | "projects" | "network" | "marketplace" | "radar" | "alerts" | "profile";
export type ProjectStatus = "New construction" | "Redevelopment" | "Approval stage" | "Construction started";

export interface Project {
  id: string; name: string; area: string; country?: string; siteAddress?: string; currency?: string;
  status: ProjectStatus; builder: string; value: number; homes: number; completion: string;
  confidence: number; updated: string; description: string; tags: string[];
  coordinates: { x: number; y: number };
}

export interface NetworkMember {
  id: string; name: string; kind: Role; company: string; areas: string[];
  specialties: string[]; deals: number; rating: number; initials: string; color: string;
}

export interface Opportunity {
  id: string; title: string; builder: string; area: string; type: string;
  commission: string; deadline: string; matches: number; description: string;
}

export interface RadarSignal {
  id: string; title: string; area: string; type: ProjectStatus; when: string;
  confidence: number; detail: string; projectId?: string;
}

// The global workspace starts without fabricated project, person, or signal records.
export const projects: Project[] = [];
export const network: NetworkMember[] = [];
export const opportunities: Opportunity[] = [];
export const signals: RadarSignal[] = [];

export const statusColor: Record<ProjectStatus, string> = {
  "New construction": "#3f65d9", "Redevelopment": "#df8c34",
  "Approval stage": "#9b62d6", "Construction started": "#2f8f78",
};
