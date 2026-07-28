# 02. Comprehensive Folder Structure & File Architecture
**System Name:** Moonstar Enterprise Insurance, Mortgage & Commercial Lending CRM  
**Root Workspace:** `c:\Users\prems\Downloads\MMI-`  

---

## 1. Directory Tree Overview

The application follows a structured Next.js App Router layout divided into domain-specific route groups, modularized UI components, shared backend services, utility helpers, and database schemas:

```
c:\Users\prems\Downloads\MMI-\
├── app/                        # Next.js App Router hierarchy (Pages, Layouts, and API Route Handlers)
│   ├── (dashboard)/            # Route Group: Protected Insurance CRM dashboard routes
│   │   ├── accounting/         # Accounting & Commission tracking pages
│   │   ├── admin/              # Admin supervisory dashboard, CSR assignments, reports
│   │   ├── csr/                # CSR personal lead queues and pipeline boards
│   │   ├── superadmin/         # Superadmin god-mode configuration, audit logs, user management
│   │   ├── DashboardClientLayout.tsx # Client wrapper for dashboard sidebars and top bars
│   │   └── layout.tsx / loading.tsx  # Shared layout and loading spinner for dashboard routes
│   ├── api/                    # Serverless HTTP backend endpoints
│   │   ├── accounting/         # Route handlers for financial verification and commission updates
│   │   ├── delete-document/    # Route handler for deleting files from Supabase storage
│   │   ├── documents/          # Route handlers for fetching document URLs and metadata
│   │   ├── mortgage/           # Route handlers dedicated to Moonstar Mortgage loans & auth
│   │   ├── notify-submission/  # Route handler triggering email/portal alerts on intake receipt
│   │   ├── reminder-check/     # Background cron endpoint for evaluating SLA follow-ups
│   │   ├── reports/            # Route handlers for generating Excel/PDF KPI workbooks
│   │   ├── send-email/         # Route handler interfacing with MS Graph API to dispatch emails
│   │   ├── superadmin/         # Route handlers for system settings, email templates, form templates
│   │   ├── update-client/      # Route handler for updating core client demographic info
│   │   ├── update-stage/       # Core pipeline stage progression engine validating mandatory fields
│   │   └── upload-document/    # Route handler for multipart file uploads to Supabase storage
│   ├── intake/[id]/            # Public unauthenticated portal for client form completion & file uploads
│   ├── lending/                # Route Group: Accurate Lending commercial loan portal
│   │   ├── activity-log/       # Audit trail for commercial loan state transitions
│   │   ├── dashboard/          # Lending overview and metrics
│   │   ├── loans/              # Detailed loan application views (`/new`, `/[id]`)
│   │   ├── login/              # Dedicated authentication screen for Accurate Lending
│   │   ├── pipeline/           # 21-stage commercial lending kanban/table pipeline
│   │   ├── term-sheet-received/# Dedicated UI stage for handling bank term sheets and section E data
│   │   └── LendingClientLayout.tsx   # Client layout wrapper with Lending sidebar/topbar
│   ├── login/                  # Main authentication screen for Innovative Insurance portal
│   ├── mortgage/               # Route Group: Moonstar Mortgage portal
│   │   ├── components/         # Mortgage-specific modals and pipeline views
│   │   ├── lib/                # Mortgage stage field definitions (`stageFields.ts`) & types
│   │   ├── login/              # Dedicated authentication screen for Moonstar Mortgage
│   │   ├── pipeline/ & pipelines/ # Mortgage loan processing boards and table views
│   │   └── MortgageClientLayout.tsx  # Client layout wrapper with Mortgage sidebar/topbar
│   ├── test-ui/                # Internal developer sandbox for UI verification
│   ├── unauthorized/           # Error page displayed when RBAC checks deny access
│   ├── globals.css             # Global Tailwind styles and custom CSS reset
│   ├── layout.tsx              # Application Root Layout wrapping ToastProvider
│   └── page.tsx                # Multi-portal landing screen directing users to their assigned domain
├── components/                 # Reusable React UI Components divided by functional domain
│   ├── email/                  # Email composer and MS Graph template preview modals
│   ├── forms/                  # Insurance line-of-business intake forms (Auto, Home, Commercial, Vehicle)
│   ├── layout/                 # Shared structural components (`TopBar.tsx`, `Sidebar.tsx`, `Footer.tsx`)
│   ├── leads/                  # Client management modals (`EditClientModal`, `CategorySelectionModal`, `DocumentViewer`)
│   ├── lending/                # Accurate Lending domain components (`SectionELenderInfo`, `TermSheetReceivedStageUI`)
│   ├── mortgage/               # Mortgage layout headers and sidebars
│   ├── pipeline/               # Pipeline stage transition modal (`UpdateStageModal.tsx`)
│   └── ui/                     # Generic UI primitives (`Loading.tsx`, `Toast.tsx`, `IntakeUI.tsx`, `MultiSelectPolicy.tsx`)
├── constants/                  # Static application configurations and lookups (`policyTypes.ts`, `companyRoles.ts`)
├── data/                       # Cached schema definitions (`openapi_service.json`) and diagnostic outputs
├── lib/                        # Core backend integrations, Supabase clients, and email engines
├── migrations/                 # PostgreSQL schema migrations, stored procedures, and trigger definitions
├── scripts/                    # Node.js maintenance scripts for schema dumps, refactoring, and reporting
├── supabase/                   # Supabase configuration files (`config.toml`)
├── utils/                      # Shared business logic and helper utilities (`auth.ts`, `renewalHelper.ts`)
├── proxy.ts                    # Next.js Middleware handling session cookies, RBAC enforcement, and portal routing
├── next.config.js              # Next.js configuration enabling Turbopack
├── package.json                # Project dependencies (`@supabase/ssr`, `exceljs`, `pdfkit`, `zod`, etc.)
└── tailwind.config.js          # Tailwind CSS design system configuration
```

---

## 2. Detailed Folder & Key File Analysis

### 2.1 `/app` (App Router Core)
- **Purpose**: Defines the routing architecture, layouts, page boundaries, and API endpoints.
- **Key Files & Folders**:
  - `app/layout.tsx`: Root HTML/Body wrapper initializing `ToastProvider` across all pages.
  - `app/page.tsx`: The primary portal selector (`/`). Evaluates the active user's session, inspects `profiles.portal_access`, and routes them automatically to `/csr`, `/lending/dashboard`, or `/mortgage`.
  - `app/(dashboard)/*`: Route group grouping the four core insurance roles (`csr`, `admin`, `superadmin`, `accounting`) under `DashboardClientLayout.tsx` which renders the insurance navigation sidebar.
  - `app/lending/*`: Completely isolated commercial lending portal. Features `LendingClientLayout.tsx` for commercial navigation, loan creation forms (`loans/new/page.tsx`), and the 21-stage pipeline viewer (`pipeline/page.tsx`).
  - `app/mortgage/*`: Isolated residential mortgage portal containing its own local state components (`app/mortgage/components/`) and stage configuration lookups (`app/mortgage/lib/stageFields.ts`).
  - `app/intake/[id]/page.tsx`: Publicly accessible client intake portal where unauthenticated customers fill out required insurance details (`AutoInsuranceForm.tsx`, etc.) and upload declaration PDFs.

### 2.2 `/app/api` (Backend Route Handlers)
- **Purpose**: Acts as the server-side API layer, isolating secret keys (`SUPABASE_SERVICE_ROLE_KEY`, Azure credentials) and handling complex transactional database updates.
- **Key Files & Folders**:
  - `app/api/update-stage/route.ts`: Crucial progression engine. When a CSR attempts to move a lead between pipeline stages, this route queries the target stage's `mandatory_fields` (`JSONB` array), verifies that all required keys exist inside `temp_leads_basics`, logs the movement in `lead_stage_history`, and commits the update.
  - `app/api/upload-document/route.ts`: Accepts `multipart/form-data` uploads, validates file types/sizes, uploads them into the `documents` Supabase Storage bucket, and inserts metadata records into `documents` table.
  - `app/api/send-email/route.ts`: Integrates with `lib/microsoftGraph.ts` to dispatch custom intake forms or quote notifications directly to clients via corporate Outlook/Azure mailboxes.
  - `app/api/mortgage/loans/route.ts`: Handles CRUD operations for residential mortgage applications, enforcing strict data cleansing via `sanitizePayloadForPostgres` before inserting into `mortgage_loans`.

### 2.3 `/components` (Domain-Specific UI Components)
- **Purpose**: Houses all modular, reusable React components cleanly segregated by domain.
- **Key Files & Folders**:
  - `components/forms/*`: Contains multi-step forms (`AutoInsuranceForm.tsx`, `HomeInsuranceForm.tsx`, `VehicleListForm.tsx`) used inside both the public client intake view (`/intake/[id]`) and internal CSR edit screens.
  - `components/pipeline/UpdateStageModal.tsx`: Interactive modal presented when clicking a pipeline card. It displays required fields, captures stage remarks, and calls `/api/update-stage`.
  - `components/lending/SectionELenderInfo.tsx`: Complex multi-bank management UI for stage 5+ of commercial lending, tracking bank officers, underwriters, and closing checklists.
  - `components/email/EmailModal.tsx`: Email composer allowing CSRs to select pre-built `email_templates`, inject dynamic client variables, and preview the output before sending.

### 2.4 `/lib` (Services & Integrations)
- **Purpose**: Centralizes external system communication, database clients, and business engines.
- **Key Files**:
  - `lib/supabaseClient.ts`: Browser-side Supabase client initialized with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Also provides helper functions `getPersonalLinesPipeline()` and `getInitialStage()`.
  - `lib/supabaseServer.ts`: Server-side Supabase client factory (`createServer()`) leveraging `@supabase/ssr` to read/write session cookies inside Server Components and Route Handlers. Also exports `supabaseServer` administrative client for RLS bypasses.
  - `lib/microsoftGraph.ts`: Handles Azure OAuth2 token acquisition (`https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token`) and dispatches emails via `https://graph.microsoft.com/v1.0/users/{from}/sendMail`. Logs all dispatch attempts into `email_logs`.
  - `lib/emailTemplating.ts`: Advanced HTML email generator translating raw template strings and dynamic lead variables into clean, professional email bodies.
  - `lib/ToastContext.tsx`: Global React Context providing `showToast(msg, type)` across all client components.

### 2.5 `/utils` (Shared Helpers)
- **Purpose**: Pure utility functions used across frontend components and backend routes.
- **Key Files**:
  - `utils/auth.ts`: Core RBAC utility. Exports `getCurrentUser()`, `getUserRole()`, `getRedirectPath()`, and `authenticateApiRequest(req, allowedRoles)`. Used inside every API route handler to verify JWT bearer tokens or session cookies.
  - `utils/renewalHelper.ts`: Contains business logic for checking policy expiration dates, calculating upcoming X-Dates, and automatically spawning renewal leads inside `temp_leads_basics`.
  - `utils/fileParser.ts`: PapaParse wrapper for extracting structured JSON arrays from uploaded CSV/Excel lead files.

### 2.6 `/migrations` & `/supabase` (Database Engineering)
- **Purpose**: Maintains idempotent SQL migration scripts defining tables, triggers, RPCs, and RLS policies.
- **Key Files**:
  - `migrations/20260720_accurate_lending_backend.sql`: The primary 400+ line master migration establishing the entire `accurate_lending_loans`, `lending_bank_assignments`, `lending_documents`, `lending_stage_history` relational structure, triggers (`handle_lending_updated_at`), 21 pipeline stages, storage buckets (`lending-documents`), and RLS policies.
  - `migrations/20260301_enterprise_reports_schema.sql` & `20260301_reports_rpc.sql`: Defines `get_report_summary` stored procedure and composite indexing (`idx_leads_reporting_composite`) for high-speed monthly aggregations.

### 2.7 `/proxy.ts` (Next.js Middleware)
- **Purpose**: Intercepts every incoming HTTP request before it hits the App Router or API routes.
- **Key Operations**:
  - Refreshes expired `@supabase/ssr` session cookies (`request.cookies.getAll()`).
  - Resolves user roles and `portal_access` array from `profiles` table.
  - Enforces strict route blocking: prevents `csr` from accessing `/admin`, redirects `@moonstar.com` emails to `/mortgage`, and blocks non-lending users from entering `/lending`.

---

## 3. Folder Dependency & Interconnection Map

```
                +---------------------------------+
                |           /proxy.ts             |
                |  (Next.js Security Middleware)  |
                +---------------------------------+
                                 |
                                 v
                +---------------------------------+
                |         /app (App Router)       |
                |  - /app/(dashboard)/*           |
                |  - /app/lending/*               |
                |  - /app/mortgage/*              |
                |  - /app/intake/[id]/*           |
                +---------------------------------+
                  /               |             \
                 /                |              \
                v                 v               v
+-----------------------+  +--------------+  +-----------------------+
|  /components (UI)     |  |  /app/api/*  |  |  /utils (Helpers)     |
|  - /forms             |  |  (Backend    |  |  - /auth.ts           |
|  - /pipeline          |  |   Handlers)  |  |  - /renewalHelper.ts  |
|  - /email             |  +--------------+  +-----------------------+
|  - /lending           |         |             /
+-----------------------+         |            /
        \                         |           /
         \                        v          v
          +------------------------------------------+
          |            /lib (Services)               |
          |  - /supabaseClient.ts / supabaseServer.ts|
          |  - /microsoftGraph.ts                    |
          |  - /emailTemplating.ts                   |
          +------------------------------------------+
                              |
                              v
          +------------------------------------------+
          |      /migrations & /supabase (DB)        |
          |  - Relational Tables, JSONB, Triggers    |
          |  - Row-Level Security (RLS) Policies     |
          +------------------------------------------+
```

### Dependency Rules:
1. **`/app/api/*` depends on `/lib/supabaseServer.ts` and `/utils/auth.ts`**: API routes must always authenticate incoming requests using `authenticateApiRequest()` before executing mutations using `supabaseServer`.
2. **`/components/*` depends on `/lib/supabaseClient.ts` and `/lib/ToastContext.tsx`**: Client components interact with the browser client for real-time storage URLs and simple SELECT queries, reporting feedback via `useToast()`.
3. **`/lib/microsoftGraph.ts` depends on `.env.local` keys and `email_logs` table**: Outbound emails require Azure OAuth2 client credentials and write dispatch receipts directly into the `email_logs` relational table.
