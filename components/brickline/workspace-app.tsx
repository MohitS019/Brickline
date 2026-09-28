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
import { PanelAccessGate } from "./panel-access-gate";
import { AdminView } from "./views/admin-view";
import { BrandLogo } from "./brand-logo";
import type { PanelAccess } from "@/lib/panel-access";
import type { PanelContent } from "@/lib/panel-content";
import type {
  AreaSignal,
  Opportunity,
  Project,
  Role,
  ViewId,
} from "@/lib/brickline-data";

const readStored = <T,>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
};

export default function WorkspaceApp({
  panelAccess,
  panelContent: initialPanelContent,
  initialProjectId = null,
}: {
  panelAccess: PanelAccess;
  panelContent: PanelContent;
  initialProjectId?: string | null;
}) {
  const [panelContent, setPanelContent] = useState(initialPanelContent);
  const [view, setView] = useState<ViewId>("overview");
  const [role, setRole] = useState<Role>(
    panelAccess.allowedRoles[0] || "Agent",
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projectId, setProjectId] = useState<string | null>(initialProjectId);
  const [projectOrigin, setProjectOrigin] = useState<{
    view: ViewId;
    scrollY: number;
  } | null>(initialProjectId ? { view: "projects", scrollY: 0 } : null);
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
  const [areaSignals, setAreaSignals] = useState<AreaSignal[]>([]);
  const notify = useCallback((message: string) => setToast(message), []);

  useEffect(() => {
    if (initialProjectId && !window.history.state?.bricklineProject) {
      window.history.replaceState(
        { bricklineProject: initialProjectId, bricklineDirect: true },
        "",
        window.location.pathname,
      );
    }
    const handleHistory = (event: PopStateEvent) => {
      const state = event.state as {
        bricklineProject?: string;
        bricklineView?: ViewId;
        bricklineScroll?: number;
      } | null;
      if (state?.bricklineProject) {
        setProjectId(state.bricklineProject);
        window.scrollTo({ top: 0 });
        return;
      }
      setProjectId(null);
      if (state?.bricklineView) setView(state.bricklineView);
      window.requestAnimationFrame(() =>
        window.scrollTo({ top: state?.bricklineScroll || 0 }),
      );
    };
    window.addEventListener("popstate", handleHistory);
    return () => window.removeEventListener("popstate", handleHistory);
  }, [initialProjectId]);

  useEffect(() => {
    // Keep old India-workspace records recoverable under their original keys.
    const load = window.setTimeout(() => {
      setOpportunities(
        readStored<Opportunity>("brickline-global-opportunities"),
      );
      setAlerts(readStored<AlertItem>("brickline-global-alerts"));
      setSavedProjects(
        new Set(readStored<string>("brickline-india-saved-projects")),
      );
      const savedRole = localStorage.getItem("brickline-global-role");
      if (
        (savedRole === "Agent" ||
          savedRole === "Builder" ||
          savedRole === "Client") &&
        panelAccess.allowedRoles.includes(savedRole)
      ) {
        setRole(savedRole);
        if (!panelAccess.isAdmin)
          setView(savedRole === "Agent" ? "map" : "client-access");
      }
      setHydrated(true);
      fetch("/api/projects", { cache: "no-store" })
        .then(async (response) => {
          const result = (await response.json()) as { projects?: Project[] };
          if (response.ok) setProjects(result.projects || []);
        })
        .catch(() => notify("Projects could not be loaded"));
      if (panelAccess.isAdmin || panelAccess.allowedRoles.includes("Agent"))
        fetch("/api/area-signals", { cache: "no-store" })
          .then(async (response) => {
            const result = (await response.json()) as {
              signals?: AreaSignal[];
            };
            if (response.ok) setAreaSignals(result.signals || []);
          })
          .catch(() => notify("Area signals could not be loaded"));
    }, 0);
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.clearTimeout(load);
      window.removeEventListener("keydown", key);
    };
  }, [panelAccess.allowedRoles, panelAccess.isAdmin, notify]);
  useEffect(() => {
    if (hydrated)
      localStorage.setItem(
        "brickline-global-opportunities",
        JSON.stringify(opportunities),
      );
  }, [opportunities, hydrated]);
  useEffect(() => {
    if (hydrated)
      localStorage.setItem("brickline-global-alerts", JSON.stringify(alerts));
  }, [alerts, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem("brickline-global-role", role);
  }, [role, hydrated]);
  useEffect(() => {
    if (hydrated)
      localStorage.setItem(
        "brickline-india-saved-projects",
        JSON.stringify([...savedProjects]),
      );
  }, [savedProjects, hydrated]);

  const navigate = (next: ViewId) => {
    if (next === "admin" && !panelAccess.isAdmin) return;
    if (projectId) {
      window.history.replaceState(
        { bricklineView: next, bricklineScroll: 0 },
        "",
        "/",
      );
      setProjectId(null);
      setProjectOrigin(null);
    }
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openProject = (id: string) => {
    if (!id) return;
    const origin = projectOrigin || { view, scrollY: window.scrollY };
    if (!projectId) {
      window.history.replaceState(
        {
          ...(window.history.state || {}),
          bricklineView: origin.view,
          bricklineScroll: origin.scrollY,
        },
        "",
        window.location.href,
      );
      setProjectOrigin(origin);
    }
    window.history.pushState(
      { bricklineProject: id },
      "",
      `/projects/${encodeURIComponent(id)}`,
    );
    setProjectId(id);
    window.scrollTo({ top: 0 });
  };
  const closeProject = () => {
    if (
      window.history.state?.bricklineProject &&
      !window.history.state?.bricklineDirect
    ) {
      window.history.back();
      return;
    }
    const target = projectOrigin?.view || "projects";
    window.history.replaceState(
      { bricklineView: target, bricklineScroll: projectOrigin?.scrollY || 0 },
      "",
      "/",
    );
    setProjectId(null);
    setView(target);
    window.requestAnimationFrame(() =>
      window.scrollTo({ top: projectOrigin?.scrollY || 0 }),
    );
  };
  const changeRole = (next: Role) => {
    if (!panelAccess.allowedRoles.includes(next)) return;
    setRole(next);
    setForm(null);
    navigate(next === "Agent" ? "map" : "client-access");
  };
  const requestProjectForm = () => {
    if (role !== "Builder") {
      navigate("client-access");
      notify("Only a verified Builder account can register projects.");
    } else setForm("project");
  };
  const toggleSet = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    id: string,
    added: string,
    removed: string,
  ) => {
    setter((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
        notify(removed);
      } else {
        next.add(id);
        notify(added);
      }
      return next;
    });
  };
  const handleForm = async (result: FormResult) => {
    const id = `user-${Date.now()}`;
    if (result.kind === "project") {
      try {
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        });
        const saved = (await response.json()) as {
          project?: Project;
          error?: string;
        };
        if (!response.ok || !saved.project)
          throw new Error(saved.error || "Project could not be registered.");
        setProjects((current) => [saved.project!, ...current]);
        navigate("map");
        openProject(saved.project.id);
        notify("Project registered securely");
      } catch (cause) {
        notify(
          cause instanceof Error
            ? cause.message
            : "Project could not be registered.",
        );
      }
    } else if (result.kind === "opportunity") {
      setOpportunities((current) => [
        {
          id,
          title: result.name,
          builder: result.builder,
          area: [result.area, result.country].filter(Boolean).join(", "),
          type: "Partner mandate",
          commission: result.commission,
          deadline: "Open",
          matches: 0,
          description: result.notes,
        },
        ...current,
      ]);
      navigate("marketplace");
      notify("Opportunity saved in this workspace");
    } else if (result.kind === "alert") {
      setAlerts((current) => [
        {
          id,
          title: result.name,
          body: `Watching ${[result.area, result.country].filter(Boolean).join(", ")}: ${result.notes}`,
          time: "Just now",
          read: false,
        },
        ...current,
      ]);
      navigate("alerts");
      notify("Area watch saved on this device");
    } else notify(`Message prepared for ${result.name}`);
  };

  if (!hydrated)
    return (
      <div className="approval-shell">
        <div className="approval-brand">
          <BrandLogo descriptor />
        </div>
      </div>
    );
  if (
    !panelAccess.isAdmin &&
    (panelAccess.needsConsent ||
      panelAccess.status !== "approved" ||
      !panelAccess.allowedRoles.length)
  )
    return <PanelAccessGate access={panelAccess} />;

  let content: React.ReactNode;
  switch (view) {
    case "overview":
      content = (
        <OverviewView
          role={role}
          items={projects}
          onNavigate={navigate}
          onAdd={requestProjectForm}
        />
      );
      break;
    case "map":
      content = (
        <MapView
          items={projects}
          onProject={openProject}
          onAdd={requestProjectForm}
          onNavigate={navigate}
        />
      );
      break;
    case "projects":
      content = (
        <ProjectsView
          items={projects}
          saved={savedProjects}
          onProject={openProject}
          onSave={(id) =>
            toggleSet(
              setSavedProjects,
              id,
              "Project saved",
              "Project removed from saved",
            )
          }
          onAdd={requestProjectForm}
          onBuilder={() => navigate("network")}
        />
      );
      break;
    case "network":
      content = (
        <NetworkView
          items={projects}
          role={role}
          onProject={openProject}
          onAdd={requestProjectForm}
        />
      );
      break;
    case "areas":
      content = (
        <AreasView
          items={projects}
          onProject={openProject}
          onWatch={(area) => {
            setFormArea(area);
            setForm("alert");
          }}
          onMap={() => navigate("map")}
        />
      );
      break;
    case "marketplace":
      content = (
        <MarketplaceView
          items={opportunities}
          role={role}
          applied={applied}
          saved={savedOpps}
          onApply={(id) =>
            toggleSet(setApplied, id, "Interest recorded", "Interest withdrawn")
          }
          onSave={(id) =>
            toggleSet(
              setSavedOpps,
              id,
              "Opportunity saved",
              "Opportunity removed",
            )
          }
          onPost={() => setForm("opportunity")}
        />
      );
      break;
    case "radar":
      content = (
        <RadarView
          signals={areaSignals}
          following={following}
          onFollow={(id) =>
            toggleSet(setFollowing, id, "Signal followed", "Signal unfollowed")
          }
          onCreateAlert={() => setForm("alert")}
        />
      );
      break;
    case "alerts":
      content = (
        <AlertsView
          items={alerts}
          onRead={(id) =>
            setAlerts((current) =>
              current.map((alert) =>
                alert.id === id ? { ...alert, read: true } : alert,
              ),
            )
          }
          onReadAll={() =>
            setAlerts((current) =>
              current.map((alert) => ({ ...alert, read: true })),
            )
          }
          onDelete={(id) =>
            setAlerts((current) => current.filter((alert) => alert.id !== id))
          }
          onProject={openProject}
          onSettings={() => navigate("profile")}
        />
      );
      break;
    case "profile":
      content = (
        <ProfileView
          role={role}
          allowedRoles={panelAccess.allowedRoles}
          verificationLabel={panelAccess.verificationLabel}
          verifiedAt={panelAccess.verifiedAt}
          onRoleChange={changeRole}
          onNotify={notify}
        />
      );
      break;
    case "client-access":
      content = (
        <ClientAccessView
          role={role}
          projects={projects}
          copy={panelContent[role]}
          allPanelsApproved={
            panelAccess.mode === "member" &&
            panelAccess.allowedRoles.length === 3
          }
          onNavigate={navigate}
          onProject={openProject}
          onProjectsChange={(changed) =>
            setProjects((current) =>
              current.map((project) =>
                project.id === changed.id ? changed : project,
              ),
            )
          }
          onOpenIntroductions={() => changeRole("Agent")}
        />
      );
      break;
    case "admin":
      content = panelAccess.isAdmin ? (
        <AdminView
          panelContent={panelContent}
          projects={projects}
          onContentChange={(changedRole, copy) =>
            setPanelContent((current) => ({ ...current, [changedRole]: copy }))
          }
        />
      ) : (
        <div className="page">Admin access is required.</div>
      );
      break;
  }

  return (
    <>
      <AppShell
        view={view}
        role={role}
        allowedRoles={panelAccess.allowedRoles}
        isAdmin={panelAccess.isAdmin}
        mobileOpen={mobileOpen}
        unread={alerts.filter((alert) => !alert.read).length}
        onNavigate={navigate}
        onRoleChange={changeRole}
        onMobileToggle={() => setMobileOpen(!mobileOpen)}
        onSearch={() => setSearchOpen(true)}
      >
        <div hidden={Boolean(projectId)}>{content}</div>
        {projectId && (
          <ProjectDetail
            key={projectId}
            id={projectId}
            items={projects}
            signals={areaSignals}
            role={role}
            saved={savedProjects.has(projectId)}
            onClose={closeProject}
            onSave={() =>
              toggleSet(
                setSavedProjects,
                projectId,
                "Project saved",
                "Project removed from saved",
              )
            }
            onNotify={notify}
            onProject={openProject}
            onContact={(recipient) => {
              setMessageRecipient(recipient);
              setForm("message");
            }}
            onOpenArea={() => navigate("areas")}
            backLabel={
              projectOrigin?.view === "map" || projectOrigin?.view === "areas"
                ? "Back to map"
                : "Back to projects"
            }
          />
        )}
      </AppShell>
      {searchOpen && (
        <GlobalSearch
          items={projects}
          query={query}
          setQuery={setQuery}
          onClose={() => {
            setSearchOpen(false);
            setQuery("");
          }}
          onNavigate={navigate}
          onProject={openProject}
        />
      )}
      {form && (
        <SimpleFormModal
          kind={form}
          recipient={form === "message" ? messageRecipient : ""}
          initialArea={formArea}
          onClose={() => {
            setForm(null);
            setMessageRecipient("");
            setFormArea("");
          }}
          onSubmit={handleForm}
        />
      )}
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </>
  );
}
