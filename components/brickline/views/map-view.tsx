"use client";

import { FormEvent, useMemo, useState } from "react";
import { Building2, Globe2, MapPin, Plus, Search, X } from "lucide-react";
import { googleMapEmbed, projectMapLocation } from "@/lib/project-map";
import type { Project } from "@/lib/brickline-data";
import { WorldAtlas, worldCountryNames } from "../world-atlas";
import { PageHeader } from "../ui";

export function MapView({ items, onProject, onAdd }: { items: Project[]; onProject: (id: string) => void; onAdd: () => void }) {
  const [draft, setDraft] = useState("");
  const [place, setPlace] = useState("World");
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"atlas" | "google">("atlas");
  const [selectedCountry, setSelectedCountry] = useState("");
  const focusedProject = items.find(item => item.id === focusedId);
  const mapUrl = focusedProject ? projectMapLocation(focusedProject).embedUrl : googleMapEmbed(place, place === "World" ? 2 : 11);
  const matchingProjects = useMemo(() => items.filter(item => `${item.name} ${item.area} ${item.country || ""} ${item.builder}`.toLowerCase().includes(draft.toLowerCase())), [items, draft]);
  const search = (event: FormEvent) => {
    event.preventDefault();
    setFocusedId(null);
    const next = draft.trim() || "World";
    setPlace(next);
    const country = worldCountryNames.find(name => name.toLowerCase() === next.toLowerCase());
    setSelectedCountry(country || "");
    setMode(country || next === "World" ? "atlas" : "google");
  };

  return <div className="page global-map-page">
    <PageHeader eyebrow="GLOBAL DEVELOPMENT MAP" title="Explore real estate worldwide" description="Search any country, city, neighbourhood or project. Your map stays inside Brickline." actions={<button className="button primary" onClick={onAdd}><Plus size={16}/>Add project</button>}/>
    <section className="world-map-shell" aria-label="Global development map">
      <div className="world-map-toolbar">
        <form className="world-map-search" onSubmit={search}><Search size={18}/><input value={draft} onChange={event => setDraft(event.target.value)} placeholder="Search country or city worldwide" aria-label="Search country or city worldwide"/><button type="submit">Search map</button></form>
        <button className="world-reset" onClick={() => { setDraft(""); setPlace("World"); setFocusedId(null); setSelectedCountry(""); setMode("atlas"); }}><Globe2 size={17}/>Full world map</button>
      </div>
      <div className="world-map-frame">{mode === "atlas" && !focusedProject ? <WorldAtlas selected={selectedCountry} onCountry={country => { setSelectedCountry(country); setPlace(country); setDraft(country); }}/> : <iframe key={mapUrl} title={`Google map of ${focusedProject?.name || place}`} src={mapUrl} loading="eager" referrerPolicy="no-referrer-when-downgrade" allowFullScreen/>}</div>
      <div className="world-map-footer"><span><MapPin size={15}/>{focusedProject ? `Project location: ${focusedProject.name}` : place === "World" ? "World view" : `Exploring ${place}`}</span>{focusedProject && <button onClick={() => { setFocusedId(null); setMode("atlas"); }}><X size={14}/>Clear project</button>}{mode === "atlas" && place !== "World" && <button onClick={() => setMode("google")}>Street map</button>}{mode === "google" && !focusedProject && <button onClick={() => setMode("atlas")}>World map</button>}<small>{items.length} projects in this workspace</small></div>
    </section>
    <section className="world-projects"><div><h2>Projects on Brickline</h2><p>{items.length ? "Choose a project to focus its location on the map." : "No projects have been added yet. Add the first project anywhere in the world."}</p></div>{items.length ? <div className="world-project-list">{matchingProjects.map(project => <button key={project.id} onClick={() => { setFocusedId(project.id); setMode("google"); onProject(project.id); }}><Building2 size={17}/><span><b>{project.name}</b><small>{[project.area, project.country].filter(Boolean).join(", ")} · {project.builder}</small></span><MapPin size={16}/></button>)}{!matchingProjects.length && <p>No projects match this search.</p>}</div> : <button className="button secondary" onClick={onAdd}><Plus size={16}/>Add first project</button>}</section>
  </div>;
}
