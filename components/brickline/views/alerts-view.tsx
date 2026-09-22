"use client";

import { Bell, CheckCheck, Settings2, Trash2 } from "lucide-react";
import { PageHeader } from "../ui";

export interface AlertItem { id: string; title: string; body: string; time: string; read: boolean; projectId?: string }
export function AlertsView({ items, onRead, onReadAll, onDelete, onSettings }: { items: AlertItem[]; onRead: (id: string) => void; onReadAll: () => void; onDelete: (id: string) => void; onProject: (id: string) => void; onSettings: () => void }) {
  return <div className="page"><PageHeader eyebrow="ALERT CENTRE" title="Your alerts" description="Location alerts you create are kept in this device's workspace. Automated notifications require a live data source." actions={<><button className="button secondary" onClick={onReadAll}><CheckCheck size={16}/>Mark all read</button><button className="button secondary" onClick={onSettings}><Settings2 size={16}/>Profile</button></>}/><section className="panel alert-list">{items.map(alert => <article className={alert.read ? "alert-item" : "alert-item unread"} key={alert.id} onClick={() => onRead(alert.id)}><span className="alert-icon"><Bell size={18}/></span><div><div><h2>{alert.title}</h2><span>{alert.time}</span></div><p>{alert.body}</p></div><div className="alert-actions"><button onClick={event => { event.stopPropagation(); onDelete(alert.id); }} aria-label="Delete alert"><Trash2 size={16}/></button></div></article>)}{!items.length && <div className="empty-alerts"><Bell size={30}/><h2>No alerts yet</h2><p>Create a location alert from Radar to start your watchlist.</p></div>}</section></div>;
}
