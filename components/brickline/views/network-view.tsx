"use client";

import { Users } from "lucide-react";
import type { Role } from "@/lib/brickline-data";
import { PageHeader } from "../ui";

export function NetworkView({ role }: { role: Role; connected: Set<string>; onConnect: (id: string) => void; onMessage: (name: string) => void }) {
  return <div className="page"><PageHeader eyebrow="GLOBAL NETWORK" title={role === "Agent" ? "Meet builders worldwide" : "Find agents worldwide"} description="A worldwide builder–agent network will grow here as verified members join."/><section className="panel global-empty-panel"><Users size={42}/><h2>No member profiles yet</h2><p>There are no fabricated agents or builders in this directory. Your global workspace is ready for real members.</p></section></div>;
}
