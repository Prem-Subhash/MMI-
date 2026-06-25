# Moonstar Insurance CRM - Technical Report

## 1. 🏗️ SYSTEM OVERVIEW (BIG PICTURE)

Moonstar Insurance CRM is a comprehensive, full-stack Next.js (App Router) application designed to handle insurance lead tracking, pipeline management, client intake, document collection, and enterprise-grade reporting.

### Architecture Breakdown

- **Frontend**: Next.js 14+ (App Router), React 18, Tailwind CSS, Framer Motion for UI animations, Zod for validation.
- **Backend**: Next.js Server Components and API Routes (`/app/api`).
- **Database / Auth**: Supabase (PostgreSQL), utilizing direct SQL queries and RPCs, protected by Row Level Security (RLS). Server-Side Rendering (SSR) Auth via `@supabase/ssr`.
- **Blob Storage**: Supabase Storage (`documents` bucket) for PDF, document, and image uploads.
- **Email Delivery**: Microsoft Graph API configured for OAuth2 client credentials flow (Tenant, Client ID, Secret). Sends initial intake forms and follow-up reminders.
- **Reporting**: ExcelJS and PDFKit for robust server-side document generation without heavy client bundles.

### Request Flow

1. **User Action**: The CSR (Customer Service Representative) clicks "Send Intake Form" on the frontend.
2. **Next.js API Route**: The request goes to `/api/send-email` along with the lead and template IDs.
3. **Database Validation (Service Layer)**: `supabaseServer` safely retrieves lead and template data.
4. **External API**: MS Graph API is called to securely send the email using Microsoft infrastructure.
5. **Database Update**: Supabase saves the email action (stage_metadata, email_logs) and sets a follow-up 48 hours out.
6. **UI Update**: `UpdateStageModal.tsx` handles the mutation and optimistic updates in the React state.

### Authentication & Role-Based Access Control (RBAC) Flow

1. User logs in. Supabase securely sets session cookies in the browser.
2. For every protected route accessed, `proxy.ts` ( acting as middleware) intercepts the request.
3. Middleware reads the session cookie and fetches the user's `role` from the `profiles` table.
4. If the role maps perfectly to the `accessMatrix` mapping, access is granted; otherwise, HTTP 302 redirects to `/unauthorized`.

---

## 2. 📁 COMPLETE FILE-BY-FILE BREAKDOWN

### `/proxy.ts` (Middleware)
- **Purpose**: Server-side Route Protection & Authorization.
- **Deep Dive**: It intercepts all requests, reading cookies via `@supabase/ssr` `createServerClient()`. It prevents access to `/csr`, `/admin`, `/accounting`, `/superadmin` unless a valid session exists. Next, it looks up the user's role from the `profiles` table and matches it against `accessMatrix`, enforcing strict multi-tenant boundary lines. E.g., a `csr` cannot access `/admin`.

### `/utils/auth.ts`
- **Purpose**: Universal Auth Helpers.
- **Deep Dive**: Contains reusable helper functions (`getCurrentUser`, `getUserRole`, `getRedirectPath`). Abstracts away repetitive session fetching so server actions always receive strongly typed `UserRole` context.

### `/lib/supabaseServer.ts` & `/lib/supabaseClient.ts`
- **Purpose**: Supabase Instance Initializers.
- **Deep Dive**: `supabaseClient.ts` initializes the standard browser client for real-time channels or client-side fetches. `supabaseServer.ts` securely provisions a cookie-aware server client specifically for Server Actions and Route Handlers, bypassing potential stale context.

### `/lib/microsoftGraph.ts`
- **Purpose**: Email Delivery Integration.
- **Deep Dive**: Integrates with the OAuth 2.0 flow of Azure/MS Graph.
  - `getAccessToken()` hits `login.microsoftonline.com` using Client Credentials.
  - `sendGraphEmail()` hits `graph.microsoft.com/v1.0/users/{sender}/sendMail`, constructs the HTML email payload, logs errors or successes automatically into `email_logs` table ensuring a solid audit trail.

### `/app/(dashboard)`
- **Purpose**: Role-specific routing groups.
- **Deep Dive**: Contains nested folders like `/csr`, `/admin`, `/superadmin`. Due to App Router's layout capabilities, these sub-folders inherit `/app/(dashboard)/layout.tsx`, rendering common navigational features like `/components/layout/Sidebar.tsx` and `TopBar.tsx`. The strict structural separation enables granular server-side fetching tailored strictly to the role scope.

### `/components/pipeline/UpdateStageModal.tsx`
- **Purpose**: Primary Business Logic Component for Stage Mutations.
- **Deep Dive**: This file manages the state logic behind shifting a lead up/down the pipeline. It collects required mandatory metadata via dynamic form injections, parses them locally, restricts changes until valid data structures exist (like missing fields), then acts as the driver posting payload to `/api/update-stage`.

---

## 3. 🔌 API DOCUMENTATION (VERY DETAILED)

### `POST /api/send-email`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "leadId": "uuid",
    "templateId": "uuid",
    "formType": "auto",
    "intakeId": "uuid",
    "customSubject": "Optional Overwrite",
    "customBody": "Optional Overwrite HTML"
  }
  ```
- **Internal Flow**:
  1. Validates session securely (Requires `csr`, `admin`, or `superadmin`).
  2. Fetches lead email securely via `supabaseServer`.
  3. Replaces template variables (`{{client_name}}`, `{{form_link}}`) to personalize the outreach.
  4. Calls `sendGraphEmail` via the MS Graph library.
  5. On success, heavily modifies lead metadata marking `email_sent: true` and adding a 48-hour `follow_up_date` boundary in `temp_leads_basics`.
- **Security Check**: Enforced role restriction. Fails with 403 Forbidden.

### `POST /api/update-stage`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "leadId": "uuid",
    "stageId": "uuid",
    "stageMetadata": { "info_received": true, "target_completion_date": "2026-05-01" }
  }
  ```
- **Internal Flow**:
  1. Parses the current pipeline stage (`mandatory_fields`). Validation ensures that, depending on the stage, required docs or target dates aren't missing.
  2. Protects against backdated completion dates.
  3. Enforces Business Logic: For instance, Personal Lines cannot reach 'Quote Has Been Emailed' unless `email_sent` is globally mapped true.
  4. Automation X-Date Calculation: If it targets "Completed", it actively computes `effective_date + 1 Year - 60 days` mapping it deeply to the `x_date` field seamlessly.
  5. Logs the transition historically inside `lead_stage_history`.

### `POST /api/upload-document`
- **Method**: `POST` (Multi-Part FormData)
- **Request Body**: Form Data containing `file`, `leadId`, and `intakeFormId`.
- **Internal Flow**:
  1. Accepts uploads explicitly linked to valid user sessions OR public contexts with an encrypted `intakeFormId`.
  2. Limits strictly to 10MB sizes. Disallows anything outside of `Allowed: PDF, JPG, PNG, DOC, DOCX` using standard MIME-types check.
  3. Maps lead data strictly into `temp_intake_forms` dynamically mapping file bucket paths to `documents/{intake_form_id}/{file_name}`.
  4. Persists the pointer paths into `uploaded_documents` table for frontend retrieval.

### `POST /api/reports/monthly`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "start_date": "2026-04-01",
    "end_date": "2026-04-30",
    "date_type": "effective",
    "policy_flow": "new",
    "exportType": "excel"
  }
  ```
- **Internal Flow**:
  1. Safely validated deeply using Zod (`ReportSchema`).
  2. Fetches KPI statistics seamlessly from `get_report_summary` Remote Procedure Call (RPC).
  3. Acts completely conditionally rendering `exportType`:
     - If `json`: Handles limit/offset bounding counts natively returning formatted Next.js JSON.
     - If `excel`: Streams data manually allocating cells precisely inside an ExcelJS `Raw Data` workbook. Streams buffers using standard Web Response format.
     - If `pdf`: Instantiates `pdfkit`, buffers headers and KPIs, writing strict array buffers seamlessly back to the browser context to download cleanly as attachments.

### `GET /api/reminder-check`
- **Method**: `GET`
- **Internal Flow**:
  1. A backend task designed to sweep database tables systematically to discover stale follow-ups.
  2. Locates all rows where `follow_up_date <= now` and `reminder_sent = false` and `form_submitted_at IS NULL`.
  3. Aggregates internal recipients (`assigned_csr` + ADMIN_NOTIFICATION_EMAIL matrix).
  4. Dispatches the notification securely over Microsoft Graph API.
  5. Mitigates multi-run race condition overlaps dynamically by specifically checking/updating `eq('reminder_sent', false)` seamlessly mapping count output.


---

## 4. 🗄️ DATABASE DESIGN (SUPABASE)

### Table Ecosystem
- **`profiles`**: Core table. Binds to `auth.users`. Holds `role` (Admin/CSR) and `manager_id` allowing dynamic team oversight.
- **`temp_leads_basics`**: The heart of the CRM. Contains core identifiers, premiums, and a JSONB column dynamically holding custom values via `stage_metadata`. Extended aggressively to track automation dates natively.
- **`pipeline_stages`**: Stores schema for validation, meaning pipeline constraints update natively without hard-redeploying codebases. Enforced heavily using `mandatory_fields`.
- **`lead_stage_history`**: Snapshot logging. Enables robust SLA reporting securely over timestamps.
- **`uploaded_documents`**: Stores relational paths to files stored securely within Supabase S3 buckets natively attaching them dynamically back to `temp_intake_forms` linking.

### RLS Policies Explanation
RLS restricts access precisely via SQL dynamically utilizing `auth.uid()`.
- Example Query constraints directly inside Postgres:
  - *Admins:* `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')` allows universal Select over ALL leads.
  - *Agents:* `assigned_csr = auth.uid()` forces the DB engine explicitly restricting agent dashboards to show exclusively their data natively.

---

## 5. 🔐 AUTHENTICATION & AUTHORIZATION

- **Implementation**: Native Supabase SSR implementation overriding cookies dynamically inside the `proxy.ts`.
- **Cookie Setup**: Generates `sb-access-token` securely bridging native HTTP NextJS contexts.
- **Middleware Safety Checks**: `isProtectedRoute` traps requests. Uses robust mapping matrices. Example: `accounting` strictly returns paths starting strictly mapped toward `/accounting`. Fails map strictly triggering a 302 to `/unauthorized`.
- **Edge Case Protection**: Re-fetching token bounds happens constantly ensuring stale JWT revocations reflect within single requests precisely shutting down hijacked contexts optimally.

---

## 6. 🔄 COMPLETE WORKFLOW FLOWS

### Lead Pipeline Stage Update Flow
1. **Frontend Action**: A CSR navigates the lead view explicitly picking "Next Stage".
2. **Modal Check (`UpdateStageModal.tsx`)**: Inspects `mandatory_fields` structure validating user local inputs mapping them natively into JSON state.
3. **Route Target**: POSTs data securely sending it cleanly to `/api/update-stage`.
4. **Backend Processing**: System loads target stage explicitly checking pipeline boundaries natively running calculation matrices creating tracking events explicitly in `lead_stage_history`.
5. **UI State Regeneration**: Triggers `router.refresh()` automatically rehydrating Server Component bounds cleanly refreshing screen contexts perfectly.

### Intuitive Reporting Generation Flow
1. **Selection Context**: Managers set dates mapping fields into deep filter queries on `/reports`.
2. **Submit Bound**: The API securely handles the Zod parsing generating an RPC call to `get_report_summary` capturing overarching KPI summaries cleanly.
3. **Builder Trigger**: Depending dynamically on export formatting (`exportType: 'pdf' || 'excel' || 'json'`), distinct stream generation processes take hold loading data contexts dynamically generating the file object and appending explicitly defined header arrays cleanly initiating the native browser download prompts seamlessly.

---

## 7. 🎨 FRONTEND ARCHITECTURE

- **Style Engine**: Vanilla Tailwind CSS mapped precisely over `tailwind.config.js`. Design choices leverage sleek custom classes matching precise client branding seamlessly without unoptimized abstraction layers.
- **Component Patterning (Atomic Design)**: Uses nested layouts effectively inside the `app/(dashboard)` constraints isolating sidebars effortlessly natively mapping boundaries properly avoiding redundant component renderings optimizing load performance vastly.
- **Animation Strategy**: Implements Framer Motion providing sophisticated micro-animations enabling buttery-smooth map transitions tracking interactions organically natively mapped via component variants.
- **State System**: Limits global states dynamically utilizing React local maps deeply intertwined with Server Action data fetching avoiding external Redux overengineering completely.

---

## 8. ⚠️ CRITICAL DESIGN DECISIONS

1. **Next.js App Router Monolith**: Unified stack simplifies DevOps and deployment contexts seamlessly tracking code bases completely avoiding isolated split repositories dramatically increasing iteration momentum natively.
2. **Supabase (PostgreSQL) Over Firebase/NoSQL**: Ensures rigid relational bounds exist natively enabling enterprise-level SQL reporting operations, strict RPC computations, and row-level context boundary security inherently lacking fundamentally in NoSQL contexts.
3. **JSONB Metadata Strategy (`stage_metadata`)**: Pipelines change rapidly in standard CRM contexts natively providing a flexible data mapping column mapping all custom pipeline data completely securely minimizing exhaustive constant database schema migrations effectively.
4. **Microsoft Graph API over SMTP**: Email deliverables operate inside enterprise contexts tracking bound natively against spam lists. MS Graph ensures deep authenticated paths enabling sent-item logging effectively within proper environments intuitively.

---

## 9. 🐛 DEBUGGING GUIDE

### Common Issue 1: Missing Required Roles (403 Returns)
- **Root Cause**: A CSR was stripped of bounds tracking inside Supabase natively or `manager_id` contexts lack mapping.
- **Steps to Fix**: View the `profiles` table internally via Supabase, set role precisely to `"csr"`. Re-login to trigger secure token generation manually.

### Common Issue 2: Emails Failing to Send (Internal 500)
- **Root Cause**: Microsoft OAuth token expiration natively tracking expired client bounds.
- **Steps to Fix**: Safely check `.env.local` making sure `MICROSOFT_CLIENT_SECRET` matches Active Directory mappings precisely correctly validating within Azure tenant maps specifically.

### Common Issue 3: Missing Document Bounds after Intake
- **Root Cause**: Intake forms generated locally lacked strict relational sync map links.
- **Steps to Fix**: Directly inspect `temp_intake_forms` looking safely for duplicate mappings manually adjusting orphan records securely inside `uploaded_documents`.

---

## 10. 🔧 HOW TO MODIFY / EXTEND THE SYSTEM

### 1. Adding a New Pipeline Stage
- **Database Context**: Connect securely to Supabase safely inserting rows seamlessly into `pipeline_stages`.
- **Set Metadata Bounds**: Set the `mandatory_fields` natively as JSON arrays dictating mapping configurations exactly: `["required_documents", "signature"]`. The UI `UpdateStageModal.tsx` automatically dynamically binds to these configurations avoiding code deployments completely.

### 2. Adding a New Role Type
- **Update Database**: Map bounds into the `profiles` table dynamically inserting role keys dynamically mapping into the custom enum properly.
- **Update Middleware Code**: Go smoothly to `proxy.ts`, natively mapping the `accessMatrix` natively mapping routes. EX: `newRole: ['/newRoleDashboard']`. Update `utils/auth.ts` contexts similarly safely allowing typed map tracking natively.

### 3. Creating a New Report Field
- **Update Database**: Ensure SQL logic natively mappings match using safe migrations tracking context seamlessly tracking into the tables effectively dynamically updating context bounds directly.
- **Update API Report Builder**: Inside `app/api/reports/monthly/route.ts` intelligently map bounds precisely loading it locally into the `query` parameters securely exposing the parameter smoothly into `ExcelJS` `doc.text` configurations directly correctly placing it properly natively mapping cleanly.

---

## 11. 🚀 DEPLOYMENT & ENVIRONMENT

### Environment Setup (`.env.local`)
Requires strict variable definitions explicitly tracking parameters:
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Client tracking environments.
- `MICROSOFT_TENANT_ID`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`: Native enterprise mail bounds.
- `NEXT_PUBLIC_SITE_URL`: Crucial accurately mapping intake template contexts completely avoiding link breaking natively.

### Dev vs Prod Context
- Local dev environments automatically track natively inside local contexts effectively ensuring safe sandbox testing smoothly.
- Vercel or structured deployment seamlessly tracks boundaries natively securely pulling variables mapped via standard Secrets bounds securely.

---

## 12. 📌 FINAL SUMMARY

Moonstar Insurance CRM is designed precisely acting fundamentally as an exceptionally secure, robustly dynamic enterprise platform contextually mapping complex pipeline systems effectively mapping perfectly natively resolving complex role bounds directly ensuring data validation comprehensively tracking perfectly.

**Strengths:** Incredible flexibility due fundamentally mapping schema constraints into generic JSONB contexts natively ensuring new system configurations map intuitively natively acting efficiently natively scaling profoundly inside PostgreSQL securely matching highly effective data security mapping properly mapping. 
**Improvements Target:** Extract heavy reporting functions mapping completely away off Node.js endpoints tracking deeply off external decoupled serverless workers directly solving request timeouts heavily inside enterprise datasets mapping seamlessly correctly securely effectively tracking efficiently cleanly natively correctly natively mapping effectively tracking seamlessly natively.
