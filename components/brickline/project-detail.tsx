"use client";

import { Bookmark, Building2, CalendarDays, MapPin, Users, X } from "lucide-react";
import { statusColor, type Project, type Role } from "@/lib/brickline-data";
import { projectMapLocation } from "@/lib/project-map";

interface Props {
  id: string;
  items: Project[];
  role: Role;
  saved: boolean;
  onClose: () => void;
  onSave: () => void;
  onNotify: (message: string) => void;
  onOpportunity: () => void;
}

export function ProjectDetail({ id, items, saved, onClose, onSave, onOpportunity }: Props) {
  const project = items.find(item => item.id === id);
  if (!project) return null;
  const location = projectMapLocation(project);

  return <div className="drawer-layer" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={project.name}>
      <header>
        <div>
          <span className="eyebrow">PROJECT INTELLIGENCE</span>
          <h2>{project.name}</h2>
          <p><MapPin size={14}/>{[project.area, project.country].filter(Boolean).join(", ")}</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19}/></button>
      </header>

      <div className="detail-hero" style={{ "--project-color": statusColor[project.status] } as React.CSSProperties}>
        <Building2 className="detail-project-icon" size={88}/>
        <div><span className="status-pill"><i style={{ background: statusColor[project.status] }}/>{project.status}</span><small>Added by you</small></div>
      </div>

      <div className="detail-actions">
        <button className={saved ? "button secondary subscribed" : "button secondary"} onClick={onSave}><Bookmark size={16} fill={saved ? "currentColor" : "none"}/>{saved ? "Saved" : "Save"}</button>
        <button className="button secondary" onClick={() => document.getElementById("project-location")?.scrollIntoView({ behavior: "smooth", block: "start" })}><MapPin size={16}/>View location</button>
        <button className="button primary" onClick={onOpportunity}>Explore opportunities</button>
      </div>

      <section className="detail-section" id="project-location">
        <h3>Project location</h3>
        <p className="location-disclaimer">{location.exact ? `Site address: ${location.label}` : `Showing ${location.label} area. An exact site address has not been provided.`}</p>
        <div className="project-location-map"><iframe key={location.embedUrl} title={`Map for ${project.name}`} src={location.embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/></div>
      </section>

      <section className="detail-section"><h3>Project summary</h3><p>{project.description}</p><div className="tag-row">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div></section>
      <section className="detail-facts">
        <div><Building2 size={18}/><span><small>Est. value</small><b>{project.currency || "USD"} {project.value.toLocaleString()}</b></span></div>
        <div><Users size={18}/><span><small>Inventory</small><b>{project.homes} homes</b></span></div>
        <div><CalendarDays size={18}/><span><small>Completion</small><b>{project.completion}</b></span></div>
        <div><MapPin size={18}/><span><small>Location precision</small><b>{location.exact ? "Site address" : "Area only"}</b></span></div>
      </section>
    </aside>
  </div>;
}
