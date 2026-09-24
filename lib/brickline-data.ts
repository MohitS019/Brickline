export type Role = "Agent" | "Builder" | "Client";
export type ViewId =
  | "overview"
  | "map"
  | "projects"
  | "network"
  | "areas"
  | "marketplace"
  | "radar"
  | "alerts"
  | "profile"
  | "client-access"
  | "admin";
export type ProjectStatus =
  | "New construction"
  | "Redevelopment"
  | "Approval stage"
  | "Construction started";

export interface Project {
  id: string;
  name: string;
  area: string;
  country?: string;
  siteAddress?: string;
  currency?: string;
  reraNumber?: string;
  status: ProjectStatus;
  builder: string;
  value: number;
  homes: number;
  completion: string;
  confidence: number;
  updated: string;
  description: string;
  tags: string[];
  coordinates: { latitude?: number; longitude?: number };
  published?: boolean;
  viewCount?: number;
  ownedByMe?: boolean;
  isDemo?: boolean;
}

export interface NetworkMember {
  id: string;
  name: string;
  kind: Role;
  company: string;
  areas: string[];
  specialties: string[];
  deals: number;
  rating: number;
  initials: string;
  color: string;
}

export interface Opportunity {
  id: string;
  title: string;
  builder: string;
  area: string;
  type: string;
  commission: string;
  deadline: string;
  matches: number;
  description: string;
}

export interface RadarSignal {
  id: string;
  title: string;
  area: string;
  type: ProjectStatus;
  when: string;
  confidence: number;
  detail: string;
  projectId?: string;
}

export interface AreaSignal {
  id: string;
  title: string;
  area: string;
  state: string;
  category: ProjectStatus;
  detail: string;
  sourceNote: string;
  eventDate: string;
  createdAt: number;
  isDemo?: boolean;
}

// Live project, builder, and signal records are loaded from the shared workspace API.
export const projects: Project[] = [];
export const network: NetworkMember[] = [];
export const opportunities: Opportunity[] = [];
export const signals: RadarSignal[] = [];

export const statusColor: Record<ProjectStatus, string> = {
  "New construction": "#6f746f",
  Redevelopment: "#6f746f",
  "Approval stage": "#c8832f",
  "Construction started": "#3d6753",
};
