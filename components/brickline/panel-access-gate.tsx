"use client";

import { useState } from "react";
import { Clock3, LockKeyhole, RefreshCw } from "lucide-react";
import type { PanelAccess } from "@/lib/panel-access";
import type { Role } from "@/lib/brickline-data";

export function PanelAccessGate({ access }: { access: PanelAccess }) {
  const [role, setRole] = useState<Role>(access.requestedRole || "Builder");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState(access.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/panel-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, company }) });
      const result = await response.json() as { error?: string; status?: "pending" };
      if (!response.ok) throw new Error(result.error || "Could not send request.");
      setStatus("pending");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send request."); }
    finally { setBusy(false); }
  };

  return <main className="approval-shell"><div className="approval-brand">Brick<span>line.</span></div><section className="approval-card"><div className="approval-icon"><LockKeyhole size={26}/></div><span className="micro-label">PANEL ACCESS</span>
    {access.mode === "signed-out" ? <><h1>Sign in to continue.</h1><p>Each panel is linked to a signed-in account so the admin can manage access.</p><a className="reference-primary" href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in with ChatGPT</a></> :
    access.mode === "unavailable" ? <><h1>Access check unavailable.</h1><p>We cannot confirm your permissions right now. Please try again shortly.</p><button className="reference-primary" onClick={() => location.reload()}><RefreshCw size={15}/>Retry</button></> :
    status === "pending" ? <><h1>Request sent for review.</h1><p>An admin will review your {role.toLowerCase()} request. Your panels open after approval.</p><div className="approval-status"><Clock3 size={18}/> Pending admin decision</div><button className="reference-primary" onClick={() => location.reload()}><RefreshCw size={15}/>Check status</button></> :
    status === "suspended" ? <><h1>Access is suspended.</h1><p>An admin has paused your panel access. Contact the site owner if you think this is a mistake.</p><button className="reference-primary" onClick={() => location.reload()}><RefreshCw size={15}/>Check status</button></> :
    status === "approved" ? <><h1>No panels assigned.</h1><p>Your account is approved, but no panels are currently enabled. Ask an admin to grant access.</p><button className="reference-primary" onClick={() => location.reload()}><RefreshCw size={15}/>Check status</button></> :
    <><h1>{status === "declined" ? "Your request was declined." : "Request access."}</h1><p>{status === "declined" ? "You can update your profession and submit a new request." : "Choose your profession. An admin will decide which panels you can open."}</p><form onSubmit={submit}><label>Profession<select value={role} onChange={event => setRole(event.target.value as Role)}><option value="Agent">Real-estate agent</option><option value="Builder">Builder / developer</option><option value="Client">Client</option></select></label>{role === "Builder" && <label>Company name<input value={company} onChange={event => setCompany(event.target.value)} minLength={2} maxLength={120} required placeholder="Your building company"/></label>}{error && <p className="access-error" role="alert">{error}</p>}<button className="reference-primary" disabled={busy}>{busy ? "Sending…" : "Request access"}</button></form></>}
    <small>Signed in as {access.email || "a guest"}</small>
  </section></main>;
}
