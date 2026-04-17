#  Moonstar Insurance CRM

> A full-stack, enterprise-grade CRM platform built for modern insurance agencies. Centralizes lead management, automated multi-step intake workflows, pipeline-driven case tracking, and business intelligence reporting — all in a single unified Next.js application.

---

## 📦 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | [Next.js](https://nextjs.org/) (App Router + Turbopack) | `^16.2.1` |
| **Language** | TypeScript | `5.9.3` |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `^3.4.19` |
| **Auth + Database** | [Supabase JS](https://supabase.com/docs/reference/javascript) | `^2.99.1` |
| **SSR Auth Middleware** | [@supabase/ssr](https://supabase.com/docs/guides/auth/server-side) | `^0.8.0` |
| **Email** | [Microsoft Graph API](https://learn.microsoft.com/en-us/graph/api/user-sendmail) | REST |
| **Spreadsheet Export** | [ExcelJS](https://github.com/exceljs/exceljs) | `^4.4.0` |
| **PDF Export** | [PDFKit](https://pdfkit.org/) | `^0.17.2` |
| **CSV Parsing** | [PapaParse](https://www.papaparse.com/) | `^5.5.3` |
| **Animations** | [Framer Motion](https://www.framer.com/motion/) | `^12.38.0` |
| **Icons** | [Lucide React](https://lucide.dev/) | `^0.562.0` |
| **Validation** | [Zod](https://zod.dev/) | `^4.3.6` |
| **Env Config** | [dotenv](https://github.com/motdotla/dotenv) | `^17.3.1` |
| **UI Runtime** | React + React DOM | `18.2.0` |

### Dev Dependencies
| Package | Version |
|---|---|
| `@types/papaparse` | `^5.5.2` |
| `@types/pdfkit` | `^0.17.5` |
| `@types/react` | `19.2.7` |
| `autoprefixer` | `^10.4.23` |
| `postcss` | `^8.5.6` |

---

## ⚙️ Environment Variables

Create a `.env.local` file in the project root:

```env
# ─── Supabase ────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# ─── Microsoft Graph (Email Automation) ──────────────────
MICROSOFT_TENANT_ID=<your-azure-tenant-id>
MICROSOFT_CLIENT_ID=<your-azure-app-client-id>
MICROSOFT_CLIENT_SECRET=<your-azure-client-secret>
MICROSOFT_SENDER_EMAIL=notifications@yourdomain.com

# ─── App ─────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Never expose `SUPABASE_SERVICE_ROLE_KEY` on the client side.** It bypasses Row Level Security (RLS) and is exclusively for server-side API routes.

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) `v18+`
- A configured **Supabase** project (database + auth enabled)
- A **Microsoft Azure App Registration** with `Mail.Send` permission for Graph API

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-org/moonstar-crm.git
cd moonstar-crm

# 2. Install dependencies
npm install

# 3. Add your environment variables
cp .env.example .env.local
# → fill in your keys

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Compile production build
npm run start    # Serve production build
```

---

## 🏗️ Project Architecture

This app follows a **feature-first routing model** using the Next.js App Router. Backend logic lives entirely inside `/app/api` — there is no separate server process.

```
moonstar-crm/
│
├── app/                            # Next.js App Router (unified frontend + backend)
│   ├── (dashboard)/                # Route group — authenticated workspace
│   │   ├── layout.tsx              # Shell: auth guard, sidebar, topbar, footer
│   │   ├── csr/                    # CSR role workspace
│   │   │   ├── activity-log/       # CSR audit trail
│   │   │   ├── leads/              # Lead management
│   │   │   ├── page.tsx            # CSR dashboard
│   │   │   ├── pipeline/           # Active pipeline views
│   │   │   ├── renewals/           # Personal & Commercial renewals
│   │   │   └── reports/            # CSR-specific reporting
│   │   ├── admin/                  # Admin role workspace
│   │   │   ├── assignments/        # Lead assignment management
│   │   │   ├── csrs/               # CSR management & workload
│   │   │   ├── leads/              # Lead management
│   │   │   ├── page.tsx            # Admin overview
│   │   │   ├── pipelines/          # Pipeline configuration
│   │   │   └── reports/            # Admin reporting
│   │   ├── accounting/             # Accounting role workspace
│   │   └── superadmin/             # Super admin console
│   │
│   ├── api/                        # Backend API routes (server-side only)
│   │   ├── send-email/             # Trigger intake email via Microsoft Graph
│   │   ├── notify-submission/      # Notify CSR on client form submission
│   │   ├── update-stage/           # Pipeline stage transitions + history logging
│   │   ├── upload-document/        # Secure file upload to Supabase Storage
│   │   ├── reminder-check/         # Scheduled follow-up reminder logic
│   │   ├── reports/                # Report generation (Excel / PDF)
│   │   └── superadmin/             # Admin-only management APIs
│   │       ├── users/
│   │       ├── pipelines/
│   │       ├── email-templates/
│   │       ├── form-templates/
│   │       ├── system-settings/
│   │       └── audit-logs/
│   │
│   ├── intake/[id]/                # Public-facing client intake form
│   ├── login/                      # Authentication page
│   ├── unauthorized/               # Role access denied page
│   ├── globals.css                 # Global CSS
│   ├── layout.tsx                  # Root layout (Metadata, icons, ToastProvider)
│   └── page.tsx                    # Landing redirect logic
│
├── components/                     # Reusable React component library
│   ├── email/                      # Email generation & management
│   │   └── EmailGenerator.tsx      # Dynamic email composition tool
│   ├── forms/                      # Domain-specific intake form logic
│   │   ├── PrimaryApplicantForm.tsx
│   │   ├── CoApplicantForm.tsx
│   │   ├── AdditionalApplicantsForm.tsx
│   │   ├── AutoInsuranceForm.tsx
│   │   ├── HomeInsuranceForm.tsx
│   │   ├── VehicleListForm.tsx
│   │   └── constants.ts            # Shared enums (education, miles, etc.)
│   ├── layout/                     # Dashboard shell components
│   │   ├── TopBar.tsx              # Auth state, notifications, user profile
│   │   ├── Sidebar.tsx             # Role-based navigation
│   │   └── Footer.tsx
│   ├── pipeline/                   # Workflow & stage management
│   │   └── UpdateStageModal.tsx    # Conditional field logic per pipeline type
│   ├── ui/                         # Atomic design system primitives
│   │   ├── IntakeUI.tsx            # Input, Select, SectionCard, FieldGrid
│   │   ├── Loading.tsx             # Standardized loading spinners
│   │   └── Toast.tsx               # Toast notification component
│   └── page.tsx                    # Shared page wrapper
│
├── lib/                            # Shared utilities & service clients
│   ├── ToastContext.tsx            # Global toast notification state
│   ├── emailTemplating.ts          # Email subject/body template logic
│   ├── fieldLabels.ts              # Human-readable field label dictionary
│   ├── microsoftGraph.ts           # Graph API client
│   ├── renewals/                   # Renewals-specific business logic
│   ├── supabaseClient.ts           # Browser Supabase client (SSR-safe)
│   ├── supabaseServer.ts           # Server-only Supabase client (service role)
│   └── toast.ts                    # Imperative toast utility
│
├── public/                         # Static assets (images, icons)
│   ├── image.png                   # App icon
│   ├── logo.png                    # Dashboard logo
│   └── Moonstarlogo.jpeg           # Alternative logo
│
├── utils/
│   └── auth.ts                     # Auth helpers for server components
│
├── proxy.ts                        # Next.js middleware (route protection + RBAC)
├── tailwind.config.js
├── tsconfig.json
└── vercel.json
```

---

## 🔐 Authentication & Authorization

Auth is handled by **Supabase Auth** with SSR cookie-based sessions via `@supabase/ssr`. The middleware (`proxy.ts`) intercepts every request and enforces a **Role-Based Access Control (RBAC)** matrix before rendering any protected route.

```
Role         | Accessible Routes
─────────────|─────────────────────────────────────
csr          | /csr
admin        | /admin, /csr
accounting   | /accounting
superadmin   | /superadmin, /admin, /csr, /accounting
```

Unauthenticated users are redirected to `/login`. Users with valid sessions but insufficient role access are redirected to `/unauthorized`.

---

## 🔌 API Surface

All API routes are **server-side only** and require Supabase service role credentials.

| Route | Method | Purpose |
|---|---|---|
| `/api/send-email` | `POST` | Send intake form link to client via Microsoft Graph |
| `/api/notify-submission` | `POST` | Alert assigned CSR on form submission |
| `/api/update-stage` | `POST` | Transition lead stage + write to history log |
| `/api/upload-document` | `POST` | Upload client docs to Supabase Storage |
| `/api/reports` | `GET` | Generate Excel/PDF report with filters |
| `/api/reminder-check` | `GET` | Check and send overdue follow-up reminders |
| `/api/superadmin/*` | `GET/POST` | User, pipeline & system management |

---

## 🤝 Collaboration Guidelines

We follow a **trunk-based development** approach with short-lived feature branches.

```bash
# Branch naming convention
feature/<short-description>     # New features
fix/<short-description>         # Bug fixes
chore/<short-description>       # Housekeeping (deps, configs)
```

### Commit Message Format
We use a simplified **Conventional Commits** style:
```
feat: add CSR workload view to admin dashboard
fix: resolve hydration mismatch in lead detail page
chore: update Next.js to 16.2.1
refactor: extract field label logic to shared lib
```

### PR Checklist
Before opening a pull request, verify:
- [ ] No TypeScript errors (`npx tsc --noEmit` passes)
- [ ] No unused imports / dead code
- [ ] API routes use the **server-side** Supabase client, not the browser client
- [ ] New environment variables are documented in this README
- [ ] Branch is rebased on `master` / `ui-dashboard`

### Active Branches
| Branch | Purpose |
|---|---|
| `master` | Production-stable baseline |
| `ui-dashboard` | Active UI/UX improvements & feature work |

---

## 📌 Known Constraints & Notes

- **`SUPABASE_SERVICE_ROLE_KEY`** must never appear in any client-side file (`'use client'`). Use `supabaseServer.ts` only inside `/app/api` routes.
- **`proxy.ts` is the middleware** — it replaces the standard `middleware.ts` filename due to Next.js 16 Turbopack compatibility.
- **Microsoft Graph** is the sole email transport. Nodemailer is no longer used.
- Refresh Token errors (`AuthApiError: Refresh Token Not Found`) are a browser session state issue — clear site data via DevTools → Application → Clear Site Data.
