"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Building2,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  MapPin,
  MessageSquare,
  Share2,
  Users,
  X,
} from "lucide-react";
import {
  statusColor,
  type AreaSignal,
  type Project,
  type Role,
} from "@/lib/brickline-data";
import { projectMapLocation } from "@/lib/project-map";
import { ProjectStatusBadge } from "@/components/brickline/entity-cards";

type ResearchStep = "overview" | "timeline" | "developer" | "projects" | "area";

interface Props {
  id: string;
  items: Project[];
  signals: AreaSignal[];
  role: Role;
  saved: boolean;
  onClose: () => void;
  onSave: () => void;
  onContact: (recipient: string) => void;
  onNotify: (message: string) => void;
  onProject: (id: string) => void;
  onOpenArea: () => void;
}

const steps: { id: ResearchStep; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "developer", label: "Developer" },
  { id: "projects", label: "Other projects" },
  { id: "area", label: "Area development" },
];

export function ProjectDetail({
  id,
  items,
  signals,
  role,
  saved,
  onClose,
  onSave,
  onContact,
  onNotify,
  onProject,
  onOpenArea,
}: Props) {
  const [step, setStep] = useState<ResearchStep>("overview");
  const project = items.find((item) => item.id === id);
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);
  useEffect(() => {
    void fetch("/api/projects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "view", projectId: id }),
    });
  }, [id]);
  const developerProjects = useMemo(
    () =>
      project ? items.filter((item) => item.builder === project.builder) : [],
    [items, project],
  );
  const otherProjects = developerProjects.filter((item) => item.id !== id);
  const areaProjects = useMemo(
    () =>
      project
        ? items.filter(
            (item) =>
              item.area.trim().toLowerCase() ===
              project.area.trim().toLowerCase(),
          )
        : [],
    [items, project],
  );
  const areaSignals = useMemo(
    () =>
      project
        ? signals.filter(
            (signal) =>
              `${signal.area}, ${signal.state}`
                .toLowerCase()
                .includes(project.area.toLowerCase()) ||
              project.area.toLowerCase().includes(signal.area.toLowerCase()),
          )
        : [],
    [signals, project],
  );
  if (!project) return null;

  const location = projectMapLocation(project);
  const currentIndex = steps.findIndex((item) => item.id === step);
  const startedCount = developerProjects.filter(
    (item) => item.status === "Construction started",
  ).length;
  const totalValue = developerProjects.reduce(
    (sum, item) => sum + item.value,
    0,
  );
  const milestoneState = (
    milestone: "registered" | "approval" | "started" | "completion",
  ) => {
    if (milestone === "registered") return "done";
    if (milestone === "approval")
      return project.status === "Approval stage" ? "current" : "done";
    if (milestone === "started")
      return project.status === "Construction started" ? "current" : "upcoming";
    return project.completion !== "Not scheduled" ? "current" : "upcoming";
  };
  const goBack = () =>
    currentIndex === 0 ? onClose() : setStep(steps[currentIndex - 1].id);
  const goNext = () =>
    currentIndex < steps.length - 1
      ? setStep(steps[currentIndex + 1].id)
      : document
          .querySelector(".research-action-bar")
          ?.scrollIntoView({ behavior: "smooth", block: "end" });
  const share = async () => {
    const payload = {
      title: `${project.name} · Brickline`,
      text: `${project.name} by ${project.builder} in ${project.area}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) await navigator.share(payload);
      else {
        await navigator.clipboard.writeText(`${payload.text} — ${payload.url}`);
        onNotify("Project link copied");
      }
    } catch (error) {
      if ((error as DOMException).name !== "AbortError")
        onNotify("Project could not be shared");
    }
  };

  return (
    <div
      className="drawer-layer research-layer"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="detail-drawer research-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`${project.name} research journey`}
      >
        <header className="research-header">
          <button className="research-back" onClick={goBack}>
            <ArrowLeft size={17} />
            {currentIndex === 0
              ? "Back to map"
              : `Back to ${steps[currentIndex - 1].label}`}
          </button>
          <div>
            <span className="eyebrow">PROJECT RESEARCH</span>
            <h2>{project.name}</h2>
            <p>
              <MapPin size={14} />
              {project.area}, India
            </p>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close research journey"
          >
            <X size={19} />
          </button>
        </header>

        <nav className="research-steps" aria-label="Project research progress">
          {steps.map((item, index) => (
            <button
              key={item.id}
              className={
                step === item.id
                  ? "active"
                  : index < currentIndex
                    ? "complete"
                    : ""
              }
              onClick={() => setStep(item.id)}
              aria-current={step === item.id ? "step" : undefined}
            >
              <span>
                {index < currentIndex ? <CheckCircle2 size={15} /> : index + 1}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="research-content">
          {step === "overview" && (
            <>
              <div
                className="detail-hero research-hero"
                style={
                  {
                    "--project-color": statusColor[project.status],
                  } as React.CSSProperties
                }
              >
                <Building2 className="detail-project-icon" size={82} />
                <div>
                  <ProjectStatusBadge status={project.status} />
                  <strong>
                    {project.currency || "INR"} {project.value.toLocaleString()}
                  </strong>
                  <small>
                    {project.homes} homes ·{" "}
                    {location.exact ? "Exact site mapped" : "Area location"}
                  </small>
                </div>
              </div>
              <section className="research-section">
                <span className="research-kicker">PROJECT OVERVIEW</span>
                <h3>What is being developed</h3>
                <p>{project.description}</p>
                <div className="tag-row">
                  {project.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </section>
              <section className="detail-facts research-facts">
                <div>
                  <Building2 size={18} />
                  <span>
                    <small>Developer</small>
                    <b>{project.builder}</b>
                  </span>
                </div>
                <div>
                  <CalendarDays size={18} />
                  <span>
                    <small>Completion</small>
                    <b>{project.completion}</b>
                  </span>
                </div>
                <div>
                  <MapPin size={18} />
                  <span>
                    <small>Location</small>
                    <b>{location.exact ? "Site address" : "Area only"}</b>
                  </span>
                </div>
                <div>
                  <Users size={18} />
                  <span>
                    <small>Inventory</small>
                    <b>{project.homes} homes</b>
                  </span>
                </div>
              </section>
              <section className="research-section">
                <h3>Project location</h3>
                <p className="location-disclaimer">
                  {location.exact
                    ? `Site address: ${location.label}`
                    : `Showing the ${location.label} area. The builder has not supplied an exact site address.`}
                </p>
                <div className="project-location-map">
                  <iframe
                    key={location.embedUrl}
                    title={`Map for ${project.name}`}
                    src={location.embedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              </section>
              {project.reraNumber && (
                <section className="research-section">
                  <h3>RERA registration</h3>
                  <p>{project.reraNumber}</p>
                  <small>
                    Builder-provided number · visible only to permitted roles
                  </small>
                </section>
              )}
            </>
          )}

          {step === "timeline" && (
            <section className="research-section research-stage">
              <span className="research-kicker">PROJECT TIMELINE</span>
              <h3>From registration to handover</h3>
              <p>
                Milestones reflect the project record. Brickline leaves dates
                blank until a verified Builder supplies them.
              </p>
              <div className="research-timeline">
                <Milestone
                  state={milestoneState("registered")}
                  title="Project registered"
                  detail={project.updated || "Registration recorded"}
                />
                <Milestone
                  state={milestoneState("approval")}
                  title="Approvals and launch"
                  detail={
                    project.status === "Approval stage"
                      ? "Current recorded stage"
                      : "Stage passed in the current record"
                  }
                />
                <Milestone
                  state={milestoneState("started")}
                  title="Construction started"
                  detail={
                    project.status === "Construction started"
                      ? "Current recorded stage"
                      : "Start date not yet supplied"
                  }
                />
                <Milestone
                  state={milestoneState("completion")}
                  title="Completion and handover"
                  detail={
                    project.completion === "Not scheduled"
                      ? "Completion date not yet supplied"
                      : project.completion
                  }
                />
              </div>
            </section>
          )}

          {step === "developer" && (
            <section className="research-section research-stage">
              <span className="research-kicker">DEVELOPER PROFILE</span>
              <div className="developer-heading">
                <span>
                  {project.builder
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")
                    .toUpperCase()}
                </span>
                <div>
                  <h3>{project.builder}</h3>
                  <p>
                    Profile compiled from registered projects in this Brickline
                    workspace.
                  </p>
                </div>
              </div>
              <div className="developer-metrics">
                <span>
                  <b>{developerProjects.length}</b>registered projects
                </span>
                <span>
                  <b>{startedCount}</b>construction started
                </span>
                <span>
                  <b>
                    {new Set(developerProjects.map((item) => item.area)).size}
                  </b>
                  active localities
                </span>
                <span>
                  <b>
                    {project.currency || "INR"} {totalValue.toLocaleString()}
                  </b>
                  recorded value
                </span>
              </div>
              <div className="research-note">
                <Circle size={10} fill="currentColor" />
                Builder verification and RERA review are managed by the
                Brickline administrator.
              </div>
            </section>
          )}

          {step === "projects" && (
            <section className="research-section research-stage">
              <span className="research-kicker">
                DEVELOPER&apos;S OTHER PROJECTS
              </span>
              <h3>More from {project.builder}</h3>
              <p>
                Every result below comes from the same registered project
                database.
              </p>
              {otherProjects.length ? (
                <div className="related-projects">
                  {otherProjects.map((item) => (
                    <button key={item.id} onClick={() => onProject(item.id)}>
                      <span className="related-project-icon">
                        <Building2 size={18} />
                      </span>
                      <span>
                        <b>{item.name}</b>
                        <small>
                          {item.area} · {item.status}
                        </small>
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="research-empty">
                  <Building2 size={25} />
                  <b>No other registered projects</b>
                  <span>
                    This is currently the only project linked to{" "}
                    {project.builder}.
                  </span>
                </div>
              )}
            </section>
          )}

          {step === "area" && (
            <section className="research-section research-stage">
              <span className="research-kicker">AREA DEVELOPMENT</span>
              <h3>{project.area}</h3>
              <p>
                Broader activity from registered projects and
                administrator-checked signals in this locality.
              </p>
              <div className="area-research-grid">
                <span>
                  <b>{areaProjects.length}</b>registered projects
                </span>
                <span>
                  <b>
                    {new Set(areaProjects.map((item) => item.builder)).size}
                  </b>
                  developers
                </span>
                <span>
                  <b>
                    {
                      areaProjects.filter(
                        (item) => item.status === "Construction started",
                      ).length
                    }
                  </b>
                  started
                </span>
                <span>
                  <b>{areaSignals.length}</b>checked signals
                </span>
              </div>
              {areaSignals.length > 0 && (
                <div className="area-signal-list">
                  {areaSignals.slice(0, 3).map((signal) => (
                    <article key={signal.id}>
                      <Clock3 size={16} />
                      <div>
                        <b>{signal.title}</b>
                        <small>
                          {signal.category} ·{" "}
                          {new Date(
                            `${signal.eventDate}T00:00:00`,
                          ).toLocaleDateString()}
                        </small>
                        <p>{signal.detail}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <button className="button secondary" onClick={onOpenArea}>
                Open full area intelligence <ArrowRight size={15} />
              </button>
            </section>
          )}
        </div>

        <div className="research-next">
          <span>
            Step {currentIndex + 1} of {steps.length}
          </span>
          <button onClick={goNext}>
            {currentIndex === steps.length - 1
              ? "Ready to act"
              : `Next: ${steps[currentIndex + 1].label}`}
            <ArrowRight size={16} />
          </button>
        </div>
        <div className="research-action-bar" aria-label="Project actions">
          <button
            className="contact"
            onClick={() => onContact(project.builder)}
          >
            <MessageSquare size={17} />
            {role === "Client" ? "Contact representative" : "Contact developer"}
          </button>
          <button className={saved ? "saved" : ""} onClick={onSave}>
            <Bookmark size={17} fill={saved ? "currentColor" : "none"} />
            {saved ? "Saved" : "Save"}
          </button>
          <button onClick={share}>
            <Share2 size={17} />
            Share
          </button>
        </div>
      </aside>
    </div>
  );
}

function Milestone({
  state,
  title,
  detail,
}: {
  state: "done" | "current" | "upcoming";
  title: string;
  detail: string;
}) {
  return (
    <div className={state}>
      <span>
        {state === "done" ? (
          <CheckCircle2 size={18} />
        ) : state === "current" ? (
          <Clock3 size={18} />
        ) : (
          <Circle size={18} />
        )}
      </span>
      <div>
        <b>{title}</b>
        <small>{detail}</small>
      </div>
      <em>
        {state === "done"
          ? "Recorded"
          : state === "current"
            ? "Current"
            : "Upcoming"}
      </em>
    </div>
  );
}
