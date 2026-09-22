"use client";

import { useEffect, useState } from "react";
import { BriefcaseBusiness, Check, Globe2, House, Pencil, Users } from "lucide-react";
import type { Role } from "@/lib/brickline-data";
import { PageHeader } from "../ui";

export function ProfileView({ role, allowedRoles, onRoleChange, onNotify }: { role: Role; allowedRoles: Role[]; onRoleChange: (role: Role) => void; onNotify: (message: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [markets, setMarkets] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem("brickline-global-profile") || "{}");
        setName(saved.name || ""); setCompany(saved.company || ""); setMarkets(saved.markets || "");
      } catch { /* Invalid local profile stays empty. */ }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const save = () => { localStorage.setItem("brickline-global-profile", JSON.stringify({ name, company, markets })); setEditing(false); onNotify("Profile saved on this device"); };

  return <div className="page"><PageHeader eyebrow="YOUR WORKSPACE" title="Your profile" description="Set your identity and see the panels assigned to your account." actions={<button className="button primary" onClick={() => editing ? save() : setEditing(true)}>{editing ? <><Check size={16}/>Save profile</> : <><Pencil size={16}/>Edit profile</>}</button>}/><div className="profile-grid"><section className="panel profile-card"><div className="large-avatar"><Globe2 size={34}/></div>{editing ? <><label>Name<input value={name} onChange={event => setName(event.target.value)} placeholder="Your name"/></label><label>Company<input value={company} onChange={event => setCompany(event.target.value)} placeholder="Your company"/></label><label>Markets<input value={markets} onChange={event => setMarkets(event.target.value)} placeholder="Countries or cities you serve"/></label></> : <><h2>{name || "Your name"}</h2><p>{company || "Add your company"}</p><small>{markets || "Add your markets"}</small></>}</section><section className="panel profile-settings"><span className="eyebrow">PANEL ACCESS</span><h2>Your available panels</h2><div className="role-cards">{allowedRoles.includes("Agent") && <button className={role === "Agent" ? "active" : ""} onClick={() => onRoleChange("Agent")}><Users size={22}/><b>Real-estate agent</b><span>Map discovery, builder research, and client introduction drafts.</span></button>}{allowedRoles.includes("Builder") && <button className={role === "Builder" ? "active" : ""} onClick={() => onRoleChange("Builder")}><BriefcaseBusiness size={22}/><b>Builder / developer</b><span>Profile footprint, published projects, and opportunities.</span></button>}{allowedRoles.includes("Client") && <button className={role === "Client" ? "active" : ""} onClick={() => onRoleChange("Client")}><House size={22}/><b>Client</b><span>Public map and projects, with private builder details via an agent.</span></button>}</div><p className="profile-note">The admin controls panel permissions. Profile details and new project records still live on this device; shared project data is a separate future step.</p></section></div></div>;
}
