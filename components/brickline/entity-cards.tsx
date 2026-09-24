"use client";

import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import {
  ArrowRight,
  Bookmark,
  Building2,
  Database,
  MapPin,
  Shield,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import {
  statusColor,
  type Project,
  type ProjectStatus,
} from "@/lib/brickline-data";

export type VerificationState = "rera-verified" | "pending" | "unverified";

const verificationCopy: Record<VerificationState, string> = {
  "rera-verified": "RERA Verified",
  pending: "Pending Verification",
  unverified: "Unverified",
};

export function VerificationBadge({
  state,
  className = "",
}: {
  state: VerificationState;
  className?: string;
}) {
  const Icon =
    state === "rera-verified"
      ? ShieldCheck
      : state === "pending"
        ? Shield
        : ShieldX;
  return (
    <span className={`verification-badge ${state} ${className}`.trim()}>
      <Icon size={16} />
      <span>{verificationCopy[state]}</span>
    </span>
  );
}

export function DemoBadge() {
  return (
    <span className="demo-record-badge">
      <Database size={14} />
      Demo record
    </span>
  );
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className="project-status-badge"
      style={{ "--status-color": statusColor[status] } as CSSProperties}
    >
      {status}
    </span>
  );
}

export function ProjectCard({
  project,
  variant = "full",
  saved = false,
  onSave,
  onOpen,
  onBuilder,
  cornerAction,
}: {
  project: Project;
  variant?: "full" | "compact" | "popover";
  saved?: boolean;
  onSave?: () => void;
  onOpen: () => void;
  onBuilder?: () => void;
  cornerAction?: ReactNode;
}) {
  const verification: VerificationState = project.isDemo
    ? "pending"
    : "rera-verified";
  const openFromKey = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };
  const builderLabel = onBuilder ? (
    <button
      type="button"
      className="entity-project-builder"
      onClick={(event) => {
        event.stopPropagation();
        onBuilder();
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {project.builder}
    </button>
  ) : (
    <span className="entity-project-builder">{project.builder}</span>
  );
  if (variant === "compact")
    return (
      <article
        className="entity-project-card compact"
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={openFromKey}
      >
        <span
          className="entity-project-thumb"
          style={
            { "--project-color": statusColor[project.status] } as CSSProperties
          }
        >
          <Building2 size={19} />
        </span>
        <span className="entity-project-copy">
          <span className="entity-card-title">{project.name}</span>
          <span className="entity-project-location">
            <MapPin size={12} />
            {project.area}
          </span>
          {builderLabel}
          <span className="entity-card-badges">
            <ProjectStatusBadge status={project.status} />
            <VerificationBadge state={verification} />
            {project.isDemo && <DemoBadge />}
          </span>
        </span>
        <ArrowRight size={15} className="entity-card-arrow" />
      </article>
    );

  return (
    <article className={`entity-project-card ${variant}`}>
      {cornerAction}
      <div
        className="entity-project-visual"
        style={
          { "--project-color": statusColor[project.status] } as CSSProperties
        }
      >
        <Building2 size={variant === "popover" ? 30 : 58} />
        {onSave && (
          <button
            className={saved ? "entity-save saved" : "entity-save"}
            onClick={onSave}
            aria-label={saved ? "Remove saved project" : "Save project"}
          >
            <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <div className="entity-project-body">
        <div className="entity-card-badges">
          <ProjectStatusBadge status={project.status} />
          <VerificationBadge state={verification} />
          {project.isDemo && <DemoBadge />}
        </div>
        <h2>{project.name}</h2>
        <p>
          <span>
            <MapPin size={12} />
            {project.area}
          </span>
          {builderLabel}
        </p>
        {variant !== "popover" && (
          <div className="entity-project-facts">
            <span>
              <b>
                {project.currency || "INR"} {project.value.toLocaleString()}
              </b>
              Est. value
            </span>
            <span>
              <b>{project.homes}</b>Homes
            </span>
            <span>
              <b>{project.completion}</b>Completion
            </span>
          </div>
        )}
        <button className="entity-project-action" onClick={onOpen}>
          {variant === "popover" ? "Open full project" : "View project"}
          <ArrowRight size={14} />
        </button>
      </div>
    </article>
  );
}

export function BuilderCard({
  name,
  projectCount,
  primaryLocality,
  verification = "rera-verified",
  variant = "card",
  secondary,
  trailing,
  onOpen,
}: {
  name: string;
  projectCount: number;
  primaryLocality: string;
  verification?: VerificationState;
  variant?: "card" | "row" | "admin";
  secondary?: string;
  trailing?: ReactNode;
  onOpen?: () => void;
}) {
  const activate = () => onOpen?.();
  const keyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (onOpen && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      onOpen();
    }
  };
  return (
    <div
      className={`entity-builder-card ${variant} ${onOpen ? "interactive" : ""}`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={activate}
      onKeyDown={keyDown}
    >
      <span className="entity-builder-initials">
        {name
          .split(/\s+/)
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
          .toUpperCase()}
      </span>
      <span className="entity-builder-copy">
        <span className="entity-card-title">{name}</span>
        {secondary && (
          <span className="entity-builder-secondary">{secondary}</span>
        )}
        <span className="entity-builder-locality">
          <MapPin size={12} />
          {primaryLocality}
        </span>
        <VerificationBadge state={verification} />
      </span>
      <span className="entity-builder-count">
        <b>{projectCount}</b> {projectCount === 1 ? "project" : "projects"}
      </span>
      {trailing ||
        (onOpen && <ArrowRight size={16} className="entity-card-arrow" />)}
    </div>
  );
}
