"use client";

import type { ReactNode } from "react";
import { Bell, Menu, Search, ShieldCheck, UserRound, X } from "lucide-react";
import type { Role, ViewId } from "@/lib/brickline-data";
import { BrandLogo } from "./brand-logo";

const primary: { id: ViewId; label: string }[] = [
  { id: "client-access", label: "My panel" },
  { id: "overview", label: "Dashboard" },
  { id: "map", label: "Explore map" },
  { id: "projects", label: "Projects" },
  { id: "network", label: "Builders" },
  { id: "areas", label: "Areas" },
  { id: "radar", label: "Insights" },
];
const secondary: { id: ViewId; label: string }[] = [
  { id: "marketplace", label: "Opportunities" },
  { id: "alerts", label: "Alerts" },
  { id: "profile", label: "Profile" },
];

interface Props {
  children: ReactNode;
  view: ViewId;
  role: Role;
  allowedRoles: Role[];
  isAdmin: boolean;
  mobileOpen: boolean;
  unread: number;
  onNavigate: (view: ViewId) => void;
  onRoleChange: (role: Role) => void;
  onMobileToggle: () => void;
  onSearch: () => void;
}

export function AppShell({ children, view, role, allowedRoles, isAdmin, mobileOpen, unread, onNavigate, onRoleChange, onMobileToggle, onSearch }: Props) {
  const go = (next: ViewId) => { onNavigate(next); if (mobileOpen) onMobileToggle(); };
  const primaryItems = isAdmin ? [{ id: "admin" as ViewId, label: "Admin" }, ...primary] : primary;
  return <main className="app-shell reference-shell">
    <header className="site-header">
      <button className="site-brand" onClick={() => go("map")} aria-label="Brickline home"><BrandLogo /></button>
      <nav className="site-nav" aria-label="Main navigation">{primaryItems.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => go(item.id)}>{item.label}</button>)}</nav>
      <div className="site-actions">
        <button className="site-search" onClick={onSearch} aria-label="Search Brickline"><Search size={18}/><span>Search</span></button>
        <button className="site-alert" onClick={() => go("alerts")} aria-label="Open alerts"><Bell size={18}/>{unread > 0 && <em>{unread}</em>}</button>
        {view === "admin" ? <span className="site-role admin-role" aria-label="Admin panel active"><ShieldCheck size={14}/>Admin panel</span> : <label className="site-role"><span className="sr-only">Panel</span><select value={role} onChange={event => onRoleChange(event.target.value as Role)}>{allowedRoles.map(option => <option key={option} value={option}>{option} panel</option>)}</select></label>}
        <button className="site-avatar" onClick={() => go("profile")} aria-label="Open profile"><UserRound size={18}/></button>
        <button className="site-menu-toggle" onClick={onMobileToggle} aria-label={mobileOpen ? "Close menu" : "Open menu"}>{mobileOpen ? <X size={22}/> : <Menu size={22}/>}</button>
      </div>
    </header>
    {mobileOpen && <nav className="site-mobile-nav" aria-label="Mobile navigation">{[...primaryItems, ...secondary].map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => go(item.id)}>{item.label}</button>)}<div className="mobile-role-choice">{allowedRoles.map(option => <button key={option} className={role === option ? "active" : ""} onClick={() => onRoleChange(option)}>{option}</button>)}</div></nav>}
    <div className="site-subnav"><div>{secondary.map(item => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => go(item.id)}>{item.label}</button>)}<a href="/privacy">Privacy</a></div></div>
    <section className="content site-content">{children}</section>
  </main>;
}
