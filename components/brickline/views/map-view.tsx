"use client";

import { type CSSProperties, FormEvent, useMemo, useState } from "react";
import { ArrowRight, MapPin, Plus, Search, X } from "lucide-react";
import { InteractiveProjectMap } from "@/components/brickline/interactive-project-map";
import { ProjectCard } from "@/components/brickline/entity-cards";
import {
  statusColor,
  type Project,
  type ProjectStatus,
  type ViewId,
} from "@/lib/brickline-data";

const statusFilters: { label: string; status: ProjectStatus }[] = [
  { label: "New", status: "New construction" },
  { label: "Started", status: "Construction started" },
  { label: "Redevelopment", status: "Redevelopment" },
  { label: "Approval", status: "Approval stage" },
];
type Suggestion = {
  id: string;
  label: string;
  detail: string;
  kind: "Project" | "Locality" | "Builder";
  projects: Project[];
};

export function MapView({
  items,
  onProject,
  onAdd,
  onNavigate,
}: {
  items: Project[];
  onProject: (id: string) => void;
  onAdd: () => void;
  onNavigate: (view: ViewId) => void;
}) {
  const [draft, setDraft] = useState("");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [focusProjects, setFocusProjects] = useState<Project[] | null>(null);
  const [filter, setFilter] = useState<ProjectStatus | "All">("All");
  const [searchOpen, setSearchOpen] = useState(false);
  const focusedProject = items.find((item) => item.id === focusedId) || null;
  const visibleProjects = useMemo(
    () => items.filter((item) => filter === "All" || item.status === filter),
    [items, filter],
  );
  const mappedCount = visibleProjects.filter(
    (item) =>
      Number.isFinite(item.coordinates.latitude) &&
      Number.isFinite(item.coordinates.longitude),
  ).length;
  const builderCount = new Set(items.map((item) => item.builder)).size;
  const suggestions = useMemo(() => {
    const entries: Suggestion[] = items.map((project) => ({
      id: `project:${project.id}`,
      label: project.name,
      detail: `${project.builder} · ${project.area}`,
      kind: "Project",
      projects: [project],
    }));
    for (const area of [...new Set(items.map((item) => item.area))])
      entries.push({
        id: `area:${area}`,
        label: area,
        detail: `${items.filter((item) => item.area === area).length} registered project(s)`,
        kind: "Locality",
        projects: items.filter((item) => item.area === area),
      });
    for (const builder of [...new Set(items.map((item) => item.builder))])
      entries.push({
        id: `builder:${builder}`,
        label: builder,
        detail: `${items.filter((item) => item.builder === builder).length} registered project(s)`,
        kind: "Builder",
        projects: items.filter((item) => item.builder === builder),
      });
    const query = draft.trim().toLowerCase();
    return (
      query
        ? entries.filter((entry) =>
            `${entry.label} ${entry.detail} ${entry.kind}`
              .toLowerCase()
              .includes(query),
          )
        : entries
    ).slice(0, 8);
  }, [items, draft]);
  const chooseSuggestion = (suggestion: Suggestion) => {
    setDraft(suggestion.label);
    setSearchOpen(false);
    setFocusProjects([...suggestion.projects]);
    setFocusedId(
      suggestion.kind === "Project" ? suggestion.projects[0]?.id || null : null,
    );
  };
  const search = (event: FormEvent) => {
    event.preventDefault();
    if (suggestions[0]) chooseSuggestion(suggestions[0]);
  };
  const reset = () => {
    setDraft("");
    setFocusedId(null);
    setFocusProjects(null);
    setFilter("All");
    setSearchOpen(false);
  };
  const focusProject = (project: Project) => {
    setFocusedId(project.id);
    setFocusProjects([project]);
  };
  return (
    <div className="page reference-page map-home">
      <div className="reference-eyebrow">
        INDIA MAP <span>·</span> PROJECT &amp; AREA INTELLIGENCE
      </div>
      <section className="map-intro">
        <div>
          <h1>
            Discover what&apos;s <em>next</em> in Indian real estate.
          </h1>
          <p>
            RERA projects, verified builders, and checked development signals in
            one workspace.
          </p>
          <div className="map-intro-actions">
            <button className="reference-primary" onClick={onAdd}>
              <Plus size={16} />
              Add RERA project
            </button>
            <button
              className="reference-link"
              onClick={() => onNavigate("areas")}
            >
              Explore an area <ArrowRight size={15} />
            </button>
          </div>
        </div>
        <aside className="map-live-numbers">
          <span className="micro-label">INDIA WORKSPACE</span>
          <div>
            <strong className="stat-neutral">{items.length}</strong> projects{" "}
            <strong className="stat-neutral">{builderCount}</strong> builders
          </div>
          <div>
            <strong className="stat-neutral">
              {new Set(items.map((item) => item.area)).size}
            </strong>{" "}
            localities{" "}
            <strong className="stat-active">
              {
                items.filter((item) => item.status === "Construction started")
                  .length
              }
            </strong>{" "}
            started
          </div>
          <small>
            Demo records are labeled; every count uses this shared workspace
            dataset.
          </small>
        </aside>
      </section>
      <section className="map-explorer">
        <div className="map-search-row">
          <form onSubmit={search} className="map-search-form">
            <Search size={18} />
            <input
              value={draft}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
              onChange={(event) => {
                setDraft(event.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search Indian locality, city, project, or builder..."
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={searchOpen}
              aria-controls="map-search-suggestions"
            />
            <button>
              Explore map <ArrowRight size={15} />
            </button>
            {searchOpen && (
              <div
                className="map-suggestions"
                role="listbox"
                id="map-search-suggestions"
              >
                {suggestions.length ? (
                  suggestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion.id}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => chooseSuggestion(suggestion)}
                    >
                      <span>
                        {suggestion.label}
                        <small>{suggestion.detail}</small>
                      </span>
                      <b>{suggestion.kind}</b>
                    </button>
                  ))
                ) : (
                  <p>No registered project, locality, or builder matches.</p>
                )}
              </div>
            )}
          </form>
          <button className="map-reset" onClick={reset}>
            India view
          </button>
        </div>
        <div className="map-home-grid">
          <div className="map-home-main">
            <div className="map-stage">
              <div className="map-stage-top">
                <div>
                  <span className="micro-label">
                    LIVE PROJECT MAP <b>·</b> INDIA
                  </span>
                  <h2>
                    {items.length
                      ? `${mappedCount} mapped project${mappedCount === 1 ? "" : "s"} in this view`
                      : "Explore India from state to locality level"}
                  </h2>
                </div>
                <div className="map-legend">
                  {statusFilters.map((entry) => (
                    <span key={entry.status}>
                      <i style={{ background: statusColor[entry.status] }} />
                      {entry.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="map-stage-visual">
                <InteractiveProjectMap
                  projects={visibleProjects}
                  selectedId={focusedId}
                  focusProjects={focusProjects}
                  onSelect={(id) => {
                    const project = items.find((item) => item.id === id);
                    if (project) focusProject(project);
                  }}
                />
                {focusedProject && (
                  <ProjectCard
                    project={focusedProject}
                    variant="popover"
                    onOpen={() => onProject(focusedProject.id)}
                    onBuilder={() => onNavigate("network")}
                    cornerAction={
                      <button
                        className="map-summary-close"
                        onClick={() => setFocusedId(null)}
                        aria-label="Close project summary"
                      >
                        <X size={15} />
                      </button>
                    }
                  />
                )}
              </div>
              <div className="map-stage-bottom">
                <span>
                  <MapPin size={14} />
                  {focusedProject
                    ? focusedProject.name
                    : `${mappedCount} visible pins`}
                </span>
                {focusedProject && (
                  <button onClick={() => setFocusedId(null)}>
                    <X size={14} />
                    Clear project
                  </button>
                )}
              </div>
            </div>
            <div className="map-filters">
              <span className="micro-label">FILTER BY STATUS</span>
              <button
                className={filter === "All" ? "active" : ""}
                onClick={() => setFilter("All")}
              >
                All <b>{items.length}</b>
              </button>
              {statusFilters.map((entry) => (
                <button
                  key={entry.status}
                  className={
                    filter === entry.status
                      ? "active status-filter"
                      : "status-filter"
                  }
                  style={
                    {
                      "--status-color": statusColor[entry.status],
                    } as CSSProperties
                  }
                  onClick={() => {
                    setFilter(entry.status);
                    setFocusedId(null);
                  }}
                >
                  {entry.label}{" "}
                  <b>
                    {
                      items.filter((item) => item.status === entry.status)
                        .length
                    }
                  </b>
                </button>
              ))}
            </div>
          </div>
          <aside className="map-home-rail">
            <span className="micro-label accent">IN YOUR INDIA WORKSPACE</span>
            <button onClick={() => onNavigate("projects")}>
              <span>
                Latest projects{" "}
                <small>
                  {items.length ? `${items.length} added` : "No projects yet"}
                </small>
              </span>
              <ArrowRight size={16} />
            </button>
            <button onClick={() => onNavigate("network")}>
              <span>
                Verified builders{" "}
                <small>{builderCount} from project records</small>
              </span>
              <ArrowRight size={16} />
            </button>
            <button onClick={() => onNavigate("radar")}>
              <span>
                Area signals <small>Admin-verified manual feed</small>
              </span>
              <ArrowRight size={16} />
            </button>
            <div className="map-rail-projects">
              <span className="micro-label">PROJECTS MATCHING YOUR VIEW</span>
              {visibleProjects.length ? (
                visibleProjects
                  .slice(0, 4)
                  .map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      variant="compact"
                      onOpen={() => focusProject(project)}
                      onBuilder={() => onNavigate("network")}
                    />
                  ))
              ) : (
                <div className="map-rail-empty component-empty-state">
                  <MapPin size={24} />
                  <p>No registered project matches yet.</p>
                  <button onClick={items.length ? reset : onAdd}>
                    {items.length ? "Clear filters" : "Add the first project"}{" "}
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
