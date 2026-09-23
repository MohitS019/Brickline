"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Copy, Eye, Link2, LockKeyhole, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import type { Project, Role, ViewId } from "@/lib/brickline-data";
import type { PanelCopy } from "@/lib/panel-content";

type ShareMinutes = 15 | 30 | 60 | 120;
type ShareGrant = { id: string; clientEmail?: string; builderProfileId: string; expiresAt: number; createdAt: number; firstOpenedAt?: number | null; revokedAt?: number | null; link?: string };
const durations: { minutes: ShareMinutes; label: string }[] = [
  { minutes: 15, label: "15 minutes" }, { minutes: 30, label: "30 minutes" },
  { minutes: 60, label: "1 hour" }, { minutes: 120, label: "2 hours" },
];

export function ClientAccessView({ role, projects, copy, allPanelsApproved, onNavigate }: { role: Role; projects: Project[]; copy: PanelCopy; allPanelsApproved: boolean; onNavigate: (view: ViewId) => void }) {
  const [grants, setGrants] = useState<ShareGrant[]>([]);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [builder, setBuilder] = useState("");
  const [minutes, setMinutes] = useState<ShareMinutes>(15);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(0);
  const builders = useMemo(() => [...new Set(projects.map(project => project.builder.trim()).filter(Boolean))].sort(), [projects]);
  useEffect(() => { const initial = window.setTimeout(() => setNow(Date.now()), 0); const timer = window.setInterval(() => setNow(Date.now()), 60_000); return () => { window.clearTimeout(initial); window.clearInterval(timer); }; }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (role === "Builder") return;
      try {
        const token = new URLSearchParams(location.search).get("grant");
        if (role === "Client" && token) {
          const opened = await fetch("/api/client-grants", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "open", token }) });
          const result = await opened.json() as { grant?: ShareGrant; error?: string };
          if (!opened.ok) throw new Error(result.error || "Could not open secure access.");
          history.replaceState(null, "", location.pathname);
          if (active) setNotice(`Secure access opened for ${result.grant?.builderProfileId}.`);
        }
        const response = await fetch("/api/client-grants", { cache: "no-store" });
        const result = await response.json() as { grants?: ShareGrant[]; error?: string };
        if (!response.ok) throw new Error(result.error || "Could not load introductions.");
        if (active) setGrants(result.grants || []);
      } catch (cause) { if (active) setError(cause instanceof Error ? cause.message : "Could not load introductions."); }
    };
    void load(); return () => { active = false; };
  }, [role]);

  const createGrant = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clientName.trim() || !/^\S+@\S+\.\S+$/.test(clientEmail.trim()) || !builder) {
      setError("Enter a client name, a valid email, and a builder."); return;
    }
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/client-grants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clientEmail, builderProfileId: builder, minutes }) });
      const result = await response.json() as { grant?: ShareGrant; token?: string; error?: string };
      if (!response.ok || !result.grant || !result.token) throw new Error(result.error || "Could not create secure access.");
      const link = `${location.origin}${location.pathname}?grant=${encodeURIComponent(result.token)}`;
      setGrants(current => [{ ...result.grant!, link }, ...current]);
      setClientName(""); setClientEmail(""); setBuilder(""); setNotice("Secure link created. Copy it now; the token is not stored in the activity list.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create secure access."); }
    finally { setBusy(false); }
  };
  const revoke = async (grantId: string) => {
    const response = await fetch("/api/client-grants", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revoke", grantId }) });
    if (response.ok) setGrants(current => current.map(grant => grant.id === grantId ? { ...grant, revokedAt: Date.now() } : grant));
  };

  if (role === "Client") return <div className="page access-page">
    <div className="reference-eyebrow">CLIENT PANEL <span>·</span> EXPLORE + SHARED ACCESS</div>
    <div className="reference-heading-row"><h1>{copy.headline} <em>{copy.accent}</em></h1></div>
    <div className="access-intro"><div><span className="micro-label">PUBLIC EXPLORATION</span><h2>Start with the map.</h2><p>{copy.description}</p><button className="reference-primary" onClick={() => onNavigate("map")}>Explore map <ArrowRight size={16}/></button></div><div><span className="micro-label">SHARED WITH ME</span><h2>Your private introductions.</h2><p>Only links addressed to your verified account can open. Every access is checked by the server until it expires.</p><span className="access-count"><LockKeyhole size={17}/> {grants.length} active {grants.length === 1 ? "share" : "shares"}</span></div></div>
    {notice && <div className="builder-approved-banner"><ShieldCheck size={18}/>{notice}</div>}{error && <p className="access-error" role="alert">{error}</p>}{grants.length > 0 && <section className="access-card"><h2>Active builder access</h2><div className="access-drafts">{grants.map(grant => <article key={grant.id}><div><b>{grant.builderProfileId}</b><span>Expires {new Date(grant.expiresAt).toLocaleString()}</span></div></article>)}</div></section>}
    <section className="access-explainer"><ShieldCheck size={21}/><div><b>Private by design</b><p>Secure links are signed, account-bound, validated on the server, automatically rejected after expiry, and recorded in the audit trail.</p></div></section>
  </div>;

  if (role === "Builder") return <div className="page access-page">
    <div className="reference-eyebrow">BUILDER PANEL <span>·</span> PROFILE ACCESS</div>
    <div className="reference-heading-row"><h1>{copy.headline} <em>{copy.accent}</em></h1></div>
    {allPanelsApproved && <div className="builder-approved-banner"><ShieldCheck size={18}/> Admin approved · Agent, Builder, and Client panels are available in the panel switcher.</div>}
    <div className="access-intro"><div><span className="micro-label">YOUR PUBLIC FOOTPRINT</span><h2>Publish projects.</h2><p>{copy.description}</p><button className="reference-primary" onClick={() => onNavigate("projects")}>Manage projects <ArrowRight size={16}/></button></div><div><span className="micro-label">PRIVATE PROFILE</span><h2>Access is time-boxed.</h2><p>Agents can issue server-enforced introductions lasting from 15 minutes to 2 hours. Expired or revoked links are rejected automatically.</p><span className="access-count"><LockKeyhole size={17}/> Protected access</span></div></div>
  </div>;

  return <div className="page access-page">
    <div className="reference-eyebrow">AGENT PANEL <span>·</span> CLIENT INTRODUCTIONS</div>
    <div className="reference-heading-row"><h1>{copy.headline} <em>{copy.accent}</em></h1></div>
    <div className="access-intro"><div><span className="micro-label">THE WORKFLOW</span><h2>Choose the right builder for your client.</h2><p>{copy.description}</p><button className="reference-primary" onClick={() => onNavigate("network")}>Explore builders <ArrowRight size={16}/></button></div><div className="access-steps"><span><b>01</b> Pick client + builder</span><span><b>02</b> Choose a 15-minute to 2-hour window</span><span><b>03</b> Send authenticated access</span><span><b>04</b> See real view activity</span></div></div>
    <div className="access-grid"><section className="access-card"><div className="access-card-title"><span className="micro-label">SECURE INTRODUCTION</span><Clock3 size={18}/></div><h2>New client access</h2><p className="access-caption">The client must already have an approved Client account. A signed, account-bound link expires automatically.</p><form onSubmit={createGrant}><label>Client name<input value={clientName} onChange={event => setClientName(event.target.value)} placeholder="Client's name"/></label><label>Verified client email<input type="email" value={clientEmail} onChange={event => setClientEmail(event.target.value)} placeholder="client@example.com"/></label><label>Builder profile<select value={builder} onChange={event => setBuilder(event.target.value)}><option value="">Select a builder</option>{builders.map(name => <option key={name} value={name}>{name}</option>)}</select></label><fieldset><legend>Access duration</legend><div className="access-duration">{durations.map(option => <button key={option.minutes} type="button" className={minutes === option.minutes ? "active" : ""} onClick={() => setMinutes(option.minutes)}>{option.label}</button>)}</div></fieldset>{error && <p className="access-error" role="alert">{error}</p>}{notice && <p className="access-hint" role="status">{notice}</p>}<button type="submit" className="reference-primary" disabled={!builders.length || busy}><Plus size={15}/>{busy ? "Creating…" : "Create secure link"}</button>{!builders.length && <small className="access-hint">Add a real project first to make its builder available.</small>}</form></section>
    <section className="access-card"><div className="access-card-title"><span className="micro-label">AUDITED ACTIVITY</span><Eye size={18}/></div><h2>Introductions</h2><div className="access-metrics"><span><b>{grants.filter(item => !item.revokedAt && item.expiresAt > now).length}</b>ACTIVE</span><span><b>{grants.filter(item => item.firstOpenedAt).length}</b>OPENED</span><span><b>{grants.filter(item => item.revokedAt).length}</b>REVOKED</span></div>{grants.length ? <div className="access-drafts">{grants.map(grant => <article key={grant.id}><div><b>{grant.clientEmail}</b><small>{grant.builderProfileId}</small><span>{grant.revokedAt ? "Revoked" : grant.expiresAt <= now ? "Expired" : `Expires ${new Date(grant.expiresAt).toLocaleString()}`} · {grant.firstOpenedAt ? "Opened" : "Not opened"}</span>{grant.link && <button type="button" onClick={() => navigator.clipboard.writeText(grant.link!)}><Copy size={14}/>Copy secure link</button>}</div>{!grant.revokedAt && grant.expiresAt > now && <button onClick={() => revoke(grant.id)} aria-label={`Revoke access for ${grant.clientEmail}`}><Trash2 size={16}/></button>}</article>)}</div> : <div className="access-empty"><Users size={28}/><b>No introductions yet</b><p>Create secure, time-limited access for an approved client.</p></div>}<div className="access-service-note"><Link2 size={17}/><p>Every create, open, revoke, and expiry decision is enforced on the server and recorded for audit.</p></div></section></div>
  </div>;
}
