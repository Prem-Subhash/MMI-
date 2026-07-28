# 06. Exhaustive Database Schema & Storage Analysis
**System Name:** Moonstar Enterprise Insurance, Mortgage & Commercial Lending CRM  
**Engine:** Supabase hosted PostgreSQL 14+  

---

## 1. Complete Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    auth_users ||--|| profiles : "1:1 extension (id)"
    profiles ||--o{ temp_leads_basics : "assigned_csr / manager_id"
    profiles ||--o{ accurate_lending_loans : "assigned_lending_officer"
    profiles ||--o{ mortgage_loans : "assigned_mortgage_officer"
    profiles ||--o{ lending_documents : "uploaded_by"
    profiles ||--o{ audit_logs : "user_id"

    pipelines ||--o{ pipeline_stages : "pipeline_id (1:N)"
    pipelines ||--o{ temp_leads_basics : "pipeline_id (1:N)"
    pipeline_stages ||--o{ temp_leads_basics : "stage_id (1:N)"

    temp_leads_basics ||--o{ temp_intake_forms : "lead_id (1:N)"
    temp_leads_basics ||--o{ documents : "lead_id (1:N)"
    temp_leads_basics ||--o{ email_logs : "lead_id (1:N)"
    email_templates ||--o{ email_logs : "template_id (1:N)"

    accurate_lending_loans ||--o{ lending_bank_assignments : "loan_id (1:N CASCADE)"
    accurate_lending_loans ||--o{ lending_documents : "loan_id (1:N CASCADE)"
    accurate_lending_loans ||--o{ lending_stage_history : "loan_id (1:N CASCADE)"

    mortgage_loans ||--o{ mortgage_stage_history : "loan_id (1:N CASCADE)"

    profiles {
        uuid id PK "FK to auth.users"
        text email
        text full_name
        text role "CHECK ('csr','admin','superadmin','accounting','lending','accurate_lending','mortgage')"
        text[] portal_access "ARRAY['insurance', 'lending', 'mortgage']"
        uuid manager_id FK
        timestamptz created_at
    }

    pipelines {
        uuid id PK
        text name "UNIQUE ('Personal Lines', 'Commercial Lines', 'Accurate Commercial Lending')"
        text category "CHECK ('Personal Lines', 'Commercial Lines', 'Lending', 'Mortgage')"
        boolean is_renewal
        text description
    }

    pipeline_stages {
        uuid id PK
        uuid pipeline_id FK
        text stage_name
        int stage_order
        jsonb mandatory_fields 'ARRAY["client_email", "quoted_premium"]'
    }

    temp_leads_basics {
        uuid id PK
        uuid pipeline_id FK
        uuid stage_id FK
        text stage_name
        text insurence_category "'personal' | 'commercial'"
        text policy_flow "'new' | 'renewal'"
        uuid assigned_csr FK
        date effective_date "GENERATED ALWAYS AS (COALESCE(renewal_date, created_at::date))"
        date renewal_date
        timestamp follow_up_date
        boolean reminder_sent
        numeric total_premium
        numeric bound_premium
        numeric expected_commission
        jsonb stage_metadata '{"quoted_premium": 1450, "ezlynx_updated": true}'
    }

    accurate_lending_loans {
        uuid id PK
        text loan_id_code "UNIQUE"
        int stage "CHECK (1..21)"
        text stage_name
        text borrower_name
        numeric purchase_price
        numeric internal_amount_rec
        jsonb partners
        uuid assigned_lending_officer FK
    }

    lending_bank_assignments {
        uuid id PK
        uuid loan_id FK
        text lender_bank
        text bank_officer_name
        text bank_underwriter_name
        boolean is_custom_bank
        int display_order
    }

    lending_documents {
        uuid id PK
        uuid loan_id FK
        text bank_name
        text file_name
        text file_path
        text status "CHECK ('Received', 'In Review', 'Accepted')"
    }

    mortgage_loans {
        uuid id PK
        text pipeline_type "'NEW_LOAN' | 'PRE_APPROVAL'"
        text stage
        text client_name
        numeric loan_amount
        numeric interest_rate
        uuid assigned_mortgage_officer FK
    }
```

---

## 2. Table-by-Table Technical Breakdown

### 2.1 Core Identity & Access Control Tables

#### `profiles`
- **Purpose**: Extends `auth.users` (`id = auth.uid()`) to store roles, team hierarchies, and multi-portal access allowances.
- **Key Columns**:
  - `id (UUID, PK)`: Foreign key referencing `auth.users(id) ON DELETE CASCADE`.
  - `role (TEXT)`: Enforced via check constraint `role IN ('csr', 'admin', 'superadmin', 'accounting', 'lending', 'accurate_lending', 'mortgage')`.
  - `portal_access (TEXT[])`: GIN-indexed array defining accessible portals (`ARRAY['insurance', 'lending']`).
  - `manager_id (UUID, FK)`: Self-referencing link (`profiles.id`) establishing hierarchy for team filtering.
- **Application Usage**: Read by `proxy.ts` on every request to authorize navigation; read/written by `/api/superadmin/users` during employee onboarding.

---

### 2.2 Insurance Pipeline & Lead Tables

#### `pipelines` & `pipeline_stages`
- **Purpose**: Houses the definitions of workflow pipelines and their sequentially ordered stages.
- **Key Columns (`pipeline_stages`)**:
  - `pipeline_id (UUID, FK)`: Refers to `pipelines(id) ON DELETE CASCADE`.
  - `stage_order (INT)`: Numeric sequence sorting (`1`, `2`, `3`...).
  - `mandatory_fields (JSONB)`: Stored array of string keys (`['client_email', 'ezlynx_updated', 'quoted_premium']`) evaluated dynamically by `/api/update-stage` before allowing progression.

#### `temp_leads_basics` (Master Insurance Lead Repository)
- **Purpose**: Stores all insurance leads across Personal Lines, Commercial Lines, and Renewals.
- **Key Columns & Schema Features**:
  - `insurence_category (TEXT)`: Discriminator column (`'personal'` vs `'commercial'`).
  - `policy_flow (TEXT)`: Discriminator column (`'new'` vs `'renewal'`).
  - `effective_date (DATE)`: Computed generated column: `GENERATED ALWAYS AS (COALESCE(renewal_date, created_at::date)) STORED`.
  - `follow_up_date (TIMESTAMP)` & `reminder_sent (BOOLEAN)`: SLA tracking fields monitored by `/api/reminder-check` cron jobs.
  - `stage_metadata (JSONB)`: Flexible document store holding custom fields submitted during quoting (`{"carrier_name": "Progressive", "autopay_enabled": true}`).
- **Indexes**:
  - `idx_leads_effective_date (effective_date)`
  - `idx_leads_assigned_csr (assigned_csr)`
  - `idx_leads_reporting_composite (effective_date, policy_flow, insurence_category)` (Essential for sub-second monthly KPI aggregations).

---

### 2.3 Accurate Lending Commercial Real Estate Tables

#### `accurate_lending_loans`
- **Purpose**: Master table for commercial real estate and business lending applications spanning 21 stages.
- **Key Columns**:
  - `stage (INT)`: Check constraint `stage >= 1 AND stage <= 21`.
  - `loan_id_code (TEXT, UNIQUE)`: Human-readable identifier (`'LOAN-2026-001'`).
  - `accutax_amount_req`, `accurate_lending_amount_req`, `bank_amount_req`, `bank_amount_rec (NUMERIC)`: Financial tracking metrics corresponding to Stages 8, 9, and 10.
  - `partners (JSONB)`: Array of co-borrowers and business partners (`[{"name": "Partner A", "share": 50}]`).

#### `lending_bank_assignments`
- **Purpose**: Supports Stage 5+ where a single commercial loan is shopped across multiple lender banks simultaneously.
- **Key Columns**:
  - `loan_id (UUID, FK)`: Refers to `accurate_lending_loans(id) ON DELETE CASCADE`.
  - `lender_bank (TEXT)`: Name of participating bank (`'Wells Fargo'`, `'Chase'`).
  - `bank_officer_name`, `bank_underwriter_name`, `title_agency_name`, `bank_closing_agent_name (TEXT)`: Granular underwriting contact tracking.

#### `lending_documents` & `lending_stage_history`
- **Purpose**: Stores bank-specific term sheets/closing checklists (`lending_documents`) and immutable audit trails of stage transitions (`lending_stage_history`).

---

### 2.4 Moonstar Mortgage Tables

#### `mortgage_loans` & `mortgage_stage_history`
- **Purpose**: Stores residential mortgage loan applications across `'NEW_LOAN'` and `'PRE_APPROVAL'` pipelines.
- **Key Columns (`mortgage_loans`)**:
  - `pipeline_type (TEXT)`: `'NEW_LOAN'` or `'PRE_APPROVAL'`.
  - `stage (TEXT)`: Mortgage stage codes (`'NEW_LOAN'`, `'PREAPPROVAL_LOAN'`, `'SUBMITTED_TO_LENDER'`).
  - `estimated_property_value`, `loan_amount`, `interest_rate`, `final_loan_amount (NUMERIC)`: Cleansed strictly by `sanitizePayloadForPostgres()`.

---

### 2.5 System Audit, Logs, and Communication Tables

#### `email_logs`, `email_templates`, `form_templates`, `system_settings`, `audit_logs`
- **Purpose**: Infrastructure tables providing email auditability (`email_logs` tracking MS Graph delivery receipts), dynamic email/form template definitions (`JSONB fields`), global key-value configuration (`system_settings`), and security action tracking (`audit_logs`).

---

## 3. Storage Buckets & File Rules

The database integrates directly with Supabase Storage, maintaining two isolated private storage buckets:

| Bucket ID | Public? | Max File Size | Allowed MIME Types | Primary Consumers |
| :--- | :--- | :--- | :--- | :--- |
| **`documents`** | `false` | 10 MB (`10485760`) | `application/pdf`<br>`image/jpeg`<br>`image/png`<br>`image/webp` | Insurance CSRs (`/csr`) and Unauthenticated Clients (`/intake/[id]`) uploading prior declaration pages and driver licenses. |
| **`lending-documents`** | `false` | 25 MB (`26214400`) | `application/pdf`<br>`image/jpeg`<br>`image/png`<br>`application/msword`<br>`application/vnd.openxmlformats-officedocument.*` | Commercial Lending Officers and Underwriters (`/lending/*`) attaching bank term sheets, tax returns, and closing checklists. |

---

## 4. Stored Procedures (`RPC`), Triggers & Functions

### 4.1 `get_report_summary` (`RPC`)
- **Location**: `migrations/20260301_reports_rpc.sql`
- **Purpose**: Executes high-speed, server-side aggregations over `temp_leads_basics` to return KPI counts and total premiums for monthly reports (`/api/reports/monthly`), avoiding massive network data transfers to Node.js.
- **SQL Signature**:
  ```sql
  FUNCTION get_report_summary(
    p_start_date DATE, p_end_date DATE, p_date_type TEXT,
    p_flow TEXT, p_category TEXT, p_csr UUID
  ) RETURNS JSONB SECURITY INVOKER;
  ```

### 4.2 Triggers (`handle_new_user` & `handle_lending_updated_at`)
- **`handle_new_user()`**: Fires `AFTER INSERT ON auth.users`. Automatically inserts a default profile row (`role = 'agent'`, `portal_access = ARRAY['insurance']`) into `profiles` when a new account is registered.
- **`handle_lending_updated_at()`**: Fires `BEFORE UPDATE ON accurate_lending_loans` and `lending_bank_assignments`. Automatically updates `updated_at = NOW()`.

---

## 5. Row-Level Security (RLS) Policy Architecture

All 20+ tables strictly enforce Row-Level Security (`ENABLE ROW LEVEL SECURITY`). RLS policies act as the ultimate defensive perimeter:

### 5.1 `temp_leads_basics` RLS Policies
- **`Admins and Superadmins view all leads`**:
  ```sql
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );
  ```
- **`Managers view team leads`**:
  ```sql
  FOR SELECT USING (
    assigned_csr = auth.uid() OR
    assigned_csr IN (SELECT id FROM profiles WHERE manager_id = auth.uid())
  );
  ```
- **`Agents view own leads`**:
  ```sql
  FOR SELECT USING (assigned_csr = auth.uid());
  ```

### 5.2 `accurate_lending_loans` RLS Policies
- **`Lending view/modify accurate_lending_loans`**:
  ```sql
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (
        role IN ('superadmin', 'admin', 'lending', 'accurate_lending') 
        OR 'lending' = ANY(portal_access) 
        OR 'accurate_lending' = ANY(portal_access)
      )
    )
  );
  ```
