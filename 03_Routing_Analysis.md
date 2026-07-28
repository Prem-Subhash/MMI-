# 03. Comprehensive Routing Analysis
**System Name:** Moonstar Enterprise Insurance, Mortgage & Commercial Lending CRM  

---

## 1. Routing Architecture Overview

The application leverages Next.js App Router dynamic route groups and nested layouts (`app/` directory). Every incoming request traverses `proxy.ts` (Middleware), which enforces session checking via `@supabase/ssr` (`sb-access-token` cookie) and restricts access using an explicit RBAC access matrix and portal access array (`portal_access TEXT[]`).

---

## 2. Master Routing Table

| URL Path | Route Type | Target Audience | Required Role / Access Flag | Primary Database Tables | Core Components Used |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | Page (Public/Auth Selector) | All Users | None (Evaluates Session) | `profiles` | `HomePage`, `portalCards` |
| `/login` | Page (Auth) | Insurance Users | Public (Redirects if Auth) | `profiles` | Login Form UI |
| `/lending/login` | Page (Auth) | Commercial Lending | Public (Redirects if Auth) | `profiles` | Lending Login UI |
| `/mortgage/login` | Page (Auth) | Mortgage Users | Public (Redirects if Auth) | `profiles` | Mortgage Login UI |
| `/csr` | Protected Route Group | Insurance CSRs | `csr`, `admin`, `superadmin` | `temp_leads_basics`, `profiles`, `pipelines` | `DashboardClientLayout`, `Sidebar`, `TopBar` |
| `/admin` | Protected Route Group | Insurance Admins | `admin`, `superadmin` | `temp_leads_basics`, `profiles`, `email_logs` | `DashboardClientLayout`, Admin tables |
| `/superadmin` | Protected Route Group | System Config | `superadmin` | `pipelines`, `pipeline_stages`, `system_settings`, `audit_logs` | `DashboardClientLayout`, Stage editors |
| `/accounting` | Protected Route Group | Accountants | `accounting`, `superadmin` | `temp_leads_basics`, `commission_records` | `DashboardClientLayout`, Financial tables |
| `/lending/dashboard` | Protected Page | Commercial Officers | `lending`, `accurate_lending`, `superadmin` | `accurate_lending_loans`, `lending_stage_history` | `LendingClientLayout`, Dashboard metrics |
| `/lending/pipeline` | Protected Page | Commercial Officers | `lending`, `accurate_lending`, `superadmin` | `accurate_lending_loans`, `lending_bank_assignments` | Kanban/Table pipeline views |
| `/lending/loans/new` | Protected Page | Commercial Officers | `lending`, `accurate_lending`, `superadmin` | `accurate_lending_loans`, `profiles` | New Loan Entry Form |
| `/lending/loans/[id]` | Protected Page | Commercial Officers | `lending`, `accurate_lending`, `superadmin` | `accurate_lending_loans`, `lending_bank_assignments`, `lending_documents` | Detailed Loan View, Section E UI |
| `/lending/term-sheet-received` | Protected Page | Underwriters | `lending`, `accurate_lending`, `superadmin` | `accurate_lending_loans`, `lending_documents` | `TermSheetReceivedStageUI` |
| `/lending/activity-log` | Protected Page | Commercial Officers | `lending`, `accurate_lending`, `superadmin` | `lending_stage_history`, `profiles` | Activity audit feed table |
| `/mortgage` & `/mortgage/pipelines` | Protected Page | Mortgage Officers | `mortgage`, `admin`, `superadmin` | `mortgage_loans`, `mortgage_stage_history` | `MortgageClientLayout`, `PipelineView` |
| `/intake/[id]` | Public Form Portal | Unauthenticated Clients | None (Token verification) | `temp_intake_forms`, `documents` (`documents` storage bucket) | `IntakeUI`, `AutoInsuranceForm`, etc. |
| `/unauthorized` | Error Fallback | Denied Users | Public | None | Access Denied Screen |

---

## 3. Deep-Dive Route Analysis

### 3.1 Portal Landing & Authentication Routes

#### `/` (`app/page.tsx`)
- **Purpose**: Multi-portal gateway presenting visual selection cards for **Innovative Insurance**, **Accurate Lending**, and **Moonstar Mortgage**.
- **Components Used**: `HomePage` (Client Component), `portalCards` data definition.
- **Hooks & Context**: `useRouter()`, `useEffect()`.
- **API Calls & Database Interactions**: Calls `supabase.auth.getSession()` on mount. If a valid session exists, queries `profiles` table for `role` and `portal_access`.
- **Permissions & Navigation Path**:
  - If `@moonstar.com` email or `portal_access` contains only `'mortgage'`, automatically redirects to `/mortgage`.
  - If `portal_access` contains `'lending'` / `'accurate_lending'`, redirects to `/lending/dashboard`.
  - Otherwise redirects to `/{profile.role}` (`/csr`, `/admin`, `/superadmin`, `/accounting`).

#### `/login`, `/lending/login`, `/mortgage/login` (`app/login/page.tsx`, `app/lending/login/page.tsx`, `app/mortgage/login/page.tsx`)
- **Purpose**: Dedicated login screens styled specifically for each brand.
- **Components Used**: Brand-specific login forms and background overlays (`/bglogin.jpg`, `/Accurate_Lending_Logo-removebg-preview.png`).
- **Hooks & Context**: `useState()`, `useRouter()`, `useToast()`.
- **API Calls & Database Interactions**: Calls `supabase.auth.signInWithPassword({ email, password })`. UPon success, queries `profiles` table (`select('role, portal_access')`) and routes to the appropriate dashboard URL.

---

### 3.2 Innovative Insurance CRM Routes (`/(dashboard)/*`)

#### `/csr` (`app/(dashboard)/csr/*`)
- **Purpose**: Personal working environment for Insurance Customer Service Representatives. Displays assigned lead queues, pipeline boards (`/csr/pipeline/personal`), and basic reports (`/csr/reports`).
- **Components Used**: `DashboardClientLayout.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `UpdateStageModal.tsx`, `EmailModal.tsx`, `EditClientModal.tsx`.
- **Hooks & Context**: `useToast()`, `useState()`, `useEffect()`, `useRouter()`.
- **API Calls**: `/api/update-stage`, `/api/send-email`, `/api/upload-document`.
- **Database Tables & RLS**: Reads `temp_leads_basics` where `assigned_csr = auth.uid()`, `pipelines`, and `pipeline_stages`.
- **Permissions**: Requires `csr`, `admin`, or `superadmin` role.

#### `/admin` (`app/(dashboard)/admin/*`)
- **Purpose**: Supervisory dashboard enabling Team Leads and Admins to view all leads globally, assign/reassign leads between CSRs (`/admin/assignments`), and monitor email communication histories (`/admin/reports`).
- **Components Used**: Admin lead management tables, CSR assignment dropdowns, `DocumentViewer.tsx`.
- **API Calls**: `/api/update-client`, `/api/reports/monthly`.
- **Database Tables & RLS**: Reads/writes `temp_leads_basics` across all CSRs, `profiles`, `email_logs`, `email_templates`.
- **Permissions**: Requires `admin` or `superadmin` role.

#### `/superadmin` (`app/(dashboard)/superadmin/*`)
- **Purpose**: System configuration and technical administration. Enables managing custom `pipelines` (`/superadmin/pipelines/[id]/stages`), system settings, user roles (`/superadmin/users`), and system-wide audit logs (`/superadmin/audit-logs`).
- **Components Used**: Dynamic stage configuration tables, JSON schema field editors, user role management modals.
- **API Calls**: `/api/superadmin/pipelines/stages`, `/api/superadmin/users`, `/api/superadmin/form-templates`.
- **Database Tables & RLS**: Direct mutations on `pipelines`, `pipeline_stages`, `form_templates`, `profiles`, `system_settings`, `audit_logs`.
- **Permissions**: Strictly requires `superadmin` role.

#### `/accounting` (`app/(dashboard)/accounting/*`)
- **Purpose**: Financial tracking and policy reconciliation module. Enables verifying policy premiums, tracking commission records (`/accounting/all-leads`), and marking renewal payments.
- **Components Used**: Financial reconciliation tables, commission entry modals.
- **API Calls**: `/api/accounting/update-commission`, `/api/accounting/verify-policy`, `/api/accounting/reconciliation`.
- **Database Tables & RLS**: Reads `temp_leads_basics` (`bound_premium`, `expected_commission`, `policy_number`), updates `commission_records`.
- **Permissions**: Requires `accounting` or `superadmin` role.

---

### 3.3 Accurate Lending Commercial Portal (`/lending/*`)

#### `/lending/dashboard` (`app/lending/dashboard/page.tsx`)
- **Purpose**: Executive dashboard displaying total commercial loan volume, stage distributions across the 21 stages, and active loan officer workload metrics.
- **Components Used**: `LendingClientLayout.tsx`, `LendingSidebar.tsx`, `LendingTopBar.tsx`, summary KPI cards.
- **Database Tables & RLS**: Queries `accurate_lending_loans`, `lending_stage_history`. RLS filtered to `auth.uid() = assigned_lending_officer` unless `admin`/`superadmin`.
- **Permissions**: Requires `'lending'` or `'accurate_lending'` flag in `portal_access`.

#### `/lending/pipeline` (`app/lending/pipeline/page.tsx`)
- **Purpose**: Visual board displaying all commercial lending applications across stages (`1. New Loan` through `21. Check Received from Borrower`).
- **Components Used**: `LendingClientLayout.tsx`, Stage progression drag/drop or action buttons.
- **API Calls**: `/api/update-stage` (or direct Supabase update on `accurate_lending_loans.stage`).
- **Database Tables**: `accurate_lending_loans`, `pipeline_stages`.

#### `/lending/loans/new` & `/lending/loans/[id]` (`app/lending/loans/*`)
- **Purpose**: Comprehensive commercial loan application entry and deep-dive review pages. Captures borrower demographics, property addresses, purchase prices, partner structures (`JSONB`), and Section E multi-bank underwriting assignments (`lending_bank_assignments`).
- **Components Used**: `SectionELenderInfo.tsx`, loan detail tabs, document upload dropzones.
- **API Calls**: `/api/upload-document` (`lending-documents` storage bucket).
- **Database Tables**: `accurate_lending_loans`, `lending_bank_assignments`, `lending_documents`, `lending_stage_history`.

#### `/lending/term-sheet-received` (`app/lending/term-sheet-received/page.tsx`)
- **Purpose**: Specialized workflow page dedicated to Stage 5 (`Term Sheet Received`). Displays comparison tables of interest rates, term months, and good faith deposit requirements across multiple lender banks.
- **Components Used**: `TermSheetReceivedStageUI.tsx`.
- **Database Tables**: `accurate_lending_loans`, `lending_documents`, `lending_bank_assignments`.

---

### 3.4 Moonstar Mortgage Portal (`/mortgage/*`)

#### `/mortgage` & `/mortgage/pipelines` (`app/mortgage/page.tsx`, `app/mortgage/pipelines/page.tsx`)
- **Purpose**: Residential mortgage application management. Displays pre-approval requests, new purchase loans, and refinancing pipelines.
- **Components Used**: `MortgageClientLayout.tsx`, `PipelineView.tsx`, `LoanDetailModal.tsx`, `LoanFormModal.tsx`.
- **API Calls**: `/api/mortgage/loans`, `/api/mortgage/loans/[id]`, `/api/mortgage/loans/[id]/history`.
- **Database Tables**: `mortgage_loans`, `mortgage_stage_history`.
- **Permissions**: Requires `'mortgage'` in `portal_access` or `@moonstar.com` email domain.

---

### 3.5 Public Client Intake Portal (`/intake/[id]`)

#### `/intake/[id]` (`app/intake/[id]/page.tsx`)
- **Purpose**: Secure, unauthenticated client form ingestion page. Clients arrive via encrypted token links sent via MS Graph email (`/api/send-email`). They complete insurance intake questions (`AutoInsuranceForm.tsx`, `HomeInsuranceForm.tsx`, etc.) and upload prior insurance declaration documents.
- **Components Used**: `IntakeUI.tsx`, multi-part forms, drag-and-drop document uploaders.
- **Hooks & Context**: `useState()`, `useEffect()`, `useToast()`.
- **API Calls & Storage**: POST to `/api/upload-document` (`documents` bucket) and directly updates/inserts into `temp_intake_forms` table.
- **Permissions & Authentication**: Public route (bypasses `proxy.ts` auth checks). Validation relies on the unique, hard-to-guess `UUID` passed in the URL path (`[id]`).
