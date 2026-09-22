"use client";

import { ArrowRight, Building2, Globe2, Handshake, Radio } from "lucide-react";
import type { Project, Role, ViewId } from "@/lib/brickline-data";
import { PageHeader } from "../ui";

export function OverviewView({ role, items, onNavigate, onAdd }: { role: Role; items: Project[]; onNavigate: (view: ViewId) => void; onAdd: () => void }) {
  return <div className="page global-overview"><PageHeader eyebrow="BRICKLINE GLOBAL" title="Real estate has no borders" description={role === "Agent" ? "Explore development activity, projects and opportunities across the world." : "Bring your projects to a worldwide network of real estate professionals."} actions={<button className="button primary" onClick={() => onNavigate("map")}><Globe2 size={16}/>Open world map</button>}/>
    <section className="global-hero"><div><span className="eyebrow">ONE WORLDWIDE WORKSPACE</span><h2>Start with a place.<br/>Find what is being built.</h2><p>Explore the full world map, add a project location and prepare your workspace for real opportunities as the network grows.</p><div><button className="button primary" onClick={() => onNavigate("map")}>Explore map <ArrowRight size={16}/></button><button className="button secondary" onClick={onAdd}>Add a project</button></div></div><div className="global-hero-globe"><Globe2 size={150} strokeWidth={0.8}/><span>GLOBAL COVERAGE</span></div></section>
    <div className="global-feature-grid"><button onClick={() => onNavigate("map")}><Globe2/><b>World map</b><span>Explore any country or city</span><ArrowRight size={16}/></button><button onClick={() => onNavigate("projects")}><Building2/><b>Projects</b><span>{items.length ? `${items.length} projects in your workspace` : "No projects yet"}</span><ArrowRight size={16}/></button><button onClick={() => onNavigate("marketplace")}><Handshake/><b>Opportunities</b><span>Find or publish partner mandates</span><ArrowRight size={16}/></button><button onClick={() => onNavigate("radar")}><Radio/><b>Radar</b><span>Follow development updates</span><ArrowRight size={16}/></button></div>
  </div>;
}
