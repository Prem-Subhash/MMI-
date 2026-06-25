
# COMPLETE END-TO-END REVERSE ENGINEERING ANALYSIS
**Project:** Moonstar Insurance CRM
**Tech Stack:** Next.js (App Router), React, Supabase (PostgreSQL), Tailwind CSS, MS Graph API

---

# EXECUTIVE SUMMARY

The **Moonstar Insurance CRM** is an enterprise-scale full-stack system explicitly designed for insurance workflow management, client intake, lead pipeline management, and automated follow-ups.

**Main Business Purpose:** Safely map unauthenticated client form submissions into secure internal pipeline stages bounded by strong Role-Based Access Control (RBAC). It tracks leads from creation to "Quote Emailed" or "Completed" status, automating email reminders based on SLA limits.

**Main Modules:**
1. **Intake Flow Module:** Unauthenticated form ingestion.
2. **Pipeline Engine Module:** Sequential pipeline stage manager dictating progression via `mandatory_fields`.
3. **Automated Reminders Module:** Hooks into MS Graph API for automated email delivery.
4. **Data Aggregation & Reporting Module:** ExcelJS and PDFKit enabled robust reporting backend.
5. **Accounting & Commissions Module:** (Observed in codebase) Tracks lead commissions.

**Main User Types:**
- **Client (Unauthenticated):** Accesses temporary intake links.
- **CSR (Customer Service Rep):** Works on assigned leads in personal queues.
- **Admin:** Manages multiple CSR matrices and aggregates reports.
- **Superadmin:** System configurator, managing pipeline variables and users globally.

**Overall Architecture:**
- **Frontend:** Next.js 14 App Router, Client and Server Components cleanly delineated. Tailwind for UI, Framer Motion for micro-animations.
- **Backend:** Next.js API Routes (`/app/api`), executing heavy logic and Supabase RPCs.
- **Database:** Supabase PostgreSQL acting as the central state store, leveraging Row Level Security (RLS) policies over tables like `temp_leads_basics` and `pipeline_stages`.
- **Auth:** `@supabase/ssr` cookie-based authentication via Next.js Middleware.

---

# PROJECT STRUCTURE ANALYSIS

- **`/app`**: The Next.js App Router core.
  - **Business Function:** Houses all page components, nested layouts, and API routes.
  - **`/app/(dashboard)`**: Protected route group containing role-specific folders (`/csr`, `/admin`, `/accounting`, `/superadmin`). Inherits a global layout for sidebars.
  - **`/app/api`**: Backend API endpoints handling Supabase mutations, file uploads, and MS Graph integrations.
- **`/components`**: Reusable React UI Components.
  - **Business Function:** Holds atomic UI elements, forms (`AutoInsuranceForm.tsx`, etc.), modals (`UpdateStageModal.tsx`), and layout wrappers.
- **`/lib`**: Core Services and Integrations.
  - **Business Function:** Contains `supabaseServer.ts`, `supabaseClient.ts`, `microsoftGraph.ts`, and `emailTemplating.ts`. The absolute backbone of server-side data fetching and external service communication.
- **`/utils`**: Helper Functions.
  - **Business Function:** Contains `auth.ts` for RBAC abstractions and validation tools.
- **`/supabase`**: Database schema and migrations.
  - **Business Function:** Tracks DB states and edge functions if applicable.

---

# FILE-BY-FILE ANALYSIS

### page.tsx
- **Full Path:** `app/(dashboard)/accounting/all-leads/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Accounting Module
- **Imported Dependencies:** react, next/navigation, next/link, @/lib/supabaseClient, lucide-react, @/components/ui/Loading, @/lib/currency
- **Components Defined:** AccountingAllLeadsPage
- **Hooks Used:** useSearchParams, useRouter, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics
- **Role Dependency:** Public / None

### LeadAccountingClient.tsx
- **Full Path:** `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- **File Type:** Utility
- **Business Function:** Part of Accounting Module
- **Imported Dependencies:** react, next/link, next/navigation, @/lib/supabaseClient, @/components/ui/Toast, @/lib/currency
- **Components Defined:** LeadAccountingClient
- **Hooks Used:** useRouter, useToast, useState
- **APIs Used:** /api/accounting/update-commission, /api/accounting/verify-policy
- **Database Tables Accessed:** temp_leads_basics, accounting_logs
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/accounting/leads/[id]/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Accounting Module
- **Imported Dependencies:** @/lib/supabaseServer, next/navigation, next/link, lucide-react, @/app/(dashboard)/accounting/leads/[id]/LeadAccountingClient
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, temp_leads_basics, accounting_logs
- **Role Dependency:** Superadmin

### page.tsx
- **Full Path:** `app/(dashboard)/accounting/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Accounting Module
- **Imported Dependencies:** react, next/link, next/navigation, @/lib/supabaseServer, @/lib/currency
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, temp_leads_basics, accounting_logs
- **Role Dependency:** Superadmin

### page.tsx
- **Full Path:** `app/(dashboard)/accounting/reports/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Accounting Module
- **Imported Dependencies:** @/lib/supabaseServer, next/navigation, ./ReportsClient
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles
- **Role Dependency:** Superadmin

### ReportsClient.tsx
- **Full Path:** `app/(dashboard)/accounting/reports/ReportsClient.tsx`
- **File Type:** Utility
- **Business Function:** Part of Accounting Module
- **Imported Dependencies:** react, next/link, @/lib/supabaseClient, @/components/ui/Toast, @/lib/currency
- **Components Defined:** ReportsClient
- **Hooks Used:** useToast, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics, accounting_logs
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/admin/assignments/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, @/lib/supabaseClient, next/link, lucide-react, @/components/ui/Loading, @/lib/toast
- **Components Defined:** AdminAssignmentsPage
- **Hooks Used:** useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** profiles, pipelines, pipeline_stages, temp_leads_basics
- **Role Dependency:** CSR

### page.tsx
- **Full Path:** `app/(dashboard)/admin/csrs/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** @/lib/supabaseServer, next/link, lucide-react
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles
- **Role Dependency:** CSR

### page.tsx
- **Full Path:** `app/(dashboard)/admin/csrs/[id]/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, next/navigation, next/link, @/lib/supabaseClient, @/components/ui/Loading
- **Components Defined:** CSRWorkloadPage
- **Hooks Used:** useParams, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** profiles, temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/admin/leads/new/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, @/lib/supabaseClient, @/lib/toast
- **Components Defined:** AdminNewLeadPage
- **Hooks Used:** useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** clients, temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/admin/leads/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, next/navigation, next/link, @/lib/supabaseClient, lucide-react, @/components/ui/Loading
- **Components Defined:** AdminLeadsPage
- **Hooks Used:** useSearchParams, useRouter, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/admin/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, @/lib/supabaseServer, next/link
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics, profiles
- **Role Dependency:** CSR

### page.tsx
- **Full Path:** `app/(dashboard)/admin/pipelines/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** @/lib/supabaseServer, ./PipelineClient
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** pipelines, pipeline_stages, temp_leads_basics
- **Role Dependency:** Public / None

### PipelineClient.tsx
- **Full Path:** `app/(dashboard)/admin/pipelines/PipelineClient.tsx`
- **File Type:** Utility
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** react, next/link, lucide-react
- **Components Defined:** PipelineClient
- **Hooks Used:** useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/admin/reports/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Reporting Module
- **Imported Dependencies:** @/lib/supabaseServer, next/link, lucide-react
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/activity-log/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, next/navigation, @/lib/supabaseClient, @/components/ui/Loading
- **Components Defined:** ActivityLogPage
- **Hooks Used:** useRouter, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/leads/new/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, @/lib/supabaseClient, next/navigation, @/lib/toast, @/components/ui/Loading
- **Components Defined:** NewLeadPage
- **Hooks Used:** useSearchParams, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** clients, temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/leads/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, next/navigation, next/link, @/lib/supabaseClient, lucide-react, @/components/ui/Loading
- **Components Defined:** MyLeadsPage
- **Hooks Used:** useSearchParams, useRouter, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/leads/[id]/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, next/navigation, next/link, lucide-react, @/lib/supabaseClient, @/components/pipeline/UpdateStageModal, @/components/leads/EditClientModal, @/components/leads/DocumentViewer, @/components/email/EmailModal, @/lib/fieldLabels, @/lib/toast, @/components/ui/Loading, @/lib/currency
- **Components Defined:** LeadReviewPage
- **Hooks Used:** useRouter, useSearchParams, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics, temp_intake_forms, lead_stage_history
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** next/navigation
- **Components Defined:** DashboardPage
- **Hooks Used:** useRouter
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** react, next/navigation, next/link, @/lib/supabaseClient, lucide-react, @/components/ui/Loading, @/components/email/EmailModal
- **Components Defined:** CommercialLinesPage
- **Hooks Used:** useSearchParams, useRouter, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** react, @/lib/supabaseClient, @/lib/toast
- **Components Defined:** NewLeadPage
- **Hooks Used:** useState
- **APIs Used:** None
- **Database Tables Accessed:** clients, temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/pipeline/personal/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** react, next/navigation, next/link, @/lib/supabaseClient, lucide-react, @/components/ui/Loading, @/components/email/EmailModal
- **Components Defined:** PersonalLinesPage
- **Hooks Used:** useSearchParams, useRouter, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** react, next/navigation, @/lib/supabaseClient, lucide-react, @/lib/toast, @/components/email/EmailGenerator
- **Components Defined:** SendFormPage
- **Hooks Used:** useSearchParams, useRouter, useState, useEffect
- **APIs Used:** /api/send-email
- **Database Tables Accessed:** temp_leads_basics, email_templates, temp_intake_forms
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** react, next/navigation, @/lib/supabaseClient, @/components/pipeline/UpdateStageModal, lucide-react
- **Components Defined:** LeadReviewPage
- **Hooks Used:** useRouter, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics, temp_intake_forms, clients, client_insurance_details
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, papaparse, @/lib/supabaseClient, next/link, lucide-react, @/components/ui/Loading
- **Components Defined:** CommercialRenewalImportPage
- **Hooks Used:** useState
- **APIs Used:** None
- **Database Tables Accessed:** pipelines, pipeline_stages, temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/renewals/commercial/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, next/link, @/lib/supabaseClient, lucide-react, @/components/ui/Loading, @/lib/currency
- **Components Defined:** CommercialRenewalPage
- **Hooks Used:** useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/renewals/debug/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, @/lib/supabaseClient
- **Components Defined:** DebugRenewalsPage
- **Hooks Used:** useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, papaparse, @/lib/supabaseClient, next/link, lucide-react, @/components/ui/Loading
- **Components Defined:** PersonalRenewalImportPage
- **Hooks Used:** useState
- **APIs Used:** None
- **Database Tables Accessed:** pipelines, pipeline_stages, temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/renewals/personal/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, next/link, @/lib/supabaseClient, lucide-react, @/components/ui/Loading, @/lib/currency
- **Components Defined:** PersonalRenewalPage
- **Hooks Used:** useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/renewals/[id]/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, next/navigation, @/lib/supabaseClient, lucide-react, next/link, @/components/ui/Loading, @/components/pipeline/UpdateStageModal, @/components/email/EmailGenerator, @/lib/toast, @/lib/currency
- **Components Defined:** RenewalDetailPage
- **Hooks Used:** useParams, useRouter, useSearchParams, useState, useEffect
- **APIs Used:** /api/send-email
- **Database Tables Accessed:** temp_leads_basics, email_templates
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/csr/reports/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Reporting Module
- **Imported Dependencies:** react, lucide-react, @/lib/supabaseClient, @/lib/toast, @/components/ui/Loading, @/lib/currency
- **Components Defined:** MonthlyReportPage
- **Hooks Used:** useState, useEffect
- **APIs Used:** /api/reports/monthly, /api/reports/monthly
- **Database Tables Accessed:** profiles
- **Role Dependency:** Public / None

### layout.tsx
- **Full Path:** `app/(dashboard)/layout.tsx`
- **File Type:** Layout
- **Business Function:** Part of Core
- **Imported Dependencies:** react, next/navigation, @/lib/supabaseClient, @/components/layout/Sidebar, @/components/layout/TopBar, @/components/layout/Footer
- **Components Defined:** DashboardLayout
- **Hooks Used:** useRouter, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### loading.tsx
- **Full Path:** `app/(dashboard)/loading.tsx`
- **File Type:** Utility
- **Business Function:** Part of Core
- **Imported Dependencies:** @/components/ui/Loading
- **Components Defined:** DashboardLoading
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### AuditLogsClient.tsx
- **Full Path:** `app/(dashboard)/superadmin/audit-logs/AuditLogsClient.tsx`
- **File Type:** Utility
- **Business Function:** Part of Core
- **Imported Dependencies:** react, lucide-react, @/components/ui/Loading, @/lib/toast
- **Components Defined:** AuditLogsClient
- **Hooks Used:** useState, useEffect
- **APIs Used:** /api/superadmin/audit-logs
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/superadmin/audit-logs/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** ./AuditLogsClient
- **Components Defined:** AuditLogsPage
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### EmailTemplatesClient.tsx
- **Full Path:** `app/(dashboard)/superadmin/email-templates/EmailTemplatesClient.tsx`
- **File Type:** Utility
- **Business Function:** Part of Core
- **Imported Dependencies:** react, lucide-react, @/components/ui/Loading, @/lib/toast, framer-motion
- **Components Defined:** EmailTemplatesClient
- **Hooks Used:** useState, useEffect
- **APIs Used:** /api/superadmin/email-templates, /api/superadmin/email-templates, /api/superadmin/email-templates, /api/superadmin/email-templates
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/superadmin/email-templates/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** ./EmailTemplatesClient
- **Components Defined:** EmailTemplatesPage
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### FormTemplatesClient.tsx
- **Full Path:** `app/(dashboard)/superadmin/forms/FormTemplatesClient.tsx`
- **File Type:** Utility
- **Business Function:** Part of Core
- **Imported Dependencies:** react, lucide-react, @/components/ui/Loading, @/lib/toast, framer-motion
- **Components Defined:** FormTemplatesClient
- **Hooks Used:** useState, useEffect
- **APIs Used:** /api/superadmin/form-templates, /api/superadmin/form-templates, /api/superadmin/form-templates
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/superadmin/forms/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** ./FormTemplatesClient
- **Components Defined:** FormTemplatesPage
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/superadmin/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, @/lib/supabaseServer, next/link, @/lib/currency
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, temp_leads_basics, pipelines
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/superadmin/pipelines/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** ./PipelinesClient
- **Components Defined:** PipelinesPage
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### PipelinesClient.tsx
- **Full Path:** `app/(dashboard)/superadmin/pipelines/PipelinesClient.tsx`
- **File Type:** Utility
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** react, lucide-react, @/components/ui/Loading, @/lib/toast, next/link
- **Components Defined:** PipelinesClient
- **Hooks Used:** useState, useEffect
- **APIs Used:** /api/superadmin/pipelines, /api/superadmin/pipelines, /api/superadmin/pipelines
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/superadmin/pipelines/[id]/stages/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** ./StagesClient, next/link, lucide-react, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** pipelines
- **Role Dependency:** Public / None

### StagesClient.tsx
- **Full Path:** `app/(dashboard)/superadmin/pipelines/[id]/stages/StagesClient.tsx`
- **File Type:** Utility
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** react, lucide-react, @/components/ui/Loading, @/lib/toast, framer-motion
- **Components Defined:** StagesClient
- **Hooks Used:** useState, useEffect
- **APIs Used:** /api/superadmin/pipelines/stages, /api/superadmin/pipelines/stages, /api/superadmin/pipelines/stages, /api/superadmin/pipelines/stages
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/superadmin/roles/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** ./RolesClient
- **Components Defined:** RolesPage
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### RolesClient.tsx
- **Full Path:** `app/(dashboard)/superadmin/roles/RolesClient.tsx`
- **File Type:** Utility
- **Business Function:** Part of Core
- **Imported Dependencies:** react, lucide-react, @/components/ui/Loading, @/lib/toast
- **Components Defined:** RolesClient
- **Hooks Used:** useState, useEffect
- **APIs Used:** /api/superadmin/users, /api/superadmin/users
- **Database Tables Accessed:** None
- **Role Dependency:** Admin, CSR, Superadmin

### page.tsx
- **Full Path:** `app/(dashboard)/superadmin/system-settings/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** ./SystemSettingsClient, lucide-react
- **Components Defined:** SystemSettingsPage
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### SystemSettingsClient.tsx
- **Full Path:** `app/(dashboard)/superadmin/system-settings/SystemSettingsClient.tsx`
- **File Type:** Utility
- **Business Function:** Part of Core
- **Imported Dependencies:** react, lucide-react, @/components/ui/Loading, @/lib/toast
- **Components Defined:** SystemSettingsClient
- **Hooks Used:** useState, useEffect
- **APIs Used:** /api/superadmin/system-settings, /api/superadmin/pipelines, /api/superadmin/system-settings
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/(dashboard)/superadmin/users/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** ./UsersClient
- **Components Defined:** UsersPage
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### UsersClient.tsx
- **Full Path:** `app/(dashboard)/superadmin/users/UsersClient.tsx`
- **File Type:** Utility
- **Business Function:** Part of Core
- **Imported Dependencies:** react, lucide-react, @/components/ui/Loading, @/lib/toast
- **Components Defined:** UsersClient
- **Hooks Used:** useState, useEffect
- **APIs Used:** /api/superadmin/users, /api/superadmin/users, /api/superadmin/users
- **Database Tables Accessed:** None
- **Role Dependency:** Admin, CSR, Superadmin

### route.ts
- **Full Path:** `app/api/accounting/reconciliation/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Accounting Module
- **Imported Dependencies:** next/server, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, temp_leads_basics
- **Role Dependency:** Superadmin

### route.ts
- **Full Path:** `app/api/accounting/update-commission/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Accounting Module
- **Imported Dependencies:** next/server, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, temp_leads_basics, accounting_logs
- **Role Dependency:** Superadmin

### route.ts
- **Full Path:** `app/api/accounting/verify-policy/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Accounting Module
- **Imported Dependencies:** next/server, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, temp_leads_basics, accounting_logs
- **Role Dependency:** Superadmin

### route.ts
- **Full Path:** `app/api/delete-document/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** documents, uploaded_documents
- **Role Dependency:** Public / None

### route.ts
- **Full Path:** `app/api/documents/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** uploaded_documents
- **Role Dependency:** Public / None

### route.ts
- **Full Path:** `app/api/documents/[id]/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** uploaded_documents, documents
- **Role Dependency:** Public / None

### route.ts
- **Full Path:** `app/api/notify-submission/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @/lib/supabaseServer, @/lib/microsoftGraph
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** temp_intake_forms, temp_leads_basics, profiles, user_notifications
- **Role Dependency:** Admin, Superadmin

### route.ts
- **Full Path:** `app/api/reminder-check/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @/lib/supabaseServer, @/lib/microsoftGraph
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics, temp_intake_forms
- **Role Dependency:** Public / None

### route.ts
- **Full Path:** `app/api/reports/monthly/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Reporting Module
- **Imported Dependencies:** @supabase/ssr, next/headers, next/server, zod, exceljs, @/lib/currency
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** temp_leads_basics
- **Role Dependency:** Public / None

### route.ts
- **Full Path:** `app/api/send-email/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @/lib/supabaseServer, @/lib/microsoftGraph
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, temp_leads_basics, email_templates, email_logs
- **Role Dependency:** Admin, CSR, Superadmin

### route.ts
- **Full Path:** `app/api/superadmin/audit-logs/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, audit_logs
- **Role Dependency:** Superadmin

### route.ts
- **Full Path:** `app/api/superadmin/email-templates/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @supabase/supabase-js, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, email_templates, audit_logs
- **Role Dependency:** Superadmin

### route.ts
- **Full Path:** `app/api/superadmin/form-templates/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @supabase/supabase-js, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, form_templates, audit_logs
- **Role Dependency:** Superadmin

### route.ts
- **Full Path:** `app/api/superadmin/pipelines/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** next/server, @supabase/supabase-js, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, pipelines, audit_logs
- **Role Dependency:** Superadmin

### route.ts
- **Full Path:** `app/api/superadmin/pipelines/stages/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** next/server, @supabase/supabase-js, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, pipeline_stages, audit_logs
- **Role Dependency:** Superadmin

### route.ts
- **Full Path:** `app/api/superadmin/system-settings/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @supabase/supabase-js, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, system_settings, audit_logs
- **Role Dependency:** Superadmin

### route.ts
- **Full Path:** `app/api/superadmin/users/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @supabase/supabase-js, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, audit_logs
- **Role Dependency:** Superadmin

### route.ts
- **Full Path:** `app/api/update-client/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, temp_leads_basics, clients, audit_logs
- **Role Dependency:** Admin, CSR, Superadmin

### route.ts
- **Full Path:** `app/api/update-stage/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles, temp_leads_basics, pipeline_stages, lead_stage_history
- **Role Dependency:** Admin, CSR, Superadmin

### route.ts
- **Full Path:** `app/api/upload-document/route.ts`
- **File Type:** API Route
- **Business Function:** Part of Core
- **Imported Dependencies:** next/server, @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** temp_intake_forms, documents, uploaded_documents
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/intake/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Intake Module
- **Imported Dependencies:** None
- **Components Defined:** IntakePage
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/intake/[id]/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Intake Module
- **Imported Dependencies:** react, next/navigation, @/lib/supabaseClient, framer-motion, @/components/ui/Loading, @/components/ui/Toast, @/components/ui/IntakeUI, @/components/forms/HomeInsuranceForm, @/components/forms/AutoInsuranceForm, @/components/forms/PrimaryApplicantForm, @/components/forms/CoApplicantForm, @/components/layout/Footer
- **Components Defined:** IntakeFormPage
- **Hooks Used:** useSearchParams, useState, useToast, useEffect
- **APIs Used:** /api/upload-document, /api/notify-submission, /api/delete-document
- **Database Tables Accessed:** temp_intake_forms, documents
- **Role Dependency:** Public / None

### layout.tsx
- **Full Path:** `app/layout.tsx`
- **File Type:** Layout
- **Business Function:** Part of Core
- **Imported Dependencies:** @/lib/ToastContext
- **Components Defined:** RootLayout
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/login/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** react, next/navigation, next/image, @/lib/supabaseClient, lucide-react, @/components/layout/Footer, @/lib/toast
- **Components Defined:** LoginPage
- **Hooks Used:** useRouter, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** profiles
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** next/image, react, next/navigation, @/components/layout/Footer, @/lib/supabaseClient
- **Components Defined:** HomePage
- **Hooks Used:** useRouter, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `app/unauthorized/page.tsx`
- **File Type:** Page
- **Business Function:** Part of Core
- **Imported Dependencies:** next/link
- **Components Defined:** UnauthorizedPage
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### EmailGenerator.tsx
- **Full Path:** `components/email/EmailGenerator.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** react, @/lib/emailTemplating, lucide-react
- **Components Defined:** EmailGenerator
- **Hooks Used:** useEffect
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### EmailModal.tsx
- **Full Path:** `components/email/EmailModal.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** react, @/lib/supabaseClient, @/lib/toast, @/components/email/EmailGenerator, @/components/ui/Loading
- **Components Defined:** EmailModal
- **Hooks Used:** useState, useEffect
- **APIs Used:** /api/send-email
- **Database Tables Accessed:** temp_leads_basics, email_templates, profiles, temp_intake_forms
- **Role Dependency:** Public / None

### AdditionalApplicantsForm.tsx
- **Full Path:** `components/forms/AdditionalApplicantsForm.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** ./constants
- **Components Defined:** AdditionalApplicantsForm
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### AutoInsuranceForm.tsx
- **Full Path:** `components/forms/AutoInsuranceForm.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** lucide-react, @/components/ui/IntakeUI, ./constants
- **Components Defined:** AutoInsuranceForm
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### CoApplicantForm.tsx
- **Full Path:** `components/forms/CoApplicantForm.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** lucide-react, @/components/ui/IntakeUI, ./constants
- **Components Defined:** CoApplicantForm
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### constants.ts
- **Full Path:** `components/forms/constants.ts`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** None
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### HomeInsuranceForm.tsx
- **Full Path:** `components/forms/HomeInsuranceForm.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** @/components/ui/IntakeUI
- **Components Defined:** HomeInsuranceForm
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### PrimaryApplicantForm.tsx
- **Full Path:** `components/forms/PrimaryApplicantForm.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** lucide-react, @/components/ui/IntakeUI, ./constants
- **Components Defined:** PrimaryApplicantForm
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### VehicleListForm.tsx
- **Full Path:** `components/forms/VehicleListForm.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** None
- **Components Defined:** VehicleListForm
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### Footer.tsx
- **Full Path:** `components/layout/Footer.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** react, lucide-react
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### Sidebar.tsx
- **Full Path:** `components/layout/Sidebar.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** lucide-react, next/link, next/navigation, react, @/lib/supabaseClient
- **Components Defined:** Sidebar
- **Hooks Used:** usePathname, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** profiles
- **Role Dependency:** Admin, CSR, Superadmin

### TopBar.tsx
- **Full Path:** `components/layout/TopBar.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** react, next/navigation, lucide-react, @/lib/supabaseClient, @/lib/toast
- **Components Defined:** TopBar
- **Hooks Used:** useRouter, useState, useEffect
- **APIs Used:** None
- **Database Tables Accessed:** profiles, user_notifications, temp_leads_basics
- **Role Dependency:** CSR

### DocumentViewer.tsx
- **Full Path:** `components/leads/DocumentViewer.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** @/lib/supabaseClient, react, @/lib/toast
- **Components Defined:** DocumentViewer
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### EditClientModal.tsx
- **Full Path:** `components/leads/EditClientModal.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** react, @/components/ui/Loading, @/lib/toast, lucide-react
- **Components Defined:** EditClientModal
- **Hooks Used:** useState
- **APIs Used:** /api/update-client
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### page.tsx
- **Full Path:** `components/page.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** None
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### UpdateStageModal.tsx
- **Full Path:** `components/pipeline/UpdateStageModal.tsx`
- **File Type:** Component
- **Business Function:** Part of Pipeline Module
- **Imported Dependencies:** react, @/lib/supabaseClient, @/lib/toast, @/components/ui/Loading
- **Components Defined:** UpdateStageModal
- **Hooks Used:** useState, useEffect
- **APIs Used:** /api/update-stage
- **Database Tables Accessed:** pipelines, pipeline_stages
- **Role Dependency:** Public / None

### IntakeUI.tsx
- **Full Path:** `components/ui/IntakeUI.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** react, lucide-react
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### Loading.tsx
- **Full Path:** `components/ui/Loading.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** framer-motion
- **Components Defined:** Spinner, Loading
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### Toast.tsx
- **Full Path:** `components/ui/Toast.tsx`
- **File Type:** Component
- **Business Function:** Part of Core
- **Imported Dependencies:** None
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### currency.ts
- **Full Path:** `lib/currency.ts`
- **File Type:** Service
- **Business Function:** Part of Core
- **Imported Dependencies:** None
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### emailTemplating.ts
- **Full Path:** `lib/emailTemplating.ts`
- **File Type:** Service
- **Business Function:** Part of Core
- **Imported Dependencies:** ./currency
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### fieldLabels.ts
- **Full Path:** `lib/fieldLabels.ts`
- **File Type:** Service
- **Business Function:** Part of Core
- **Imported Dependencies:** None
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### microsoftGraph.ts
- **Full Path:** `lib/microsoftGraph.ts`
- **File Type:** Service
- **Business Function:** Part of Core
- **Imported Dependencies:** @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** email_logs
- **Role Dependency:** Public / None

### validateStage.ts
- **Full Path:** `lib/renewals/validateStage.ts`
- **File Type:** Service
- **Business Function:** Part of Core
- **Imported Dependencies:** None
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### supabaseClient.ts
- **Full Path:** `lib/supabaseClient.ts`
- **File Type:** Service
- **Business Function:** Part of Core
- **Imported Dependencies:** @supabase/ssr
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** pipelines, pipeline_stages
- **Role Dependency:** Public / None

### supabaseServer.ts
- **Full Path:** `lib/supabaseServer.ts`
- **File Type:** Service
- **Business Function:** Part of Core
- **Imported Dependencies:** @supabase/supabase-js, @supabase/ssr, next/headers
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### toast.ts
- **Full Path:** `lib/toast.ts`
- **File Type:** Service
- **Business Function:** Part of Core
- **Imported Dependencies:** None
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### ToastContext.tsx
- **Full Path:** `lib/ToastContext.tsx`
- **File Type:** Service
- **Business Function:** Part of Core
- **Imported Dependencies:** react, @/lib/toast, framer-motion
- **Components Defined:** ToastProvider
- **Hooks Used:** useToast, useState, useEffect, useCallback
- **APIs Used:** None
- **Database Tables Accessed:** None
- **Role Dependency:** Public / None

### auth.ts
- **Full Path:** `utils/auth.ts`
- **File Type:** Utility
- **Business Function:** Part of Core
- **Imported Dependencies:** @/lib/supabaseServer
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles
- **Role Dependency:** Admin, CSR, Superadmin

### proxy.ts
- **Full Path:** `proxy.ts`
- **File Type:** Utility
- **Business Function:** Part of Core
- **Imported Dependencies:** @supabase/ssr, @supabase/supabase-js, next/server
- **Components Defined:** None
- **Hooks Used:** None
- **APIs Used:** None
- **Database Tables Accessed:** profiles
- **Role Dependency:** Public / None

---

# ROUTING ANALYSIS

### Route: /(dashboard)/accounting/all-leads
- **File:** `app/(dashboard)/accounting/all-leads/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** temp_leads_basics

### Route: /(dashboard)/accounting/leads/[id]
- **File:** `app/(dashboard)/accounting/leads/[id]/page.tsx`
- **Allowed Roles:** Superadmin
- **APIs Called:** None
- **Tables Accessed Directly:** profiles, temp_leads_basics, accounting_logs

### Route: /(dashboard)/accounting
- **File:** `app/(dashboard)/accounting/page.tsx`
- **Allowed Roles:** Superadmin
- **APIs Called:** None
- **Tables Accessed Directly:** profiles, temp_leads_basics, accounting_logs

### Route: /(dashboard)/accounting/reports
- **File:** `app/(dashboard)/accounting/reports/page.tsx`
- **Allowed Roles:** Superadmin
- **APIs Called:** None
- **Tables Accessed Directly:** profiles

### Route: /(dashboard)/admin/assignments
- **File:** `app/(dashboard)/admin/assignments/page.tsx`
- **Allowed Roles:** CSR
- **APIs Called:** None
- **Tables Accessed Directly:** profiles, pipelines, pipeline_stages, temp_leads_basics

### Route: /(dashboard)/admin/csrs
- **File:** `app/(dashboard)/admin/csrs/page.tsx`
- **Allowed Roles:** CSR
- **APIs Called:** None
- **Tables Accessed Directly:** profiles

### Route: /(dashboard)/admin/csrs/[id]
- **File:** `app/(dashboard)/admin/csrs/[id]/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** profiles, temp_leads_basics

### Route: /(dashboard)/admin/leads/new
- **File:** `app/(dashboard)/admin/leads/new/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** clients, temp_leads_basics

### Route: /(dashboard)/admin/leads
- **File:** `app/(dashboard)/admin/leads/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** temp_leads_basics

### Route: /(dashboard)/admin
- **File:** `app/(dashboard)/admin/page.tsx`
- **Allowed Roles:** CSR
- **APIs Called:** None
- **Tables Accessed Directly:** temp_leads_basics, profiles

### Route: /(dashboard)/admin/pipelines
- **File:** `app/(dashboard)/admin/pipelines/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** pipelines, pipeline_stages, temp_leads_basics

### Route: /(dashboard)/admin/reports
- **File:** `app/(dashboard)/admin/reports/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** temp_leads_basics

### Route: /(dashboard)/csr/activity-log
- **File:** `app/(dashboard)/csr/activity-log/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** temp_leads_basics

### Route: /(dashboard)/csr/leads/new
- **File:** `app/(dashboard)/csr/leads/new/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** clients, temp_leads_basics

### Route: /(dashboard)/csr/leads
- **File:** `app/(dashboard)/csr/leads/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** temp_leads_basics

### Route: /(dashboard)/csr/leads/[id]
- **File:** `app/(dashboard)/csr/leads/[id]/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** temp_leads_basics, temp_intake_forms, lead_stage_history

### Route: /(dashboard)/csr
- **File:** `app/(dashboard)/csr/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** None

### Route: /(dashboard)/csr/pipeline/commercial
- **File:** `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** temp_leads_basics

### Route: /(dashboard)/csr/pipeline/personal/new
- **File:** `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** clients, temp_leads_basics

### Route: /(dashboard)/csr/pipeline/personal
- **File:** `app/(dashboard)/csr/pipeline/personal/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** temp_leads_basics

### Route: /(dashboard)/csr/pipeline/personal/send-form
- **File:** `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** /api/send-email
- **Tables Accessed Directly:** temp_leads_basics, email_templates, temp_intake_forms

### Route: /(dashboard)/csr/pipeline/personal/[id]
- **File:** `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** temp_leads_basics, temp_intake_forms, clients, client_insurance_details

### Route: /(dashboard)/csr/renewals/commercial/import
- **File:** `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** pipelines, pipeline_stages, temp_leads_basics

### Route: /(dashboard)/csr/renewals/commercial
- **File:** `app/(dashboard)/csr/renewals/commercial/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** temp_leads_basics

### Route: /(dashboard)/csr/renewals/debug
- **File:** `app/(dashboard)/csr/renewals/debug/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** temp_leads_basics

### Route: /(dashboard)/csr/renewals/personal/import
- **File:** `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** pipelines, pipeline_stages, temp_leads_basics

### Route: /(dashboard)/csr/renewals/personal
- **File:** `app/(dashboard)/csr/renewals/personal/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** temp_leads_basics

### Route: /(dashboard)/csr/renewals/[id]
- **File:** `app/(dashboard)/csr/renewals/[id]/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** /api/send-email
- **Tables Accessed Directly:** temp_leads_basics, email_templates

### Route: /(dashboard)/csr/reports
- **File:** `app/(dashboard)/csr/reports/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** /api/reports/monthly, /api/reports/monthly
- **Tables Accessed Directly:** profiles

### Route: /(dashboard)/superadmin/audit-logs
- **File:** `app/(dashboard)/superadmin/audit-logs/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** None

### Route: /(dashboard)/superadmin/email-templates
- **File:** `app/(dashboard)/superadmin/email-templates/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** None

### Route: /(dashboard)/superadmin/forms
- **File:** `app/(dashboard)/superadmin/forms/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** None

### Route: /(dashboard)/superadmin
- **File:** `app/(dashboard)/superadmin/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** profiles, temp_leads_basics, pipelines

### Route: /(dashboard)/superadmin/pipelines
- **File:** `app/(dashboard)/superadmin/pipelines/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** None

### Route: /(dashboard)/superadmin/pipelines/[id]/stages
- **File:** `app/(dashboard)/superadmin/pipelines/[id]/stages/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** pipelines

### Route: /(dashboard)/superadmin/roles
- **File:** `app/(dashboard)/superadmin/roles/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** None

### Route: /(dashboard)/superadmin/system-settings
- **File:** `app/(dashboard)/superadmin/system-settings/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** None

### Route: /(dashboard)/superadmin/users
- **File:** `app/(dashboard)/superadmin/users/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** None

### Route: /intake
- **File:** `app/intake/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** None

### Route: /intake/[id]
- **File:** `app/intake/[id]/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** /api/upload-document, /api/notify-submission, /api/delete-document
- **Tables Accessed Directly:** temp_intake_forms, documents

### Route: /login
- **File:** `app/login/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** profiles

### Route: /
- **File:** `app/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** None

### Route: /unauthorized
- **File:** `app/unauthorized/page.tsx`
- **Allowed Roles:** Inherited from Middleware
- **APIs Called:** None
- **Tables Accessed Directly:** None

---

# APPLICATION FLOW ANALYSIS

### 1. Authentication Flow
- User accesses `/login`.
- Submits credentials to Supabase Auth.
- Supabase returns session JWT, stored as a secure cookie.
- Middleware (`proxy.ts`) intercepts subsequent requests, extracts the `sb-access-token`, verifies it, looks up the user's role in the `profiles` table, and maps access via the `accessMatrix`. Fails redirect to `/unauthorized`.

### 2. Form Submission Flow (Client Intake)
- Client receives a secure, tokenized URL.
- Submits form data (e.g. `AutoInsuranceForm.tsx`).
- UI triggers POST to `/api/upload-document` (if files attached) or directly inserts to `temp_intake_forms`.
- Files are saved in Supabase Storage (`documents/{intake_id}`).

### 3. Navigation & Dashboard Flow
- CSR logs in -> Redirected to `/csr/dashboard`.
- Sidebar components read the role context and display allowed navigation links.
- Data on page loads via Server Components fetching strictly `assigned_csr = auth.uid()` filtered data directly from Supabase to prevent over-fetching.

### 4. Stage Update Flow (Pipeline)
- CSR clicks "Update Stage" in `UpdateStageModal.tsx`.
- Component validates local state against `mandatory_fields` JSON array required for the target stage.
- POST payload to `/api/update-stage`.
- Backend enforces logic (e.g., checking if email was sent before quoting).
- Updates `temp_leads_basics` with new stage metadata.
- Logs action in `lead_stage_history`.
- `router.refresh()` rehydrates UI.

---

# USER ROLE ANALYSIS

- **CSR (Customer Service Rep):**
  - *Permissions:* Can read/write leads specifically assigned to them.
  - *Accessible Pages:* `/csr/*`
  - *Allowed Actions:* Update pipeline stages, send emails to clients, upload documents.
  - *Restricted Actions:* Cannot access admin reporting, accounting, or system configuration.

- **Admin:**
  - *Permissions:* Broad oversight over CSRs.
  - *Accessible Pages:* `/admin/*`
  - *Allowed Actions:* Generate monthly reports, view all leads, reassign leads.
  - *Restricted Actions:* Cannot modify core system pipeline variables.

- **Superadmin:**
  - *Permissions:* God-mode over the CRM.
  - *Accessible Pages:* `/superadmin/*`
  - *Allowed Actions:* Modify `pipeline_stages` schema, manage all user roles.

- **Accounting:**
  - *Permissions:* Financial tracking.
  - *Accessible Pages:* `/accounting/*`
  - *Allowed Actions:* Track commissions, view lead financials.

---

# FEATURE INVENTORY

**Pipeline Module:**
- *Update Stage Workflow*: Validates mandatory fields and automates X-Date calculations.
- *Stage History Log*: Tracks all state changes for SLA reporting.

**Intake Module:**
- *Multi-part Forms*: Captures client data without auth.
- *Document Upload*: Handles PDF/Image uploads mapped to Intake IDs.

**Reporting Module:**
- *Report Generator*: Hits RPC `get_report_summary`. Outputs JSON, Excel (via ExcelJS), or PDF (via PDFKit).

**Communication Module:**
- *MS Graph Emailer*: Generates templated emails (Client Name, Form Links) and dispatches via Azure tenant.
- *Automated Reminders*: Background sweeps for stale leads (`follow_up_date <= now`).

---

# COMPONENT DEPENDENCY MAP

- **page.tsx** (`app/(dashboard)/accounting/all-leads/page.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useSearchParams, useRouter, useState, useEffect
  - Tables: temp_leads_basics
- **page.tsx** (`app/(dashboard)/accounting/leads/[id]/page.tsx`)
  - Tables: profiles, temp_leads_basics, accounting_logs
- **page.tsx** (`app/(dashboard)/accounting/page.tsx`)
  - Tables: profiles, temp_leads_basics, accounting_logs
- **page.tsx** (`app/(dashboard)/accounting/reports/page.tsx`)
  - Tables: profiles
- **page.tsx** (`app/(dashboard)/admin/assignments/page.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useState, useEffect
  - Tables: profiles, pipelines, pipeline_stages, temp_leads_basics
- **page.tsx** (`app/(dashboard)/admin/csrs/page.tsx`)
  - Tables: profiles
- **page.tsx** (`app/(dashboard)/admin/csrs/[id]/page.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useParams, useState, useEffect
  - Tables: profiles, temp_leads_basics
- **page.tsx** (`app/(dashboard)/admin/leads/new/page.tsx`)
  - Hooks: useState, useEffect
  - Tables: clients, temp_leads_basics
- **page.tsx** (`app/(dashboard)/admin/leads/page.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useSearchParams, useRouter, useState, useEffect
  - Tables: temp_leads_basics
- **page.tsx** (`app/(dashboard)/admin/page.tsx`)
  - Tables: temp_leads_basics, profiles
- **page.tsx** (`app/(dashboard)/admin/pipelines/page.tsx`)
  - Tables: pipelines, pipeline_stages, temp_leads_basics
- **page.tsx** (`app/(dashboard)/admin/reports/page.tsx`)
  - Tables: temp_leads_basics
- **page.tsx** (`app/(dashboard)/csr/activity-log/page.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useRouter, useState, useEffect
  - Tables: temp_leads_basics
- **page.tsx** (`app/(dashboard)/csr/leads/new/page.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useSearchParams, useState, useEffect
  - Tables: clients, temp_leads_basics
- **page.tsx** (`app/(dashboard)/csr/leads/page.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useSearchParams, useRouter, useState, useEffect
  - Tables: temp_leads_basics
- **page.tsx** (`app/(dashboard)/csr/leads/[id]/page.tsx`)
  - Components: @/components/pipeline/UpdateStageModal, @/components/leads/EditClientModal, @/components/leads/DocumentViewer, @/components/email/EmailModal, @/components/ui/Loading
  - Hooks: useRouter, useSearchParams, useState, useEffect
  - Tables: temp_leads_basics, temp_intake_forms, lead_stage_history
- **page.tsx** (`app/(dashboard)/csr/page.tsx`)
  - Hooks: useRouter
- **page.tsx** (`app/(dashboard)/csr/pipeline/commercial/page.tsx`)
  - Components: @/components/ui/Loading, @/components/email/EmailModal
  - Hooks: useSearchParams, useRouter, useState, useEffect
  - Tables: temp_leads_basics
- **page.tsx** (`app/(dashboard)/csr/pipeline/personal/new/page.tsx`)
  - Hooks: useState
  - Tables: clients, temp_leads_basics
- **page.tsx** (`app/(dashboard)/csr/pipeline/personal/page.tsx`)
  - Components: @/components/ui/Loading, @/components/email/EmailModal
  - Hooks: useSearchParams, useRouter, useState, useEffect
  - Tables: temp_leads_basics
- **page.tsx** (`app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`)
  - Components: @/components/email/EmailGenerator
  - Hooks: useSearchParams, useRouter, useState, useEffect
  - Tables: temp_leads_basics, email_templates, temp_intake_forms
- **page.tsx** (`app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`)
  - Components: @/components/pipeline/UpdateStageModal
  - Hooks: useRouter, useState, useEffect
  - Tables: temp_leads_basics, temp_intake_forms, clients, client_insurance_details
- **page.tsx** (`app/(dashboard)/csr/renewals/commercial/import/page.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useState
  - Tables: pipelines, pipeline_stages, temp_leads_basics
- **page.tsx** (`app/(dashboard)/csr/renewals/commercial/page.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useState, useEffect
  - Tables: temp_leads_basics
- **page.tsx** (`app/(dashboard)/csr/renewals/debug/page.tsx`)
  - Hooks: useState, useEffect
  - Tables: temp_leads_basics
- **page.tsx** (`app/(dashboard)/csr/renewals/personal/import/page.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useState
  - Tables: pipelines, pipeline_stages, temp_leads_basics
- **page.tsx** (`app/(dashboard)/csr/renewals/personal/page.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useState, useEffect
  - Tables: temp_leads_basics
- **page.tsx** (`app/(dashboard)/csr/renewals/[id]/page.tsx`)
  - Components: @/components/ui/Loading, @/components/pipeline/UpdateStageModal, @/components/email/EmailGenerator
  - Hooks: useParams, useRouter, useSearchParams, useState, useEffect
  - Tables: temp_leads_basics, email_templates
- **page.tsx** (`app/(dashboard)/csr/reports/page.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useState, useEffect
  - Tables: profiles
- **page.tsx** (`app/(dashboard)/superadmin/audit-logs/page.tsx`)
- **page.tsx** (`app/(dashboard)/superadmin/email-templates/page.tsx`)
- **page.tsx** (`app/(dashboard)/superadmin/forms/page.tsx`)
- **page.tsx** (`app/(dashboard)/superadmin/page.tsx`)
  - Tables: profiles, temp_leads_basics, pipelines
- **page.tsx** (`app/(dashboard)/superadmin/pipelines/page.tsx`)
- **page.tsx** (`app/(dashboard)/superadmin/pipelines/[id]/stages/page.tsx`)
  - Tables: pipelines
- **page.tsx** (`app/(dashboard)/superadmin/roles/page.tsx`)
- **page.tsx** (`app/(dashboard)/superadmin/system-settings/page.tsx`)
- **page.tsx** (`app/(dashboard)/superadmin/users/page.tsx`)
- **page.tsx** (`app/intake/page.tsx`)
- **page.tsx** (`app/intake/[id]/page.tsx`)
  - Components: @/components/ui/Loading, @/components/ui/Toast, @/components/ui/IntakeUI, @/components/forms/HomeInsuranceForm, @/components/forms/AutoInsuranceForm, @/components/forms/PrimaryApplicantForm, @/components/forms/CoApplicantForm, @/components/layout/Footer
  - Hooks: useSearchParams, useState, useToast, useEffect
  - Tables: temp_intake_forms, documents
- **page.tsx** (`app/login/page.tsx`)
  - Components: @/components/layout/Footer
  - Hooks: useRouter, useState, useEffect
  - Tables: profiles
- **page.tsx** (`app/page.tsx`)
  - Components: @/components/layout/Footer
  - Hooks: useRouter, useEffect
- **page.tsx** (`app/unauthorized/page.tsx`)
- **EmailGenerator.tsx** (`components/email/EmailGenerator.tsx`)
  - Hooks: useEffect
- **EmailModal.tsx** (`components/email/EmailModal.tsx`)
  - Components: @/components/email/EmailGenerator, @/components/ui/Loading
  - Hooks: useState, useEffect
  - Tables: temp_leads_basics, email_templates, profiles, temp_intake_forms
- **AdditionalApplicantsForm.tsx** (`components/forms/AdditionalApplicantsForm.tsx`)
- **AutoInsuranceForm.tsx** (`components/forms/AutoInsuranceForm.tsx`)
  - Components: @/components/ui/IntakeUI
- **CoApplicantForm.tsx** (`components/forms/CoApplicantForm.tsx`)
  - Components: @/components/ui/IntakeUI
- **constants.ts** (`components/forms/constants.ts`)
- **HomeInsuranceForm.tsx** (`components/forms/HomeInsuranceForm.tsx`)
  - Components: @/components/ui/IntakeUI
- **PrimaryApplicantForm.tsx** (`components/forms/PrimaryApplicantForm.tsx`)
  - Components: @/components/ui/IntakeUI
- **VehicleListForm.tsx** (`components/forms/VehicleListForm.tsx`)
- **Footer.tsx** (`components/layout/Footer.tsx`)
- **Sidebar.tsx** (`components/layout/Sidebar.tsx`)
  - Hooks: usePathname, useEffect
  - Tables: profiles
- **TopBar.tsx** (`components/layout/TopBar.tsx`)
  - Hooks: useRouter, useState, useEffect
  - Tables: profiles, user_notifications, temp_leads_basics
- **DocumentViewer.tsx** (`components/leads/DocumentViewer.tsx`)
- **EditClientModal.tsx** (`components/leads/EditClientModal.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useState
- **page.tsx** (`components/page.tsx`)
- **UpdateStageModal.tsx** (`components/pipeline/UpdateStageModal.tsx`)
  - Components: @/components/ui/Loading
  - Hooks: useState, useEffect
  - Tables: pipelines, pipeline_stages
- **IntakeUI.tsx** (`components/ui/IntakeUI.tsx`)
- **Loading.tsx** (`components/ui/Loading.tsx`)
- **Toast.tsx** (`components/ui/Toast.tsx`)

---

# SUPABASE ANALYSIS

- **Authentication Logic:** SSR implementation overriding cookies dynamically via NextJS Middleware. `createServerClient` is heavily utilized.
- **User Management:** Managed via standard `auth.users` extended heavily by the `profiles` table which holds `role` and `manager_id`.
- **Database Operations:** Extensively uses PostgreSQL JSONB columns (`stage_metadata`) to store custom pipeline data, avoiding schema lock-in. Uses native RPCs (`get_report_summary`) for heavy lifting.
- **Storage Usage:** Supabase Storage (`documents` bucket) is used for file uploads, limited to 10MB per file and strict MIME checking natively at the API level.
- **Row Level Security (RLS):** Supabase strictly restricts data. For example, queries naturally append `assigned_csr = auth.uid()` for CSRs, ensuring data isolation without explicit backend filters.

---

# DATABASE USAGE ANALYSIS

- **temp_leads_basics** accessed in `app/(dashboard)/accounting/all-leads/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- **accounting_logs** accessed in `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- **profiles** accessed in `app/(dashboard)/accounting/leads/[id]/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/accounting/leads/[id]/page.tsx`
- **accounting_logs** accessed in `app/(dashboard)/accounting/leads/[id]/page.tsx`
- **profiles** accessed in `app/(dashboard)/accounting/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/accounting/page.tsx`
- **accounting_logs** accessed in `app/(dashboard)/accounting/page.tsx`
- **profiles** accessed in `app/(dashboard)/accounting/reports/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/accounting/reports/ReportsClient.tsx`
- **accounting_logs** accessed in `app/(dashboard)/accounting/reports/ReportsClient.tsx`
- **profiles** accessed in `app/(dashboard)/admin/assignments/page.tsx`
- **pipelines** accessed in `app/(dashboard)/admin/assignments/page.tsx`
- **pipeline_stages** accessed in `app/(dashboard)/admin/assignments/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/admin/assignments/page.tsx`
- **profiles** accessed in `app/(dashboard)/admin/csrs/page.tsx`
- **profiles** accessed in `app/(dashboard)/admin/csrs/[id]/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/admin/csrs/[id]/page.tsx`
- **clients** accessed in `app/(dashboard)/admin/leads/new/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/admin/leads/new/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/admin/leads/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/admin/page.tsx`
- **profiles** accessed in `app/(dashboard)/admin/page.tsx`
- **pipelines** accessed in `app/(dashboard)/admin/pipelines/page.tsx`
- **pipeline_stages** accessed in `app/(dashboard)/admin/pipelines/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/admin/pipelines/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/admin/reports/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/activity-log/page.tsx`
- **clients** accessed in `app/(dashboard)/csr/leads/new/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/leads/new/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/leads/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/leads/[id]/page.tsx`
- **temp_intake_forms** accessed in `app/(dashboard)/csr/leads/[id]/page.tsx`
- **lead_stage_history** accessed in `app/(dashboard)/csr/leads/[id]/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- **clients** accessed in `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/pipeline/personal/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- **email_templates** accessed in `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- **temp_intake_forms** accessed in `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- **temp_intake_forms** accessed in `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- **clients** accessed in `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- **client_insurance_details** accessed in `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- **pipelines** accessed in `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- **pipeline_stages** accessed in `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/renewals/commercial/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/renewals/debug/page.tsx`
- **pipelines** accessed in `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- **pipeline_stages** accessed in `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/renewals/personal/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/csr/renewals/[id]/page.tsx`
- **email_templates** accessed in `app/(dashboard)/csr/renewals/[id]/page.tsx`
- **profiles** accessed in `app/(dashboard)/csr/reports/page.tsx`
- **profiles** accessed in `app/(dashboard)/superadmin/page.tsx`
- **temp_leads_basics** accessed in `app/(dashboard)/superadmin/page.tsx`
- **pipelines** accessed in `app/(dashboard)/superadmin/page.tsx`
- **pipelines** accessed in `app/(dashboard)/superadmin/pipelines/[id]/stages/page.tsx`
- **profiles** accessed in `app/api/accounting/reconciliation/route.ts`
- **temp_leads_basics** accessed in `app/api/accounting/reconciliation/route.ts`
- **profiles** accessed in `app/api/accounting/update-commission/route.ts`
- **temp_leads_basics** accessed in `app/api/accounting/update-commission/route.ts`
- **accounting_logs** accessed in `app/api/accounting/update-commission/route.ts`
- **profiles** accessed in `app/api/accounting/verify-policy/route.ts`
- **temp_leads_basics** accessed in `app/api/accounting/verify-policy/route.ts`
- **accounting_logs** accessed in `app/api/accounting/verify-policy/route.ts`
- **documents** accessed in `app/api/delete-document/route.ts`
- **uploaded_documents** accessed in `app/api/delete-document/route.ts`
- **uploaded_documents** accessed in `app/api/documents/route.ts`
- **uploaded_documents** accessed in `app/api/documents/[id]/route.ts`
- **documents** accessed in `app/api/documents/[id]/route.ts`
- **temp_intake_forms** accessed in `app/api/notify-submission/route.ts`
- **temp_leads_basics** accessed in `app/api/notify-submission/route.ts`
- **profiles** accessed in `app/api/notify-submission/route.ts`
- **user_notifications** accessed in `app/api/notify-submission/route.ts`
- **temp_leads_basics** accessed in `app/api/reminder-check/route.ts`
- **temp_intake_forms** accessed in `app/api/reminder-check/route.ts`
- **temp_leads_basics** accessed in `app/api/reports/monthly/route.ts`
- **profiles** accessed in `app/api/send-email/route.ts`
- **temp_leads_basics** accessed in `app/api/send-email/route.ts`
- **email_templates** accessed in `app/api/send-email/route.ts`
- **email_logs** accessed in `app/api/send-email/route.ts`
- **profiles** accessed in `app/api/superadmin/audit-logs/route.ts`
- **audit_logs** accessed in `app/api/superadmin/audit-logs/route.ts`
- **profiles** accessed in `app/api/superadmin/email-templates/route.ts`
- **email_templates** accessed in `app/api/superadmin/email-templates/route.ts`
- **audit_logs** accessed in `app/api/superadmin/email-templates/route.ts`
- **profiles** accessed in `app/api/superadmin/form-templates/route.ts`
- **form_templates** accessed in `app/api/superadmin/form-templates/route.ts`
- **audit_logs** accessed in `app/api/superadmin/form-templates/route.ts`
- **profiles** accessed in `app/api/superadmin/pipelines/route.ts`
- **pipelines** accessed in `app/api/superadmin/pipelines/route.ts`
- **audit_logs** accessed in `app/api/superadmin/pipelines/route.ts`
- **profiles** accessed in `app/api/superadmin/pipelines/stages/route.ts`
- **pipeline_stages** accessed in `app/api/superadmin/pipelines/stages/route.ts`
- **audit_logs** accessed in `app/api/superadmin/pipelines/stages/route.ts`
- **profiles** accessed in `app/api/superadmin/system-settings/route.ts`
- **system_settings** accessed in `app/api/superadmin/system-settings/route.ts`
- **audit_logs** accessed in `app/api/superadmin/system-settings/route.ts`
- **profiles** accessed in `app/api/superadmin/users/route.ts`
- **audit_logs** accessed in `app/api/superadmin/users/route.ts`
- **profiles** accessed in `app/api/update-client/route.ts`
- **temp_leads_basics** accessed in `app/api/update-client/route.ts`
- **clients** accessed in `app/api/update-client/route.ts`
- **audit_logs** accessed in `app/api/update-client/route.ts`
- **profiles** accessed in `app/api/update-stage/route.ts`
- **temp_leads_basics** accessed in `app/api/update-stage/route.ts`
- **pipeline_stages** accessed in `app/api/update-stage/route.ts`
- **lead_stage_history** accessed in `app/api/update-stage/route.ts`
- **temp_intake_forms** accessed in `app/api/upload-document/route.ts`
- **documents** accessed in `app/api/upload-document/route.ts`
- **uploaded_documents** accessed in `app/api/upload-document/route.ts`
- **temp_intake_forms** accessed in `app/intake/[id]/page.tsx`
- **documents** accessed in `app/intake/[id]/page.tsx`
- **profiles** accessed in `app/login/page.tsx`
- **temp_leads_basics** accessed in `components/email/EmailModal.tsx`
- **email_templates** accessed in `components/email/EmailModal.tsx`
- **profiles** accessed in `components/email/EmailModal.tsx`
- **temp_intake_forms** accessed in `components/email/EmailModal.tsx`
- **profiles** accessed in `components/layout/Sidebar.tsx`
- **profiles** accessed in `components/layout/TopBar.tsx`
- **user_notifications** accessed in `components/layout/TopBar.tsx`
- **temp_leads_basics** accessed in `components/layout/TopBar.tsx`
- **pipelines** accessed in `components/pipeline/UpdateStageModal.tsx`
- **pipeline_stages** accessed in `components/pipeline/UpdateStageModal.tsx`
- **email_logs** accessed in `lib/microsoftGraph.ts`
- **pipelines** accessed in `lib/supabaseClient.ts`
- **pipeline_stages** accessed in `lib/supabaseClient.ts`
- **profiles** accessed in `utils/auth.ts`
- **profiles** accessed in `proxy.ts`

---

# API ANALYSIS

### /api/accounting/reconciliation
- **Methods:** GET
- **File:** `app/api/accounting/reconciliation/route.ts`
- **Tables Accessed:** profiles, temp_leads_basics

### /api/accounting/update-commission
- **Methods:** POST
- **File:** `app/api/accounting/update-commission/route.ts`
- **Tables Accessed:** profiles, temp_leads_basics, accounting_logs

### /api/accounting/verify-policy
- **Methods:** POST
- **File:** `app/api/accounting/verify-policy/route.ts`
- **Tables Accessed:** profiles, temp_leads_basics, accounting_logs

### /api/delete-document
- **Methods:** POST
- **File:** `app/api/delete-document/route.ts`
- **Tables Accessed:** documents, uploaded_documents

### /api/documents
- **Methods:** GET
- **File:** `app/api/documents/route.ts`
- **Tables Accessed:** uploaded_documents

### /api/documents/[id]
- **Methods:** GET
- **File:** `app/api/documents/[id]/route.ts`
- **Tables Accessed:** uploaded_documents, documents

### /api/notify-submission
- **Methods:** POST
- **File:** `app/api/notify-submission/route.ts`
- **Tables Accessed:** temp_intake_forms, temp_leads_basics, profiles, user_notifications

### /api/reminder-check
- **Methods:** GET
- **File:** `app/api/reminder-check/route.ts`
- **Tables Accessed:** temp_leads_basics, temp_intake_forms

### /api/reports/monthly
- **Methods:** POST
- **File:** `app/api/reports/monthly/route.ts`
- **Tables Accessed:** temp_leads_basics

### /api/send-email
- **Methods:** POST
- **File:** `app/api/send-email/route.ts`
- **Tables Accessed:** profiles, temp_leads_basics, email_templates, email_logs

### /api/superadmin/audit-logs
- **Methods:** GET
- **File:** `app/api/superadmin/audit-logs/route.ts`
- **Tables Accessed:** profiles, audit_logs

### /api/superadmin/email-templates
- **Methods:** GET, POST, DELETE
- **File:** `app/api/superadmin/email-templates/route.ts`
- **Tables Accessed:** profiles, email_templates, audit_logs

### /api/superadmin/form-templates
- **Methods:** GET, POST, DELETE
- **File:** `app/api/superadmin/form-templates/route.ts`
- **Tables Accessed:** profiles, form_templates, audit_logs

### /api/superadmin/pipelines
- **Methods:** GET, POST, DELETE
- **File:** `app/api/superadmin/pipelines/route.ts`
- **Tables Accessed:** profiles, pipelines, audit_logs

### /api/superadmin/pipelines/stages
- **Methods:** GET, POST, DELETE
- **File:** `app/api/superadmin/pipelines/stages/route.ts`
- **Tables Accessed:** profiles, pipeline_stages, audit_logs

### /api/superadmin/system-settings
- **Methods:** GET, POST
- **File:** `app/api/superadmin/system-settings/route.ts`
- **Tables Accessed:** profiles, system_settings, audit_logs

### /api/superadmin/users
- **Methods:** GET, POST, DELETE
- **File:** `app/api/superadmin/users/route.ts`
- **Tables Accessed:** profiles, audit_logs

### /api/update-client
- **Methods:** POST
- **File:** `app/api/update-client/route.ts`
- **Tables Accessed:** profiles, temp_leads_basics, clients, audit_logs

### /api/update-stage
- **Methods:** POST
- **File:** `app/api/update-stage/route.ts`
- **Tables Accessed:** profiles, temp_leads_basics, pipeline_stages, lead_stage_history

### /api/upload-document
- **Methods:** POST
- **File:** `app/api/upload-document/route.ts`
- **Tables Accessed:** temp_intake_forms, documents, uploaded_documents

---

# STATE MANAGEMENT ANALYSIS

- **React State (useState / useReducer):** Local state handles form inputs, modal toggles, and optimistic UI updates directly inside components like `UpdateStageModal.tsx`.
- **Data Flow:** React Server Components (RSC) heavily fetch initial data natively. Client components mutate data via `fetch` to API Routes, and trigger `router.refresh()` to rehydrate the Server Component safely and automatically.
- **Context API / Global Store:** The architecture actively avoids Redux or Zustand, relying fundamentally on Next.js 14 caching and server states natively, minimizing client payload and complexity.

---

# AUTHENTICATION & AUTHORIZATION ANALYSIS

- **Login Process:** Standard Supabase email/password flow securely establishing SSR cookies.
- **Session Management:** Cookies are passed securely with every request.
- **Role Validation:** `proxy.ts` evaluates the `pathname` strictly against an `accessMatrix`.
- **Security Mechanisms:** CSRs cannot spoof API calls to admin endpoints because `/api/` route handlers internally re-fetch the session and execute role checks securely server-side before processing.

---

# BUSINESS WORKFLOW RECONSTRUCTION

**"HOW THIS CRM WORKS END-TO-END"**

1. A new lead drops into the system via an initial basic entry.
2. The CSR identifies the lead requires Intake data. CSR clicks "Send Intake Form".
3. System hits `/api/send-email`, integrates with MS Graph, sending a customized email to the client with an encrypted, unique form URL. System automatically sets a `follow_up_date` for 48 hours later.
4. If the client does not respond, a backend cron job (`/api/reminder-check`) detects the stale follow-up and dispatches an automated reminder.
5. The client clicks the link and fills out `AutoInsuranceForm.tsx` uploading their old declaration page PDF.
6. The data routes via `/api/upload-document` into Supabase Storage and `temp_intake_forms`.
7. The CSR is notified. The CSR opens the lead, reviews the documents, and attempts to update the stage to "Quoting".
8. The pipeline engine strictly checks if the "Declaration Page" metadata requirement is fulfilled natively. If yes, the stage upgrades. If not, the UI blocks progression.
9. At month-end, Admins generate KPIs via `/api/reports/monthly` returning formatted Excel logs of all closed policies.

---

# CHANGE IMPACT MATRIX

When new client requirements arrive, the following impacts exist:

- **Modifying a Pipeline Requirement (Low Risk):** Update the JSON array in the `pipeline_stages` table. UI and APIs dynamically react. No code deployment needed.
- **Adding a New Form Field (Medium Risk):** Modify `components/forms/...Form.tsx`, update validation schemas, and ensure the UI maps the new field into the `stage_metadata` payload.
- **Adding a New User Role (High Risk):** Requires updating the Supabase `profiles` enum, updating the `accessMatrix` inside `/proxy.ts`, and configuring explicit RLS policies in the database schema.
- **Changing Email Logic (High Risk):** Requires cautious modification of `/lib/microsoftGraph.ts` and `/api/send-email/route.ts`. Testing required against the Azure tenant.

---

# DEAD CODE & TECHNICAL DEBT ANALYSIS

- **Technical Debt (Medium):** The `proxy.ts` handles a massive amount of authorization blocking. As route volume increases, regex or exact path matching must be extremely rigorously maintained to avoid security holes.
- **Technical Debt (High):** Extensive use of JSONB (`stage_metadata`) provides flexibility but sacrifices SQL typing natively. Complex reporting over JSONB can become a performance bottleneck at scale.

---

# ARCHITECTURE DOCUMENT

- **Frontend Architecture:** Next.js 14 App Router natively prioritizing Server-Side Rendering (SSR).
- **Backend Architecture:** Next.js API route handlers functioning as secure controllers, passing sanitized payloads to Supabase.
- **Database Architecture:** PostgreSQL core leveraging strong relational integrity combined with flexible JSONB data stores and aggressive RLS filtering.
- **Deployment Architecture:** Vercel natively expected, allowing Edge Middleware execution (`proxy.ts`) for zero-latency auth routing.

---

# FINAL SYSTEM UNDERSTANDING REPORT

1. **Complete CRM Overview:** Delivered in Exec Summary.
2. **Complete User Journey:** Delivered in App Flow.
3. **Complete Feature List:** Delivered in Feature Inventory.
4. **Complete Route List:** Delivered in Routing Analysis.
5. **Complete API List:** Delivered in API Analysis.
6. **Complete Database Usage List:** Delivered in Database Usage Analysis.
7. **Complete Component Dependency Tree:** Delivered in Component Dependency Map.
8. **Developer Onboarding Guide:** Read this document strictly, followed by `/proxy.ts` and `UpdateStageModal.tsx` to understand the core logic loop.

---

# CLIENT CHANGE READINESS REPORT

**Tight Coupling vs Loose Coupling:**
- *Tightly Coupled:* Auth routing, Pipeline validations, and MS Graph email integrations natively heavily intertwine. Modifying these requires extreme testing.
- *Loosely Coupled:* UI components, reporting schemas, and Intake forms natively map easily into JSON metadata, making front-end iterations extremely fast and safe.

**Complexity of Future Enhancements:**
- Changing business logic (pipeline rules) is practically zero complexity due to database-driven metadata checks natively.
- Adding entirely new modules (like Accounting/Invoicing) is medium complexity, mainly requiring new Top-Level Route Groups (`(dashboard)/invoicing`) and new DB tables natively mapped with proper RLS constraints.

**Recommended Approach for Future Requirements:**
Always leverage `stage_metadata` for custom client requests natively to prevent database schema bloated migrations. Enforce strict NextJS Route Groups for any new modules to isolate auth risks entirely.
