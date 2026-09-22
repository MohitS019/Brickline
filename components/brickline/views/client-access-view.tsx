"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, Eye, Link2, LockKeyhole, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import type { Project, Role, ViewId } from "@/lib/brickline-data";

type ShareDraft = { id: string; clientName: string; clientEmail: string; builder: string; minutes: 15 | 30; createdAt: string };
const storageKey = "brickline-share-drafts-v1";

export function ClientAccessView({ role, projects, onNavigate }: { role: Role; projects: Project[]; onNavigate: (view: ViewId) => void }) {
  const [drafts, setDrafts] = useState<ShareDraft[]>([]);
  const [ready, setReady] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [builder, setBuilder] = useState("");
  const [minutes, setMinutes] = useState<15 | 30>(15);
  const [error, setError] = useState("");
  const builders = useMemo(() => [...new Set(projects.map(project => project.builder.trim()).filter(Boolean))].sort(), [projects]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
        if (Array.isArray(parsed)) setDrafts(parsed.filter(item => item && typeof item.id === "string" && typeof item.clientEmail === "string"));
      } catch { /* An invalid local draft file is ignored. */ }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (ready) localStorage.setItem(storageKey, JSON.stringify(drafts)); }, [drafts, ready]);

  const saveDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!clientName.trim() || !/^\S+@\S+\.\S+$/.test(clientEmail.trim()) || !builder) {
      setError("Enter a client name, a valid email, and a builder.");
      return;
    }
    setDrafts(current => [{ id: crypto.randomUUID(), clientName: clientName.trim(), clientEmail: clientEmail.trim().toLowerCase(), builder, minutes, createdAt: new Date().toISOString() }, ...current]);
    setClientName(""); setClientEmail(""); setBuilder(""); setError("");
  };

  if (role === "Client") return <div className="page access-page"><div className="reference-eyebrow">CLIENT PANEL <span>·</span> EXPLORE + SHARED ACCESS</div><div className="reference-heading-row"><h1>Explore freely. <em>Meet the builder</em> through your agent.</h1></div><div className="access-intro"><div><span className="micro-label">PUBLIC EXPLORATION</span><h2>Start with the map.</h2><p>Browse locations, project summaries, and area intelligence. Builder contact details and private profile information are not part of public browsing.</p><button className="reference-primary" onClick={() => onNavigate("map")}>Explore map <ArrowRight size={16}/></button></div><div><span className="micro-label">SHARED WITH ME</span><h2>Your private introductions.</h2><p>When an agent shares a builder profile, it will appear here for the time they choose. Only the invited, signed-in client will be able to open it.</p><span className="access-count"><LockKeyhole size={17}/> No active shares</span></div></div><section className="access-explainer"><ShieldCheck size={21}/><div><b>Private by design</b><p>Access links, countdowns, and view receipts will become available after secure client accounts and shared storage are connected. There are no simulated shares in this preview.</p></div></section></div>;

  if (role === "Builder") return <div className="page access-page"><div className="reference-eyebrow">BUILDER PANEL <span>·</span> PROFILE ACCESS</div><div className="reference-heading-row"><h1>Keep your profile <em>in your control.</em></h1></div><div className="access-intro"><div><span className="micro-label">YOUR PUBLIC FOOTPRINT</span><h2>Publish projects.</h2><p>Project summaries and their map locations help agents and clients discover your work. Your builder profile stays behind an agent introduction for clients.</p><button className="reference-primary" onClick={() => onNavigate("projects")}>Manage projects <ArrowRight size={16}/></button></div><div><span className="micro-label">PRIVATE PROFILE</span><h2>Access is time-boxed.</h2><p>Agents can prepare 15- or 30-minute introductions to a specific client. Live invitations and activity tracking require secure accounts and shared storage.</p><span className="access-count"><LockKeyhole size={17}/> No live access granted</span></div></div></div>;

  return <div className="page access-page"><div className="reference-eyebrow">AGENT PANEL <span>·</span> CLIENT INTRODUCTIONS</div><div className="reference-heading-row"><h1>From discovery to <em>a trusted introduction.</em></h1></div><div className="access-intro"><div><span className="micro-label">THE WORKFLOW</span><h2>Choose the right builder for your client.</h2><p>Find a builder on the map, prepare a client-specific invitation, then grant access for 15 or 30 minutes once secure sharing is connected.</p><button className="reference-primary" onClick={() => onNavigate("network")}>Explore builders <ArrowRight size={16}/></button></div><div className="access-steps"><span><b>01</b> Pick client + builder</span><span><b>02</b> Set a 15- or 30-minute window</span><span><b>03</b> Send authenticated access</span><span><b>04</b> See real view activity</span></div></div><div className="access-grid"><section className="access-card"><div className="access-card-title"><span className="micro-label">PREPARE AN INTRODUCTION</span><Clock3 size={18}/></div><h2>New client share</h2><p className="access-caption">Save the details as a private draft on this device. A draft does not send a link or grant access.</p><form onSubmit={saveDraft}><label>Client name<input value={clientName} onChange={event => setClientName(event.target.value)} placeholder="Client's name"/></label><label>Client email<input type="email" value={clientEmail} onChange={event => setClientEmail(event.target.value)} placeholder="client@example.com"/></label><label>Builder profile<select value={builder} onChange={event => setBuilder(event.target.value)}><option value="">Select a builder</option>{builders.map(name => <option key={name} value={name}>{name}</option>)}</select></label><fieldset><legend>Access duration</legend><div className="access-duration"><button type="button" className={minutes === 15 ? "active" : ""} onClick={() => setMinutes(15)}>15 minutes</button><button type="button" className={minutes === 30 ? "active" : ""} onClick={() => setMinutes(30)}>30 minutes</button></div></fieldset>{error && <p className="access-error" role="alert">{error}</p>}<button type="submit" className="reference-primary" disabled={!builders.length}><Plus size={15}/>Save draft</button>{!builders.length && <small className="access-hint">Add a real project first to make its builder available.</small>}</form></section><section className="access-card"><div className="access-card-title"><span className="micro-label">CLIENT ACTIVITY</span><Eye size={18}/></div><h2>Introductions</h2><div className="access-metrics"><span><b>{drafts.length}</b>LOCAL DRAFTS</span><span><b>0</b>ACTIVE SHARES</span><span><b>0</b>VERIFIED VIEWS</span></div>{drafts.length ? <div className="access-drafts">{drafts.map(draft => <article key={draft.id}><div><b>{draft.clientName}</b><small>{draft.clientEmail}</small><span>{draft.builder} · {draft.minutes} min · Draft, not sent</span></div><button onClick={() => setDrafts(current => current.filter(item => item.id !== draft.id))} aria-label={`Delete draft for ${draft.clientName}`}><Trash2 size={16}/></button></article>)}</div> : <div className="access-empty"><Users size={28}/><b>No introductions prepared</b><p>Client and builder details you enter will show here as local drafts.</p></div>}<div className="access-service-note"><Link2 size={17}/><p>Live links, expiration, and view receipts are unavailable until authentication and a shared database are connected.</p></div></section></div></div>;
}
