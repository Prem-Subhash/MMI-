# 16. Comprehensive CRM Business Flow & Lifecycle Documentation
**System Name:** Moonstar Enterprise Insurance, Mortgage & Commercial Lending CRM  

---

## 1. Enterprise Business Purpose

The **Moonstar CRM** is built to orchestrate three complex financial services sectors—**Property & Casualty Insurance**, **Commercial Real Estate Lending**, and **Residential Mortgages**—inside a unified operational ecosystem. It transforms chaotic manual tasks (spreadsheet lead tracking, unstructured email attachments, missed policy renewals, complex bank bidding) into deterministic, auditable workflows governed by strict Service Level Agreements (SLAs).

---

## 2. Property & Casualty Insurance Lifecycle (`Innovative Insurance`)

### Phase 1: Lead Ingestion & Categorization
- **Operational Trigger**: A prospective client calls the agency or fills out a basic web inquiry.
- **CRM Action**: The Customer Service Representative (CSR) accesses `/csr`, clicks "New Lead", and selects the appropriate pipeline: **Personal Lines** (Auto, Homeowners, Umbrella) or **Commercial Lines** (Worker's Comp, General Liability, Commercial Auto).
- **System State**: A record is created in `temp_leads_basics` with `stage_name = 'New Lead'` and `assigned_csr = auth.uid()`.

### Phase 2: Tokenized Client Intake & Document Capture
- **Operational Trigger**: The CSR needs detailed risk specifications (e.g., VIN numbers, square footage, prior declaration sheets) before requesting carrier quotes.
- **CRM Action**: The CSR opens `EmailModal.tsx`, selects the pre-built `Intake Form Template`, and dispatches it via `/api/send-email`.
- **System State**: The Azure MS Graph API dispatches a branded email containing an encrypted URL (`https://crm.com/intake/{lead_id}`). The system automatically sets `follow_up_date = NOW() + 48 hours` to establish SLA tracking.
- **Client Action**: The client clicks the link (`/intake/[id]`), completes the interactive questionnaire (`AutoInsuranceForm.tsx`), and uploads their prior declaration PDF. UPon submission, `/api/notify-submission` alerts the CSR immediately.

### Phase 3: Carrier Quoting & Underwriting Governance
- **Operational Trigger**: The CSR receives the intake data and logs into comparative rating engines (`EZLynx`).
- **CRM Action**: The CSR obtains rate quotes across multiple insurance carriers (e.g., Progressive, Travelers, Hartford) and attempts to move the lead to Stage 3 (`Quoting`).
- **System Governance**: The progression engine (`UpdateStageModal.tsx`) checks the `mandatory_fields` JSON schema. To advance, the CSR *must* check the confirmation box verifying that `EZLynx` has been updated and input the `quoted_premium` dollar amount.

### Phase 4: Policy Binding & Accounting Verification
- **Operational Trigger**: The client accepts the quote and authorizes payment.
- **CRM Action**: The CSR advances the lead to Stage 5 (`Bound/Completed`), entering the official `policy_number` and `total_premium`.
- **Accounting Handoff**: The policy drops into the Accounting queue (`/accounting/all-leads`). The financial officer verifies the bound premium against carrier commission statements (`/api/accounting/verify-policy`) and logs `expected_commission` for payroll calculation.

### Phase 5: X-Date Renewal & Zero-Lapse Automation
- **Operational Trigger**: 11 months after binding, the policy approaches its annual expiration (`renewal_date`).
- **CRM Action**: The `renewalHelper.ts` engine identifies the expiring policy and automatically spawns a renewal lead (`policy_flow = 'renewal'`) in the original CSR's queue, triggering automated client re-engagement before coverage lapses.

---

## 3. Commercial Real Estate & Business Lending Lifecycle (`Accurate Lending`)

### Phase 1: Application Ingestion & Partner Mapping
- **Operational Trigger**: A business entity requests financing for commercial property acquisition or working capital.
- **CRM Action**: The commercial loan officer logs into `/lending/dashboard`, creates a new application (`/lending/loans/new`), inputs the purchase price ($3,500,000), and registers co-borrowers inside the `partners` JSONB array.
- **System State**: A record is generated inside `accurate_lending_loans` starting at **Stage 1 (`New Loan`)** with a unique tracking code (`LOAN-2026-001`).

### Phase 2: Multi-Bank Syndication & Underwriting Shopping
- **Operational Trigger**: The application package is complete (`Stage 4`) and ready for lender submission.
- **CRM Action**: The loan officer accesses `SectionELenderInfo.tsx` to assign the loan across multiple participating banks (`Wells Fargo`, `Chase`, `Bank of America`), logging individual bank underwriters and loan officers (`lending_bank_assignments`).

### Phase 3: Term Sheet Comparative Review (`Stage 5`)
- **Operational Trigger**: Participating banks return initial term sheets.
- **CRM Action**: The loan officer advances to **Stage 5 (`Term Sheet Received`)** (`TermSheetReceivedStageUI.tsx`), uploading the bank PDFs (`lending_documents`) and comparing interest rates, amortization terms, and deposit requirements side-by-side. The borrower selects a winning bank, which is marked as `'Accepted'`.

### Phase 4: Appraisal, Accutax & Closing Checklists
- **Operational Trigger**: The loan enters formal underwriting toward closing.
- **CRM Action**: The application progresses through strict sequential checkpoints:
  - **Stage 8 (`Accutax Amount Req`)**: Verification of tax transcript fees (`accutax_amount_req`).
  - **Stage 12 (`Appraisal Ordered`)**: Tracking commercial property appraisal status.
  - **Stage 16 (`Clear to Close`)**: Final legal review and closing checklist verification.
  - **Stage 21 (`Check Received from Borrower`)**: Final confirmation of closing wire/check receipt (`check_wire_amount_received`), closing out the commercial loan lifecycle.

---

## 4. Residential Mortgage Processing Lifecycle (`Moonstar Mortgage`)

### Phase 1: Pre-Approval vs. New Loan Pipeline
- **Operational Trigger**: A homebuyer applies for pre-approval or submits a purchase purchase contract.
- **CRM Action**: The mortgage officer accesses `/mortgage/pipelines`, selecting `PRE_APPROVAL` or `NEW_LOAN` (`LoanFormModal.tsx`).
- **System Cleansing**: The backend (`/api/mortgage/loans`) executes `sanitizePayloadForPostgres()`, ensuring that estimates (`estimated_property_value`, `loan_amount`, `estimated_credit_score`) are cleanly stored in `mortgage_loans`.

### Phase 2: Processing & Document Verification
- **Operational Trigger**: The borrower submits W-2s, paystubs, and bank statements.
- **CRM Action**: The mortgage processor (`processor_name`) reviews uploaded files, tracks missing documentation (`missing_documents_list`), and updates the loan stage (`SUBMITTED_TO_LENDER`, `CONDITIONAL_APPROVAL`, `CLEAR_TO_CLOSE`). Every transition records an immutable row in `mortgage_stage_history`.
