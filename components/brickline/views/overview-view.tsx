"use client";

import { ArrowRight, Building2, Globe2, Handshake, Radio } from "lucide-react";
import type { Project, Role, ViewId } from "@/lib/brickline-data";
import { PageHeader } from "../ui";

export function OverviewView({ role, items, onNavigate, onAdd }: { role: Role; items: Project[]; onNavigate: (view: ViewId) => void; onAdd: () => void }) {
  return <div className="page global-overview"><PageHeader eyebrow="BRICKLINE INDIA" title="Know what is being built before the sign goes up" description={role === "Agent" ? "Explore development activity and builder opportunities across India." : role === "Builder" ? "Publish RERA-registered projects to a verified professional network." : "Research Indian projects, builders, and areas before you decide."} actions={<button className="button primary" onClick={() => onNavigate("map")}><Globe2 size={16}/>Open India map</button>}/>
    <section className="global-hero"><div><span className="eyebrow">ONE INDIA INTELLIGENCE WORKSPACE</span><h2>Start with a locality.<br/>Find what is being built.</h2><p>Explore India, add RERA-registered project locations, and follow checked development signals.</p><div><button className="button primary" onClick={() => onNavigate("map")}>Explore map <ArrowRight size={16}/></button><button className="button secondary" onClick={onAdd}>Add a project</button></div></div><div className="global-hero-globe"><Globe2 size={150} strokeWidth={0.8}/><span>INDIA COVERAGE</span></div></section>
    <div className="global-feature-grid"><button onClick={() => onNavigate("map")}><Globe2/><b>India map</b><span>Explore states, cities, and localities</span><ArrowRight size={16}/></button><button onClick={() => onNavigate("projects")}><Building2/><b>Projects</b><span>{items.length ? `${items.length} RERA project records` : "No projects yet"}</span><ArrowRight size={16}/></button><button onClick={() => onNavigate("marketplace")}><Handshake/><b>Opportunities</b><span>Find India partner mandates</span><ArrowRight size={16}/></button><button onClick={() => onNavigate("radar")}><Radio/><b>Radar</b><span>Follow verified area updates</span><ArrowRight size={16}/></button></div>
  </div>;
}
