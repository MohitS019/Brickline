"use client";
import { ReactNode } from "react";
import { Bell, Building2, ChevronDown, Compass, Handshake, Map, Menu, Radio, Search, UserRound, Users, X } from "lucide-react";
import type { Role, ViewId } from "@/lib/brickline-data";

const navigation: {id:ViewId;label:string;icon:typeof Compass}[] = [
  {id:"map",label:"World map",icon:Map},{id:"overview",label:"Overview",icon:Compass},
  {id:"projects",label:"Projects",icon:Building2},{id:"network",label:"Network",icon:Users},
  {id:"marketplace",label:"Opportunities",icon:Handshake},{id:"radar",label:"Radar",icon:Radio},
];

interface Props { children:ReactNode; view:ViewId; role:Role; mobileOpen:boolean; unread:number; onNavigate:(v:ViewId)=>void; onRoleChange:(r:Role)=>void; onMobileToggle:()=>void; onSearch:()=>void; }

export function AppShell({children,view,role,mobileOpen,unread,onNavigate,onRoleChange,onMobileToggle,onSearch}:Props){
  const go=(id:ViewId)=>{onNavigate(id); if(mobileOpen) onMobileToggle()};
  return <main className="app-shell">
    <aside className={mobileOpen?"sidebar mobile-open":"sidebar"}>
      <div className="brand-row"><button className="brand" onClick={()=>go("map")} aria-label="Brickline world map"><span className="brand-mark">B</span><span>BRICKLINE</span></button><button className="close-mobile" onClick={onMobileToggle} aria-label="Close menu"><X size={20}/></button></div>
      <div className="workspace-switcher"><span>WORKSPACE</span><div className="role-segment"><button className={role==="Agent"?"selected":""} onClick={()=>onRoleChange("Agent")}>Agent</button><button className={role==="Builder"?"selected":""} onClick={()=>onRoleChange("Builder")}>Builder</button></div></div>
      <nav className="main-nav" aria-label="Main navigation">{navigation.map(({id,label,icon:Icon})=><button key={id} className={view===id?"nav-item active":"nav-item"} onClick={()=>go(id)}><Icon size={18}/><span>{label}</span></button>)}</nav>
      <div className="sidebar-bottom"><button className={view==="alerts"?"nav-item active":"nav-item"} onClick={()=>go("alerts")}><Bell size={18}/><span>Alerts</span>{unread>0&&<i>{unread}</i>}</button><button className={view==="profile"?"user-card active":"user-card"} onClick={()=>go("profile")}><span className="avatar"><UserRound size={16}/></span><span><strong>Your workspace</strong><small>{role} mode</small></span><ChevronDown size={15}/></button></div>
    </aside>
    {mobileOpen&&<button className="backdrop" onClick={onMobileToggle} aria-label="Close menu"/>}
    <section className="content"><header className="topbar"><button className="mobile-menu" onClick={onMobileToggle} aria-label="Open menu"><Menu size={22}/></button><div className="location"><span className="status-pulse"/>Global platform <span>/</span><b>{navigation.find(x=>x.id===view)?.label ?? (view==="alerts"?"Alerts":"Profile")}</b></div><div className="top-actions"><button className="global-search" onClick={onSearch}><Search size={17}/><span>Search workspace</span><kbd>⌘ K</kbd></button><button className="icon-button" onClick={()=>go("alerts")} aria-label="Open alerts"><Bell size={18}/>{unread>0&&<i/>}</button><button className="avatar-button" onClick={()=>go("profile")} aria-label="Open profile"><UserRound size={17}/></button></div></header>{children}</section>
  </main>
}
