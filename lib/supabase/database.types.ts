export type BricklineRole = "Agent" | "Builder" | "Client";
export type AccountStatus = "pending" | "approved" | "suspended" | "rejected";
export type VerificationStatus = "rera-verified" | "pending" | "unverified";
export type SupabaseProjectStatus =
  | "New construction"
  | "Redevelopment"
  | "Approval stage"
  | "Construction started";

export type ProfileRow = {
  id: string;
  email: string;
  full_name: string;
  role: BricklineRole;
  status: AccountStatus;
  company_name: string;
  city: string;
  rera_number: string | null;
  gst_number: string | null;
  phone: string | null;
  business_address: string | null;
  contact_person: string | null;
  agency_name: string | null;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  is_admin: boolean;
  agent_access: boolean;
  builder_access: boolean;
  client_access: boolean;
  consent_version: string;
  consent_at: string | null;
  consent_withdrawn_at: string | null;
  deletion_requested_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
};

export type BuilderRow = {
  id: string;
  profile_id: string | null;
  name: string;
  verification_status: VerificationStatus;
  locality: string;
  city: string;
  is_demo_record: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectRow = {
  id: string;
  name: string;
  builder_id: string;
  locality: string;
  city: string;
  country: string;
  site_address: string | null;
  currency: string;
  rera_number: string | null;
  status: SupabaseProjectStatus;
  est_value: number;
  homes: number;
  completion_date: string;
  description: string;
  latitude: number | null;
  longitude: number | null;
  published: boolean;
  view_count: number;
  verification_status: VerificationStatus;
  is_demo_record: boolean;
  created_at: string;
  updated_at: string;
};

export type IntroductionRow = {
  id: string;
  agent_id: string;
  client_id: string;
  builder_id: string;
  project_id: string | null;
  duration_minutes: number;
  created_at: string;
  expires_at: string;
  opened_at: string | null;
  last_opened_at: string | null;
  revoked_at: string | null;
  expiry_logged_at: string | null;
  open_count: number;
  bound_device_hash: string | null;
  last_country: string | null;
  device_label: string | null;
};

export type AreaSignalRow = {
  id: string;
  title: string;
  description: string;
  status_tag: SupabaseProjectStatus;
  locality: string;
  city: string;
  state: string;
  source_label: string;
  event_date: string;
  is_demo_record: boolean;
  created_at: string;
};

