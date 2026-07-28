# 05. Exhaustive API Route Handlers Analysis
**System Name:** Moonstar Enterprise Insurance, Mortgage & Commercial Lending CRM  

---

## 1. API Architecture & Security Model

All backend API routes (`app/api/*`) operate as Next.js Route Handlers (`route.ts`). They enforce strict **defense-in-depth security** by independently authenticating incoming requests via `authenticateApiRequest(request, allowedRoles)` (`utils/auth.ts`). Even if a client bypasses Next.js Middleware (`proxy.ts`), API route handlers re-verify the session cookie or bearer token, confirm the user's role in the `profiles` table, and execute operations using either the user-scoped client or the administrative `supabaseServer` client.

---

## 2. Core Insurance & Pipeline API Endpoints

### 2.1 `/api/update-stage` (`POST`)
- **Purpose**: The central engine governing lead progression across pipeline stages. Enforces mandatory field checks (`mandatory_fields` JSON schema) and updates lead metadata while writing audit logs.
- **Input Payload (JSON)**:
  ```json
  {
    "lead_id": "c1f7a90b-...",
    "target_stage_id": "8b23f10a-...",
    "stage_metadata": { "quoted_premium": 1450, "ezlynx_updated": true },
    "remarks": "Client accepted auto quote over phone."
  }
  ```
- **Authentication & Authorization**: `authenticateApiRequest(req, ['csr', 'admin', 'superadmin'])`. Verifies that if `role === 'csr'`, `temp_leads_basics.assigned_csr` matches `auth.uid()`.
- **Validation & Business Logic**:
  1. Queries `pipeline_stages` for `target_stage_id` to inspect `mandatory_fields` (`JSONB` array of required keys).
  2. Evaluates whether the incoming `stage_metadata` (plus existing `temp_leads_basics` columns) contains non-null values for every mandatory field. If any key is missing or false, returns `400 Bad Request` with `{ error: "Missing mandatory fields: ezlynx_updated" }`.
  3. Updates `temp_leads_basics` (`SET stage_id = target_stage_id, stage_metadata = stage_metadata, updated_at = NOW()`).
  4. Inserts a record into `lead_stage_history` (`lead_id`, `previous_stage_id`, `new_stage_id`, `changed_by = auth.uid()`, `remarks`).
- **Output (JSON)**: `{ "success": true, "lead": { ...updated_lead } }`
- **Callers**: `components/pipeline/UpdateStageModal.tsx`.

---

### 2.2 `/api/upload-document` (`POST`)
- **Purpose**: Ingests multipart files (PDFs, images, Excel), saves them to Supabase Storage, and registers metadata records inside the `documents` table.
- **Input Payload (`multipart/form-data`)**:
  - `file`: Binary file blob (`application/pdf`, `image/png`, `image/jpeg`).
  - `lead_id` / `intake_id`: UUID of the associated lead or public intake session.
  - `document_type`: String (`'Declaration Page'`, `'Driver License'`, `'Closing Checklist'`).
- **Authentication & Authorization**:
  - For internal CSR uploads: `authenticateApiRequest(req, ['csr', 'admin', 'superadmin'])`.
  - For public client intake (`/intake/[id]`): Verifies existence of valid `intake_id` inside `temp_intake_forms` before accepting.
- **Validation**:
  - Enforces 25MB (`26214400` bytes) size limit.
  - Checks `file.type` against allowed MIME array (`['application/pdf', 'image/jpeg', 'image/png']`).
- **Database & Storage Queries**:
  1. Uploads binary to storage bucket: `supabaseServer.storage.from('documents').upload(`${lead_id}/${Date.now()}_${fileName}`, file)`.
  2. Inserts metadata row: `INSERT INTO documents (lead_id, file_name, file_path, file_size, document_type, uploaded_by) VALUES (...)`.
- **Output (JSON)**: `{ "success": true, "document": { "id": "...", "file_path": "..." } }`
- **Callers**: `components/ui/IntakeUI.tsx`, `components/leads/EditClientModal.tsx`.

---

### 2.3 `/api/delete-document` (`POST`) & `/api/documents/[id]` (`GET`, `DELETE`)
- **Purpose**: Retrieves public/signed storage URLs (`GET`) or removes binary objects and database records (`DELETE`).
- **Authentication**: `authenticateApiRequest(req, ['csr', 'admin', 'superadmin'])`.
- **Database & Storage Queries**:
  1. Deletes storage object: `supabaseServer.storage.from('documents').remove([document.file_path])`.
  2. Deletes relational metadata: `DELETE FROM documents WHERE id = id`.
- **Output**: `{ "success": true }`

---

## 3. Communication & SLA Automation Endpoints

### 3.1 `/api/send-email` (`POST`)
- **Purpose**: Generates customized HTML emails (`lib/emailTemplating.ts`) and dispatches them via corporate Azure Microsoft Graph API mailboxes (`lib/microsoftGraph.ts`).
- **Input Payload (JSON)**:
  ```json
  {
    "lead_id": "c1f7a90b-...",
    "template_id": "d4e2f11c-...",
    "to_email": "client@example.com",
    "subject": "Complete Your Moonstar Insurance Intake",
    "body": "<p>Dear John, please click here: ...</p>"
  }
  ```
- **Authentication**: `authenticateApiRequest(req, ['csr', 'admin', 'superadmin'])`.
- **Business Logic & Database Mutations**:
  1. Calls `sendMailViaGraph({ to: to_email, subject, htmlBody: body })`.
  2. Logs delivery attempt: `INSERT INTO email_logs (lead_id, template_id, to_email, subject, status) VALUES (..., 'sent')`.
  3. **Automatic SLA Trigger**: Updates the lead's follow-up window: `UPDATE temp_leads_basics SET follow_up_date = CURRENT_TIMESTAMP + INTERVAL '48 hours' WHERE id = lead_id`.
- **Output**: `{ "success": true, "log_id": "..." }`
- **Callers**: `components/email/EmailModal.tsx`.

---

### 3.2 `/api/notify-submission` (`POST`)
- **Purpose**: Internal webhook/handler invoked when a client successfully completes the public intake form (`/intake/[id]`). Dispatches an alert email to the assigned CSR.
- **Authentication**: Public / Service Token.
- **Database Queries**: Reads `temp_leads_basics` joined with `profiles` (`assigned_csr`), sends Graph email to `csr.email`.

---

### 3.3 `/api/reminder-check` (`GET` - Cron Job Handler)
- **Purpose**: Automated background worker designed to be executed hourly via external cron schedulers (`Vercel Cron`). Sweeps the database for stale leads past their follow-up date and sends automated reminder emails.
- **Authentication**: Verifies `CRON_SECRET` bearer token header (`Authorization: Bearer process.env.CRON_SECRET`).
- **Database & Graph Queries**:
  1. `SELECT * FROM temp_leads_basics WHERE follow_up_date <= CURRENT_TIMESTAMP AND reminder_sent = false AND stage_name = 'Quote Has been Emailed'`.
  2. For each stale lead, formats reminder template and dispatches via `sendMailViaGraph()`.
  3. Updates lead record: `UPDATE temp_leads_basics SET reminder_sent = true, last_reminder_at = NOW() WHERE id = lead.id`.
- **Output**: `{ "success": true, "reminders_processed": 14 }`

---

## 4. Moonstar Mortgage Endpoints (`/api/mortgage/*`)

### 4.1 `/api/mortgage/loans` (`GET`, `POST`)
- **Purpose**: Paginated listing (`GET`) and creation (`POST`) of residential mortgage applications (`mortgage_loans`).
- **Authentication**: `authenticateApiRequest(req, ['mortgage', 'admin', 'superadmin'])`.
- **Validation (`sanitizePayloadForPostgres`)**:
  - Automatically cleans empty strings (`"" → null`) across all date (`application_received_date`, `inquiry_date`, `target_closing_date`) and numeric fields (`estimated_property_value`, `loan_amount`, `interest_rate`) to prevent `22P02 invalid input syntax for type numeric/date` PostgreSQL errors.
- **Database Queries (`POST`)**:
  1. `INSERT INTO mortgage_loans (client_name, phone, email, loan_type, stage, assigned_mortgage_officer, ...) VALUES (...) RETURNING *`.
  2. Automatically captures initial stage snapshot: `INSERT INTO mortgage_stage_history (loan_id, previous_stage, current_stage, updated_by, stage_data) VALUES (...)`.
- **Callers**: `app/mortgage/page.tsx`, `app/mortgage/pipelines/page.tsx`, `LoanFormModal.tsx`.

### 4.2 `/api/mortgage/loans/[id]` (`GET`, `PUT`, `DELETE`) & `/api/mortgage/loans/[id]/history` (`GET`)
- **Purpose**: Deep-dive mutations on individual mortgage loans and retrieval of complete stage progression histories.
- **Authentication**: `authenticateApiRequest(req, ['mortgage', 'admin', 'superadmin'])`.
- **Callers**: `LoanDetailModal.tsx`, `StageHistorySection.tsx`.

---

## 5. Superadmin & Reporting Endpoints

### 5.1 `/api/reports/monthly` (`GET`)
- **Purpose**: High-speed analytics aggregation endpoint generating JSON KPIs, Excel workbooks (`exceljs`), or PDF summaries (`pdfkit`) for management reviews.
- **Authentication**: `authenticateApiRequest(req, ['admin', 'superadmin', 'accounting'])`.
- **Query Parameters**: `start_date`, `end_date`, `date_type` ('effective' | 'expiration'), `flow` ('new' | 'renewal'), `category` ('personal' | 'commercial'), `format` ('json' | 'excel' | 'pdf').
- **Database Operations**: Invokes PostgreSQL RPC function: `supabaseServer.rpc('get_report_summary', { p_start_date, p_end_date, p_date_type, ... })`.
- **Output**:
  - If `format=json`: `{ "total_policies": 142, "total_premium": 245000.00, ... }`
  - If `format=excel`: Streams binary `.xlsx` workbook buffer (`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).

### 5.2 `/api/superadmin/*` (`pipelines`, `stages`, `users`, `form-templates`, `email-templates`, `system-settings`, `audit-logs`)
- **Purpose**: God-mode CRUD controllers allowing superadmins to modify dynamic stage orders, update user roles (`profiles.role`), edit system settings (`system_settings`), and review security audit trails (`audit_logs`).
- **Authentication**: Strictly requires `authenticateApiRequest(req, ['superadmin'])`.
- **Callers**: `app/(dashboard)/superadmin/*`.

---

## 6. Accounting Endpoints (`/api/accounting/*`)

### 6.1 `/api/accounting/update-commission` (`POST`) & `/api/accounting/verify-policy` (`POST`)
- **Purpose**: Enables accounting officers to verify policy numbers, adjust `bound_premium` and `expected_commission`, mark policies as financially reconciled (`reconciliation_records`), and log transactions (`accounting_logs`).
- **Authentication**: `authenticateApiRequest(req, ['accounting', 'superadmin'])`.
- **Callers**: `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`.
