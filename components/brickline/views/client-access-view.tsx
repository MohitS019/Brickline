"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Clock3,
  Copy,
  Edit3,
  Eye,
  Link2,
  LockKeyhole,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import type {
  Project,
  ProjectStatus,
  Role,
  ViewId,
} from "@/lib/brickline-data";
import type { PanelCopy } from "@/lib/panel-content";
import { Modal } from "@/components/brickline/ui";
import { VerificationBadge } from "@/components/brickline/entity-cards";

type ShareMinutes = 15 | 30 | 60 | 120;
type ShareGrant = {
  id: string;
  clientEmail?: string;
  builderProfileId: string;
  projectId?: string;
  projectName?: string;
  expiresAt: number;
  createdAt: number;
  firstOpenedAt?: number | null;
  revokedAt?: number | null;
  link?: string;
  openCount?: number;
  agentName?: string;
  lastOpenedAt?: number | null;
  lastCountry?: string | null;
  deviceLabel?: string | null;
  token?: string;
};
type AccessDenial = { title: string; message: string };
const durations: { minutes: ShareMinutes; label: string }[] = [
  { minutes: 15, label: "15 minutes" },
  { minutes: 30, label: "30 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 120, label: "2 hours" },
];

export function ClientAccessView({
  role,
  projects,
  copy,
  allPanelsApproved,
  onNavigate,
  onProject,
  onProjectsChange,
  onOpenIntroductions,
}: {
  role: Role;
  projects: Project[];
  copy: PanelCopy;
  allPanelsApproved: boolean;
  onNavigate: (view: ViewId) => void;
  onProject: (id: string) => void;
  onProjectsChange: (project: Project) => void;
  onOpenIntroductions: () => void;
}) {
  const [grants, setGrants] = useState<ShareGrant[]>([]);
  const [clientEmail, setClientEmail] = useState("");
  const [builder, setBuilder] = useState("");
  const [projectId, setProjectId] = useState("");
  const [minutes, setMinutes] = useState<ShareMinutes>(15);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(0);
  const [builderTab, setBuilderTab] = useState<"projects" | "introductions">(
    "projects",
  );
  const [clientTab, setClientTab] = useState<"shares" | "discover">("shares");
  const [editing, setEditing] = useState<Project | null>(null);
  const [secureAccess, setSecureAccess] = useState<{
    token: string;
    grant: ShareGrant;
  } | null>(null);
  const [denial, setDenial] = useState<AccessDenial | null>(null);
  const builders = useMemo(
    () =>
      [
        ...new Set(
          projects
            .filter((project) => project.published !== false)
            .map((project) => project.builder.trim())
            .filter(Boolean),
        ),
      ].sort(),
    [projects],
  );
  const builderProjects = useMemo(
    () =>
      projects.filter(
        (project) => project.builder === builder && project.published !== false,
      ),
    [projects, builder],
  );
  const ownedProjects = projects.filter((project) => project.ownedByMe);
  const knownClients = [
    ...new Set(grants.map((grant) => grant.clientEmail).filter(Boolean)),
  ] as string[];
  useEffect(() => {
    setProjectId(builderProjects[0]?.id || "");
  }, [builder, builderProjects]);
  useEffect(() => {
    const initial = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, []);
  const remaining = (expiresAt: number) => {
    const seconds = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const hours = Math.floor(seconds / 3600);
    const minutesLeft = Math.floor((seconds % 3600) / 60);
    return `${hours ? `${hours}h ` : ""}${String(minutesLeft).padStart(2, "0")}m ${String(seconds % 60).padStart(2, "0")}s`;
  };
  const grantState = (grant: ShareGrant) =>
    grant.revokedAt ? "revoked" : grant.expiresAt <= now ? "expired" : "active";

  const denyAccess = (message: string, code?: string) => {
    setSecureAccess(null);
    onProject("");
    setDenial({
      title:
        code === "revoked"
          ? "Introduction revoked"
          : code === "expired"
            ? "Introduction expired"
            : "Access denied",
      message,
    });
  };

  const openSecureGrant = async (token: string) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/client-grants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "open", token }),
      });
      const result = (await response.json()) as {
        grant?: ShareGrant;
        error?: string;
        code?: string;
      };
      if (!response.ok || !result.grant)
        return denyAccess(
          result.error || "This secure introduction cannot be opened.",
          result.code,
        );
      setDenial(null);
      setSecureAccess({ token, grant: result.grant });
      setNotice(
        `Shared by ${result.grant.agentName || "your agent"} · access expires in ${remaining(result.grant.expiresAt)}.`,
      );
      if (result.grant.projectId) onProject(result.grant.projectId);
    } catch {
      denyAccess("The secure introduction could not be validated.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (role === "Builder") return;
      try {
        const token = new URLSearchParams(location.search).get("grant");
        if (role === "Client" && token) {
          await openSecureGrant(token);
          history.replaceState(null, "", location.pathname);
        }
        const response = await fetch(
          `/api/client-grants?mode=${role.toLowerCase()}`,
          {
            cache: "no-store",
          },
        );
        const result = (await response.json()) as {
          grants?: ShareGrant[];
          error?: string;
        };
        if (!response.ok)
          throw new Error(result.error || "Could not load introductions.");
        if (active) setGrants(result.grants || []);
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load introductions.",
          );
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [role]);

  useEffect(() => {
    if (role !== "Client" || !secureAccess) return;
    let cancelled = false;
    const validate = async () => {
      const response = await fetch("/api/client-grants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "validate", token: secureAccess.token }),
      });
      const result = (await response.json()) as {
        error?: string;
        code?: string;
      };
      if (!cancelled && !response.ok)
        denyAccess(
          result.error || "This secure introduction is no longer active.",
          result.code,
        );
    };
    const interval = window.setInterval(() => void validate(), 10_000);
    const expiry = window.setTimeout(
      () => void validate(),
      Math.max(0, secureAccess.grant.expiresAt - Date.now() + 50),
    );
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(expiry);
    };
  }, [role, secureAccess]);

  const createGrant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(clientEmail.trim()) || !builder || !projectId) {
      setError("Choose a valid client account, builder, and project.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/client-grants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientEmail,
          builderProfileId: builder,
          projectId,
          minutes,
        }),
      });
      const result = (await response.json()) as {
        grant?: ShareGrant;
        token?: string;
        error?: string;
      };
      if (!response.ok || !result.grant || !result.token)
        throw new Error(result.error || "Could not create secure access.");
      const link = `${location.origin}${location.pathname}?grant=${encodeURIComponent(result.token)}`;
      setGrants((current) => [{ ...result.grant!, link }, ...current]);
      setClientEmail("");
      setBuilder("");
      setProjectId("");
      setNotice(
        "Secure introduction created. Copy the link now; its token is not stored in the activity list.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not create secure access.",
      );
    } finally {
      setBusy(false);
    }
  };
  const revoke = async (grantId: string) => {
    setError("");
    const response = await fetch("/api/client-grants", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revoke", grantId }),
    });
    const result = (await response.json()) as { error?: string };
    if (response.ok) {
      setGrants((current) =>
        current.map((grant) =>
          grant.id === grantId ? { ...grant, revokedAt: Date.now() } : grant,
        ),
      );
      setNotice("Introduction revoked. The client link is no longer valid.");
    } else {
      setError(result.error || "Could not revoke this introduction.");
    }
  };
  const publishProject = async (project: Project, published: boolean) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          projectId: project.id,
          published,
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok)
        throw new Error(result.error || "Could not update publishing.");
      onProjectsChange({ ...project, published });
      setNotice(
        published ? "Project published." : "Project moved back to draft.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not update project.",
      );
    } finally {
      setBusy(false);
    }
  };

  if (role === "Client")
    return (
      <div className="page access-page">
        <div className="reference-eyebrow">
          CLIENT PANEL <span>·</span> EXPLORE + SHARED ACCESS
        </div>
        <div className="reference-heading-row">
          <h1>
            {copy.headline} <em>{copy.accent}</em>
          </h1>
        </div>
        {denial && (
          <section className="secure-access-denial" role="alert">
            <LockKeyhole size={30} />
            <span className="micro-label">SERVER-ENFORCED ACCESS</span>
            <h2>{denial.title}</h2>
            <p>{denial.message}</p>
            <button
              className="reference-primary"
              onClick={() => {
                setDenial(null);
                setClientTab("shares");
              }}
            >
              Return to shared projects
            </button>
          </section>
        )}
        {secureAccess && !denial && (
          <div className="secure-access-live" role="status">
            <ShieldCheck size={18} />
            <span>
              <b>Protected introduction active</b>
              {secureAccess.grant.projectName} ·{" "}
              {remaining(secureAccess.grant.expiresAt)} remaining
            </span>
          </div>
        )}
        <div className="admin-main-tabs role-panel-tabs">
          <button
            className={clientTab === "shares" ? "active" : ""}
            onClick={() => setClientTab("shares")}
          >
            Shared with me
          </button>
          <button
            className={clientTab === "discover" ? "active" : ""}
            onClick={() => setClientTab("discover")}
          >
            Discover projects
          </button>
        </div>
        {notice && (
          <div className="builder-approved-banner">
            <ShieldCheck size={18} />
            {notice}
          </div>
        )}
        {error && (
          <p className="access-error" role="alert">
            {error}
          </p>
        )}
        {clientTab === "shares" ? (
          <section className="role-panel-surface">
            <div className="role-panel-heading">
              <div>
                <span className="micro-label">SHARED WITH ME</span>
                <h2>Private introductions</h2>
                <p>
                  Active and expired access shared with your verified account.
                </p>
              </div>
              <span className="access-count">
                <LockKeyhole size={17} />
                {
                  grants.filter((grant) => grantState(grant) === "active")
                    .length
                }{" "}
                active
              </span>
            </div>
            {grants.length ? (
              <div className="shared-with-me-list">
                {grants.map((grant) => {
                  const state = grantState(grant);
                  return (
                    <article key={grant.id} className={state}>
                      <div>
                        <span className={`share-state ${state}`}>{state}</span>
                        <h3>{grant.builderProfileId}</h3>
                        <p>{grant.projectName || "Builder profile access"}</p>
                        <small>
                          Shared by {grant.agentName || "your agent"} ·{" "}
                          {state === "active"
                            ? `${remaining(grant.expiresAt)} remaining`
                            : state === "revoked"
                              ? "Access revoked"
                              : `Expired ${new Date(grant.expiresAt).toLocaleString()}`}
                        </small>
                      </div>
                      {state === "active" && grant.projectId && grant.token && (
                        <button
                          className="reference-primary"
                          disabled={busy}
                          onClick={() => void openSecureGrant(grant.token!)}
                        >
                          Open secure project <ArrowRight size={14} />
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="access-empty">
                <Users size={28} />
                <b>No introductions yet</b>
                <p>Ask your agent to share a project to see it here.</p>
              </div>
            )}
          </section>
        ) : (
          <section className="role-panel-surface discover-panel">
            <div>
              <span className="micro-label">PUBLIC EXPLORATION</span>
              <h2>Start with the map.</h2>
              <p>{copy.description}</p>
              <button
                className="reference-primary"
                onClick={() => onNavigate("map")}
              >
                Explore map <ArrowRight size={16} />
              </button>
            </div>
            <div className="access-explainer">
              <ShieldCheck size={21} />
              <div>
                <b>Private by design</b>
                <p>
                  Introduction links are account-bound, time-limited, and
                  checked by the server on every open.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    );

  if (role === "Builder")
    return (
      <div className="page access-page">
        <div className="reference-eyebrow">
          BUILDER PANEL <span>·</span> PROJECT OPERATIONS
        </div>
        <div className="reference-heading-row">
          <h1>
            {copy.headline} <em>{copy.accent}</em>
          </h1>
        </div>
        {allPanelsApproved && (
          <div className="builder-approved-banner">
            <ShieldCheck size={18} />
            Admin approved · Agent, Builder, and Client panels are available.
          </div>
        )}
        <div className="admin-main-tabs role-panel-tabs">
          <button
            className={builderTab === "projects" ? "active" : ""}
            onClick={() => setBuilderTab("projects")}
          >
            Manage projects
          </button>
          <button
            className={builderTab === "introductions" ? "active" : ""}
            onClick={() => setBuilderTab("introductions")}
          >
            Introductions
          </button>
        </div>
        {notice && (
          <p className="access-hint" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="access-error" role="alert">
            {error}
          </p>
        )}
        {builderTab === "projects" ? (
          <section className="role-panel-surface">
            <div className="role-panel-heading">
              <div>
                <span className="micro-label">YOUR PUBLISHED FOOTPRINT</span>
                <h2>Manage projects</h2>
                <p>
                  Edit project information, control publishing, and monitor
                  profile views.
                </p>
              </div>
              <button
                className="reference-primary"
                onClick={() => onNavigate("projects")}
              >
                <Plus size={15} />
                Add project
              </button>
            </div>
            {ownedProjects.length ? (
              <div
                className="builder-project-table"
                role="table"
                aria-label="Your published projects"
              >
                <div className="builder-project-table-head" role="row">
                  <span>Project</span>
                  <span>Status</span>
                  <span>Publishing</span>
                  <span>Views</span>
                  <span>Actions</span>
                </div>
                {ownedProjects.map((project) => (
                  <div
                    className="builder-project-table-row"
                    role="row"
                    key={project.id}
                  >
                    <span>
                      <b>{project.name}</b>
                      <small>{project.area}</small>
                    </span>
                    <span>
                      <i
                        className={`project-stage-dot ${project.status.toLowerCase().replaceAll(" ", "-")}`}
                      />
                      {project.status}
                    </span>
                    <span>
                      {project.published ? (
                        <>
                          <ShieldCheck size={14} />
                          Published
                        </>
                      ) : (
                        <>
                          <Clock3 size={14} />
                          Draft
                        </>
                      )}
                    </span>
                    <span>
                      <Eye size={14} />
                      {project.viewCount || 0}
                    </span>
                    <span>
                      <button onClick={() => setEditing(project)}>
                        <Edit3 size={14} />
                        Edit
                      </button>
                      <button
                        disabled={busy}
                        onClick={() =>
                          publishProject(project, !project.published)
                        }
                      >
                        {project.published ? (
                          <LockKeyhole size={14} />
                        ) : (
                          <Send size={14} />
                        )}{" "}
                        {project.published ? "Unpublish" : "Publish"}
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="access-empty">
                <Plus size={28} />
                <b>No projects in your account</b>
                <p>Add a RERA-registered project to begin.</p>
              </div>
            )}
          </section>
        ) : (
          <section className="role-panel-surface introduction-bridge">
            <LockKeyhole size={28} />
            <div>
              <span className="micro-label">TIME-BOXED ACCESS</span>
              <h2>Access is time-boxed.</h2>
              <p>
                Agents issue server-enforced introductions lasting from 15
                minutes to 2 hours. Open the Agent introduction workspace to
                choose a client, builder, project, and expiry.
              </p>
              <VerificationBadge state="rera-verified" />
              <button
                className="reference-primary"
                disabled={!allPanelsApproved}
                onClick={onOpenIntroductions}
              >
                Open introduction UI <ArrowRight size={15} />
              </button>
              {!allPanelsApproved && (
                <small>Admin approval for the Agent panel is required.</small>
              )}
            </div>
          </section>
        )}
        {editing && (
          <ProjectEditModal
            project={editing}
            onClose={() => setEditing(null)}
            onSaved={(updated) => {
              onProjectsChange(updated);
              setEditing(null);
              setNotice("Project changes saved.");
            }}
          />
        )}
      </div>
    );

  return (
    <div className="page access-page">
      <div className="reference-eyebrow">
        AGENT PANEL <span>·</span> CLIENT INTRODUCTIONS
      </div>
      <div className="reference-heading-row">
        <h1>
          {copy.headline} <em>{copy.accent}</em>
        </h1>
      </div>
      <div className="access-intro">
        <div>
          <span className="micro-label">THE WORKFLOW</span>
          <h2>Choose the right project for your client.</h2>
          <p>{copy.description}</p>
          <button
            className="reference-primary"
            onClick={() => onNavigate("network")}
          >
            Explore builders <ArrowRight size={16} />
          </button>
        </div>
        <div className="access-steps">
          <span>
            <b>01</b> Pick client + builder
          </span>
          <span>
            <b>02</b> Choose a project
          </span>
          <span>
            <b>03</b> Set 15 minutes to 2 hours
          </span>
          <span>
            <b>04</b> Send authenticated access
          </span>
        </div>
      </div>
      <div className="access-grid">
        <section className="access-card">
          <div className="access-card-title">
            <span className="micro-label">SECURE INTRODUCTION</span>
            <Clock3 size={18} />
          </div>
          <h2>New client access</h2>
          <form onSubmit={createGrant}>
            <label>
              Client account
              <input
                type="email"
                list="known-client-accounts"
                value={clientEmail}
                onChange={(event) => setClientEmail(event.target.value)}
                placeholder="client@example.com"
              />
              <datalist id="known-client-accounts">
                {knownClients.map((email) => (
                  <option key={email} value={email} />
                ))}
              </datalist>
              <small>
                Choose a previous client or enter an approved Client email.
              </small>
            </label>
            <label>
              Builder profile
              <select
                value={builder}
                onChange={(event) => setBuilder(event.target.value)}
              >
                <option value="">Select a builder</option>
                {builders.map((name) => (
                  <option key={name}>{name}</option>
                ))}
              </select>
            </label>
            <label>
              Project
              <select
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                disabled={!builder}
              >
                <option value="">Select a published project</option>
                {builderProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend>Access duration</legend>
              <div className="access-duration">
                {durations.map((option) => (
                  <button
                    key={option.minutes}
                    type="button"
                    className={minutes === option.minutes ? "active" : ""}
                    onClick={() => setMinutes(option.minutes)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </fieldset>
            {error && (
              <p className="access-error" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="access-hint" role="status">
                {notice}
              </p>
            )}
            <button
              type="submit"
              className="reference-primary"
              disabled={!projectId || busy}
            >
              <Plus size={15} />
              {busy ? "Creating…" : "Create secure link"}
            </button>
          </form>
        </section>
        <section className="access-card">
          <div className="access-card-title">
            <span className="micro-label">AUDITED ACTIVITY</span>
            <Eye size={18} />
          </div>
          <h2>Introductions</h2>
          <div className="access-metrics">
            <span className="active">
              <b>
                {grants.filter((item) => grantState(item) === "active").length}
              </b>
              ACTIVE
            </span>
            <span className="verified">
              <b>{grants.filter((item) => item.firstOpenedAt).length}</b>OPENED
            </span>
            <span className="rejected">
              <b>{grants.filter((item) => item.revokedAt).length}</b>REVOKED
            </span>
          </div>
          {grants.length ? (
            <div className="access-drafts">
              {grants.map((grant) => (
                <article key={grant.id}>
                  <div>
                    <b>{grant.clientEmail}</b>
                    <small>
                      {grant.builderProfileId} · {grant.projectName}
                    </small>
                    <span>
                      {grantState(grant) === "active"
                        ? `${remaining(grant.expiresAt)} remaining`
                        : grantState(grant)}
                    </span>
                    {grant.link && (
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(grant.link!)
                        }
                      >
                        <Copy size={14} />
                        Copy secure link
                      </button>
                    )}
                  </div>
                  {grantState(grant) === "active" && (
                    <button
                      onClick={() => revoke(grant.id)}
                      aria-label={`Revoke access for ${grant.clientEmail}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="access-empty">
              <Users size={28} />
              <b>No introductions yet</b>
              <p>Create secure, time-limited access for an approved client.</p>
            </div>
          )}
          <div className="access-service-note">
            <Link2 size={17} />
            <p>
              Every create, open, revoke, and expiry decision is server-enforced
              and audited.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function ProjectEditModal({
  project,
  onClose,
  onSaved,
}: {
  project: Project;
  onClose: () => void;
  onSaved: (project: Project) => void;
}) {
  const [name, setName] = useState(project.name);
  const [area, setArea] = useState(project.area);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [description, setDescription] = useState(project.description);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit",
          projectId: project.id,
          name,
          area,
          status,
          description,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        coordinates?: Project["coordinates"];
      };
      if (!response.ok)
        throw new Error(result.error || "Could not save project.");
      onSaved({
        ...project,
        name: name.trim(),
        area: area.trim(),
        status,
        description: description.trim(),
        coordinates: result.coordinates || project.coordinates,
      });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save project.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Edit project" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <label>
          Project name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <label>
          Locality
          <input
            value={area}
            onChange={(event) => setArea(event.target.value)}
            required
          />
        </label>
        <label>
          Development stage
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as ProjectStatus)}
          >
            <option>New construction</option>
            <option>Redevelopment</option>
            <option>Approval stage</option>
            <option>Construction started</option>
          </select>
        </label>
        <label>
          Description
          <textarea
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
          />
        </label>
        {error && (
          <p className="access-error" role="alert">
            {error}
          </p>
        )}
        <div className="modal-buttons">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
