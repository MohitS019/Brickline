# Brickline

Brickline is a B2B real-estate intelligence platform for builders, agents, and
clients. It combines map-based project discovery, RERA-focused verification,
area intelligence, project timelines, and secure timed introductions in one
role-aware workspace.

**Live application:**
[brickline-b2b-platform.msonje.chatgpt.site](https://brickline-b2b-platform.msonje.chatgpt.site)

> The repository includes clearly labelled illustrative demo records. They are
> product samples, not live market claims.

## Product surfaces

- **Public:** landing page, project discovery preview, product explanation,
  request-access flow, privacy, terms, and data-source notes.
- **Agent:** map-first discovery, project research, builder profiles, saved
  projects, alerts, leads, and time-limited client introductions.
- **Builder:** verified company profile, project publishing and management,
  content controls, and engagement signals.
- **Client:** shared-project research with active and expired introduction
  states.
- **Admin:** account approval, RERA/GST review, access control, content editing,
  area signals, privacy operations, and security audit history.

## Core capabilities

- Responsive MapLibre maps with OpenStreetMap basemaps
- Status filters, project pins, clustering, search, and full-page project detail
- Shared project, builder, status, and verification components
- Project timelines, developer portfolios, and area-development intelligence
- Role and verification checks enforced by server routes
- Signed client-introduction tokens with 15-minute to 2-hour expiry
- Revocation, open limits, device/session binding, and audit logging
- Encryption and fingerprints for RERA, GST, phone, and other sensitive fields
- India DPDP-oriented consent, retention, export, and deletion workflows

## Technology

| Layer                | Choice                                                 |
| -------------------- | ------------------------------------------------------ |
| UI                   | React 19, Next.js 16 App Router, TypeScript            |
| Primary runtime      | Vinext/Vite on Cloudflare Workers through OpenAI Sites |
| Maps                 | MapLibre GL with OpenStreetMap tiles                   |
| Data                 | Cloudflare D1 with Drizzle migrations                  |
| Styling              | Tailwind CSS plus Brickline's custom design system     |
| Icons                | Lucide React                                           |
| Secondary deployment | Vercel-compatible public Next.js build                 |

## Deployment model

Brickline has two deliberate deployment targets:

1. **OpenAI Sites is the full application.** It provides dispatch-owned ChatGPT
   sign-in, Cloudflare D1 bindings, and the authenticated Agent, Builder, Client,
   and Admin workspaces.
2. **Vercel is a public web target.** It builds the same public landing and legal
   pages with standard Next.js. Protected actions are forwarded to the full
   Sites application configured by `NEXT_PUBLIC_BRICKLINE_APP_URL`.

The Vercel compatibility layer intentionally does not fake a database or
authentication session. This keeps public deployments honest and prevents a
partially secured duplicate backend.

## Prerequisites

- Node.js 22.13 or newer
- npm 10 or newer
- Git

## Local setup

```bash
git clone https://github.com/MohitS019/Brickline.git
cd Brickline
npm ci
```

Copy the environment template for local configuration:

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Never commit `.env.local` or real secrets.

### Run the full Sites-compatible application

```bash
npm run dev
```

The portable preview runs on `http://127.0.0.1:5173`. Local Sites development
can simulate sign-in through:

```text
/signin-with-chatgpt?return_to=/
```

Build and preview the Cloudflare Worker output:

```bash
npm run build
npm start
```

### Run the Vercel/Next.js target

```bash
npm run dev:vercel
npm run build:vercel
npm run start:vercel
```

The Vercel target renders public pages locally. Protected links use
`NEXT_PUBLIC_BRICKLINE_APP_URL` and return visitors to the full application.

## Environment variables

| Variable                        | Required by | Purpose                                      |
| ------------------------------- | ----------- | -------------------------------------------- |
| `NEXT_PUBLIC_BRICKLINE_APP_URL` | Vercel      | Full application origin for protected routes |
| `BRICKLINE_ADMIN_EMAIL`         | Sites       | Comma-separated administrator allowlist      |
| `BRICKLINE_GRANT_SECRET`        | Sites       | HMAC signing secret for timed introductions  |
| `BRICKLINE_DATA_SECRET`         | Sites       | Encryption and fingerprinting secret         |

The `DB` D1 binding is declared in `.openai/hosting.json` and injected by Sites;
it is not stored in an environment file.

## Scripts

| Command                | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Start the Vinext/Sites development server        |
| `npm run build`        | Build the deployable Cloudflare Worker           |
| `npm start`            | Preview the built Worker with local D1 state     |
| `npm run dev:vercel`   | Start standard Next.js development               |
| `npm run build:vercel` | Verify the Vercel production build               |
| `npm run start:vercel` | Serve the completed Next.js build                |
| `npm run typecheck`    | Run strict TypeScript checks                     |
| `npm run lint`         | Run ESLint                                       |
| `npm run db:generate`  | Generate Drizzle migrations after schema changes |

## Database and demo data

The D1 schema is defined by ordered SQL migrations in `drizzle/`. Do not edit an
already deployed migration; add a new migration instead.

`lib/demo-seed.ts` provides the shared, labelled demo dataset used by the map,
project lists, builder cards, area intelligence, and Admin examples. Production
records retain their own verification state and are never silently converted
into demo records.

## Project structure

```text
app/
  api/                       secured route handlers
  projects/[projectId]/      full project research route
  request-access/            role-based registration
  privacy|terms|data-sources public policy pages
components/brickline/
  views/                     role and feature views
  entity-cards.tsx           shared project/builder/badge components
  interactive-project-map.tsx
lib/
  api-security.ts            authorization, rate limits, audit helpers
  demo-seed.ts               shared illustrative dataset
  grant-token.ts             signed timed-access tokens
  sensitive-data.ts          encryption and fingerprints
  platform/                  deployment compatibility adapters
drizzle/                     ordered D1 migrations
public/                      logos, favicon, and static headers
scripts/                     Sites/Vinext build and preview helpers
```

## Security notes

- Client-side role selection is never treated as authorization.
- Sensitive mutations require verified server-side roles and same-origin JSON.
- Introduction expiry and revocation are checked by the server, not only by a
  browser countdown.
- RERA/GST values are encrypted before storage and fingerprinted for duplicate
  detection.
- Secrets belong in the hosting provider's encrypted environment settings.
- Demo data is always labelled in the interface.

See the public [Privacy Notice](https://brickline-b2b-platform.msonje.chatgpt.site/privacy),
[Terms](https://brickline-b2b-platform.msonje.chatgpt.site/terms), and
[Data Sources](https://brickline-b2b-platform.msonje.chatgpt.site/data-sources)
for user-facing details.

## Deploying

### OpenAI Sites

Use the Sites workflow so the source commit, Cloudflare build archive, D1
migrations, and deployment remain synchronized. Runtime secrets are configured
in Sites rather than committed to this repository.

### Vercel

1. Import this GitHub repository into Vercel.
2. Keep the framework preset as **Next.js**.
3. The committed `vercel.json` runs `npm ci` and `npm run build:vercel`.
4. Confirm `NEXT_PUBLIC_BRICKLINE_APP_URL` points at the full Sites application.
5. Deploy. Pull requests receive preview deployments through Vercel's normal Git
   integration.

## Contributing

1. Create a focused branch.
2. Keep demo records labelled and migrations append-only.
3. Run `npm run typecheck`, `npm run lint`, `npm run build`, and
   `npm run build:vercel`.
4. Open a pull request describing user-visible behavior and security impact.

## License

This is a private project. No license or permission to redistribute is granted
unless the repository owner adds one explicitly.
