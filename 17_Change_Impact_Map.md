# 17. Comprehensive Change Impact Matrix & Blast-Radius Prediction
**System Name:** Moonstar Enterprise Insurance, Mortgage & Commercial Lending CRM  

---

## 1. Change Impact Matrix Overview

When extending or refactoring a multi-portal monolith, seemingly localized changes can trigger cascading failures across isolated domains. This matrix maps the exact dependencies, affected files, and potential failure modes across five high-risk modification categories:

---

## 2. High-Risk Modification Scenarios & Blast-Radius Profiles

### Scenario 1: Modifying Pipeline Stages or Mandatory Requirements (`mandatory_fields`)
- **Action**: Adding a new mandatory requirement (`'carrier_declaration_attached'`) to Stage 3 (`Quoting`) inside `pipeline_stages.mandatory_fields` (`JSONB`).
- **Affected Components & UI Layer**:
  - `components/pipeline/UpdateStageModal.tsx`: Dynamically reads `mandatory_fields`. Will automatically render a new checkbox or text input requirement.
- **Affected API Layer**:
  - `app/api/update-stage/route.ts`: Will automatically block any CSR attempting to transition to Stage 3 if `stage_metadata.carrier_declaration_attached` is missing or false.
- **Affected Database Layer**: `pipeline_stages`, `temp_leads_basics.stage_metadata`.
- **Blast Radius**: **High (Underwriting Workflow)**. If the new field is not properly documented or if existing leads in Stage 2 lack the new data, CSRs will be locked out of moving leads forward until they manually populate the field.
- **Developer Verification Checklist**:
  - [ ] Verify that `UpdateStageModal.tsx` renders a clean UI control for the new mandatory field string.
  - [ ] Test `/api/update-stage` with missing fields to ensure `400 Bad Request` returns clear error text.
  - [ ] Ensure `stage_metadata` JSON schema accommodates the data type (boolean vs string vs number).

---

### Scenario 2: Adding or Modifying Intake Form Fields (`AutoInsuranceForm.tsx`)
- **Action**: Adding a new question ("Has the driver had any DUI violations in the past 5 years?") to the public auto insurance intake flow.
- **Affected Components & UI Layer**:
  - `components/forms/AutoInsuranceForm.tsx`: Needs new UI input controls and local validation logic (`handleChange`).
  - `components/ui/IntakeUI.tsx`: Passes updated `formData` up to the master intake container (`/intake/[id]`).
  - `components/leads/EditClientModal.tsx`: Must be updated so internal CSRs can view/edit the new DUI field.
- **Affected API Layer**: `/api/upload-document`, `/api/notify-submission`.
- **Affected Database Layer**: `temp_intake_forms.intake_data` (`JSONB`).
- **Blast Radius**: **Medium (Intake Ingestion & CSR Review)**. Because intake data is stored flexibly inside `intake_data` (`JSONB`), no SQL table migrations are required. However, if `EditClientModal.tsx` is not updated, CSRs will never see the client's answer to the new question.
- **Developer Verification Checklist**:
  - [ ] Update `AutoInsuranceForm.tsx` and verify local validation rules.
  - [ ] Update `EditClientModal.tsx` to render the new field when inspecting existing intake records.
  - [ ] Test public submission via `/intake/[id]` to confirm the field saves inside `temp_intake_forms.intake_data`.

---

### Scenario 3: Modifying User Roles or Multi-Portal Permissions (`profiles.role`, `portal_access`)
- **Action**: Adding a new enterprise department role (`'underwriting_manager'`) or changing how `portal_access` arrays are checked in `proxy.ts`.
- **Affected Security & Routing Layer**:
  - `proxy.ts`: Must update `accessMatrix` (`accessMatrix.underwriting_manager = ['/lending', '/csr']`) and adjust `portal_access` array checks.
  - `utils/auth.ts`: Must update `UserRole` type definition and check constraints across `authenticateApiRequest()`.
- **Affected Database Layer**:
  - `profiles.role`: Requires executing a database migration (`ALTER TABLE profiles DROP CONSTRAINT role_check; ADD CONSTRAINT ... CHECK (role IN (...))`).
  - **Row-Level Security (RLS) Policies**: **CRITICAL**. Every single RLS policy across `temp_leads_basics`, `accurate_lending_loans`, and `mortgage_loans` must be inspected and updated to explicitly allow the new role.
- **Blast Radius**: **CATASTROPHIC (System-Wide Security & Access)**. Omitting the new role from `proxy.ts` traps users in infinite redirect loops (`307`). Omitting the new role from PostgreSQL RLS policies causes all database queries to return empty arrays (`[]`), rendering dashboards blank (`500/403`).
- **Developer Verification Checklist**:
  - [ ] Write and run SQL migration updating `profiles.role` check constraint.
  - [ ] Update `UserRole` type and `accessMatrix` inside `proxy.ts` and `auth.ts`.
  - [ ] Audit and update RLS policies (`ENABLE ROW LEVEL SECURITY`) across all 20+ tables.

---

### Scenario 4: Modifying Email Templates or MS Graph Integration (`microsoftGraph.ts`)
- **Action**: Updating the Azure OAuth2 authentication scope or changing HTML merge tag formatting (`{{client_name}}`) inside `emailTemplating.ts`.
- **Affected API Layer**: `/api/send-email`, `/api/reminder-check`, `/api/notify-submission`.
- **Affected Components**: `EmailModal.tsx`, `EmailGenerator.tsx`.
- **Affected Database Layer**: `email_logs`, `email_templates`.
- **Blast Radius**: **High (Client Communication & SLAs)**. If `sendMailViaGraph()` fails due to OAuth2 token rejection or bad JSON formatting, all outbound client intake links and automated SLA follow-up reminders will silently fail, paralyzing client acquisition.
- **Developer Verification Checklist**:
  - [ ] Verify Azure Active Directory client credentials (`AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`) against the target tenant.
  - [ ] Test template merge tag replacement across edge cases (missing names, null quote amounts).
  - [ ] Verify that `email_logs` accurately records both `sent` status and `error_message` traces.

---

### Scenario 5: Extending Lending or Mortgage Workflows (`sanitizePayloadForPostgres`)
- **Action**: Adding a new financial metric (`'good_faith_deposit_amount'`) to `mortgage_loans` or `accurate_lending_loans`.
- **Affected API Layer**: `app/api/mortgage/loans/route.ts` (`sanitizePayloadForPostgres`), `/api/update-stage`.
- **Affected Database Layer**: `mortgage_loans`, `accurate_lending_loans`, `lending_stage_history`.
- **Blast Radius**: **High (Database Schema Integrity)**. If the new numeric column is added to PostgreSQL without updating `NUMERIC_FIELDS` inside `sanitizePayloadForPostgres()`, empty string inputs (`""`) from frontend forms will crash the API route (`22P02 invalid input syntax`).
- **Developer Verification Checklist**:
  - [ ] Execute SQL migration `ALTER TABLE mortgage_loans ADD COLUMN good_faith_deposit_amount NUMERIC;`.
  - [ ] Add `'good_faith_deposit_amount'` to the `NUMERIC_FIELDS` array inside `sanitizePayloadForPostgres()`.
  - [ ] Update `LoanFormModal.tsx` and `LoanDetailModal.tsx` to handle the new input.
