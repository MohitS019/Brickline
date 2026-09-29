"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import type { Project, Role } from "@/lib/brickline-data";
import { BrandLogo } from "./brand-logo";
import { InteractiveProjectMap } from "./interactive-project-map";
import { ProjectCard } from "./entity-cards";

const roles: {
  id: Role;
  title: string;
  outcome: string;
  bullets: string[];
}[] = [
  {
    id: "Agent",
    title: "Agent",
    outcome: "Discover projects early and introduce clients securely.",
    bullets: [
      "Map-first project research",
      "Locality and builder intelligence",
      "Timed, audited client introductions",
    ],
  },
  {
    id: "Builder",
    title: "Builder",
    outcome: "Publish verified projects and manage market visibility.",
    bullets: [
      "RERA-focused project profiles",
      "Builder dashboard and project controls",
      "Agent and client engagement signals",
    ],
  },
  {
    id: "Client",
    title: "Client",
    outcome: "Research what an agent shares without losing context.",
    bullets: [
      "Public project discovery",
      "Account-bound builder introductions",
      "Clear active and expired access states",
    ],
  },
];

const researchSteps = [
  "Explore map",
  "Project",
  "Timeline",
  "Developer",
  "Area",
  "Introduction",
];

const faqs = [
  {
    question: "What does RERA verification mean on Brickline?",
    answer:
      "A green badge means the account or project registration details have completed Brickline's current admin review. Pending and unverified states remain visibly separate. Brickline is not a government registry and users should still confirm records with the relevant RERA authority.",
  },
  {
    question: "Who can see builder contact details?",
    answer:
      "Protected builder details are limited to approved roles and client introductions issued by an Agent. Public visitors see project and builder summaries, not private account data.",
  },
  {
    question: "How does timed access work?",
    answer:
      "An Agent selects a client and project, chooses 15 minutes to 2 hours, and issues an account-bound link. The server checks the account, expiry, revocation state, device signal, and open limit on access.",
  },
  {
    question: "What is demo data versus verified data?",
    answer:
      "Demo records are clearly labelled and exist to demonstrate the product. User-submitted records show their own verification state. Brickline does not present illustrative records as live market facts.",
  },
];

export function PublicLanding({
  projects,
  signInHref,
  appUrl,
}: {
  projects: Project[];
  signInHref: string;
  appUrl?: string;
}) {
  const featured = projects.slice(0, 3);
  const appHref = (path: string) => `${appUrl || ""}${path}`;
  const openProject = (id: string) =>
    window.location.assign(appHref(`/projects/${encodeURIComponent(id)}`));

  return (
    <main className="public-site">
      <header className="public-topbar">
        <Link href="/" className="site-brand" aria-label="Brickline home">
          <BrandLogo />
        </Link>
        <nav aria-label="Public navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#for-agents">For Agents</a>
          <a href="#for-builders">For Builders</a>
          <a href="#for-clients">For Clients</a>
        </nav>
        <div>
          <a href={signInHref} target="_top" className="public-login">
            Log in
          </a>
          <a href={appHref("/request-access")} className="reference-primary">
            Request access
          </a>
        </div>
      </header>

      <section className="public-hero">
        <div className="public-hero-copy">
          <span className="reference-eyebrow">
            INDIA REAL-ESTATE INTELLIGENCE
          </span>
          <h1>
            Know what is being <em>built</em> before the sign goes up
          </h1>
          <p>
            Research projects, developers, localities, and secure introductions
            from one verified professional workspace.
          </p>
          <div className="public-actions">
            <a href={appHref("/request-access")} className="reference-primary">
              Request access <ArrowRight size={16} />
            </a>
            <a href="#featured-map" className="public-secondary">
              Explore the map <MapPin size={16} />
            </a>
          </div>
        </div>
        <div className="public-map-preview" id="featured-map">
          <div className="public-map-label">
            <span className="micro-label">LIVE PRODUCT PREVIEW</span>
            <b>Project activity across India</b>
          </div>
          <InteractiveProjectMap
            projects={projects}
            selectedId={null}
            focusProjects={projects}
            onSelect={openProject}
          />
        </div>
      </section>

      <section className="public-trust" aria-label="Trust and access controls">
        <span>
          <ShieldCheck size={18} />
          <b>RERA-focused verification</b>
        </span>
        <span>
          <UserRoundCheck size={18} />
          <b>Admin-reviewed accounts</b>
        </span>
        <span>
          <Clock3 size={18} />
          <b>Timed, audited client access</b>
        </span>
        <span>
          <MapPin size={18} />
          <b>India-wide map coverage</b>
        </span>
      </section>

      <section className="public-section public-role-section">
        <div className="public-section-heading">
          <span className="reference-eyebrow">
            THREE PROFESSIONS · ONE DATA SPINE
          </span>
          <h2>
            A workspace shaped around <em>how you decide.</em>
          </h2>
        </div>
        <div className="public-role-grid">
          {roles.map((role) => (
            <article key={role.id} id={`for-${role.id.toLowerCase()}s`}>
              <span className="micro-label">{role.id.toUpperCase()} PANEL</span>
              <h3>{role.title}</h3>
              <p>{role.outcome}</p>
              <ul>
                {role.bullets.map((bullet) => (
                  <li key={bullet}>
                    <CheckCircle2 size={15} />
                    {bullet}
                  </li>
                ))}
              </ul>
              <a href={appHref(`/request-access?role=${role.id}`)}>
                Request {role.id.toLowerCase()} access <ArrowRight size={15} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="public-section public-how" id="how-it-works">
        <div className="public-section-heading">
          <span className="reference-eyebrow">THE RESEARCH JOURNEY</span>
          <h2>
            From map signal to <em>qualified introduction.</em>
          </h2>
        </div>
        <ol>
          {researchSteps.map((step, index) => (
            <li key={step}>
              <span>{index + 1}</span>
              <b>{step}</b>
            </li>
          ))}
        </ol>
      </section>

      <section className="public-section public-introduction">
        <div>
          <span className="reference-eyebrow">TIMED INTRODUCTIONS</span>
          <h2>
            Private access that <em>expires by design.</em>
          </h2>
          <p>
            Links are signed, tied to the intended client account, and checked
            by the server on every protected request.
          </p>
          <p>
            Issued, opened, expired, and revoked events become part of the
            security audit trail.
          </p>
        </div>
        <div className="introduction-mock" aria-label="Timed access example">
          <span className="micro-label">SHARED BY ANANYA · ACTIVE</span>
          <div>
            <b>Meridian One BKC</b>
            <small>Meridian Habitat · Mumbai</small>
          </div>
          <strong>14:32</strong>
          <small>Time remaining · 2 of 5 opens used</small>
          <span className="share-state expired">Expired links are denied</span>
        </div>
      </section>

      <section className="public-section public-featured">
        <div className="public-section-heading">
          <span className="reference-eyebrow">FEATURED DEMO PROJECTS</span>
          <h2>
            See the shared component system <em>in context.</em>
          </h2>
        </div>
        <div className="public-project-grid">
          {featured.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpen={() => openProject(project.id)}
            />
          ))}
        </div>
      </section>

      <section className="public-section public-faq">
        <div className="public-section-heading">
          <span className="reference-eyebrow">FREQUENTLY ASKED</span>
          <h2>
            Clear answers before <em>you request access.</em>
          </h2>
        </div>
        <div>
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>
                {faq.question}
                <span>+</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="public-final-cta">
        <span className="micro-label">READY TO ENTER THE WORKSPACE?</span>
        <h2>Start with the map. Continue with verified context.</h2>
        <a href={appHref("/request-access")} className="reference-primary">
          Request access <ArrowRight size={16} />
        </a>
      </section>

      <footer className="public-footer">
        <BrandLogo descriptor />
        <nav>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="mailto:mohitsonje4@gmail.com">Contact</a>
          <Link href="/data-sources">Data sources</Link>
        </nav>
        <p>
          Basemap data © OpenStreetMap contributors. Demo projects are
          illustrative and labelled; user submissions and manual signals retain
          their verification state.
        </p>
      </footer>
    </main>
  );
}
