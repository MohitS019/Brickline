"use client";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "./app-shell";
import { GlobalSearch, Toast } from "./ui";
import { ProjectDetail } from "./project-detail";
import { SimpleFormModal } from "./forms";
import { OverviewView } from "./views/overview-view";
import { MapView } from "./views/map-view";
import { ProjectsView } from "./views/projects-view";
import { NetworkView } from "./views/network-view";
import { MarketplaceView } from "./views/marketplace-view";
import { RadarView } from "./views/radar-view";
import { AlertsView, type AlertItem } from "./views/alerts-view";
import { ProfileView } from "./views/profile-view";
import type { Role, ViewId } from "@/lib/brickline-data";

type FormKind="project"|"opportunity"|"alert"|"message";
const initialAlerts:AlertItem[]=[
 {id:"a1",title:"Construction started at Aurelia Heights",body:"Foundation work and contractor mobilisation were verified in Bandra West.",time:"28 min ago",read:false,projectId:"aurelia"},
 {id:"a2",title:"New match: Exclusive channel partners",body:"Aurelia Developments matches your luxury buyer profile and coverage.",time:"2h ago",read:false},
 {id:"a3",title:"Approval advanced for Arden Park",body:"The Worli project moved to the next municipal review stage.",time:"Yesterday",read:false,projectId:"arden"},
 {id:"a4",title:"Weekly Mumbai market brief is ready",body:"12 new signals and ₹1,385 Cr in potential launch value were recorded.",time:"Monday",read:true},
];

export default function WorkspaceApp(){
 const [view,setView]=useState<ViewId>("overview"),[role,setRole]=useState<Role>("Agent"),[mobileOpen,setMobileOpen]=useState(false),[searchOpen,setSearchOpen]=useState(false),[query,setQuery]=useState(""),[projectId,setProjectId]=useState<string|null>(null),[toast,setToast]=useState(""),[brief,setBrief]=useState(false),[form,setForm]=useState<FormKind|null>(null),[messageRecipient,setMessageRecipient]=useState("");
 const [savedProjects,setSavedProjects]=useState(new Set<string>()),[connections,setConnections]=useState(new Set<string>()),[savedOpps,setSavedOpps]=useState(new Set<string>()),[applied,setApplied]=useState(new Set<string>()),[following,setFollowing]=useState(new Set<string>()),[alerts,setAlerts]=useState(initialAlerts);
 const notify=useCallback((m:string)=>setToast(m),[]); const toggleSet=(setter:React.Dispatch<React.SetStateAction<Set<string>>>,id:string,message:string)=>setter(prev=>{const next=new Set(prev);next.has(id)?next.delete(id):next.add(id);notify(message);return next});
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setSearchOpen(true)}};window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key)},[]);
 const navigate=(v:ViewId)=>{setView(v);window.scrollTo({top:0,behavior:"smooth"})}; const openProject=(id:string)=>setProjectId(id);
 const content=()=>{switch(view){case"map":return <MapView onProject={openProject} onNotify={notify}/>;case"projects":return <ProjectsView saved={savedProjects} onProject={openProject} onSave={id=>toggleSet(setSavedProjects,id,savedProjects.has(id)?"Project removed from saved":"Project saved")} onAdd={()=>setForm("project")}/>;case"network":return <NetworkView role={role} connected={connections} onConnect={id=>toggleSet(setConnections,id,connections.has(id)?"Connection removed":"Connection added")} onMessage={name=>{setMessageRecipient(name);setForm("message")}}/>;case"marketplace":return <MarketplaceView role={role} applied={applied} saved={savedOpps} onApply={id=>toggleSet(setApplied,id,applied.has(id)?"Application withdrawn":"Interest sent to the builder")} onSave={id=>toggleSet(setSavedOpps,id,savedOpps.has(id)?"Opportunity removed":"Opportunity saved")} onPost={()=>setForm("opportunity")}/>;case"radar":return <RadarView following={following} onFollow={id=>toggleSet(setFollowing,id,following.has(id)?"Signal unfollowed":"Signal added to your watchlist")} onProject={openProject} onCreateAlert={()=>setForm("alert")}/>;case"alerts":return <AlertsView items={alerts} onRead={id=>setAlerts(a=>a.map(x=>x.id===id?{...x,read:true}:x))} onReadAll={()=>{setAlerts(a=>a.map(x=>({...x,read:true})));notify("All alerts marked as read")}} onDelete={id=>{setAlerts(a=>a.filter(x=>x.id!==id));notify("Alert removed")}} onProject={openProject} onSettings={()=>navigate("profile")}/>;case"profile":return <ProfileView role={role} onRoleChange={r=>{setRole(r);notify(`Switched to ${r} workspace`)}} onNotify={notify}/>;default:return <OverviewView role={role} brief={brief} onBrief={()=>{setBrief(!brief);notify(brief?"Weekly brief paused":"Weekly brief subscribed")}} onNavigate={navigate} onProject={openProject} onNotify={notify}/>}}
 return <><AppShell view={view} role={role} mobileOpen={mobileOpen} unread={alerts.filter(a=>!a.read).length} onNavigate={navigate} onRoleChange={r=>{setRole(r);notify(`Switched to ${r} workspace`)}} onMobileToggle={()=>setMobileOpen(!mobileOpen)} onSearch={()=>setSearchOpen(true)}>{content()}</AppShell>{searchOpen&&<GlobalSearch query={query} setQuery={setQuery} onClose={()=>{setSearchOpen(false);setQuery("")}} onNavigate={navigate} onProject={openProject}/>} {projectId&&<ProjectDetail id={projectId} role={role} saved={savedProjects.has(projectId)} onClose={()=>setProjectId(null)} onSave={()=>toggleSet(setSavedProjects,projectId,savedProjects.has(projectId)?"Project removed from saved":"Project saved")} onNotify={notify} onOpportunity={()=>{setProjectId(null);navigate("marketplace")}}/>}{form&&<SimpleFormModal kind={form} onClose={()=>setForm(null)} onSubmit={notify}/>} {toast&&<Toast message={toast} onClose={()=>setToast("")}/>}<span hidden>{messageRecipient}</span></>
}
