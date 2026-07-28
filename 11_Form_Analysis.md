# 11. Exhaustive Form Analysis & Data Validation Audit
**System Name:** Moonstar Enterprise Insurance, Mortgage & Commercial Lending CRM  

---

## 1. Form Layer Architecture & Validation Philosophy

The CRM handles high-stakes financial, underwriting, and personal identification data across its three portals. To prevent bad data insertion (`22P02 invalid input syntax` PostgreSQL errors) and ensure regulatory compliance, forms enforce a **three-tier validation structure**:
1. **HTML5 & React Client-Side Validation**: Instant feedback during field typing (regex formatting, required indicators).
2. **Dynamic JSONB Metadata Validation**: Runtime checking of mandatory stage requirements before pipeline transitions (`mandatory_fields`).
3. **Backend API Cleansing & Sanitization**: Strict data transformation (`sanitizePayloadForPostgres()`, Zod parsing) inside API route handlers before executing database insertions.

---

## 2. Insurance Line-of-Business Intake Forms (`components/forms/`)

### 2.1 `AutoInsuranceForm.tsx` & `VehicleListForm.tsx`
- **Business Purpose**: Captures comprehensive automobile risk data during both public client intake (`/intake/[id]`) and internal CSR editing (`EditClientModal.tsx`).
- **Key Fields**:
  - Driver details: License numbers, dates of birth, marital status, defensive driving discounts.
  - Vehicle specifications: VIN (`17-character validation`), make, model, year, annual mileage, primary use (`Commute`, `Pleasure`, `Business`).
  - Coverage selections: Bodily injury limits (`$100k/$300k`), property damage, comprehensive/collision deductibles (`$500`, `$1000`), roadside assistance.
- **Validation Rules**:
  - Enforces strict 17-alphanumeric character length on VIN inputs (`/^[A-HJ-NPR-Z0-9]{17}$/i`).
  - Requires at least one primary vehicle and primary driver before allowing submission.
- **Submission Target**: Propagates data up to `IntakeUI.tsx`, which POSTs to `/api/upload-document` (if files attached) and commits the structure to `temp_intake_forms.intake_data` (`JSONB`).

### 2.2 `HomeInsuranceForm.tsx`
- **Business Purpose**: Captures residential property risk specifications for homeowner hazard policies.
- **Key Fields**: Property address, square footage, year built, roof construction material (`Asphalt Shingle`, `Tile`, `Metal`), plumbing/wiring updates (`copper vs. polybutylene`), security systems, and liability limits.
- **Validation Rules**: Numeric fields (`square footage`, `year built`) reject non-digit input.

### 2.3 `PrimaryApplicantForm.tsx`, `CoApplicantForm.tsx`, `AdditionalApplicantsForm.tsx`
- **Business Purpose**: Standardized demographic ingestion forms capturing SSNs (encrypted/masked), phone numbers, email addresses, and employment histories across personal lines.

---

## 3. Pipeline Progression & Underwriting Forms

### 3.1 Stage Progression Form (`components/pipeline/UpdateStageModal.tsx`)
- **Business Purpose**: Governs underwriting governance when moving leads between stages.
- **Dynamic Field Generation**: Instead of hardcoding input boxes, the modal reads the target stage's `mandatory_fields` (`JSONB` array) from `pipeline_stages` and dynamically renders inputs:
  - If `mandatory_fields` includes `'quoted_premium'`, renders a numeric input: `Quoted Premium ($)`.
  - If `mandatory_fields` includes `'ezlynx_updated'`, renders a mandatory boolean checkbox: `[ ] I confirm EZLynx has been updated with carrier rates`.
  - If `mandatory_fields` includes `'policy_number'`, renders a text input box.
- **Client & Server Validation Loop**:
  ```tsx
  // Local check prior to API call
  const missing = mandatoryFields.filter(field => {
    const val = stageMetadata[field] || lead[field];
    return val === undefined || val === null || val === '' || val === false;
  });
  if (missing.length > 0) {
    showToast(`Missing required fields: ${missing.join(', ')}`, 'error');
    return;
  }
  ```
- **Submission Target**: POST to `/api/update-stage`.

---

## 4. Accurate Lending Commercial Underwriting Forms (`components/lending/`)

### 4.1 Multi-Bank Syndication Form (`SectionELenderInfo.tsx`)
- **Business Purpose**: Captures underwriting contact structures for commercial loans shopped across multiple banks (`lending_bank_assignments`).
- **Key Fields**:
  - `lender_bank` (Dropdown/Custom input: `'Wells Fargo'`, `'Chase'`, `'Bank of America'`).
  - `bank_officer_name`, `bank_officer_phone`, `bank_officer_email`.
  - `bank_underwriter_name`, `bank_underwriter_email`.
  - `title_agency_name`, `bank_closing_agent_name`.
- **Submission Target**: Direct mutations on `lending_bank_assignments` or `/api/lending/update-bank-assignments`.

---

## 5. Moonstar Mortgage Loan Application Form (`app/mortgage/components/LoanFormModal.tsx`)

### 5.1 `LoanFormModal.tsx` & Data Cleansing Engine
- **Business Purpose**: Ingests new residential mortgage loan applications (`mortgage_loans`).
- **Key Fields**: `pipeline_type` (`'NEW_LOAN'` | `'PRE_APPROVAL'`), `client_name`, `phone`, `email`, `loan_type` (`'CONVENTIONAL'`, `'FHA'`, `'VA'`), `transaction_type` (`'PURCHASE'`, `'REFINANCE'`), `estimated_property_value`, `loan_amount`, `interest_rate`, `target_closing_date`.
- **Data Cleansing & Sanitization (`sanitizePayloadForPostgres`)**:
  When the client submits the form to `/api/mortgage/loans`, the server executes the `sanitizePayloadForPostgres` utility before querying Supabase:
  ```typescript
  function sanitizePayloadForPostgres(payload: Record<string, any>): Record<string, any> {
    const DATE_FIELDS = ['application_received_date', 'inquiry_date', 'target_closing_date', 'lock_expire_date'];
    const NUMERIC_FIELDS = ['estimated_property_value', 'estimated_credit_score', 'loan_amount', 'interest_rate'];
    const cleaned = { ...payload };

    for (const key of Object.keys(cleaned)) {
      const val = cleaned[key];
      if (typeof val === 'string' && val.trim() === '') cleaned[key] = null;
      if (DATE_FIELDS.includes(key) && (!val || val.trim() === '')) cleaned[key] = null;
      if (NUMERIC_FIELDS.includes(key)) {
        if (val === '' || val === null || val === undefined || isNaN(Number(val))) {
          cleaned[key] = null;
        } else {
          cleaned[key] = Number(val);
        }
      }
    }
    return cleaned;
  }
  ```
- **Why This Is Critical**: Without this sanitization, if a mortgage officer leaves optional fields like `target_closing_date` or `interest_rate` blank, HTML forms transmit empty strings (`""`). Attempting to insert `""` into a PostgreSQL `DATE` or `NUMERIC` column triggers a fatal schema exception (`22P02`). `sanitizePayloadForPostgres` converts them cleanly to `null`, ensuring bulletproof reliability.

---

## 6. Email Communication Form (`components/email/EmailModal.tsx`)

- **Business Purpose**: Allows CSRs to compose and send emails via MS Graph.
- **Key Fields**: `selectedTemplateId` (`email_templates` lookup), `to_email` (pre-populated from `lead.email`), `subject`, and `body` (Rich text / HTML text area).
- **Validation**: Enforces valid email regex on `to_email` and prevents submission if `subject` or `body` are empty.
