"use client";

import { useEffect, useState } from "react";
import { Check, Clock3, LockKeyhole, RefreshCw, ShieldCheck, X } from "lucide-react";
import type { BuilderAccess } from "@/lib/builder-access";

type RequestRow = { userId: string; email: string; name: string; company: string; status: string; requestedAt: number };

export function BuilderApprovalGate({ access }: { access: BuilderAccess }) {
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState(access.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/builder-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company }) });
      const result = await response.json() as { error?: string; status?: "pending" };
      if (!response.ok) throw new Error(result.error || "Could not send request.");
      setStatus("pending");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send request."); }
    finally { setBusy(false); }
  };

  return <main className="approval-shell"><div className="approval-brand">Brick<span>line.</span></div><section className="approval-card"><div className="approval-icon"><LockKeyhole size={26}/></div><span className="micro-label">BUILDER ACCESS</span>{access.mode === "signed-out" ? <><h1>Sign in to request access.</h1><p>Your builder workspace needs an identifiable account before an admin can review it.</p><a className="reference-primary" href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in with ChatGPT</a></> : access.mode === "unavailable" ? <><h1>Access check unavailable.</h1><p>We cannot confirm your approval right now. Please try again shortly.</p><button className="reference-primary" onClick={() => location.reload()}><RefreshCw size={15}/>Retry</button></> : status === "pending" ? <><h1>Request sent for review.</h1><p>An admin must approve your Builder access. You will be able to enter the Builder workspace after approval.</p><div className="approval-status"><Clock3 size={18}/> Pending admin decision</div><button className="reference-primary" onClick={() => location.reload()}><RefreshCw size={15}/>Check status</button></> : <><h1>{status === "declined" ? "Access was not approved." : "Request Builder access."}</h1><p>{status === "declined" ? "You can update your company and submit a new request." : "Tell the admin which company you represent. No Builder features are available until they approve you."}</p><form onSubmit={submit}><label>Company name<input value={company} onChange={event => setCompany(event.target.value)} minLength={2} maxLength={120} required placeholder="Your building company"/></label>{error && <p className="access-error" role="alert">{error}</p>}<button className="reference-primary" disabled={busy}>{busy ? "Sending…" : "Request access"}</button></form></>}<small>Signed in as {access.email || "a guest"}</small></section></main>;
}

export function AdminApprovals() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/builder-access", { cache: "no-store" }).then(async response => {
      const result = await response.json() as { requests?: RequestRow[]; error?: string };
      if (!response.ok) throw new Error(result.error || "Could not load requests.");
      if (active) setRows(result.requests || []);
    }).catch(cause => { if (active) setError(cause instanceof Error ? cause.message : "Could not load requests."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const review = async (userId: string, status: "approved" | "declined") => {
    setBusyId(userId); setError("");
    try {
      const response = await fetch("/api/builder-access", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, status }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save decision.");
      setRows(current => current.map(row => row.userId === userId ? { ...row, status } : row));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save decision."); }
    finally { setBusyId(""); }
  };
  const pending = rows.filter(row => row.status === "pending");
  return <section className="admin-approvals"><div className="admin-approvals-head"><div><span className="micro-label">ADMIN REVIEW</span><h2>Builder access requests</h2></div><ShieldCheck size={24}/></div>{loading ? <p>Loading requests…</p> : error ? <p className="access-error" role="alert">{error}</p> : pending.length ? <div className="admin-request-list">{pending.map(row => <article key={row.userId}><div><b>{row.name}</b><span>{row.company}</span><small>{row.email} · Requested {new Date(row.requestedAt).toLocaleDateString()}</small></div><div><button disabled={busyId === row.userId} onClick={() => review(row.userId, "approved")}><Check size={15}/>Approve</button><button disabled={busyId === row.userId} onClick={() => review(row.userId, "declined")}><X size={15}/>Decline</button></div></article>)}</div> : <p>No pending Builder requests.</p>}</section>;
}
