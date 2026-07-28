# 08. Comprehensive Business Modules & Functional Architecture
**System Name:** Moonstar Enterprise Insurance, Mortgage & Commercial Lending CRM  

---

## 1. Module Overview & Domain Separation

The application is architected into 11 interconnected business modules distributed across three domain-specific portals (`Innovative Insurance`, `Accurate Lending`, and `Moonstar Mortgage`). Each module handles a distinct lifecycle phase of customer intake, risk evaluation, financial underwriting, or commission tracking.

---

## 2. Innovative Insurance CRM Modules (`/(dashboard)/*`)

### 2.1 Lead & Policy Management Module
- **Business Purpose**: Tracks insurance customers from initial prospect inquiry through active policy binding and annual renewals.
- **Key Tables**: `temp_leads_basics`, `profiles`.
- **Core Features**:
  - **Dual Line-of-Business Tracking**: Splits leads into `Personal Lines` (Auto, Home, Umbrella) and `Commercial Lines` (Worker's Comp, General Liability, Commercial Auto) using `insurence_category`.
  - **X-Date & Renewal Automation**: Uses `effective_date` and `renewal_date` (`utils/renewalHelper.ts`) to automatically identify expiring policies. When a policy approaches its expiration window, the system spawns a renewal lead (`policy_flow = 'renewal'`) assigned to the original CSR, ensuring zero lapse in coverage.
  - **Personal & Team Queues**: CSRs view their personal assigned workload (`/csr`), while Team Leads view aggregated departmental performance (`/admin`).

### 2.2 Client Intake & Ingestion Module
- **Business Purpose**: Bridges the gap between internal agents and external unauthenticated clients by capturing structured risk data via secure, tokenized web links (`/intake/[id]`).
- **Key Tables**: `temp_intake_forms`, `documents`.
- **Core Features**:
  - **Unauthenticated Tokenized Access**: CSRs generate unique intake URLs sent via email (`/api/send-email`). Clients access `/intake/[id]` without requiring passwords or account registration.
  - **Dynamic Multi-Step Forms**: Renders line-of-business specific questionnaires (`AutoInsuranceForm.tsx`, `HomeInsuranceForm.tsx`, `VehicleListForm.tsx`, `PrimaryApplicantForm.tsx`).
  - **Declaration Page Uploads**: Allows clients to upload prior insurance declaration sheets, driver licenses, or property photos directly into the `documents` Supabase Storage bucket.
  - **Real-Time Webhook Alerting**: UPon submission (`IntakeUI.tsx`), calls `/api/notify-submission` to immediately email the assigned CSR and update the lead's pipeline status.

### 2.3 Pipeline & Stage Progression Engine Module
- **Business Purpose**: Enforces standardized underwriting and sales workflows across all insurance leads.
- **Key Tables**: `pipelines`, `pipeline_stages`, `temp_leads_basics`, `lead_stage_history`.
- **Core Features**:
  - **Dynamic Pipeline Definitions**: Custom pipelines (`Personal Lines`, `Commercial Lines`, `Renewals`) composed of ordered stages (`1. New Lead` → `2. Intake Emailed` → `3. Quoting` → `4. Quote Emailed` → `5. Bound/Completed`).
  - **Mandatory JSONB Field Validation**: The critical governance engine (`UpdateStageModal.tsx` + `/api/update-stage`). Each stage defines a `mandatory_fields` JSON array (`['client_email', 'quoted_premium', 'ezlynx_updated']`). If a CSR attempts to drag a lead to "Quoting" without checking the "EZLynx Updated" confirmation box or filling in the quote premium, the backend API rejects the transaction (`400 Bad Request`).
  - **Audit Logging**: Every transition records an immutable row in `lead_stage_history` (`lead_id`, `previous_stage`, `new_stage`, `changed_by`, `remarks`, `changed_at`).

### 2.4 Document Storage & Management Module
- **Business Purpose**: Provides secure, organized storage for customer declaration pages, term sheets, and closing checklists.
- **Key Tables & Buckets**: `documents` (`documents` bucket), `lending_documents` (`lending-documents` bucket).
- **Core Features**:
  - **Strict Storage Isolation**: Separates general insurance files (10MB limit) from heavy commercial lending packages (25MB limit).
  - **Signed Public URLs**: Files are stored in private buckets. When CSRs or loan officers view documents inside `DocumentViewer.tsx`, the client generates temporary signed public URLs, preventing unauthorized public URL guessing.

### 2.5 Email & Communication Module
- **Business Purpose**: Automates corporate email communications without relying on external third-party transactional mailers (like SendGrid), ensuring all mail originates from official `@moonstar.com` corporate Outlook mailboxes.
- **Key Tables & Utilities**: `email_templates`, `email_logs`, `lib/microsoftGraph.ts`, `lib/emailTemplating.ts`.
- **Core Features**:
  - **Azure Microsoft Graph OAuth2**: Uses Azure Active Directory client credentials to obtain OAuth2 access tokens and dispatches mail via `https://graph.microsoft.com/v1.0/users/{from_email}/sendMail`.
  - **Dynamic Template Merging**: Replaces merge tags (`{{client_name}}`, `{{intake_link}}`, `{{quote_amount}}`, `{{csr_name}}`) with live lead variables (`EmailModal.tsx`).
  - **Immutable Delivery Logs**: Every outbound email records a tracking row in `email_logs` (`lead_id`, `template_id`, `to_email`, `subject`, `status`, `error_message`).

### 2.6 Reminders & SLA Automation Module
- **Business Purpose**: Prevents lead leakage by enforcing strict follow-up Service Level Agreements (SLAs).
- **Key Tables & Endpoints**: `temp_leads_basics` (`follow_up_date`, `reminder_sent`), `/api/reminder-check`.
- **Core Features**:
  - **Automatic 48-Hour SLA Window**: When a CSR sends an intake form or quote (`/api/send-email`), the system automatically advances `follow_up_date` by 48 hours.
  - **Cron Background Sweeper**: An hourly serverless cron job (`/api/reminder-check`) scans for leads where `follow_up_date <= NOW() AND reminder_sent = false AND stage = 'Quote Emailed'`. It dispatches automated reminder emails to the client and marks `reminder_sent = true`.

### 2.7 Accounting & Commissions Module
- **Business Purpose**: Tracks financial production, reconciles bound policy premiums against carrier statements, and computes agent commissions.
- **Key Tables & Endpoints**: `temp_leads_basics` (`total_premium`, `bound_premium`, `expected_commission`), `/accounting/*`, `/api/accounting/*`.
- **Core Features**:
  - **Financial Reconciliation Queue**: Accountants access `/accounting/all-leads` to review newly bound policies.
  - **Commission Verification**: Verifies policy numbers (`policy_number`), updates `bound_premium`, and logs commission payouts (`expected_commission`) for payroll calculation.

### 2.8 Enterprise Analytics & Reporting Module
- **Business Purpose**: Delivers management insights, production summaries, and exportable financial reports (`/api/reports/monthly`).
- **Key Tables & RPCs**: `temp_leads_basics`, `get_report_summary` stored procedure.
- **Core Features**:
  - **RPC-Driven Aggregation**: Uses PostgreSQL stored procedures to compute KPI totals (`total_policies`, `total_premium`, `new_business_premium`, `renewal_premium`) in sub-second execution time.
  - **Excel Workbook Export (`exceljs`)**: Programmatically builds multi-sheet `.xlsx` files complete with branded header formatting, currency formatting, and auto-adjusted column widths.
  - **PDF Summary Generation (`pdfkit`)**: Streams clean PDF reports directly to browser clients for executive printing.

---

## 3. Accurate Lending Commercial Portal Modules (`/lending/*`)

### 3.1 21-Stage Commercial Real Estate & Business Loan Module
- **Business Purpose**: Tracks complex multi-million dollar commercial lending applications from initial inquiry through closing wire receipt (`accurate_lending_loans`).
- **Key Tables**: `accurate_lending_loans`, `lending_stage_history`.
- **Core Features**:
  - **21-Stage Granular Workflow**: Enforces progression across 21 explicit checkpoints (`1. New Loan` → `5. Term Sheet Received` → `8. Accutax Amount Req` → `12. Appraisal Ordered` → `16. Clear to Close` → `21. Check Received from Borrower`).
  - **Financial Checkpoint Tracking**: Tracks specific monetary milestones required across the loan lifecycle (`accutax_amount_req`, `accurate_lending_amount_req`, `bank_amount_req`, `check_wire_amount_received`).

### 3.2 Multi-Bank Underwriting & Section E Module
- **Business Purpose**: Manages the multi-lender syndication and bidding process where a commercial borrower's package is submitted to several regional banks simultaneously (`SectionELenderInfo.tsx`).
- **Key Tables**: `lending_bank_assignments`, `lending_documents`.
- **Core Features**:
  - **Participating Bank Directory**: Allows adding multiple bank assignments to a single loan (`loan_id`), tracking each bank's specific `bank_officer_name`, `bank_underwriter_name`, and `title_agency_name`.
  - **Term Sheet Comparative Review (`TermSheetReceivedStageUI.tsx`)**: When loans reach Stage 5 (`Term Sheet Received`), underwriters compare interest rates, term lengths, and deposit requirements side-by-side, marking specific bank offers as `'Accepted'` or `'In Review'`.

---

## 4. Moonstar Mortgage Portal Modules (`/mortgage/*`)

### 4.1 Residential Mortgage Application & Processing Module
- **Business Purpose**: Manages residential home purchase (`NEW_LOAN`) and pre-approval (`PRE_APPROVAL`) processing queues (`mortgage_loans`).
- **Key Tables**: `mortgage_loans`, `mortgage_stage_history`.
- **Core Features**:
  - **Cleansed Payload Ingestion**: Uses `sanitizePayloadForPostgres()` (`/api/mortgage/loans`) to ensure all borrower numeric estimates (`estimated_property_value`, `loan_amount`, `estimated_credit_score`) and date fields are strictly formatted before insertion.
  - **Officer & Processor Assignment**: Tracks both the front-end loan officer (`loan_officer_name`) and back-end document processor (`processor_name`).

---

## 5. System Administration Module (`/superadmin/*`)

- **Business Purpose**: Provides global system configuration, security auditing, and dynamic schema customization (`app/(dashboard)/superadmin/*`).
- **Key Tables**: `pipelines`, `pipeline_stages`, `form_templates`, `email_templates`, `system_settings`, `audit_logs`.
- **Core Features**:
  - **Dynamic Stage & Field Builder (`/superadmin/pipelines/[id]/stages`)**: Allows superadmins to add new stages, reorder sequence indices, and modify the `mandatory_fields` JSON array in real time without deploying code changes.
  - **Employee & Role Management (`/superadmin/users`)**: Manages the company directory, updating `profiles.role` and modifying `portal_access` arrays (`['insurance', 'lending', 'mortgage']`).
  - **System Audit Trails (`/superadmin/audit-logs`)**: Inspects immutable tracking logs across all high-privilege system mutations (`audit_logs`).
