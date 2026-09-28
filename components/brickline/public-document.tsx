import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "./brand-logo";

export function PublicDocument({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
}) {
  return (
    <main className="public-document public-site">
      <header className="public-topbar compact">
        <Link href="/" className="site-brand">
          <BrandLogo />
        </Link>
        <nav>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/data-sources">Data sources</Link>
        </nav>
        <Link href="/request-access" className="reference-primary">
          Request access
        </Link>
      </header>
      <article>
        <span className="reference-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="public-document-lead">{lead}</p>
        {children}
      </article>
      <footer className="public-footer compact">
        <BrandLogo descriptor />
        <p>
          Questions:{" "}
          <a href="mailto:mohitsonje4@gmail.com">mohitsonje4@gmail.com</a>
        </p>
      </footer>
    </main>
  );
}
