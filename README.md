# Brickline

Brickline is a B2B real-estate intelligence platform for builders, agents, and
clients. It combines map-based project discovery, RERA-focused verification,
area intelligence, project timelines, and secure timed introductions in one
role-aware workspace.

**Live application:**
[bricklinereal.vercel.app](https://bricklinereal.vercel.app)

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
| Primary runtime      | Next.js on Vercel                                      |
| Maps                 | MapLibre GL with OpenStreetMap tiles                   |
| Auth and data        | Supabase Auth + Postgres with Row Level Security       |
| Styling              | Tailwind CSS plus Brickline's custom design system     |
| Icons                | Lucide React                                           |
| Portable build       | Vinext/Vite compatibility build                        |

## Deployment model

Brickline uses Supabase as the shared authentication and data layer. The full
public site and the authenticated Agent, Builder, Client, and Admin workspaces
can therefore run as one Next.js application on Vercel. A portable Vinext build
remains available for compatibility testing.

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

### Run the application

```bash
npm run dev
```

The Next.js application runs on `http://localhost:3000`. Build and serve the
production application with:

```bash
npm run build
npm start
```

### Optional Sites compatibility target

```bash
npm run dev:sites
npm run build:sites
npm run start:sites
```

Sites/Vinext support is isolated under `scripts/sites/`; it is not used by the
Vercel production deployment.

## Environment variables

| Variable                               | Exposure    | Purpose                                      |
| -------------------------------------- | ----------- | -------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Browser     | Supabase project URL                          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser     | `sb_publishable_…` key governed by RLS        |
| `SUPABASE_SECRET_KEY`                  | Server only | `sb_secret_…` key; never expose to the client |
| `BRICKLINE_APP_SECRET`                 | Server only | 32+ random bytes used for derived app keys    |

Use the raw Supabase project URL, for example
`https://your-project-ref.supabase.co`. Do not paste Markdown such as
`[https://…](https://…)` into `.env.local` or Vercel.

`BRICKLINE_ADMIN_EMAIL` is optional and defaults to `mohitsonje4@gmail.com`.
Account passwords are not environment variables: Supabase Auth salts and hashes
them internally. Never reuse an account password as `BRICKLINE_APP_SECRET`.
Generate the app secret locally, then copy the output into `.env.local` and
Vercel's encrypted environment variables:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

The protected Admin workspace is available at `/admin`. The database migration
promotes only the verified Supabase account `mohitsonje4@gmail.com`; all other
accounts are rejected by the server-side route and Admin API checks.

For a different first administrator, update the chosen row directly in Supabase:

```sql
update public.profiles
set is_admin = true, status = 'approved',
    agent_access = true, builder_access = true, client_access = true
where email = 'admin@example.com';
```

## Scripts

| Command                | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Start standard Next.js development      |
| `npm run build`        | Build the Vercel/Next.js application    |
| `npm start`            | Serve the completed Next.js build       |
| `npm run dev:sites`    | Start the optional Sites/Vinext preview |
| `npm run build:sites`  | Build the optional portable Worker      |
| `npm run typecheck`    | Run strict TypeScript checks            |
| `npm run lint`         | Run ESLint                              |
| `npx supabase start`   | Start the local Supabase stack          |
| `npx supabase test db` | Run database and RLS tests              |

## Database and demo data

The Postgres schema, explicit grants, RLS policies, auth profile trigger, and
labelled demo records live in `supabase/migrations/`. Create future migrations
with `npx supabase migration new <name>` and never edit a migration already
applied to production.

The initial migration seeds 10 labelled demo projects, 5 builders, and 4 area
signals. All product screens read these rows through Supabase; production rows
use `is_demo_record = false` and never receive the Demo record label.

## Project structure

```text
app/
  api/                       secured route handlers
  auth/                      Supabase callback and sign-out routes
  login/                     email/password login and sign-up
  projects/[projectId]/      full project research route
  request-access/            role-based registration
  privacy|terms|data-sources public policy pages
components/brickline/
  views/                     role and feature views
  entity-cards.tsx           shared project/builder/badge components
  interactive-project-map.tsx
lib/
  api-security.ts            authorization, rate limits, audit helpers
  grant-token.ts             signed timed-access tokens
  supabase/                  browser/server/admin clients and mappers
supabase/
  migrations/                Postgres schema, seed data, grants, and RLS
  tests/                     pgTAP security tests
public/                      logos, favicon, and static headers
scripts/                     build helpers
  sites/                     isolated Sites/Vinext compatibility tooling
```

## Security notes

- Client-side role selection is never treated as authorization.
- Sensitive mutations require verified server-side roles and same-origin JSON.
- Introduction expiry and revocation are checked by the server, not only by a
  browser countdown.
- The Supabase secret key is imported only by server route helpers and is never
  referenced by a Client Component.
- Profile, project, introduction, and signal access is protected by explicit
  Postgres grants plus RLS policies.
- Secrets belong in the hosting provider's encrypted environment settings.
- Demo data is always labelled in the interface.

See the public [Privacy Notice](https://bricklinereal.vercel.app/privacy),
[Terms](https://bricklinereal.vercel.app/terms), and
[Data Sources](https://bricklinereal.vercel.app/data-sources)
for user-facing details.

## Deploying

### Vercel

1. Import this GitHub repository into Vercel.
2. Keep the framework preset as **Next.js**.
3. Use the framework defaults: `npm ci` followed by `npm run build`.
4. Add the four environment variables from `.env.example`; keep
   `SUPABASE_SECRET_KEY` and `BRICKLINE_APP_SECRET` restricted to the server.
5. Apply the Supabase migrations, configure the Auth Site URL and redirect URLs,
   then deploy. Pull requests receive preview deployments through Vercel's normal Git
   integration.

## Contributing

1. Create a focused branch.
2. Keep demo records labelled and migrations append-only.
3. Run `npm run typecheck`, `npm run lint`, and `npm run build`.
4. Open a pull request describing user-visible behavior and security impact.

## License

This is a private project. No license or permission to redistribute is granted
unless the repository owner adds one explicitly.
