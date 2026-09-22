"use client";

import { Bookmark, Building2, CalendarDays, CheckCircle2, MapPin, Share2, Users, X } from "lucide-react";
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

export function ProjectDetail({ id, items, role, saved, onClose, onSave, onNotify, onOpportunity }: Props) {
  const project = items.find(item => item.id === id);
  if (!project) return null;
  const location = projectMapLocation(project);

  return <div className="drawer-layer" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="detail-drawer" role="dialog" aria-modal="true" aria-label={project.name}>
      <header>
        <div>
          <span className="eyebrow">PROJECT INTELLIGENCE</span>
          <h2>{project.name}</h2>
          <p><MapPin size={14}/>{project.area}</p>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Close"><X size={19}/></button>
      </header>

      <div className="detail-hero" style={{ "--project-color": statusColor[project.status] } as React.CSSProperties}>
        <Building2 className="detail-project-icon" size={88}/>
        <div><span className="status-pill"><i style={{ background: statusColor[project.status] }}/>{project.status}</span><strong>{project.confidence}%</strong><small>signal confidence</small></div>
      </div>

      <div className="detail-actions">
        <button className={saved ? "button secondary subscribed" : "button secondary"} onClick={onSave}><Bookmark size={16} fill={saved ? "currentColor" : "none"}/>{saved ? "Saved" : "Save"}</button>
        <button className="button secondary" onClick={() => document.getElementById("project-location")?.scrollIntoView({ behavior: "smooth", block: "start" })}><MapPin size={16}/>View location</button>
        <button className="button secondary" onClick={() => onNotify("Share link copied")}><Share2 size={16}/>Share</button>
        <button className="button primary" onClick={onOpportunity}>{role === "Agent" ? "Request introduction" : "Find agents"}</button>
      </div>

      <section className="detail-section" id="project-location">
        <h3>Project location</h3>
        <p className="location-disclaimer">{location.exact ? `Site address: ${location.label}` : `Showing ${location.label} area. An exact site address has not been provided.`}</p>
        <div className="project-location-map"><iframe key={location.embedUrl} title={`Map for ${project.name}`} src={location.embedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/></div>
      </section>

      <section className="detail-section"><h3>Project summary</h3><p>{project.description}</p><div className="tag-row">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div></section>
      <section className="detail-facts">
        <div><Building2 size={18}/><span><small>Est. value</small><b>₹{project.value} Cr</b></span></div>
        <div><Users size={18}/><span><small>Inventory</small><b>{project.homes} homes</b></span></div>
        <div><CalendarDays size={18}/><span><small>Completion</small><b>{project.completion}</b></span></div>
        <div><CheckCircle2 size={18}/><span><small>Last verified</small><b>{project.updated}</b></span></div>
      </section>
      <section className="detail-section"><h3>Development timeline</h3><div className="timeline">
        <div className="done"><i/><span><b>Land and title verified</b><small>Completed</small></span></div>
        <div className="done"><i/><span><b>Primary approvals</b><small>Completed</small></span></div>
        <div className="current"><i/><span><b>{project.status}</b><small>Current stage</small></span></div>
        <div><i/><span><b>Sales launch</b><small>Expected next</small></span></div>
      </div></section>
    </aside>
  </div>;
}
