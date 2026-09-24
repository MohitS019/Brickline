"use client";
import { ReactNode, useEffect } from "react";
import { Building2, Check, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { network, type Project, type ViewId } from "@/lib/brickline-data";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </header>
  );
}
export function EmptyState({
  title,
  body,
  icon: Icon = Search,
  action,
}: {
  title: string;
  body: string;
  icon?: LucideIcon;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state component-empty-state">
      <Icon size={28} />
      <h3>{title}</h3>
      <p>{body}</p>
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
export function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [message, onClose]);
  return (
    <div className="toast" role="status">
      <span>
        <Check size={15} />
      </span>
      {message}
      <button onClick={onClose} aria-label="Dismiss">
        <X size={15} />
      </button>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [onClose]);
  return (
    <div
      className="modal-layer"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className={wide ? "modal wide" : "modal"}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button onClick={onClose} aria-label="Close">
            <X size={19} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
export function GlobalSearch({
  items,
  query,
  setQuery,
  onClose,
  onNavigate,
  onProject,
}: {
  items: Project[];
  query: string;
  setQuery: (v: string) => void;
  onClose: () => void;
  onNavigate: (v: ViewId) => void;
  onProject: (id: string) => void;
}) {
  const q = query.toLowerCase();
  const foundProjects = items
    .filter((p) => `${p.name} ${p.area} ${p.builder}`.toLowerCase().includes(q))
    .slice(0, 4);
  const foundPeople = network
    .filter((p) =>
      `${p.name} ${p.company} ${p.areas.join(" ")}`.toLowerCase().includes(q),
    )
    .slice(0, 3);
  return (
    <Modal title="Search Brickline" onClose={onClose} wide>
      <div className="search-field large">
        <Search size={19} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, builders, agents or areas"
        />
      </div>
      <div className="search-results">
        {query ? (
          <>
            <span className="eyebrow">PROJECTS</span>
            {foundProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onProject(p.id);
                  onClose();
                }}
              >
                <span className="result-icon">
                  <Building2 size={17} />
                </span>
                <span>
                  <b>{p.name}</b>
                  <small>
                    {p.area} · {p.builder}
                  </small>
                </span>
              </button>
            ))}
            <span className="eyebrow result-section">PEOPLE & COMPANIES</span>
            {foundPeople.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onNavigate("network");
                  onClose();
                }}
              >
                <span
                  className="result-icon person"
                  style={{ background: p.color }}
                >
                  {p.initials}
                </span>
                <span>
                  <b>{p.name}</b>
                  <small>
                    {p.company} · {p.kind}
                  </small>
                </span>
              </button>
            ))}
            {!foundProjects.length && !foundPeople.length && (
              <EmptyState
                title="No matches"
                body="Try another project, company, person or area."
              />
            )}
          </>
        ) : (
          <div className="search-hint">
            <p>Quickly find any project, builder, agent or market.</p>
            <div>
              <button
                onClick={() => {
                  onNavigate("projects");
                  onClose();
                }}
              >
                Browse projects
              </button>
              <button
                onClick={() => {
                  onNavigate("network");
                  onClose();
                }}
              >
                Open network
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
