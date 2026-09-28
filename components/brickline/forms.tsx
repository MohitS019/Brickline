"use client";
import { FormEvent, useState } from "react";
import type { ProjectStatus } from "@/lib/brickline-data";
import { Modal } from "./ui";

const currencies = [
  ["INR", "Indian rupee"],
  ["USD", "US dollar"],
  ["AED", "UAE dirham"],
  ["EUR", "Euro"],
  ["GBP", "British pound"],
];
export type FormKind = "project" | "opportunity" | "alert" | "message";
export type FormResult =
  | {
      kind: "project";
      name: string;
      area: string;
      country: string;
      siteAddress: string;
      reraNumber: string;
      currency: string;
      builder: string;
      status: ProjectStatus;
      value: number;
      homes: number;
      notes: string;
    }
  | {
      kind: "opportunity";
      name: string;
      area: string;
      country: string;
      builder: string;
      commission: string;
      notes: string;
    }
  | {
      kind: "alert";
      name: string;
      area: string;
      country: string;
      notes: string;
    }
  | { kind: "message"; name: string; notes: string };

export function SimpleFormModal({
  kind,
  recipient = "",
  initialArea = "",
  onClose,
  onSubmit,
}: {
  kind: FormKind;
  recipient?: string;
  initialArea?: string;
  onClose: () => void;
  onSubmit: (result: FormResult) => void;
}) {
  const [name, setName] = useState(recipient);
  const [area, setArea] = useState(initialArea);
  const [siteAddress, setSiteAddress] = useState("");
  const [reraNumber, setReraNumber] = useState("");
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [otherCurrency, setOtherCurrency] = useState("");
  const [notes, setNotes] = useState("");
  const [builder, setBuilder] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("New construction");
  const [value, setValue] = useState("");
  const [homes, setHomes] = useState("");
  const [commission, setCommission] = useState("");
  const titles = {
    project: "Add India project",
    opportunity: "Post opportunity",
    alert: "Create India Radar alert",
    message: "Send message",
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (kind === "project") {
      if (!reraNumber.trim()) {
        setError("Enter the project RERA registration number.");
        return;
      }
      const selectedCurrency = (currency === "OTHER" ? otherCurrency : currency)
        .trim()
        .toUpperCase();
      if (!/^[A-Z]{3}$/.test(selectedCurrency)) return;
      onSubmit({
        kind,
        name: name.trim(),
        area: area.trim(),
        country: "India",
        siteAddress: siteAddress.trim(),
        reraNumber: reraNumber.trim(),
        currency: selectedCurrency,
        builder: builder.trim() || "Your company",
        status,
        value: Number(value) || 0,
        homes: Number(homes) || 0,
        notes: notes.trim(),
      });
    } else if (kind === "opportunity")
      onSubmit({
        kind,
        name: name.trim(),
        area: area.trim(),
        country: "India",
        builder: builder.trim() || "Your company",
        commission: commission.trim() || "To be discussed",
        notes: notes.trim(),
      });
    else if (kind === "alert")
      onSubmit({
        kind,
        name: name.trim(),
        area: area.trim(),
        country: "India",
        notes: notes.trim(),
      });
    else onSubmit({ kind, name: name.trim(), notes: notes.trim() });
    onClose();
  };
  return (
    <Modal title={titles[kind]} onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <label>
          {kind === "project"
            ? "Project name"
            : kind === "opportunity"
              ? "Opportunity title"
              : kind === "alert"
                ? "Alert name"
                : "Recipient"}
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder={
              kind === "message" ? "Person or company" : "Enter a name"
            }
          />
        </label>
        {(kind === "project" || kind === "opportunity") && (
          <label>
            Builder or company
            <input
              value={builder}
              onChange={(event) => setBuilder(event.target.value)}
              required
              placeholder="Company name"
            />
          </label>
        )}
        {kind !== "message" && (
          <label>
            India locality, city, or state
            <input
              value={area}
              onChange={(event) => setArea(event.target.value)}
              required
              placeholder="e.g. Kothrud, Pune, Maharashtra"
            />
            <small>Brickline&apos;s MVP currently covers India only.</small>
          </label>
        )}
        {kind === "project" && (
          <>
            <label>
              Exact site address (optional)
              <input
                value={siteAddress}
                onChange={(event) => setSiteAddress(event.target.value)}
                placeholder="Street address or nearby landmark"
              />
            </label>
            <label>
              RERA project registration number (required)
              <input
                value={reraNumber}
                onChange={(event) => {
                  setReraNumber(event.target.value);
                  setError("");
                }}
                maxLength={80}
                required
              />
              <small>
                Required for every project published on Brickline India.
              </small>
            </label>
            {error && <p className="access-error">{error}</p>}
            <label>
              Development stage
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ProjectStatus)
                }
              >
                <option>New construction</option>
                <option>Redevelopment</option>
                <option>Approval stage</option>
                <option>Construction started</option>
              </select>
            </label>
            <div className="form-row">
              <label>
                Currency
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                >
                  {currencies.map(([code, label]) => (
                    <option key={code} value={code}>
                      {code} · {label}
                    </option>
                  ))}
                  <option value="OTHER">Other currency</option>
                </select>
              </label>
              <label>
                Estimated value
                <input
                  type="number"
                  min="0"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  required
                />
              </label>
            </div>
            {currency === "OTHER" && (
              <label>
                Other currency code
                <input
                  value={otherCurrency}
                  onChange={(event) =>
                    setOtherCurrency(event.target.value.toUpperCase())
                  }
                  minLength={3}
                  maxLength={3}
                  pattern="[A-Z]{3}"
                  required
                />
              </label>
            )}
            <label>
              Number of homes
              <input
                type="number"
                min="0"
                value={homes}
                onChange={(event) => setHomes(event.target.value)}
                required
              />
            </label>
          </>
        )}
        {kind === "opportunity" && (
          <label>
            Partner commission
            <input
              value={commission}
              onChange={(event) => setCommission(event.target.value)}
              required
            />
          </label>
        )}
        <label>
          {kind === "message"
            ? "Message"
            : kind === "alert"
              ? "What should trigger this alert?"
              : "Description"}
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            required
          />
        </label>
        <div className="modal-buttons">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary">
            {kind === "message" ? "Send message" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
