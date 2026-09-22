"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "./app-shell";
import { GlobalSearch, Toast } from "./ui";
import { ProjectDetail } from "./project-detail";
import { SimpleFormModal, type FormKind, type FormResult } from "./forms";
import { OverviewView } from "./views/overview-view";
import { MapView } from "./views/map-view";
import { AreasView } from "./views/areas-view";
import { ProjectsView } from "./views/projects-view";
import { NetworkView } from "./views/network-view";
import { MarketplaceView } from "./views/marketplace-view";
import { RadarView } from "./views/radar-view";
import { AlertsView, type AlertItem } from "./views/alerts-view";
import { ProfileView } from "./views/profile-view";
import { ClientAccessView } from "./views/client-access-view";
import type { Opportunity, Project, Role, ViewId } from "@/lib/brickline-data";

const readStored = <T,>(key: string): T[] => {
  try { return JSON.parse(localStorage.getItem(key) || "[]") as T[]; }
  catch { return []; }
};

export default function WorkspaceApp() {
  const [view, setView] = useState<ViewId>("map");
  const [role, setRole] = useState<Role>("Agent");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [form, setForm] = useState<FormKind | null>(null);
  const [messageRecipient, setMessageRecipient] = useState("");
  const [formArea, setFormArea] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [savedProjects, setSavedProjects] = useState(new Set<string>());
  const [savedOpps, setSavedOpps] = useState(new Set<string>());
  const [applied, setApplied] = useState(new Set<string>());
  const [following, setFollowing] = useState(new Set<string>());
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const notify = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    // Keep old India-workspace records recoverable under their original keys.
    const load = window.setTimeout(() => {
      setProjects(readStored<Project>("brickline-global-projects"));
      setOpportunities(readStored<Opportunity>("brickline-global-opportunities"));
      setAlerts(readStored<AlertItem>("brickline-global-alerts"));
      const savedRole = localStorage.getItem("brickline-global-role");
      if (savedRole === "Agent" || savedRole === "Builder" || savedRole === "Client") setRole(savedRole);
      setHydrated(true);
    }, 0);
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", key);
    return () => { window.clearTimeout(load); window.removeEventListener("keydown", key); };
  }, []);
  useEffect(() => { if (hydrated) localStorage.setItem("brickline-global-projects", JSON.stringify(projects)); }, [projects, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("brickline-global-opportunities", JSON.stringify(opportunities)); }, [opportunities, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("brickline-global-alerts", JSON.stringify(alerts)); }, [alerts, hydrated]);
  useEffect(() => { if (hydrated) localStorage.setItem("brickline-global-role", role); }, [role, hydrated]);

  const navigate = (next: ViewId) => { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const changeRole = (next: Role) => { setRole(next); setProjectId(null); setForm(null); navigate(next === "Agent" ? "map" : "client-access"); };
  const requestProjectForm = () => { if (role === "Client") { navigate("client-access"); notify("Client panel is for browsing; project publishing belongs to builders."); } else setForm("project"); };
  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, id: string, added: string, removed: string) => {
    setter(previous => { const next = new Set(previous); if (next.has(id)) { next.delete(id); notify(removed); } else { next.add(id); notify(added); } return next; });
  };
  const handleForm = (result: FormResult) => {
    const id = `user-${Date.now()}`;
    if (result.kind === "project") {
      const created: Project = { id, name: result.name, area: result.area, country: result.country, siteAddress: result.siteAddress || undefined, currency: result.currency, status: result.status, builder: result.builder, value: result.value, homes: result.homes, completion: "Not scheduled", confidence: 100, updated: "Just added", description: result.notes, tags: ["Added by you"], coordinates: { x: 50, y: 50 } };
      setProjects(current => [created, ...current]);
      navigate("map");
      setProjectId(id);
      notify("Project added to this device's global workspace");
    } else if (result.kind === "opportunity") {
      setOpportunities(current => [{ id, title: result.name, builder: result.builder, area: [result.area, result.country].filter(Boolean).join(", "), type: "Partner mandate", commission: result.commission, deadline: "Open", matches: 0, description: result.notes }, ...current]);
      navigate("marketplace");
      notify("Opportunity saved in this workspace");
    } else if (result.kind === "alert") {
      setAlerts(current => [{ id, title: result.name, body: `Watching ${[result.area, result.country].filter(Boolean).join(", ")}: ${result.notes}`, time: "Just now", read: false }, ...current]);
      navigate("alerts");
      notify("Area watch saved on this device");
    } else notify(`Message prepared for ${result.name}`);
  };

  let content: React.ReactNode;
  switch (view) {
    case "overview": content = <OverviewView role={role} items={projects} onNavigate={navigate} onAdd={requestProjectForm}/>; break;
    case "map": content = <MapView items={projects} onProject={setProjectId} onAdd={requestProjectForm} onNavigate={navigate}/>; break;
    case "projects": content = <ProjectsView items={projects} saved={savedProjects} onProject={setProjectId} onSave={id => toggleSet(setSavedProjects, id, "Project saved", "Project removed from saved")} onAdd={requestProjectForm}/>; break;
    case "network": content = <NetworkView items={projects} role={role} onProject={setProjectId} onAdd={requestProjectForm}/>; break;
    case "areas": content = <AreasView items={projects} onProject={setProjectId} onWatch={area => { setFormArea(area); setForm("alert"); }} onMap={() => navigate("map")}/>; break;
    case "marketplace": content = <MarketplaceView items={opportunities} role={role} applied={applied} saved={savedOpps} onApply={id => toggleSet(setApplied, id, "Interest recorded", "Interest withdrawn")} onSave={id => toggleSet(setSavedOpps, id, "Opportunity saved", "Opportunity removed")} onPost={() => setForm("opportunity")}/>; break;
    case "radar": content = <RadarView following={following} onFollow={id => toggleSet(setFollowing, id, "Signal followed", "Signal unfollowed")} onProject={setProjectId} onCreateAlert={() => setForm("alert")}/>; break;
    case "alerts": content = <AlertsView items={alerts} onRead={id => setAlerts(current => current.map(alert => alert.id === id ? { ...alert, read: true } : alert))} onReadAll={() => setAlerts(current => current.map(alert => ({ ...alert, read: true })))} onDelete={id => setAlerts(current => current.filter(alert => alert.id !== id))} onProject={setProjectId} onSettings={() => navigate("profile")}/>; break;
    case "profile": content = <ProfileView role={role} onRoleChange={changeRole} onNotify={notify}/>; break;
    case "client-access": content = <ClientAccessView role={role} projects={projects} onNavigate={navigate}/>; break;
  }

  return <><AppShell view={view} role={role} mobileOpen={mobileOpen} unread={alerts.filter(alert => !alert.read).length} onNavigate={navigate} onRoleChange={changeRole} onMobileToggle={() => setMobileOpen(!mobileOpen)} onSearch={() => setSearchOpen(true)}>{content}</AppShell>
    {searchOpen && <GlobalSearch items={projects} query={query} setQuery={setQuery} onClose={() => { setSearchOpen(false); setQuery(""); }} onNavigate={navigate} onProject={setProjectId}/>}
    {projectId && <ProjectDetail id={projectId} items={projects} role={role} saved={savedProjects.has(projectId)} onClose={() => setProjectId(null)} onSave={() => toggleSet(setSavedProjects, projectId, "Project saved", "Project removed from saved")} onNotify={notify} onOpportunity={() => { setProjectId(null); navigate("marketplace"); }}/>}
    {form && <SimpleFormModal kind={form} recipient={form === "message" ? messageRecipient : ""} initialArea={formArea} onClose={() => { setForm(null); setMessageRecipient(""); setFormArea(""); }} onSubmit={handleForm}/>}
    {toast && <Toast message={toast} onClose={() => setToast("")}/>}
  </>;
}
