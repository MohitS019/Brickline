"use client";

import { BellRing, Globe2, Radio } from "lucide-react";
import { PageHeader } from "../ui";

export function RadarView({ onCreateAlert }: { following: Set<string>; onFollow: (id: string) => void; onProject: (id: string) => void; onCreateAlert: () => void }) {
  return <div className="page"><PageHeader eyebrow="GLOBAL RADAR" title="Watch the markets that matter" description="Create a location alert for any market worldwide. Signals will appear here when a live data source is connected." actions={<button className="button primary" onClick={onCreateAlert}><BellRing size={16}/>Create alert</button>}/><section className="panel global-empty-panel"><Globe2 size={42}/><h2>No live signals yet</h2><p>Brickline does not invent construction or approval activity. Add a market alert now; verified automated signals require a connected source.</p><button className="button secondary" onClick={onCreateAlert}><Radio size={16}/>Watch a location</button></section></div>;
}
