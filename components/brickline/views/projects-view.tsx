"use client";
import { useMemo, useState } from "react";
import { Grid2X2, List, Plus, Search, SlidersHorizontal } from "lucide-react";
import { type Project, type ProjectStatus } from "@/lib/brickline-data";
import { ProjectCard } from "@/components/brickline/entity-cards";
import { EmptyState, PageHeader } from "../ui";

export function ProjectsView({
  items,
  saved,
  onProject,
  onSave,
  onAdd,
}: {
  items: Project[];
  saved: Set<string>;
  onProject: (id: string) => void;
  onSave: (id: string) => void;
  onAdd: () => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"All" | ProjectStatus>("All");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState("Recently updated");
  const filtered = useMemo(
    () =>
      items
        .filter(
          (project) =>
            (status === "All" || project.status === status) &&
            `${project.name} ${project.area} ${project.builder}`
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "Highest value"
            ? b.value - a.value
            : sort === "Most homes"
              ? b.homes - a.homes
              : 0,
        ),
    [items, query, status, sort],
  );
  return (
    <div className="page">
      <PageHeader
        eyebrow="INDIA PROJECT DIRECTORY"
        title="Projects"
        description="RERA-registered Indian projects appear here after a verified Builder adds them."
        actions={
          <button className="button primary" onClick={onAdd}>
            <Plus size={16} />
            Add project
          </button>
        }
      />
      <div className="toolbar">
        <div className="search-field">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search project, builder, city, or state"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
        >
          <option>All</option>
          <option>New construction</option>
          <option>Redevelopment</option>
          <option>Approval stage</option>
          <option>Construction started</option>
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value)}>
          <option>Recently updated</option>
          <option>Highest value</option>
          <option>Most homes</option>
        </select>
        <div className="view-toggle">
          <button
            className={layout === "grid" ? "active" : ""}
            onClick={() => setLayout("grid")}
          >
            <Grid2X2 size={16} />
          </button>
          <button
            className={layout === "list" ? "active" : ""}
            onClick={() => setLayout("list")}
          >
            <List size={17} />
          </button>
        </div>
      </div>
      <div className="result-bar">
        <span>
          <SlidersHorizontal size={14} />
          {filtered.length} projects
        </span>
        <button
          onClick={() => {
            setQuery("");
            setStatus("All");
          }}
        >
          Clear filters
        </button>
      </div>
      {filtered.length ? (
        <div
          className={
            layout === "grid" ? "project-grid" : "project-grid list-layout"
          }
        >
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              saved={saved.has(project.id)}
              onSave={() => onSave(project.id)}
              onOpen={() => onProject(project.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects yet"
          body="Add the first RERA-registered Indian project, or clear your filters."
        />
      )}
    </div>
  );
}
