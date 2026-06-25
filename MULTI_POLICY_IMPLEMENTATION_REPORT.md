# Multi-Policy Implementation Report

## Overview
This report summarizes the frontend and logic refactoring completed to support the **Multi-Policy Lead Capability** (One Lead → Multiple Policies → One Intake Experience). The implementation strictly adheres to the requested boundaries: no architecture redesigns, no database schema mutations, no removal of legacy `policy_type` fields, and email/reporting modules were left completely untouched.

## Phase 1: Lead Creation
**Objective:** Replace single-policy dropdowns with multi-select controls and prepare payloads for the `lead_policies` table.

**Files Modified:**
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`

**Implementation Details:**
- Replaced `<Select name="policy_type" />` with a custom clickable Grid of policy cards.
- Introduced `selectedPolicies: string[]` into local component state.
- **Legacy Fallback:** Set the `temp_leads_basics.policy_type` insert payload to `selectedPolicies[0]`.
- **Payload Preparation:** Generated the `lead_policies` array payload and logged it to the console with explicit `/* TODO: Backend Integration */` markers for future DB insertion.
- **Validation:** Updated `checkDuplicateActiveLead` to evaluate against the entire `selectedPolicies` array.

## Phase 2: Lead Display
**Objective:** Render an aggregated list of all attached policies across Lead Detail pages and Pipeline views.

**Files Modified:**
- `utils/formatPolicies.ts` (NEW)
- `app/(dashboard)/csr/leads/[id]/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/page.tsx`
- `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- `app/(dashboard)/csr/leads/page.tsx`
- `app/(dashboard)/admin/leads/page.tsx`

**Implementation Details:**
- Created `formatPolicies()` helper to cleanly join arrays of policy strings.
- Modified the Supabase `.select()` queries across all pipeline and lead detail pages to explicitly fetch `lead_policies(policy_type)`.
- Updated UI components (Cards, KPI Badges) to prioritize `lead_policies` if populated, falling back gracefully to the legacy `temp_leads_basics.policy_type` string.

## Phase 3 & 4: Intake Form System & Validation
**Objective:** Dynamically composite intake forms based on multiple requested policies and enforce holistic validation.

**Files Modified:**
- `app/intake/[id]/page.tsx`

**Implementation Details:**
- Decoupled rendering logic from the rigid 1:1 `form_type` string.
- Modified `loadIntake()` to fetch `lead_policies` natively based on the `lead_id` attached to the `temp_intake_forms` record.
- Implemented `resolvedLayouts` using a `Set<string>` to deduplicate form rendering (e.g., rendering `HomeInsuranceForm` and `AutoInsuranceForm` stacked dynamically without duplicating primary applicant data).
- **Validation:** Refactored `handleSubmit` to iterate over all `activePolicies` and assert that the `formData` object contains valid entries for every requested section before allowing submission.

## Phase 5: Pipeline and Review Pages
*(Completed alongside Phase 2 modifications to pipeline list views and lead detail modals).*

## Phase 6: Form Templates
**Objective:** Support multi-policy schema definitions.

**Files Reviewed:**
- `app/(dashboard)/superadmin/forms/FormTemplatesClient.tsx`
*(Note: As the backend schema for `form_templates` currently lacks a strict policy mapping column and relies on JSON payloads, the core UI was verified to support flexible JSON compositions capable of spanning multiple policy architectures).*

---

## ⚠️ Backend Work Remaining (Next Steps)

This implementation successfully prepared the frontend interfaces. To finalize the feature, the following backend/database work must be executed in a separate phase:

1. **Insert into `lead_policies`:** 
   Locate the `/* TODO: Backend Integration */` tags inside the `handleCreateClient` functions of the 3 Lead Creation pages. Add the explicit Supabase insert command to write the prepared `selectedPolicies` payload into the `lead_policies` table.
   
2. **PostgreSQL RPCs (Reporting):** 
   Update `get_report_summary` to aggregate metrics using `lead_policies` rather than strict string matching on `temp_leads_basics.policy_type`.

3. **Email Routing:** 
   Update `lib/microsoftGraph.ts` and `app/api/send-email/route.ts` to map multi-policy leads to the correct compound email templates.

4. **Update Stage Validations:** 
   Update `app/api/update-stage/route.ts` to evaluate `mandatory_fields` across all attached policies rather than a single policy.
