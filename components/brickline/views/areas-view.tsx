"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Bell, Building2, MapPin, Search } from "lucide-react";
import type { Project, ProjectStatus } from "@/lib/brickline-data";
import { googleMapEmbed } from "@/lib/project-map";

const stages: { label: string; status: ProjectStatus; tone: string }[] = [
  { label: "New projects", status: "New construction", tone: "coral" },
  { label: "Construction started", status: "Construction started", tone: "green" },
  { label: "Redevelopment", status: "Redevelopment", tone: "purple" },
  { label: "Awaiting approval", status: "Approval stage", tone: "amber" },
];

export function AreasView({ items, onProject, onWatch, onMap }: { items: Project[]; onProject: (id: string) => void; onWatch: (area: string) => void; onMap: () => void }) {
  const [draft, setDraft] = useState("");
  const [selected, setSelected] = useState("");
  const areaProjects = useMemo(() => selected ? items.filter(project => `${project.area} ${project.country || ""}`.toLowerCase().includes(selected.toLowerCase())) : [], [items, selected]);
  const builders = useMemo(() => {
    const counts = new Map<string, number>();
    areaProjects.forEach(project => counts.set(project.builder, (counts.get(project.builder) || 0) + 1));
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [areaProjects]);
  const submit = (event: FormEvent) => { event.preventDefault(); setSelected(draft.trim()); };

  return <div className="page reference-page area-page">
    <div className="reference-eyebrow">AREA INTELLIGENCE <span>·</span> LOCALITY STORY</div>
    <div className="reference-heading-row"><h1>From listings to <em>place:</em> an entire locality&apos;s development story, on one page.</h1></div>
    <section className="area-sheet">
      <div className="area-sheet-head"><div><small>Area intelligence</small><h2>{selected || "Choose a place"}</h2><p>{selected ? `${areaProjects.length} projects in this workspace` : "Search any Indian city, neighbourhood, or state to begin."}</p></div><form className="area-search" onSubmit={submit}><Search size={17}/><input value={draft} onChange={event => setDraft(event.target.value)} placeholder="Indian city, neighbourhood, or state" aria-label="Area to research"/><button type="submit">Explore</button></form><button className="area-watch" onClick={() => onWatch(selected)} disabled={!selected}><Bell size={15}/>Watch this area</button></div>
      <div className="area-sheet-grid">
        <article className="area-score"><span className="micro-label">DEVELOPMENT SCORE</span><strong>{areaProjects.length ? "—" : "N/A"}</strong><p>A score needs independently verified market data. Workspace projects alone are not enough.</p><div className="score-baseline"><i/></div><small>{selected ? `Current workspace · ${areaProjects.length} recorded` : "Select a place to inspect it"}</small></article>
        <article className="area-activity"><span className="micro-label">WHAT&apos;S HAPPENING · YOUR WORKSPACE</span>{stages.map(stage => <div className={`area-activity-row ${stage.tone}`} key={stage.status}><span>{stage.label}</span><b>{areaProjects.filter(project => project.status === stage.status).length}</b></div>)}</article>
        <article className="area-builders"><span className="micro-label">BUILDERS IN THIS AREA</span>{builders.length ? builders.slice(0, 4).map(([name, count], index) => <div className="area-builder-row" key={name}><b>{index + 1}</b><span>{name}</span><small>{count} {count === 1 ? "project" : "projects"}</small></div>) : <p className="area-no-builders">No builder records for this area yet.</p>}</article>
      </div>
      <div className="area-sheet-bottom"><div className="area-map-preview"><div className="area-preview-label"><span>GOOGLE MAP <b>·</b> {selected || "INDIA"}</span><strong>{areaProjects.length} mapped projects</strong></div><iframe key={selected || "India"} title={`Map of ${selected || "India"}`} src={googleMapEmbed(selected ? `${selected}, India` : "India", selected ? 11 : 5)} referrerPolicy="no-referrer-when-downgrade" allowFullScreen/></div><div className="area-growth"><span className="micro-label">PROJECTS IN THIS AREA</span>{areaProjects.length ? <div className="area-project-links">{areaProjects.slice(0, 5).map(project => <button key={project.id} onClick={() => onProject(project.id)}><span><b>{project.name}</b><small><MapPin size={12}/>{project.area} · {project.status}</small></span><ArrowRight size={15}/></button>)}</div> : <div className="area-growth-empty"><Building2 size={24}/><h3>No projects here yet</h3><p>As real projects are added, they&apos;ll appear here—without made-up activity or rankings.</p><button onClick={onMap}>Explore the India map <ArrowRight size={14}/></button></div>}</div></div>
    </section>
  </div>;
}
