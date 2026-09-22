"use client";

import { useEffect, useState } from "react";
import { Check, Globe2, Pencil, Users, BriefcaseBusiness, House } from "lucide-react";
import type { Role } from "@/lib/brickline-data";
import { PageHeader } from "../ui";

export function ProfileView({ role, onRoleChange, onNotify }: { role: Role; onRoleChange: (role: Role) => void; onNotify: (message: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [markets, setMarkets] = useState("");
  useEffect(() => {
    const load = window.setTimeout(() => {
      try { const saved = JSON.parse(localStorage.getItem("brickline-global-profile") || "{}"); setName(saved.name || ""); setCompany(saved.company || ""); setMarkets(saved.markets || ""); } catch { /* Invalid local profile stays empty. */ }
    }, 0);
    return () => window.clearTimeout(load);
  }, []);
  const save = () => { localStorage.setItem("brickline-global-profile", JSON.stringify({ name, company, markets })); setEditing(false); onNotify("Profile saved on this device"); };
  return <div className="page"><PageHeader eyebrow="YOUR ACCOUNT" title="Global workspace profile" description="Set your identity and the markets where you work." actions={<button className="button primary" onClick={() => editing ? save() : setEditing(true)}>{editing ? <><Check size={16}/>Save profile</> : <><Pencil size={16}/>Edit profile</>}</button>}/><div className="profile-grid"><section className="panel profile-card"><div className="large-avatar"><Globe2 size={34}/></div>{editing ? <><label>Name<input value={name} onChange={event => setName(event.target.value)} placeholder="Your name"/></label><label>Company<input value={company} onChange={event => setCompany(event.target.value)} placeholder="Your company"/></label><label>Markets<input value={markets} onChange={event => setMarkets(event.target.value)} placeholder="Countries or cities you serve"/></label></> : <><h2>{name || "Your name"}</h2><p>{company || "Add your company"}</p><small>{markets || "Add your markets"}</small></>}</section><section className="panel profile-settings"><span className="eyebrow">WORKSPACE MODE</span><h2>How do you use Brickline?</h2><div className="role-cards"><button className={role === "Agent" ? "active" : ""} onClick={() => onRoleChange("Agent")}><Users size={22}/><b>Real estate agent</b><span>Explore projects and opportunities worldwide.</span></button><button className={role === "Builder" ? "active" : ""} onClick={() => onRoleChange("Builder")}><BriefcaseBusiness size={22}/><b>Builder / developer</b><span>Publish projects and find distribution partners.</span></button><button className={role === "Buyer" ? "active" : ""} onClick={() => onRoleChange("Buyer")}><House size={22}/><b>Buyer / investor</b><span>Research projects, builders and local markets.</span></button></div><p className="profile-note">This prototype stores your profile and new listings only on this device. It is not a shared public account yet.</p></section></div></div>;
}
