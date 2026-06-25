# MULTI_POLICY_INTAKE_WORKFLOW_AUDIT

This audit traces the complete data lifecycle of a Multi-Policy lead, from the Send Email Modal down to the final React Component rendering on the Intake Portal.

---

### Scenario Tracing

#### Scenario 1: Home + Auto
1. **Value stored in `temp_intake_forms.form_type`:** A single string (e.g., `'home'`), dependent entirely on what the CSR selected in the Send Email dropdown.
2. **URL Generated:** `.../intake/[id]?type=home`
3. **`activePolicies` Calculated:** `['home', 'auto']` (The intake engine intercepts the request, queries `lead_policies`, and overrides the single string).
4. **Form Components Rendered:** `<HomeInsuranceForm />` + `<AutoInsuranceForm />`.
5. **Deduplication works:** Yes.

#### Scenario 2: Home + Condo + Umbrella
1. **Value stored in `temp_intake_forms.form_type`:** A single string (e.g., `'home'`).
2. **URL Generated:** `.../intake/[id]?type=home`
3. **`activePolicies` Calculated:** `['home', 'condo', 'umbrella']`
4. **Form Components Rendered:** Exactly one `<HomeInsuranceForm />`.
5. **Deduplication works:** Yes.
6. **Is only ONE Home form rendered?** Yes, perfectly collapsed via `Set<string>`.

#### Scenario 3: Home + Auto + Umbrella
1. **Value stored in `temp_intake_forms.form_type`:** A single string (e.g., `'home'`).
2. **URL Generated:** `.../intake/[id]?type=home`
3. **`activePolicies` Calculated:** `['home', 'auto', 'umbrella']`
4. **Form Components Rendered:** Exactly one `<HomeInsuranceForm />` + one `<AutoInsuranceForm />`.
5. **Deduplication works:** Yes.
7. **Is ONE Home + ONE Auto form rendered?** Yes.

---

### Workflow Analysis Questions

**8. Is any legacy `policy_type` logic still interfering?**
Yes, but only visibly on the CSR's side. The Send Email Modal forces the CSR to select a single `formType` from a dropdown, which is written to `temp_intake_forms` and appended to the URL as `?type=home`. 
However, this interference is **benign** to the client. The `app/intake/[id]/page.tsx` engine elegantly ignores the legacy string and URL parameter if it detects records in the `lead_policies` table.

**9. Is the Preview Form showing the same content that the client will receive?**
**Yes.** Because both the "Preview Form" button and the final Client Email Link hit the exact same route (`/intake/[id]`), the intake engine intercepts both requests, pulls the `lead_policies` array, and renders the exact same multi-policy experience.

**10. What is NOT yet implemented?**
- **CSR UI Synchronization:** The CSR experiences a severe UI disconnect. The CSR explicitly selects "Home" in the Send Email modal, believing they are generating a Home-only form. However, because the Intake Engine smartly fetches `lead_policies`, the attached link is actually a Home + Auto form. The CSR is never informed of this behavior by the UI.
- **Email Messaging Synchronization:** Because the CSR is locked into selecting a "Home" template, the email text only discusses Home Insurance, yet the attached form requests Home + Auto data.

---

### SECTION A: Working Functionality

- **Multi-Policy Retrieval:** `app/intake/[id]/page.tsx` correctly queries the `lead_policies` table to construct the `activePolicies` array, successfully bypassing the legacy architecture.
- **Form Deduplication:** The `Set<string>` component collapses sub-types perfectly.
- **Preview Accuracy:** The Preview Form accurately mirrors the client's final experience.

### SECTION B: Partially Working Functionality

- **Database State:** `temp_intake_forms` still stores a single string for `form_type`. This doesn't crash the application because the intake page overrides it, but it constitutes stale/inaccurate data storage.
- **URL Generation:** The system continues to append legacy `?type=[string]` queries to URLs, which are now obsolete.

### SECTION C: Broken Functionality

- **CSR Modal UI Disconnect:** The `send-form/page.tsx` restricts the user to a single string selection via a dropdown. This forces the CSR to generate mismatched email templates (e.g., sending a "Home" email for a "Home + Auto" form link).

### SECTION D: Files Requiring Future Changes

1. `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx` *(Needs to compute `activePolicies` on mount and lock the dropdown or transition it to a Multi-Policy state).*
2. `app/api/send-email/route.ts` *(Needs to stop relying on `?type=${formType}` query parameters).*
3. `temp_intake_forms` *(Optional database refactor: drop `form_type` column entirely or map it to a JSONB array/Multi-Policy string).*
