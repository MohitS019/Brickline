"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  LockKeyhole,
  Search,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  X,
} from "lucide-react";
import type { Project, Role } from "@/lib/brickline-data";
import type { PanelContent, PanelCopy } from "@/lib/panel-content";
import { BuilderCard } from "@/components/brickline/entity-cards";

type Account = {
  userId: string;
  email: string;
  name: string;
  company: string;
  status: "pending" | "approved" | "declined" | "suspended";
  requestedRole: Role;
  agentAccess: number;
  builderAccess: number;
  clientAccess: number;
  requestedAt: number;
  reviewedAt: number | null;
  businessAddress?: string | null;
  contactPerson?: string | null;
  agencyName?: string | null;
  phone?: string | null;
  reraNumber?: string | null;
  gstNumber?: string | null;
  rejectionReason?: string | null;
  verifiedAt?: number | null;
  isDemo?: boolean;
};
type Action = "approve" | "decline" | "suspend" | "restore" | "set-panels";
const panels: {
  role: Role;
  key: "agentAccess" | "builderAccess" | "clientAccess";
}[] = [
  { role: "Agent", key: "agentAccess" },
  { role: "Builder", key: "builderAccess" },
  { role: "Client", key: "clientAccess" },
];

export function AdminView({
  panelContent,
  projects,
  onContentChange,
}: {
  panelContent: PanelContent;
  projects: Project[];
  onContentChange: (role: Role, copy: PanelCopy) => void;
}) {
  const [section, setSection] = useState<
    "access" | "content" | "signals" | "security"
  >("access");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [filter, setFilter] = useState<"all" | Account["status"]>("all");
  const [query, setQuery] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<string, string>
  >({});
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    let active = true;
    fetch("/api/panel-access", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as {
          requests?: Account[];
          error?: string;
        };
        if (!response.ok)
          throw new Error(result.error || "Could not load accounts.");
        if (active) setAccounts(result.requests || []);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Could not load accounts.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);
  const shown = useMemo(
    () =>
      accounts.filter(
        (account) =>
          (filter === "all" || account.status === filter) &&
          `${account.name} ${account.email} ${account.company} ${account.requestedRole}`
            .toLowerCase()
            .includes(query.toLowerCase()),
      ),
    [accounts, filter, query],
  );
  const mutate = async (
    account: Account,
    action: Action,
    newPanels?: Record<Role, boolean>,
    reason?: string,
  ) => {
    setBusyId(account.userId);
    setError("");
    try {
      const response = await fetch("/api/panel-access", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: account.userId,
          action,
          panels: newPanels,
          reason,
        }),
      });
      const result = (await response.json()) as {
        account?: Account;
        error?: string;
      };
      if (!response.ok || !result.account)
        throw new Error(result.error || "Could not save change.");
      setAccounts((current) =>
        current.map((item) =>
          item.userId === account.userId
            ? { ...item, ...result.account! }
            : item,
        ),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not save change.",
      );
    } finally {
      setBusyId("");
    }
  };
  const togglePanel = (account: Account, role: Role) =>
    mutate(account, "set-panels", {
      Agent:
        role === "Agent" ? !account.agentAccess : Boolean(account.agentAccess),
      Builder:
        role === "Builder"
          ? !account.builderAccess
          : Boolean(account.builderAccess),
      Client:
        role === "Client"
          ? !account.clientAccess
          : Boolean(account.clientAccess),
    });
  return (
    <div className="page admin-page">
      <div className="reference-eyebrow">
        ADMIN CONTROL <span>·</span> INDIA PLATFORM
      </div>
      <div className="reference-heading-row">
        <h1>
          Manage access <em>and verified activity.</em>
        </h1>
      </div>
      <div className="admin-main-tabs">
        <button
          className={section === "access" ? "active" : ""}
          onClick={() => setSection("access")}
        >
          Account review
        </button>
        <button
          className={section === "content" ? "active" : ""}
          onClick={() => setSection("content")}
        >
          Panel content
        </button>
        <button
          className={section === "signals" ? "active" : ""}
          onClick={() => setSection("signals")}
        >
          Area signals
        </button>
        <button
          className={section === "security" ? "active" : ""}
          onClick={() => setSection("security")}
        >
          Security audit
        </button>
      </div>
      {section === "content" ? (
        <div className="admin-content-grid">
          {panels.map((panel) => (
            <PanelContentEditor
              key={panel.role}
              role={panel.role}
              copy={panelContent[panel.role]}
              onSaved={(copy) => onContentChange(panel.role, copy)}
            />
          ))}
        </div>
      ) : section === "signals" ? (
        <AreaSignalEditor />
      ) : section === "security" ? (
        <SecurityAuditView />
      ) : (
        <>
          <div className="admin-summary">
            <span className="pending">
              <b>
                {accounts.filter((item) => item.status === "pending").length}
              </b>
              Pending
            </span>
            <span className="approved">
              <b>
                {accounts.filter((item) => item.status === "approved").length}
              </b>
              Approved
              <small>
                {accounts.filter((item) => item.isDemo).length} demo builders
              </small>
            </span>
            <span className="suspended">
              <b>
                {accounts.filter((item) => item.status === "suspended").length}
              </b>
              Suspended
            </span>
            <span className="neutral">
              <b>{accounts.length}</b>Total accounts
            </span>
          </div>
          <section className="admin-directory">
            <div className="admin-directory-head">
              <div>
                <span className="micro-label">ACCOUNT DIRECTORY</span>
                <h2>India registration review</h2>
                <p>
                  Review RERA/GST details, record a rejection reason, and manage
                  all panel permissions.
                </p>
              </div>
              <button
                onClick={() => {
                  setLoading(true);
                  setRefreshKey((value) => value + 1);
                }}
              >
                Refresh
              </button>
            </div>
            <div className="admin-toolbar">
              <div className="admin-filters">
                {(
                  [
                    "all",
                    "pending",
                    "approved",
                    "suspended",
                    "declined",
                  ] as const
                ).map((value) => (
                  <button
                    key={value}
                    className={filter === value ? "active" : ""}
                    onClick={() => setFilter(value)}
                  >
                    {value === "all"
                      ? "All"
                      : value[0].toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
              <label>
                <Search size={16} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search name, email, company"
                />
              </label>
            </div>
            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}
            {loading ? (
              <p className="admin-empty">Loading accounts…</p>
            ) : shown.length ? (
              <div className="admin-accounts">
                {shown.map((account) => (
                  <article
                    key={account.userId}
                    className={`admin-account status-${account.status}`}
                  >
                    <BuilderCard
                      variant="admin"
                      name={
                        account.company || account.agencyName || account.name
                      }
                      secondary={`${account.name} · ${account.email}`}
                      primaryLocality={
                        account.businessAddress || "India account"
                      }
                      projectCount={
                        projects.filter(
                          (project) =>
                            project.builder ===
                            (account.company ||
                              account.agencyName ||
                              account.name),
                        ).length
                      }
                      verification={
                        account.isDemo
                          ? "demo"
                          : account.status === "approved" &&
                              Boolean(account.reraNumber)
                            ? "rera-verified"
                            : account.status === "pending"
                              ? "pending"
                              : "unverified"
                      }
                      trailing={
                        <em
                          className={`admin-status ${account.status}`}
                          title={
                            account.verifiedAt
                              ? `Verified ${new Date(account.verifiedAt).toLocaleDateString()}`
                              : undefined
                          }
                        >
                          {account.status}
                        </em>
                      }
                    />
                    {account.isDemo && (
                      <p className="admin-demo-note">
                        Illustrative profile from the shared demo dataset.
                      </p>
                    )}
                    <div className="admin-verification-details">
                      <span>
                        <b>Phone</b>
                        {account.phone || "Provider email only"}
                      </span>
                      <span>
                        <b>RERA</b>
                        {account.reraNumber || "Not required"}
                      </span>
                      <span>
                        <b>GST</b>
                        {account.gstNumber || "Not required"}
                      </span>
                      <span>
                        <b>Address / contact</b>
                        {account.businessAddress ||
                          account.contactPerson ||
                          "Not required"}
                      </span>
                    </div>
                    <div className="admin-account-body">
                      <div>
                        <span className="micro-label">REQUESTED</span>
                        <strong>{account.requestedRole}</strong>
                        <small>
                          {new Date(account.requestedAt).toLocaleDateString()}
                        </small>
                      </div>
                      <div className="admin-panel-controls">
                        <span className="micro-label">PANELS</span>
                        <div>
                          {panels.map((panel) => (
                            <button
                              key={panel.role}
                              disabled={
                                busyId === account.userId ||
                                !["approved", "suspended"].includes(
                                  account.status,
                                )
                              }
                              className={account[panel.key] ? "granted" : ""}
                              onClick={() => togglePanel(account, panel.role)}
                              aria-pressed={Boolean(account[panel.key])}
                            >
                              <span>
                                {account[panel.key] ? (
                                  <Check size={13} />
                                ) : (
                                  <X size={13} />
                                )}
                              </span>
                              {panel.role}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="admin-account-actions">
                        {account.status === "pending" ? (
                          <>
                            <input
                              value={rejectionReasons[account.userId] || ""}
                              onChange={(event) =>
                                setRejectionReasons((current) => ({
                                  ...current,
                                  [account.userId]: event.target.value,
                                }))
                              }
                              placeholder="Reason required if declining"
                              maxLength={500}
                            />
                            <button
                              className="approve"
                              disabled={busyId === account.userId}
                              onClick={() => mutate(account, "approve")}
                            >
                              <UserRoundCheck size={15} />
                              Approve
                            </button>
                            <button
                              disabled={
                                busyId === account.userId ||
                                (rejectionReasons[account.userId] || "").trim()
                                  .length < 8
                              }
                              onClick={() =>
                                mutate(
                                  account,
                                  "decline",
                                  undefined,
                                  rejectionReasons[account.userId],
                                )
                              }
                            >
                              <UserRoundX size={15} />
                              Decline
                            </button>
                          </>
                        ) : account.status === "approved" ? (
                          <button
                            disabled={busyId === account.userId}
                            onClick={() => mutate(account, "suspend")}
                          >
                            <LockKeyhole size={15} />
                            Suspend
                          </button>
                        ) : account.status === "suspended" ? (
                          <button
                            className="approve"
                            disabled={busyId === account.userId}
                            onClick={() => mutate(account, "restore")}
                          >
                            <ShieldCheck size={15} />
                            Restore
                          </button>
                        ) : (
                          <span>
                            {account.rejectionReason ||
                              "Can submit a corrected registration"}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="admin-empty">
                <ShieldCheck size={30} />
                <b>No matching accounts</b>
                <p className="empty-guidance">
                  Real registrations appear here after sign-in.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function AreaSignalEditor() {
  const [form, setForm] = useState({
    title: "",
    area: "",
    state: "",
    category: "New construction",
    detail: "",
    sourceNote: "",
    eventDate: new Date().toISOString().slice(0, 10),
  });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/area-signals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(
      response.ok
        ? "Signal published to the Agent Radar."
        : result.error || "Could not publish signal.",
    );
    if (response.ok)
      setForm((current) => ({
        ...current,
        title: "",
        detail: "",
        sourceNote: "",
      }));
    setBusy(false);
  };
  return (
    <form className="admin-content-card signal-editor" onSubmit={submit}>
      <span className="micro-label">MANUAL OPERATIONS FEED</span>
      <h2>Publish an India area signal</h2>
      <p>
        Use a source you have checked. The Radar labels these as manually
        entered, not automated.
      </p>
      <label>
        Signal title
        <input
          required
          maxLength={160}
          value={form.title}
          onChange={(event) =>
            setForm((current) => ({ ...current, title: event.target.value }))
          }
        />
      </label>
      <div className="form-row">
        <label>
          Locality
          <input
            required
            maxLength={120}
            value={form.area}
            onChange={(event) =>
              setForm((current) => ({ ...current, area: event.target.value }))
            }
          />
        </label>
        <label>
          State / UT
          <input
            required
            maxLength={120}
            value={form.state}
            onChange={(event) =>
              setForm((current) => ({ ...current, state: event.target.value }))
            }
          />
        </label>
      </div>
      <div className="form-row">
        <label>
          Category
          <select
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value,
              }))
            }
          >
            <option>New construction</option>
            <option>Redevelopment</option>
            <option>Approval stage</option>
            <option>Construction started</option>
          </select>
        </label>
        <label>
          Event date
          <input
            type="date"
            required
            value={form.eventDate}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                eventDate: event.target.value,
              }))
            }
          />
        </label>
      </div>
      <label>
        Details
        <textarea
          required
          rows={4}
          maxLength={1500}
          value={form.detail}
          onChange={(event) =>
            setForm((current) => ({ ...current, detail: event.target.value }))
          }
        />
      </label>
      <label>
        Source note
        <input
          required
          maxLength={300}
          value={form.sourceNote}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              sourceNote: event.target.value,
            }))
          }
          placeholder="Municipal notice, site visit, builder filing…"
        />
      </label>
      <button className="reference-primary" disabled={busy}>
        {busy ? "Publishing…" : "Publish verified signal"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}

function SecurityAuditView() {
  const [events, setEvents] = useState<
    {
      id: string;
      actor: string;
      eventType: string;
      targetId: string | null;
      createdAt: number;
    }[]
  >([]);
  const [alerts, setAlerts] = useState<{ actor: string; count: number }[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<
    { id: string; actor: string; eventType: string }[]
  >([]);
  const [privacyRequests, setPrivacyRequests] = useState<
    {
      id: string;
      email: string;
      requestType: string;
      status: string;
      createdAt: number;
    }[]
  >([]);
  const [cleanup, setCleanup] = useState("");
  const [error, setError] = useState("");
  const introductionEvents = events.filter((event) =>
    ["grant.created", "grant.expired", "grant.revoked"].includes(
      event.eventType,
    ),
  );
  useEffect(() => {
    Promise.all([
      fetch("/api/security-audit", { cache: "no-store" }),
      fetch("/api/privacy", { cache: "no-store" }),
    ])
      .then(async ([auditResponse, privacyResponse]) => {
        const audit = (await auditResponse.json()) as {
          events?: typeof events;
          alerts?: typeof alerts;
          fraudAlerts?: typeof fraudAlerts;
          error?: string;
        };
        const privacy = (await privacyResponse.json()) as {
          requests?: typeof privacyRequests;
          error?: string;
        };
        if (!auditResponse.ok) throw new Error(audit.error);
        if (!privacyResponse.ok) throw new Error(privacy.error);
        setEvents(audit.events || []);
        setAlerts(audit.alerts || []);
        setFraudAlerts(audit.fraudAlerts || []);
        setPrivacyRequests(privacy.requests || []);
      })
      .catch((cause) =>
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not load audit activity.",
        ),
      );
  }, []);
  const runCleanup = async () => {
    setCleanup("Running…");
    const response = await fetch("/api/retention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    const result = (await response.json()) as {
      removed?: Record<string, number>;
      error?: string;
    };
    setCleanup(
      response.ok
        ? `Removed ${Object.values(result.removed || {}).reduce((sum, value) => sum + Number(value), 0)} expired records.`
        : result.error || "Cleanup failed.",
    );
  };
  const resolvePrivacy = async (
    id: string,
    status: "completed" | "rejected",
  ) => {
    const response = await fetch("/api/privacy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (response.ok)
      setPrivacyRequests((current) =>
        current.map((item) => (item.id === id ? { ...item, status } : item)),
      );
  };
  return (
    <section className="admin-directory">
      <div className="admin-directory-head">
        <div>
          <span className="micro-label">SECURITY + PRIVACY MONITORING</span>
          <h2>Audit activity</h2>
          <p>
            Protected actions, fraud signals, and privacy requests are visible
            only to administrators.
          </p>
        </div>
        <button onClick={runCleanup}>Run retention cleanup</button>
      </div>
      {cleanup && <p className="access-hint">{cleanup}</p>}
      {error && <p className="admin-error">{error}</p>}
      {alerts.length > 0 && (
        <div className="admin-error">
          Unusual grant volume:{" "}
          {alerts.map((alert) => `${alert.actor} (${alert.count})`).join(", ")}
        </div>
      )}
      {fraudAlerts.length > 0 && (
        <div className="admin-error">
          Fraud signals:{" "}
          {fraudAlerts
            .map((alert) => `${alert.eventType} · ${alert.actor}`)
            .join(", ")}
        </div>
      )}
      <div className="introduction-audit">
        <div>
          <span className="micro-label">INTRODUCTION LIFECYCLE</span>
          <h3>Issued, expired and revoked access</h3>
        </div>
        {introductionEvents.length ? (
          <div>
            {introductionEvents.map((event) => {
              const eventState = event.eventType.split(".")[1];
              const state = eventState === "created" ? "issued" : eventState;
              return (
                <p key={`introduction-${event.id}`}>
                  <span className={`share-state ${state}`}>{state}</span>
                  <span>
                    <b>{event.actor}</b>
                    <small>{event.targetId || "No grant ID"}</small>
                  </span>
                  <time>{new Date(event.createdAt).toLocaleString()}</time>
                </p>
              );
            })}
          </div>
        ) : (
          <p className="admin-empty">No introduction activity yet.</p>
        )}
      </div>
      <div className="admin-privacy-queue">
        <span className="micro-label">PRIVACY REQUEST QUEUE</span>
        {privacyRequests.filter((item) => item.status === "pending").length ? (
          privacyRequests
            .filter((item) => item.status === "pending")
            .map((item) => (
              <p key={item.id}>
                <span>
                  <b>{item.requestType}</b> · {item.email} ·{" "}
                  {new Date(item.createdAt).toLocaleString()}
                </span>
                <span>
                  <button onClick={() => resolvePrivacy(item.id, "completed")}>
                    Complete
                  </button>
                  <button onClick={() => resolvePrivacy(item.id, "rejected")}>
                    Reject
                  </button>
                </span>
              </p>
            ))
        ) : (
          <p>No pending privacy requests.</p>
        )}
      </div>
      <div className="admin-accounts">
        {events.map((event) => (
          <article key={event.id} className="admin-account">
            <div className="admin-account-identity">
              <span className="admin-account-avatar">
                <ShieldCheck size={16} />
              </span>
              <div>
                <b>{event.eventType.replaceAll(".", " ")}</b>
                <small>{event.actor}</small>
                <span>{event.targetId || "No target"}</span>
              </div>
              <em className="admin-status approved">
                {new Date(event.createdAt).toLocaleString()}
              </em>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PanelContentEditor({
  role,
  copy,
  onSaved,
}: {
  role: Role;
  copy: PanelCopy;
  onSaved: (copy: PanelCopy) => void;
}) {
  const [draft, setDraft] = useState(copy);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/panel-content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, ...draft }),
      });
      const result = (await response.json()) as {
        content?: PanelCopy;
        error?: string;
      };
      if (!response.ok || !result.content)
        throw new Error(result.error || "Could not save content.");
      setDraft(result.content);
      onSaved(result.content);
      setMessage("Saved.");
    } catch (cause) {
      setMessage(
        cause instanceof Error ? cause.message : "Could not save content.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="admin-content-card" onSubmit={save}>
      <span className="micro-label">{role.toUpperCase()} PANEL</span>
      <h2>{role} introduction</h2>
      <label>
        Heading
        <input
          maxLength={120}
          required
          value={draft.headline}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              headline: event.target.value,
            }))
          }
        />
      </label>
      <label>
        Highlighted phrase
        <input
          maxLength={120}
          required
          value={draft.accent}
          onChange={(event) =>
            setDraft((current) => ({ ...current, accent: event.target.value }))
          }
        />
      </label>
      <label>
        Introduction
        <textarea
          maxLength={1000}
          rows={5}
          required
          value={draft.description}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
        />
      </label>
      <button
        type="submit"
        className="reference-primary"
        disabled={busy || JSON.stringify(draft) === JSON.stringify(copy)}
      >
        {busy ? "Saving…" : "Save content"}
      </button>
      {message && <p>{message}</p>}
    </form>
  );
}
