# PERSONAL_LINES_EMAIL_IMPLEMENTATION_READINESS_REPORT

This readiness report outlines the exact non-destructive implementation path to satisfy the new Personal Lines Information Request requirements, ensuring no active database records are deleted and Commercial Lines remain fully intact.

---

### Analysis Answers

**A. Can the requirement be satisfied by hiding templates in the UI?**
**Yes.** Instead of executing a dangerous `DELETE` query, the API or frontend can simply filter out all templates where `insurance_category === 'personal' && name !== 'info_req'`. This instantly restricts CSRs to the Information Request template while preserving the database records for automated background jobs.

**B. Which exact frontend files must change?**
1. **`app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`**: Must apply the UI filter so only `info_req` is available.
2. **`components/email/EmailGenerator.tsx`**: Must conditionally disable/hide the entire Policy Breakdown UI block if the lead belongs to Personal Lines, preventing CSRs from wasting time entering data that won't be rendered.

**C. Which exact database records must be modified?**
We will not delete anything. However, we must update the actual text content. All records in `email_templates` where `name = 'info_req'` AND `insurance_category = 'personal'` must have their `body` fields updated.

**D. Which `email_templates` records require body updates?**
The `info_req` templates currently contain legacy wording about attaching PDF declaration pages and feature a bulky "Reply All" footer. These bodies must be `UPDATE`d to point the user to the `{{form_link}}` instead, and the footer must be scrubbed out.

**E. Which template variables become obsolete?**
Because Personal Lines will exclusively use a generic Information Request, all quoting and breakdown variables become dead to Personal Lines:
`{{policy_breakdown}}`, `{{bullets}}`, `{{savings_amount}}`, `{{current_carrier}}`, `{{premium}}`, `{{old_premium}}`, `{{new_premium}}`, etc.

**F. Which functions become dead code?**
Because Commercial Lines must *not* be broken, functions like `generatePolicyBreakdown()`, `calculateTotalSavings()`, and `getCombinedTypes()` in `lib/emailTemplating.ts` will **not** become dead code. They must be preserved exclusively for Commercial use.

**G. What SQL updates are required?**
A safe, targeted `UPDATE` query:
```sql
UPDATE email_templates 
SET body = 'Hi {{client_name}},<br><br>Thank you for requesting an insurance quote! To ensure we get you the most accurate pricing, please complete our secure intake portal below.<br><br>{{form_link}}<br><br>Thank you,<br>Moonstar Insurance Team' 
WHERE name = 'info_req' AND insurance_category = 'personal';
```

---

### SECTION A: Frontend Changes

1. **Hide Obsolete Templates:** In `send-form/page.tsx`, filter the `templates` state to only expose `info_req` for Personal Lines leads.
2. **Streamline UI:** In `EmailGenerator.tsx`, wrap the `Policy Breakdown` configuration card in a condition (`if (insurance_category === 'commercial')`). This removes the clutter for Personal Lines CSRs.

### SECTION B: Database Content Changes

1. **Update `info_req` bodies:** Execute the targeted SQL `UPDATE` to replace legacy PDF wording with modern Intake Link wording and strip the Reply-All footer for all `info_req` personal templates.

### SECTION C: No-code Database Updates

No schema changes, no table drops, and no record deletions. All templates are safely preserved in the database.

### SECTION D: Optional Future Cleanup

Once the CRM background jobs (Cron functions sending automatic renewals or payment reminders) are thoroughly audited and proven safe, the dormant `renewal_*`, `congrats_*`, and `payment_*` templates for Personal Lines can be permanently deleted to save space.

### SECTION E: Safe Implementation Sequence

1. Execute the SQL `UPDATE` to standardize the `info_req` bodies.
2. Refactor `EmailGenerator.tsx` to conditionally hide the Policy Breakdown for Personal Lines.
3. Refactor `send-form/page.tsx` to filter the template dropdown, restricting it to `info_req`.
4. Test a Multi-Policy lead (Home + Auto) to ensure the `info_req` template successfully dispatches with the Intake Link, and no Policy Breakdown tables are rendered.
5. Test a Commercial Lines lead to ensure the Policy Breakdown and standard templates are still accessible.
