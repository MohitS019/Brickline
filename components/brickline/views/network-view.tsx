"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, LockKeyhole, MapPin, Plus, Search } from "lucide-react";
import type { Project, Role } from "@/lib/brickline-data";
import { googleMapEmbed } from "@/lib/project-map";

export function NetworkView({ items, role, onProject, onAdd }: { items: Project[]; role: Role; onProject: (id: string) => void; onAdd: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const builders = useMemo(() => {
    const groups = new Map<string, Project[]>();
    items.forEach(project => groups.set(project.builder, [...(groups.get(project.builder) || []), project]));
    return [...groups].filter(([name]) => name.toLowerCase().includes(query.toLowerCase()));
  }, [items, query]);
  const active = selected ? items.filter(project => project.builder === selected) : [];
  const areas = [...new Set(active.map(project => [project.area, project.country].filter(Boolean).join(", ")))];

  return <div className="page reference-page builders-page">
    <div className="reference-eyebrow">BUILDER INTELLIGENCE <span>·</span> PROJECT FOOTPRINTS</div>
    <div className="reference-heading-row"><h1>Know <em>who&apos;s building</em> before the listing appears.</h1>{role === "Builder" && <button className="reference-primary" onClick={onAdd}><Plus size={16}/>Add project</button>}</div>
    {selected && active.length ? <section className="builder-profile">
      <button className="back-link" onClick={() => setSelected(null)}><ArrowLeft size={16}/>All builders</button>
      <div className="builder-profile-hero"><span className="builder-monogram">{selected.split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}</span><div><span className="micro-label">{role === "Client" ? "PUBLIC BUILDER SUMMARY" : "BUILDER PROFILE · WORKSPACE DATA"}</span><h2>{selected}</h2><p>{role === "Client" ? `${active.length} mapped projects` : areas.join(" · ")}</p></div>{role !== "Client" && <div className="builder-profile-stats"><span><b>{active.length}</b>PROJECTS</span><span><b>{active.filter(project => project.status === "Construction started").length}</b>STARTED</span><span><b>{active.filter(project => project.status === "Approval stage").length}</b>APPROVAL</span></div>}</div>
      {role === "Client" ? <div className="access-locked"><LockKeyhole size={30}/><h3>Full builder profile is private</h3><p>Ask your agent to share this builder with your signed-in client account. Access can run from 15 minutes to 2 hours and expires on the server.</p><small>Open an active invitation from Client Access to view the protected profile.</small></div> : <><div className="builder-profile-tabs"><span>Projects ({active.length})</span><span>India map footprint</span><small>Project records are user-added; account verification is shown separately.</small></div><div className="builder-profile-body"><div className="builder-project-list">{active.map(project => <button key={project.id} onClick={() => onProject(project.id)}><span className="builder-project-icon"><Building2 size={18}/></span><span><b>{project.name}</b><small>{project.area} · {project.status}</small></span><ArrowRight size={16}/></button>)}</div><div className="builder-footprint"><span className="micro-label">INDIA PROJECT FOOTPRINT</span><iframe title={`Project footprint for ${selected}`} src={googleMapEmbed(active[0]?.area ? `${active[0].area}, India` : "India", active[0]?.area ? 10 : 5)} referrerPolicy="no-referrer-when-downgrade" allowFullScreen/></div></div></>}
    </section> : <section className="builder-directory"><div className="builder-directory-toolbar"><div><h2>Builders</h2><p>{role === "Client" ? "Browse public builder summaries. Full profiles require an agent introduction." : "One profile for every builder represented by real projects in your workspace."}</p></div><label><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search builders"/></label></div>{builders.length ? <div className="builder-cards">{builders.map(([name, projects]) => <button key={name} onClick={() => setSelected(name)}><span className="builder-card-initials">{name.split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase()}</span><span><b>{name}</b><small><MapPin size={12}/>{[...new Set(projects.map(project => project.country || project.area))].join(" · ")}</small></span><strong>{projects.length}<small>PROJECTS</small></strong>{role === "Client" ? <LockKeyhole size={15}/> : <ArrowRight size={16}/>}</button>)}</div> : <div className="builder-directory-empty"><Building2 size={35}/><h3>No builders to show yet</h3><p>No builder records are available. No sample companies are shown.</p>{role === "Builder" && <button className="reference-primary" onClick={onAdd}><Plus size={15}/>Add first project</button>}</div>}</section>}
  </div>;
}
