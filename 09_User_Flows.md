# 09. Comprehensive User Flows & Journey Mapping
**System Name:** Moonstar Enterprise Insurance, Mortgage & Commercial Lending CRM  

---

## 1. Multi-Portal Authentication & Routing Flow

This flow illustrates how incoming login requests are processed, how sessions are verified via cookies (`@supabase/ssr`), and how users are routed across the three isolated domain portals (`Insurance`, `Lending`, `Mortgage`).

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Browser
    participant LoginPage as /login | /lending/login | /mortgage/login
    participant SupabaseAuth as Supabase Auth API
    participant Proxy as proxy.ts (Middleware)
    participant Postgres as profiles Table
    participant TargetPortal as Dashboard Portal

    User->>LoginPage: Enter Email & Password
    LoginPage->>SupabaseAuth: supabase.auth.signInWithPassword({ email, password })
    SupabaseAuth-->>Browser: Set HTTP-Only Cookies (sb-access-token, sb-refresh-token)
    Browser->>Proxy: HTTP GET / (or redirect target)
    Proxy->>SupabaseAuth: createServerClient.auth.getUser()
    SupabaseAuth-->>Proxy: Valid User Session (auth.uid)
    Proxy->>Postgres: SELECT role, portal_access FROM profiles WHERE id = auth.uid()
    Postgres-->>Proxy: { role: 'csr', portal_access: ['insurance'] }

    alt Email domain is @moonstar.com OR portal_access == ['mortgage']
        Proxy-->>Browser: 307 Redirect to /mortgage
    else portal_access contains 'lending' OR role in ('lending', 'accurate_lending')
        Proxy-->>Browser: 307 Redirect to /lending/dashboard
    else Role is Insurance ('csr', 'admin', 'superadmin', 'accounting')
        Proxy-->>Browser: 307 Redirect to /{profile.role} (/csr, /admin, etc.)
    end
    Browser->>TargetPortal: Render Dashboard (RSC Server Fetch)
```

---

## 2. CSR Lead Processing & Stage Transition Flow

This journey traces how a Customer Service Representative interacts with a lead card, validates required underwriting fields, and advances the lead through the insurance pipeline.

```mermaid
sequenceDiagram
    autonumber
    actor CSR as Customer Service Rep
    participant UI as /csr/pipeline (RSC + Client Components)
    participant Modal as UpdateStageModal.tsx
    participant API as /api/update-stage
    participant Postgres as PostgreSQL DB

    CSR->>UI: Click on Lead Card
    UI->>Modal: Open Modal (Pass lead & currentStage)
    Modal->>Postgres: SELECT mandatory_fields FROM pipeline_stages WHERE id = targetStageId
    Postgres-->>Modal: mandatory_fields: ["client_email", "quoted_premium", "ezlynx_updated"]
    
    CSR->>Modal: Enter quoted_premium ($1,450) & Check ezlynx_updated
    CSR->>Modal: Click "Update Stage"
    
    Modal->>Modal: Client-Side Validation against mandatory_fields array
    alt Local Validation Fails (e.g. ezlynx_updated unchecked)
        Modal-->>CSR: Show Warning Banner ("Please complete required fields")
    else Local Validation Passes
        Modal->>API: POST /api/update-stage { lead_id, target_stage_id, stage_metadata, remarks }
        API->>Postgres: Re-verify mandatory_fields server-side against temp_leads_basics + metadata
        alt Server Validation Passes
            API->>Postgres: UPDATE temp_leads_basics SET stage_id = target, updated_at = NOW()
            API->>Postgres: INSERT INTO lead_stage_history (lead_id, previous_stage, new_stage, remarks)
            Postgres-->>API: Success Confirmation
            API-->>Modal: { success: true }
            Modal->>UI: router.refresh() + showToast("Stage updated successfully")
            UI-->>CSR: Rehydrate UI showing Lead inside new Stage Column
        else Server Validation Fails
            API-->>Modal: 400 Bad Request { error: "Missing mandatory fields" }
            Modal-->>CSR: Toast Error Notification
        end
    end
```

---

## 3. Unauthenticated Client Intake & Document Upload Flow

This critical workflow illustrates how external customers securely submit personal insurance data and upload prior policy declaration pages via tokenized web links without requiring an account.

```mermaid
sequenceDiagram
    autonumber
    actor CSR as Customer Service Rep
    actor Client as External Client (Unauthenticated)
    participant EmailModal as EmailModal.tsx
    participant SendEmailAPI as /api/send-email
    participant Graph as Azure MS Graph API
    participant IntakePortal as /intake/[id]/page.tsx (IntakeUI.tsx)
    participant UploadAPI as /api/upload-document
    participant Storage as Supabase Storage ('documents' bucket)
    participant NotifyAPI as /api/notify-submission
    participant Postgres as PostgreSQL DB

    CSR->>EmailModal: Select "Intake Form Template" & Click Send
    EmailModal->>SendEmailAPI: POST /api/send-email { lead_id, to_email, template_id }
    SendEmailAPI->>Graph: sendMailViaGraph(HTML body with https://crm.com/intake/{lead_id})
    SendEmailAPI->>Postgres: UPDATE temp_leads_basics SET follow_up_date = NOW() + INTERVAL '48 hours'
    Graph-->>Client: Deliver Email to Client Inbox (`client@example.com`)

    Client->>IntakePortal: Click Tokenized URL (/intake/{lead_id})
    IntakePortal->>Postgres: SELECT * FROM temp_intake_forms WHERE lead_id = id
    Postgres-->>IntakePortal: Render Form Tabs (Auto, Home, Vehicles)

    Client->>IntakePortal: Fill Auto & Home Form Fields (`AutoInsuranceForm.tsx`)
    Client->>IntakePortal: Select Declaration Page PDF & Drop in DocumentViewer
    IntakePortal->>UploadAPI: POST multipart/form-data /api/upload-document { file, lead_id, type }
    UploadAPI->>Storage: Upload to bucket `documents/{lead_id}/filename.pdf`
    UploadAPI->>Postgres: INSERT INTO documents (lead_id, file_path, document_type)
    UploadAPI-->>IntakePortal: { success: true, document: { id, file_path } }

    Client->>IntakePortal: Click "Submit Final Intake"
    IntakePortal->>Postgres: UPDATE temp_intake_forms SET status = 'Completed', intake_data = {...}
    IntakePortal->>NotifyAPI: POST /api/notify-submission { lead_id }
    NotifyAPI->>Graph: Send Alert Email to Assigned CSR ("Client completed intake!")
    IntakePortal-->>Client: Show Success Confirmation Screen
```

---

## 4. Automated SLA Follow-Up & Reminder Flow

This background operational flow demonstrates how hourly serverless cron jobs enforce SLA limits and re-engage non-responsive clients automatically.

```mermaid
sequenceDiagram
    autonumber
    actor Cron as Vercel Cron / External Scheduler
    participant ReminderAPI as /api/reminder-check (GET)
    participant Postgres as PostgreSQL DB
    participant Graph as Azure MS Graph API
    actor Client as Client Inbox

    Cron->>ReminderAPI: GET /api/reminder-check (Header: Authorization Bearer CRON_SECRET)
    ReminderAPI->>ReminderAPI: Verify Bearer Token matches process.env.CRON_SECRET
    ReminderAPI->>Postgres: SELECT * FROM temp_leads_basics WHERE follow_up_date <= NOW() AND reminder_sent = false AND stage_name = 'Quote Has been Emailed'
    Postgres-->>ReminderAPI: Return Array of Stale Leads ([Lead A, Lead B])

    loop For Each Stale Lead
        ReminderAPI->>Graph: sendMailViaGraph({ to: lead.email, subject: "Friendly Reminder: Your Moonstar Quote is Waiting!" })
        Graph-->>Client: Deliver Automated Follow-up Email
        ReminderAPI->>Postgres: UPDATE temp_leads_basics SET reminder_sent = true, last_reminder_at = NOW() WHERE id = lead.id
    end
    ReminderAPI-->>Cron: HTTP 200 OK { success: true, reminders_processed: 2 }
```

---

## 5. Accurate Lending 21-Stage Commercial Loan & Term Sheet Flow

This comprehensive flow tracks a commercial real estate application through multi-bank underwriting (`SectionELenderInfo.tsx`) and term sheet review (`TermSheetReceivedStageUI.tsx`).

```mermaid
sequenceDiagram
    autonumber
    actor LO as Commercial Loan Officer
    actor UW as Underwriter
    participant NewLoanUI as /lending/loans/new
    participant LoanDetailUI as /lending/loans/[id]
    participant SectionE as SectionELenderInfo.tsx
    participant Stage5UI as TermSheetReceivedStageUI.tsx
    participant Postgres as PostgreSQL DB
    participant Storage as Supabase Storage ('lending-documents')

    LO->>NewLoanUI: Enter Borrower Name, Purchase Price ($2.5M), and Partners JSONB
    NewLoanUI->>Postgres: INSERT INTO accurate_lending_loans (borrower_name, purchase_price, stage = 1)
    Postgres-->>NewLoanUI: Return Loan ID (`LOAN-2026-001`)

    LO->>LoanDetailUI: Open Loan details & navigate to Section E Tab
    LO->>SectionE: Add Participating Banks ("Wells Fargo", "Chase") with Underwriter contacts
    SectionE->>Postgres: INSERT INTO lending_bank_assignments (loan_id, lender_bank, bank_underwriter_name)

    Note over LO, Postgres: Loan progresses through Stages 2, 3, 4 to Stage 5: Term Sheet Received

    UW->>LoanDetailUI: Open Stage 5 Review Screen (`TermSheetReceivedStageUI.tsx`)
    UW->>Stage5UI: Upload Bank Term Sheet PDFs for Wells Fargo & Chase
    Stage5UI->>Storage: Upload to `lending-documents/{loan_id}/wells_fargo_terms.pdf`
    Stage5UI->>Postgres: INSERT INTO lending_documents (loan_id, bank_name, status = 'Received')
    
    UW->>Stage5UI: Compare rates (Wells: 6.25%, Chase: 6.50%) & Mark Wells Fargo as 'Accepted'
    Stage5UI->>Postgres: UPDATE lending_bank_assignments SET status = 'Accepted' WHERE lender_bank = 'Wells Fargo'
    Stage5UI->>Postgres: UPDATE accurate_lending_loans SET stage = 6 (Term Sheet Accepted)
```

---

## 6. Moonstar Mortgage Borrower Application Flow

This journey highlights the residential mortgage application lifecycle and strict payload cleansing (`sanitizePayloadForPostgres()`).

```mermaid
sequenceDiagram
    autonumber
    actor MO as Mortgage Officer
    participant PipelineUI as /mortgage/pipelines
    participant FormModal as LoanFormModal.tsx
    participant MortgageAPI as POST /api/mortgage/loans
    participant Postgres as PostgreSQL DB

    MO->>PipelineUI: Click "New Mortgage Application"
    PipelineUI->>FormModal: Open Modal
    MO->>FormModal: Input Client Name, Loan Type ('CONVENTIONAL'), Estimated Property Value ($650,000), Inquiry Date
    MO->>FormModal: Submit Form
    
    FormModal->>MortgageAPI: POST JSON payload to /api/mortgage/loans
    MortgageAPI->>MortgageAPI: Execute sanitizePayloadForPostgres(payload)
    Note over MortgageAPI: Converts empty strings "" to null for target_closing_date & numeric fields
    
    MortgageAPI->>Postgres: INSERT INTO mortgage_loans (client_name, loan_type, estimated_property_value, stage = 'NEW_LOAN')
    MortgageAPI->>Postgres: INSERT INTO mortgage_stage_history (loan_id, current_stage = 'NEW_LOAN', updated_by = MO.name)
    Postgres-->>MortgageAPI: Return Created Mortgage Record
    MortgageAPI-->>FormModal: { success: true, loan: {...} }
    FormModal->>PipelineUI: router.refresh() + Close Modal
```

---

## 7. Admin/Superadmin Analytics Reporting & Export Flow

This administrative flow demonstrates how managers generate multi-sheet Excel workbooks (`exceljs`) using sub-second RPC aggregations.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Team Lead / Superadmin
    participant ReportsUI as /admin/reports
    participant ReportsAPI as GET /api/reports/monthly
    participant Postgres as PostgreSQL DB (RPC: get_report_summary)
    participant Excel Engine as ExcelJS / Buffer

    Admin->>ReportsUI: Select Date Range (01/01/2026 - 01/31/2026), Flow ('new'), Format ('excel')
    ReportsUI->>ReportsAPI: GET /api/reports/monthly?start_date=2026-01-01&end_date=2026-01-31&format=excel
    ReportsAPI->>Postgres: supabaseServer.rpc('get_report_summary', { p_start_date, p_end_date, p_flow })
    Postgres-->>ReportsAPI: Return JSON Aggregates & Raw Policy Rows
    
    ReportsAPI->>Excel Engine: Initialize new ExcelJS.Workbook() & add 'KPI Summary' and 'Policy Dumps' sheets
    Excel Engine->>Excel Engine: Apply custom column widths, currency styling (`$#,##0.00`), and bold headers
    Excel Engine-->>ReportsAPI: Generate Binary `.xlsx` Buffer
    ReportsAPI-->>ReportsUI: Stream response (`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
    ReportsUI-->>Admin: Browser triggers file download (`Moonstar_Monthly_Report_2026-01.xlsx`)
```
