# 01. Project Architecture Analysis
**System Name:** Moonstar Enterprise Insurance, Mortgage & Commercial Lending CRM  
**Repository Structure:** Multi-Portal Next.js 14/16 App Router Monolith  
**Tech Stack:** Next.js (App Router), React 18, TypeScript 5, Tailwind CSS, Supabase (PostgreSQL 14+), Azure MS Graph API  

---

## 1. Executive Overview & System Purpose

The **Moonstar CRM Application** is a unified, multi-portal enterprise customer relationship management system engineered to operate three distinct lines of financial and insurance business within a single codebase:
1. **Innovative Insurance CRM (`/login` → `/(dashboard)/*`)**: Manages Personal Lines, Commercial Lines, X-Date Renewals, Client Intake flows, and CSR/Admin operations.
2. **Accurate Lending CRM (`/lending/login` → `/lending/*`)**: Manages a complex 21-stage commercial lending pipeline, multi-bank underwriting assignments, term sheets, and closing checklists.
3. **Moonstar Mortgage CRM (`/mortgage/login` → `/mortgage/*`)**: Manages residential mortgage loan applications, borrower document tracking, processing pipelines, and loan officer queues.

The architecture is explicitly designed around **high security**, **strict Row-Level Security (RLS)**, **multi-tenant access control (portal_access arrays)**, and **unauthenticated client data capture** through secure tokenized intake links.

---

## 2. Core Technology Stack

### Frontend Layer
- **Next.js (App Router - v16.2.1 / v14.x patterns)**: The application utilizes the Next.js App Router paradigm (`app/` directory). It enforces a strict separation between **React Server Components (RSC)** for data fetching and **React Client Components** (`'use client'`) for interactive forms, modals, and real-time state transitions.
- **React 18**: Provides the foundational component hierarchy, using hooks (`useState`, `useEffect`, `useCallback`, `useMemo`) and custom contexts (`ToastContext.tsx`).
- **TypeScript 5.9.3**: Enforces type safety across API boundaries, form payloads, database entities, and component props (`types.ts`, `companyRoles.ts`, `policyTypes.ts`).
- **Tailwind CSS (`tailwindcss@3.4.19`)**: Utility-first styling engine configured with custom brand colors (`bg-brand`, `teal-500`), glassmorphism effects (`backdrop-blur-xl`), and responsive grid layouts (`tailwind.config.js`).
- **Framer Motion (`framer-motion@12.38.0`)**: Powers dynamic UI transitions, modal entry/exit animations, and smooth layout changes across dashboard panels.
- **Lucide React (`lucide-react@0.475.0`)**: Modern, consistent icon library utilized across top bars, sidebars, stages, and status badges.

### Backend Layer & API Routes
- **Next.js API Route Handlers (`app/api/*`)**: Serverless HTTP endpoints acting as backend controllers. They handle complex operations that require server-side secrets, service role authorization, or external API communication (e.g., file parsing, Excel dumps, document deletions, and email generation).
- **Supabase (`@supabase/ssr@0.8.0` & `@supabase/supabase-js@2.99.1`)**: Provides dual-client architecture (`createServerClient` for cookie-based user context and `supabaseServer` using `SUPABASE_SERVICE_ROLE_KEY` for administrative bypasses).
- **PostgreSQL 14+ (hosted via Supabase)**: Relational data store utilizing strong foreign-key relationships, `JSONB` metadata columns (`stage_metadata`, `mandatory_fields`, `partners`), custom `RPC` functions (`get_report_summary`), triggers (`handle_lending_updated_at`, `handle_new_user`), and fine-grained **Row-Level Security (RLS)**.

### External Services & Utilities
- **Azure Microsoft Graph API (`microsoftGraph.ts`)**: Enterprise email integration allowing the CRM to authenticate against Microsoft 365 / Azure Active Directory via OAuth2 client credentials to dispatch customized client intake links and automated SLA reminders from official corporate email addresses.
- **Reporting & Document Parsing Engine**:
  - **ExcelJS (`exceljs@4.4.0`) & XLSX (`xlsx@0.18.5`)**: High-performance generation of monthly KPI workbooks, commission dumps, and financial reconciliation sheets.
  - **PDFKit (`pdfkit@0.17.2`)**: Server-side programmatic generation of PDF summaries and client reports.
  - **PapaParse (`papaparse@5.5.3`)**: CSV/Excel bulk ingestion utility (`fileParser.ts`) used for importing client lists and policy histories.
  - **Zod (`zod@4.3.6`)**: Runtime schema validation engine applied to backend API payloads and intake form submissions.

---

## 3. High-Level Architectural Patterns

```
+-----------------------------------------------------------------------------------+
|                                  BROWSER CLIENT                                   |
|  (RSC Pages + Client Interactive Components: Forms, Modals, Stage UI, TopBars)     |
+-----------------------------------------------------------------------------------+
                                          |
                                          | HTTP / HTTPS Requests (Cookies: sb-access-token)
                                          v
+-----------------------------------------------------------------------------------+
|                            NEXT.JS MIDDLEWARE (`proxy.ts`)                        |
|  - Intercepts all non-static requests (`/((?!_next/static|_next/image|...).*)`)  |
|  - Validates session via `@supabase/ssr` (`supabase.auth.getUser()`)              |
|  - Queries `profiles` table for `role` and `portal_access` array                  |
|  - Enforces RBAC & Portal Isolation Matrix (`/csr`, `/admin`, `/lending`, etc.)   |
+-----------------------------------------------------------------------------------+
                                          |
                   +----------------------+----------------------+
                   | (Page Requests)                             | (API Mutations)
                   v                                             v
+---------------------------------------+   +---------------------------------------+
|        NEXT.JS APP ROUTER (RSC)       |   |        NEXT.JS API HANDLERS           |
|  - `app/(dashboard)/*` (Insurance)    |   |  - `/app/api/update-stage/route.ts`   |
|  - `app/lending/*` (Lending)          |   |  - `/app/api/upload-document/route.ts`|
|  - `app/mortgage/*` (Mortgage)        |   |  - `/app/api/send-email/route.ts`     |
|  - `app/intake/[id]/*` (Public Intake)|   |  - `/app/api/mortgage/loans/route.ts` |
+---------------------------------------+   +---------------------------------------+
                   |                                             |
                   | Data Queries (Anon / User JWT)              | Mutations (Service / User JWT)
                   +----------------------+----------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                       SUPABASE POSTGRESQL & STORAGE ENGINE                        |
|  - Relational Tables: profiles, pipelines, pipeline_stages, temp_leads_basics,    |
|    accurate_lending_loans, lending_bank_assignments, mortgage_loans               |
|  - JSONB Flexible Fields: stage_metadata, mandatory_fields, stage_data            |
|  - Storage Buckets: `documents` (Insurance/Intake), `lending-documents` (Lending) |
|  - Row-Level Security (RLS) Policies enforcing isolation per user & portal        |
+-----------------------------------------------------------------------------------+
                                          |
                                          | Outbound Email / Reminders
                                          v
+-----------------------------------------------------------------------------------+
|                       AZURE MICROSOFT GRAPH API (`microsoftGraph.ts`)             |
|  - Sends templated intake URLs & SLA reminders via corporate mailboxes            |
|  - Logs delivery metrics and error status directly to `email_logs` table          |
+-----------------------------------------------------------------------------------+
```

### Key Architectural Characteristics:
1. **Server-First Data Fetching (RSC)**: Whenever possible, initial page loads inside dashboard layouts (`page.tsx`) perform queries directly on the server via `createServer()` (`lib/supabaseServer.ts`). This eliminates client-side loading spinners, hides database schema structures, and ensures that data is filtered through server-side RLS policies before being sent over the wire.
2. **Client Mutation & Optimistic Rehydration**: Client components (e.g., `UpdateStageModal.tsx`, `EmailModal.tsx`) manage local UI state during form entry. UPon submission, they send JSON payloads to `/api/*` routes. Once the API confirms the transaction in PostgreSQL, the client calls `router.refresh()` to re-trigger the Server Component render cycle, refreshing the data tree cleanly.
3. **Flexible Hybrid Schema (`JSONB` + Relational)**: To support diverse insurance lines (Auto, Home, Commercial, Worker's Comp) and dynamic loan requirements without requiring constant schema migrations, the application uses structured relational columns for core indexing (`effective_date`, `assigned_csr`, `insurence_category`, `stage`) while delegating custom dynamic data to `JSONB` fields (`stage_metadata`, `mandatory_fields`, `partners`).

---

## 4. Multi-Portal Separation Architecture

The CRM achieves strict tenant and role separation across its three portals via a combination of URL path namespacing, middleware interception, and database array containment (`portal_access TEXT[]`):

| Portal Name | Entry URL | Protected Path Prefix | Allowed Roles / Portal Access Flag | Target Audience & Core Function |
| :--- | :--- | :--- | :--- | :--- |
| **Innovative Insurance** | `/login` | `/(dashboard)/csr`<br>`/(dashboard)/admin`<br>`/(dashboard)/superadmin`<br>`/(dashboard)/accounting` | Roles: `csr`, `admin`, `superadmin`, `accounting`<br>Flag: `'insurance'` in `portal_access` | Insurance CSRs, Team Leads, and Accountants managing policy quoting, X-date renewals, intake forms, and commissions. |
| **Accurate Lending** | `/lending/login` | `/lending/*`<br>`/accurate_lending/*` | Roles: `lending`, `accurate_lending`, `superadmin`<br>Flag: `'lending'` or `'accurate_lending'` in `portal_access` | Commercial Loan Officers and Underwriters tracking 21-stage commercial real estate and business loans. |
| **Moonstar Mortgage** | `/mortgage/login` | `/mortgage/*` | Roles: `mortgage`, `admin`, `superadmin`<br>Flag: `'mortgage'` in `portal_access`<br>Domain: `@moonstar.com` email check | Residential Mortgage Loan Officers and Processors tracking borrower applications, pre-approvals, and closings. |

---

## 5. Deployment & Runtime Environment

- **Target Host**: Vercel Serverless & Edge Network (`vercel.json`).
- **Turbopack Acceleration**: Configured in `next.config.js` (`turbopack: { root: __dirname }`) to enable rapid local development and optimized server bundlers.
- **Environment Configuration (`.env.local`)**:
  - `NEXT_PUBLIC_SUPABASE_URL`: Public Supabase Project API endpoint.
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous JWT for browser client initialization.
  - `SUPABASE_SERVICE_ROLE_KEY`: Secret admin JWT bypassing RLS for server-only API handlers.
  - Azure Tenant credentials (`AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`, `AZURE_TENANT_ID`) for Microsoft Graph API communication.
