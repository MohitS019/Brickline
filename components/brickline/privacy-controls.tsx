"use client";

import { useState } from "react";
import { CheckCircle2, Download, PencilLine, Trash2 } from "lucide-react";

type RequestType = "deletion" | "correction" | "export";

export function PrivacyControls() {
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState<RequestType | "">("");
  const [message, setMessage] = useState("");
  const submit = async (action: RequestType) => {
    setBusy(action); setMessage("");
    try {
      const response = await fetch("/api/privacy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, details }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not submit your request.");
      setMessage("Request received. The admin can now review it from the privacy queue."); setDetails("");
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : "Could not submit your request."); }
    finally { setBusy(""); }
  };
  return <section className="privacy-action-card"><span className="micro-label">YOUR PRIVACY REQUESTS</span><h2>Ask for access, correction, or deletion.</h2><p>Tell us what you need. Deletion is reviewed before removal so legally required records and security evidence are handled correctly.</p><label>Optional details<textarea rows={4} maxLength={1000} value={details} onChange={event => setDetails(event.target.value)} placeholder="Describe the account or information involved."/></label><div className="privacy-actions"><button disabled={Boolean(busy)} onClick={() => submit("export")}><Download size={16}/>Request a copy</button><button disabled={Boolean(busy)} onClick={() => submit("correction")}><PencilLine size={16}/>Request correction</button><button className="danger" disabled={Boolean(busy)} onClick={() => submit("deletion")}><Trash2 size={16}/>Request deletion</button></div>{message && <p className="privacy-message" role="status"><CheckCircle2 size={16}/>{message}</p>}</section>;
}
