"use client";

import { useState } from "react";
import { Clock3, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import type { PanelAccess } from "@/lib/panel-access";
import type { Role } from "@/lib/brickline-data";

export function PanelAccessGate({ access }: { access: PanelAccess }) {
  const [role, setRole] = useState<Role>(access.requestedRole || "Builder");
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [phone, setPhone] = useState("");
  const [reraNumber, setReraNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [status, setStatus] = useState(access.status);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [consent, setConsent] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/panel-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role, company, name, businessAddress, contactPerson, agencyName, phone, reraNumber, gstNumber, consent }) });
      const result = await response.json() as { error?: string; status?: "pending" | "approved"; instant?: boolean };
      if (!response.ok) throw new Error(result.error || "Could not send request.");
      if (result.instant) location.reload(); else setStatus("pending");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send request."); }
    finally { setBusy(false); }
  };

  const acceptConsent = async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/privacy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "consent" }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save consent.");
      location.reload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save consent."); setBusy(false); }
  };

  return <main className="approval-shell"><div className="approval-brand">Brick<span>line.</span></div><section className="approval-card"><div className="approval-icon"><LockKeyhole size={26}/></div><span className="micro-label">PANEL ACCESS</span>
    {access.mode === "signed-out" ? <><h1>Sign in to continue.</h1><p>Each panel is linked to a signed-in account so the admin can manage access.</p><a className="reference-primary" href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in with ChatGPT</a></> :
    access.mode === "unavailable" ? <><h1>Access check unavailable.</h1><p>We cannot confirm your permissions right now. Please try again shortly.</p><button className="reference-primary" onClick={() => location.reload()}><RefreshCw size={15}/>Retry</button></> :
    access.needsConsent ? <><h1>Review privacy choices.</h1><p>Before using protected panels, accept the current privacy notice for account verification, projects, secure introductions, fraud prevention, and audit records.</p><div className="approval-status"><ShieldCheck size={18}/> No marketing consent included</div><label className="consent-choice"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)}/><span>I have read the <a href="/privacy">Privacy Notice</a> and consent to the stated product-data processing.</span></label>{error && <p className="access-error" role="alert">{error}</p>}<button className="reference-primary" disabled={!consent || busy} onClick={acceptConsent}>{busy ? "Saving…" : "Accept and enter"}</button></> :
    status === "pending" ? <><h1>Request sent for review.</h1><p>An admin will review your {role.toLowerCase()} request. Your panels open after approval.</p><div className="approval-status"><Clock3 size={18}/> Pending admin decision</div><button className="reference-primary" onClick={() => location.reload()}><RefreshCw size={15}/>Check status</button></> :
    status === "suspended" ? <><h1>Access is suspended.</h1><p>An admin has paused your panel access. Contact the site owner if you think this is a mistake.</p><button className="reference-primary" onClick={() => location.reload()}><RefreshCw size={15}/>Check status</button></> :
    status === "approved" ? <><h1>No panels assigned.</h1><p>Your account is approved, but no panels are currently enabled. Ask an admin to grant access.</p><button className="reference-primary" onClick={() => location.reload()}><RefreshCw size={15}/>Check status</button></> :
    <><h1>{status === "declined" ? "Your registration was declined." : "Create your India account."}</h1><p>{status === "declined" ? access.rejectionReason || "Update the details below and submit again." : "Choose your profession. Builder and Agent details go to admin review; Clients enter immediately after verified sign-in."}</p><form onSubmit={submit} className="registration-form"><label>Profession<select value={role} onChange={event => setRole(event.target.value as Role)}><option value="Agent">Real-estate agent</option><option value="Builder">Builder / developer</option><option value="Client">Client</option></select></label><label>Full name<input value={name} onChange={event => setName(event.target.value)} minLength={2} maxLength={120} required placeholder="Your legal name"/></label>{role === "Builder" && <><label>Company name<input value={company} onChange={event => setCompany(event.target.value)} minLength={2} maxLength={120} required placeholder="Registered company name"/></label><label>Registered business address<textarea value={businessAddress} onChange={event => setBusinessAddress(event.target.value)} maxLength={300} required rows={3} placeholder="Registered office address in India"/></label><label>Contact person<input value={contactPerson} onChange={event => setContactPerson(event.target.value)} maxLength={120} required placeholder="Authorized contact"/></label></>}{role === "Agent" && <label>Agency name (optional)<input value={agencyName} onChange={event => setAgencyName(event.target.value)} maxLength={120} placeholder="Agency or brokerage"/></label>}{role !== "Client" && <><label>Phone<input type="tel" value={phone} onChange={event => setPhone(event.target.value)} required placeholder="+91 98765 43210"/></label><label>{role === "Builder" ? "RERA promoter registration" : "RERA agent registration"}<input value={reraNumber} onChange={event => setReraNumber(event.target.value)} maxLength={80} required placeholder="Registration number"/></label>{role === "Builder" && <label>GST number<input value={gstNumber} onChange={event => setGstNumber(event.target.value.toUpperCase())} minLength={15} maxLength={15} required placeholder="15-character GSTIN"/></label>}</>}<label>Verified email<input value={access.email || ""} readOnly aria-readonly="true"/><small>Verified through your sign-in provider.</small></label><label className="consent-choice"><input type="checkbox" checked={consent} onChange={event => setConsent(event.target.checked)} required/><span>I have read the <a href="/privacy">Privacy Notice</a> and consent to identity, RERA/GST, role, project, secure-sharing, fraud-prevention, and audit processing.</span></label>{error && <p className="access-error" role="alert">{error}</p>}<button className="reference-primary" disabled={busy || !consent}>{busy ? "Sending…" : role === "Client" ? "Verify and enter" : "Submit for admin review"}</button></form></>}
    <small>Signed in as {access.email || "a guest"}</small>
  </section></main>;
}
