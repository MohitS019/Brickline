"use client";

import { BellRing, Bookmark, MapPin, Radio, ShieldCheck } from "lucide-react";
import { statusColor, type AreaSignal } from "@/lib/brickline-data";
import { PageHeader } from "../ui";
import { ProjectStatusBadge } from "@/components/brickline/entity-cards";

export function RadarView({
  signals,
  following,
  onFollow,
  onCreateAlert,
}: {
  signals: AreaSignal[];
  following: Set<string>;
  onFollow: (id: string) => void;
  onCreateAlert: () => void;
}) {
  return (
    <div className="page">
      <PageHeader
        eyebrow="INDIA REAL ESTATE RADAR"
        title="Watch the markets that matter"
        description="Verified manual signals entered by Brickline operations appear here until an automated source is connected."
        actions={
          <button className="button primary" onClick={onCreateAlert}>
            <BellRing size={16} />
            Create alert
          </button>
        }
      />
      {signals.length ? (
        <div className="signal-feed">
          {signals.map((signal) => (
            <article className="signal-card" key={signal.id}>
              <span
                className="signal-mark"
                style={{ background: statusColor[signal.category] }}
              >
                <Radio size={17} />
              </span>
              <div className="signal-body">
                <div className="signal-title">
                  <h2>{signal.title}</h2>
                  <span>
                    {new Date(
                      `${signal.eventDate}T00:00:00`,
                    ).toLocaleDateString()}
                  </span>
                </div>
                <p>{signal.detail}</p>
                <ProjectStatusBadge status={signal.category} />
                <span className="location-tag">
                  <MapPin size={12} />
                  {signal.area}, {signal.state}
                </span>
                <div className="manual-source">
                  <ShieldCheck size={13} />
                  Manual ops entry · Source: {signal.sourceNote}
                </div>
              </div>
              <div className="signal-actions">
                <button
                  className={
                    following.has(signal.id)
                      ? "button primary"
                      : "button secondary"
                  }
                  onClick={() => onFollow(signal.id)}
                >
                  <Bookmark size={14} />
                  {following.has(signal.id) ? "Following" : "Follow"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="panel global-empty-panel component-empty-state">
          <Radio size={42} />
          <h2>No verified India signals yet</h2>
          <p>
            An administrator can publish a checked manual signal from the Admin
            panel.
          </p>
          <button className="button secondary" onClick={onCreateAlert}>
            <BellRing size={16} />
            Watch a location
          </button>
        </section>
      )}
    </div>
  );
}
