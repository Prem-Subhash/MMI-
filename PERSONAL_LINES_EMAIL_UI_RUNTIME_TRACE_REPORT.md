# PERSONAL_LINES_EMAIL_UI_RUNTIME_TRACE_REPORT

## Runtime Component Tree

When the user navigates to `/csr/pipeline/personal` and clicks "Send Email" in the pipeline table, the following component tree executes:

1. `app/(dashboard)/csr/pipeline/personal/page.tsx` (Renders the table)
2. `components/email/EmailModal.tsx` (Renders the inline modal overlay)
3. `components/email/EmailGenerator.tsx` (Renders the email configuration fields)

## Diagnosis of the Failure

1. **Which React component is actually rendering this modal?**
   The inline modal is rendered by `components/email/EmailModal.tsx`, which is injected directly into the pipeline table page.

2. **Are the `send-form/page.tsx` modifications being executed?**
   **No.** The user is clicking the "Send Email" button inside the data table on the `/csr/pipeline/personal` pipeline route. This button triggers the inline `EmailModal` component rather than navigating to the `/csr/pipeline/personal/send-form` page route. All previous refactoring work was applied to the dedicated page route instead of the modal.

3. **Does `EmailGenerator.tsx` receive `isPersonalLines=true`?**
   **No.** The `EmailModal.tsx` component is instantiating `<EmailGenerator />` *without* passing the new `isPersonalLines={true}` prop. Therefore, it defaults to `false` and exposes the massive legacy Carrier/Premium/Policy Breakdown card.

4. **Is another component overriding the new UI?**
   Yes, `EmailModal.tsx` essentially duplicates the legacy dropdown UI. It explicitly renders:
   - "Email Purpose" (`<select value={templateId}>`)
   - "Form Type" (`<select value={formType}>`)

5. **Is the route rendering stale legacy code?**
   Yes. `EmailModal.tsx` is the primary modal used across the CRM (likely for both personal and commercial lines). Because it wasn't refactored alongside `send-form/page.tsx`, it still powers the table's quick-action button with legacy logic.

## Exact Fix Required

To fix this globally, we must refactor `components/email/EmailModal.tsx` to mirror the logic we applied to `send-form`:

1. **Detect Personal Lines:** Evaluate `lead?.insurence_category === 'personal'` inside `EmailModal.tsx`.
2. **Propagate `isPersonalLines`:** Pass `isPersonalLines={true}` down to `<EmailGenerator />` when applicable to hide the Policy Breakdown.
3. **Hide Legacy Dropdowns:** Conditionally hide the Template Dropdown and Form Type Dropdown in `EmailModal.tsx` if it's a Personal Lines lead.
4. **Enforce Information Request:** Automatically default to `info_req` and compute `activePolicies` to render read-only policy badges inside `EmailModal.tsx`, exactly as was done for `send-form/page.tsx`.
