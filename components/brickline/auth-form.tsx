"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import type { Role } from "@/lib/brickline-data";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "./brand-logo";

export function AuthForm({ returnTo, initialRole, adminMode = false, mode = "login", initialMessage = "" }: { returnTo: string; initialRole: Role; adminMode?: boolean; mode?: "login" | "signup"; initialMessage?: string }) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [consent, setConsent] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [reraNumber, setReraNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(initialMessage);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const supabase = createClient();
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(returnTo);
        router.refresh();
        return;
      }
      if (password !== confirmation) throw new Error("The passwords do not match.");
      if (!consent) throw new Error("Accept the Privacy Notice to create your account.");
      if (role !== "Client" && (!/^[A-Za-z0-9/._ -]{3,80}$/.test(reraNumber.trim()) || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(gstNumber.trim().toUpperCase()))) {
        throw new Error("Enter a valid RERA registration and 15-character GST number.");
      }
      if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
        throw new Error("Use at least 12 characters with uppercase, lowercase, a number, and a symbol.");
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`,
          data: {
            role,
            full_name: name.trim(),
            company_name: company.trim(),
            city: city.trim(),
            rera_number: role === "Client" ? "" : reraNumber.trim(),
            gst_number: role === "Client" ? "" : gstNumber.trim().toUpperCase(),
            privacy_consent: true,
            consent_version: "2026-09-23",
          },
        },
      });
      if (error) throw error;
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setMessage("Check your email to verify your account. Your access will remain pending until Admin approval.");
      }
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="access-page public-site">
      <header className="public-topbar compact">
        <Link href="/" className="site-brand"><BrandLogo /></Link>
        <Link href="/" className="public-login"><ArrowLeft size={15} />Back to Brickline</Link>
      </header>
      <section className="access-layout">
        <div className="access-intro">
          <span className="reference-eyebrow">{adminMode ? "ADMIN · SECURE ACCESS" : "SECURE ACCOUNT ACCESS"}</span>
          <h1>{adminMode ? "Open the protected" : mode === "login" ? "Return to your" : "Request your"} <em>{adminMode ? "Admin workspace." : "Brickline workspace."}</em></h1>
          <p>{adminMode ? "Sign in with the verified administrator account. Admin access is checked again on the server before the panel is rendered." : "Builder and Agent registrations enter Admin review. Client accounts also remain pending until an Admin approves access."}</p>
          <div className="access-assurances">
            <span><ShieldCheck size={18} />Supabase-secured sessions</span>
            <span><CheckCircle2 size={18} />Server-enforced role approval</span>
          </div>
        </div>
        <form className="access-public-form" onSubmit={submit}>
          {!adminMode && <div className="access-role-picker">
            <Link className={mode === "login" ? "selected" : ""} aria-current={mode === "login" ? "page" : undefined} href={`/login?returnTo=${encodeURIComponent(returnTo)}`} prefetch={false}><b>Log in</b></Link>
            <Link className={mode === "signup" ? "selected" : ""} aria-current={mode === "signup" ? "page" : undefined} href={`/login?mode=signup&returnTo=${encodeURIComponent(returnTo)}`} prefetch={false}><b>Sign up</b></Link>
          </div>}
          {mode === "signup" && (
            <fieldset className="access-role-picker">
              <legend>Profession</legend>
              {(["Agent", "Builder", "Client"] as Role[]).map((option) => (
                <label key={option} className={role === option ? "selected" : ""}>
                  <input type="radio" name="role" value={option} checked={role === option} onChange={() => setRole(option)} />
                  <b>{option}</b>
                </label>
              ))}
            </fieldset>
          )}
          {mode === "signup" && <label>Full name<input required minLength={2} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>}
          <label>Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          <label>Password<input required type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 8 : 12} value={password} onChange={(event) => setPassword(event.target.value)} />{mode === "signup" && <small>12+ characters with uppercase, lowercase, a number, and a symbol.</small>}</label>
          {mode === "signup" && <label>Confirm password<input required type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>}
          {mode === "signup" && <label>{role === "Client" ? "Company (optional)" : "Company or agency"}<input required={role !== "Client"} maxLength={120} value={company} onChange={(event) => setCompany(event.target.value)} /></label>}
          {mode === "signup" && <label>City<input required maxLength={120} value={city} onChange={(event) => setCity(event.target.value)} /></label>}
          {mode === "signup" && role !== "Client" && <label>{role === "Builder" ? "RERA promoter registration" : "RERA agent registration"}<input required maxLength={80} value={reraNumber} onChange={(event) => setReraNumber(event.target.value)} /></label>}
          {mode === "signup" && role !== "Client" && <label>GST number<input required minLength={15} maxLength={15} value={gstNumber} onChange={(event) => setGstNumber(event.target.value.toUpperCase())} /></label>}
          {mode === "signup" && <label className="consent-choice"><input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>I have read the <Link href="/privacy" target="_blank">Privacy Notice</Link> and consent to the stated verification and access processing.</span></label>}
          {message && <p className="access-form-message" role="status">{message}</p>}
          <button className="reference-primary" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
        </form>
      </section>
    </main>
  );
}
