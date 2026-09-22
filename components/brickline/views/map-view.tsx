"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Building2, Globe2, MapPin, Plus, Search, X } from "lucide-react";
import { googleMapEmbed, projectMapLocation } from "@/lib/project-map";
import type { Project, ProjectStatus, ViewId } from "@/lib/brickline-data";
import { WorldAtlas, worldCountryNames } from "../world-atlas";

const statusFilters: { label: string; status: ProjectStatus; tone: string }[] = [
  { label: "New", status: "New construction", tone: "coral" },
  { label: "Started", status: "Construction started", tone: "green" },
  { label: "Redevelopment", status: "Redevelopment", tone: "purple" },
  { label: "Approval", status: "Approval stage", tone: "amber" },
];

export function MapView({ items, onProject, onAdd, onNavigate }: { items: Project[]; onProject: (id: string) => void; onAdd: () => void; onNavigate: (view: ViewId) => void }) {
  const [draft, setDraft] = useState("");
  const [place, setPlace] = useState("World");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"atlas" | "google">("atlas");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [filter, setFilter] = useState<ProjectStatus | "All">("All");
  const focusedProject = items.find(item => item.id === focusedId);
  const mapUrl = focusedProject ? projectMapLocation(focusedProject).embedUrl : googleMapEmbed(place, place === "World" ? 2 : 11);
  const visibleProjects = useMemo(() => items.filter(item => (filter === "All" || item.status === filter) && `${item.name} ${item.area} ${item.country || ""} ${item.builder}`.toLowerCase().includes(draft.toLowerCase())), [items, draft, filter]);
  const builderCount = new Set(items.map(item => item.builder)).size;
  const countryCount = new Set(items.map(item => item.country).filter(Boolean)).size;
  const search = (event: FormEvent) => {
    event.preventDefault();
    setFocusedId(null);
    const next = draft.trim() || "World";
    setPlace(next);
    const country = worldCountryNames.find(name => name.toLowerCase() === next.toLowerCase());
    setSelectedCountry(country || "");
    setMode(country || next === "World" ? "atlas" : "google");
  };
  const reset = () => { setDraft(""); setPlace("World"); setFocusedId(null); setSelectedCountry(""); setMode("atlas"); setFilter("All"); };

  return <div className="page reference-page map-home">
    <div className="reference-eyebrow">WORLD MAP <span>·</span> PROJECT &amp; AREA INTELLIGENCE</div>
    <section className="map-intro"><div><h1>Discover what&apos;s <em>next</em> in real estate.</h1><p>Projects, builders and development opportunities—mapped in one clear workspace.</p><div className="map-intro-actions"><button className="reference-primary" onClick={onAdd}><Plus size={16}/>Add a project</button><button className="reference-link" onClick={() => onNavigate("areas")}>Explore an area <ArrowRight size={15}/></button></div></div><aside className="map-live-numbers"><span className="micro-label">WORKSPACE NUMBERS</span><div><strong>{items.length}</strong> projects <strong>{builderCount}</strong> builders</div><div><strong>{countryCount}</strong> countries <strong>{items.filter(item => item.status === "Construction started").length}</strong> started</div><small>Only records added to this device are counted.</small></aside></section>
    <section className="map-explorer"><div className="map-search-row"><form onSubmit={search}><Search size={18}/><input value={draft} onChange={event => setDraft(event.target.value)} placeholder="Search country, locality, project or builder..." aria-label="Search map"/><button type="submit">Explore map <ArrowRight size={15}/></button></form><button className="map-reset" onClick={reset}><Globe2 size={16}/>World view</button></div>
      <div className="map-home-grid"><div className="map-home-main"><div className="map-stage"><div className="map-stage-top"><div><span className="micro-label">PROJECT MAP <b>·</b> {place.toUpperCase()}</span><h2>{items.length ? `${items.length} projects across ${countryCount} countries` : "A world of opportunity, ready to map"}</h2></div>{mode === "google" && <button onClick={() => setMode("atlas")}>Back to world map</button>}</div><div className="map-stage-visual">{mode === "atlas" && !focusedProject ? <WorldAtlas selected={selectedCountry} onCountry={country => { setSelectedCountry(country); setPlace(country); setDraft(country); }}/> : <iframe key={mapUrl} title={`Map of ${focusedProject?.name || place}`} src={mapUrl} referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>}</div><div className="map-stage-bottom"><span><MapPin size={14}/>{focusedProject ? focusedProject.name : place === "World" ? "Explore a country or search a locality" : place}</span>{focusedProject && <button onClick={() => { setFocusedId(null); setMode("atlas"); }}><X size={14}/>Clear project</button>}{mode === "atlas" && place !== "World" && <button onClick={() => setMode("google")}>Open street map <ArrowRight size={13}/></button>}</div></div><div className="map-filters"><span className="micro-label">FILTER BY STATUS</span><button className={filter === "All" ? "active" : ""} onClick={() => setFilter("All")}>All <b>{items.length}</b></button>{statusFilters.map(entry => <button key={entry.status} className={filter === entry.status ? `active ${entry.tone}` : entry.tone} onClick={() => setFilter(entry.status)}>{entry.label} <b>{items.filter(item => item.status === entry.status).length}</b></button>)}</div></div>
      <aside className="map-home-rail"><span className="micro-label accent">IN YOUR WORKSPACE</span><button onClick={() => onNavigate("projects")}><span>Latest projects <small>{items.length ? `${items.length} added` : "No projects yet"}</small></span><ArrowRight size={16}/></button><button onClick={() => onNavigate("network")}><span>Builder profiles <small>{builderCount} from project records</small></span><ArrowRight size={16}/></button><button onClick={() => onNavigate("areas")}><span>Area intelligence <small>Research any locality</small></span><ArrowRight size={16}/></button><button onClick={() => onNavigate("radar")}><span>Radar &amp; alerts <small>Watch a market</small></span><ArrowRight size={16}/></button><div className="map-rail-projects"><span className="micro-label">PROJECTS MATCHING YOUR VIEW</span>{visibleProjects.length ? visibleProjects.slice(0, 4).map(project => <button key={project.id} onClick={() => { setFocusedId(project.id); setMode("google"); onProject(project.id); }}><Building2 size={16}/><span><b>{project.name}</b><small>{project.area} · {project.status}</small></span></button>) : <p>No project records match yet. Add a real project to put it on the map.</p>}</div></aside></div>
    </section>
  </div>;
}
