# SEND_EMAIL_MODAL_ANALYSIS_REPORT

This report analyzes the current User Experience (UX) of the Send Email workflow (`send-form/page.tsx` and `EmailGenerator.tsx`) against the new streamlined client requirements for Personal Lines.

---

### SECTION A: Current UX

**1. What controls currently appear in the Send Email modal?**
- Template Selection Dropdown
- Form Type Selection Dropdown (Home, Auto, etc.)
- Compose Mode Toggle (Template vs Manual)
- Extensive "Email Configuration" Card featuring:
  - Client Name input
  - Carrier & Premium text fields
  - Effective Dates & Renewal Years
  - **Dynamic Policy Breakdown Table** (Add/Remove policy cards)
- Intake Form Attachment Toggle
- Subject & Body Textarea Previews
- Additional Notes Textarea

**3. What does the CSR currently see for a Home + Auto lead?**
The CSR sees a fragmented experience. The form type dropdown forces them to select either "Home" or "Auto". The dynamic Policy Breakdown table defaults to showing only the single selected policy type. The CSR is essentially blind to the fact that the underlying `lead_policies` array contains both Home and Auto.

---

### SECTION B: Problems & Simplification Opportunities

**2. Which controls become unnecessary if only the Information Request template remains and the Policy Breakdown is removed?**
Almost the entire UI becomes obsolete. 
- The **Template Dropdown** is unnecessary if there is only one valid Personal Lines template.
- The **Form Type Dropdown** is unnecessary if the system generates one combo Intake form based on `lead_policies`.
- The **Email Configuration Card** (including Carrier fields, Dates, and the entire Policy Breakdown UI) must be completely deleted.

**5. Should the policy dropdown be removed completely?**
**Yes.** The CSR should no longer have the burden of mapping policies to forms. The system already knows what the client requested.

**6. Should the system automatically detect HOME_GROUP and AUTO_GROUP?**
**Yes.** The `send-form/page.tsx` page should query the `lead_policies` table immediately upon loading and resolve the groups automatically. 

**7. Should the CSR be shown read-only policies instead of selecting a policy?**
**Yes.** Replacing the interactive dropdown with a read-only list (e.g., `"Policies Requested: Home, Auto"`) confirms to the CSR that the system is handling the complexity automatically, instilling confidence that the generated Intake Link will cover both items.

---

### SECTION C: Recommended UX

**4. What should the CSR ideally see?**
The CSR should experience a "One-Click" dispatch system. Because all complex quoting details (Policy Breakdowns, Premiums) are being removed from the Information Request stage, the CSR simply needs to review the automatically generated email and click Send.

#### 8. Send Email Experience Mockup

```text
[ SEND EMAIL TO: John Doe ]

==================================================
📋 LEAD DETAILS
--------------------------------------------------
Client: John Doe
Policies Requested: Home, Auto
Intake Form: [✓] Attached Automatically
==================================================

==================================================
✉️ EMAIL PREVIEW (Information Request)
--------------------------------------------------
Subject: [ Moonstar Mortgage Insurance Information Request ]

Body: 
Hi John,

Thank you for requesting an insurance quote! 
Please complete our secure intake portal so we can 
gather the exact details needed for your Home and Auto quotes.

[ SECURE INTAKE PORTAL LINK ]

Thank you,
Moonstar Insurance Team
==================================================

[ Add Optional Custom Note... ]

         [ SEND EMAIL ]
```

---

### SECTION D: Files Impacted

To execute these client requirements, the following files will require heavy refactoring or deletion of code:

1. **`app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`**
   - Fetch `lead_policies` on mount.
   - Remove template selection logic (hardcode or default to `info_req`).
   - Remove formType dropdown and replace with read-only badges.
   - Pass `activePolicies` directly into the Intake URL generation.

2. **`components/email/EmailGenerator.tsx`**
   - Delete all UI code rendering the "Email Configuration" card.
   - Delete the `PolicyBreakdown` state arrays and inputs.
   - Strip the UI down to strictly the Subject input, Body preview, and Notes input.

3. **`lib/emailTemplating.ts`**
   - Update `replaceTemplate()` to inject the new Intake form wording.
   - Delete all logic associated with `generatePolicyBreakdown()`.
   - Ensure the "Reply All" footer logic is stripped from the generated output.

4. **Database: `email_templates`**
   - Update or recreate the `info_req` template to ensure it meets the new standardized wording and lacks the Reply All footer.
