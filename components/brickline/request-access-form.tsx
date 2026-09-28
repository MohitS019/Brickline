"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import type { Role } from "@/lib/brickline-data";
import { BrandLogo } from "./brand-logo";

export function RequestAccessForm({
  initialRole,
  email,
  signedIn,
  signInHref,
  currentStatus,
}: {
  initialRole: Role;
  email: string;
  signedIn: boolean;
  signInHref: string;
  currentStatus: string | null;
}) {
  const [role, setRole] = useState<Role>(initialRole);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [city, setCity] = useState("");
  const [reraNumber, setReraNumber] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!signedIn) {
      window.location.assign(signInHref);
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/panel-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "public-request",
          role,
          name,
          company,
          agencyName: role === "Agent" ? company : "",
          businessAddress: city,
          contactPerson: name,
          reraNumber,
          gstNumber,
          consent,
        }),
      });
      const result = (await response.json()) as {
        error?: string;
        instant?: boolean;
      };
      if (!response.ok)
        throw new Error(result.error || "Could not submit your request.");
      if (result.instant) {
        window.location.assign("/");
        return;
      }
      setSubmitted(true);
      setMessage("Your request is now in the Admin account review queue.");
    } catch (cause) {
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Could not submit your request.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="access-page public-site">
      <header className="public-topbar compact">
        <Link href="/" className="site-brand">
          <BrandLogo />
        </Link>
        <Link href="/" className="public-login">
          <ArrowLeft size={15} />
          Back to Brickline
        </Link>
      </header>
      <section className="access-layout">
        <div className="access-intro">
          <span className="reference-eyebrow">REQUEST ACCESS</span>
          <h1>
            Choose the panel that matches <em>your work.</em>
          </h1>
          <p>
            Your verified sign-in email identifies the request. Builder and
            Agent registrations enter Admin review; Clients can enter after
            verified sign-in and consent.
          </p>
          <div className="access-assurances">
            <span>
              <ShieldCheck size={18} />
              RERA/GST details are encrypted
            </span>
            <span>
              <CheckCircle2 size={18} />
              Panel access is enforced on the server
            </span>
          </div>
        </div>
        <form className="access-public-form" onSubmit={submit}>
          <fieldset className="access-role-picker">
            <legend>Profession</legend>
            {(["Agent", "Builder", "Client"] as Role[]).map((option) => (
              <label key={option} className={role === option ? "selected" : ""}>
                <input
                  type="radio"
                  name="role"
                  value={option}
                  checked={role === option}
                  onChange={() => setRole(option)}
                />
                <b>{option}</b>
              </label>
            ))}
          </fieldset>
          <label>
            Full name
            <input
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your legal name"
            />
          </label>
          <label>
            Verified email
            <input
              type="email"
              value={email}
              readOnly
              placeholder={signedIn ? "" : "Verified after sign-in"}
            />
            <small>
              {signedIn
                ? "Confirmed by your sign-in provider."
                : "Sign in before submission to verify this field."}
            </small>
          </label>
          <label>
            {role === "Client" ? "Company (optional)" : "Company or agency"}
            <input
              required={role !== "Client"}
              maxLength={120}
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              placeholder="Organisation name"
            />
          </label>
          <label>
            City
            <input
              required
              maxLength={120}
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="e.g. Pune"
            />
          </label>
          {role !== "Client" && (
            <label>
              {role === "Builder"
                ? "RERA promoter registration"
                : "RERA agent registration"}
              <input
                required
                maxLength={80}
                value={reraNumber}
                onChange={(event) => setReraNumber(event.target.value)}
                placeholder="Registration number"
              />
            </label>
          )}
          {role !== "Client" && (
            <label>
              GST number
              <input
                required
                minLength={15}
                maxLength={15}
                value={gstNumber}
                onChange={(event) =>
                  setGstNumber(event.target.value.toUpperCase())
                }
                placeholder="15-character GSTIN"
              />
            </label>
          )}
          <label className="consent-choice">
            <input
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
              required
            />
            <span>
              I have read the <Link href="/privacy">Privacy Notice</Link> and
              consent to the stated verification and access processing.
            </span>
          </label>
          {currentStatus && !submitted && (
            <p className="access-form-message">
              Current account status: <b>{currentStatus}</b>
            </p>
          )}
          {message && (
            <p
              className={
                submitted ? "access-form-success" : "access-form-message"
              }
              role="status"
            >
              {message}
            </p>
          )}
          <button
            className="reference-primary"
            disabled={
              busy ||
              !consent ||
              submitted ||
              currentStatus === "approved" ||
              currentStatus === "pending"
            }
          >
            {busy
              ? "Submitting…"
              : !signedIn
                ? "Sign in to submit"
                : submitted
                  ? "Request submitted"
                  : role === "Client"
                    ? "Verify and enter"
                    : "Submit for Admin review"}
          </button>
        </form>
      </section>
    </main>
  );
}
