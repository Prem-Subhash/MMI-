# EMAIL_TEMPLATE_DATABASE_ANALYSIS_REPORT

This report analyzes the actual records stored within the `email_templates` database table, assessing how the client's new requirement ("Personal Lines should only use Information Request template") impacts the existing database architecture.

---

### SECTION A: Current Template Architecture

The database currently operates on a highly fragmented architecture where **every single sub-policy type** (e.g., `home`, `condo`, `motorcycle`, `umbrella`) has its own complete set of 9 independent email templates. 

**5. Database Fields Used:**
* `subject` & `body`: Extensively used to populate the email preview.
* `policy_type`: The strict mapping field (e.g., `motorcycle`) used by the Send Email Modal to filter records.
* `insurance_category`: Categorizes templates (e.g., `personal` vs `commercial`).
* `policy_flow`: Tracks the stage (e.g., `lead` vs `renewal`).

---

### SECTION B: Personal Lines Templates

For every personal lines `policy_type`, the system currently generates and stores the following 9 template variations:
1. `info_req` (Information Request)
2. `new_lead` (Quote Delivery)
3. `renewal_same` (Renewal Declaration)
4. `renewal_switch` (Switch Quote)
5. `congrats_new` (Welcome Email)
6. `congrats_existing` (Welcome Email)
7. `follow_up` (Follow-up Quote)
8. `auto_payment` (Payment Confirmation)
9. `payment_reminder` (Payment Due)

---

### SECTION C & D: Templates to Keep vs Remove

**2. Which template acts as the Information Request?**
The record where `name = 'info_req'` (Subject: *"Information Needed to Prepare Your Insurance Quote"*).

**3. Which templates must be removed?**
According to the client's strict requirement, all quoting, renewal, and automated payment templates (2 through 9 in the list above) are obsolete for Personal Lines and must be removed from the UI workflow.

**4. Which template records must remain?**
Only the `info_req` templates.

---

### SECTION E: Database Impact & Matrix

**6. How can the client requirement be achieved?**
The requirement can technically be achieved simply by executing a `DELETE` query or flipping `is_active = false` for the obsolete records. However, this leaves a bloated architecture.

**7. Exact Database Changes Required:**
Instead of maintaining 7 identical `info_req` records (one for home, one for condo, one for umbrella, etc.), the database should be cleaned up:
1. **DELETE** all Personal Lines records where `name != 'info_req'`.
2. **DELETE** all duplicate `info_req` records.
3. **MODIFY** the single remaining `info_req` record to have `policy_type = 'personal_lines'`.

#### 8. Template Matrix (Personal Lines)

| Template Name | Policy Type | Insurance Category | Keep/Delete/Modify |
| :--- | :--- | :--- | :--- |
| `info_req` | `home` | `personal` | **MODIFY** (Change to `personal_lines`) |
| `info_req` | `condo`, `auto`, etc. | `personal` | **DELETE** (Duplicates) |
| `new_lead` | *All Personal Types* | `personal` | **DELETE** |
| `renewal_*` | *All Personal Types* | `personal` | **DELETE** |
| `congrats_*` | *All Personal Types* | `personal` | **DELETE** |
| `follow_up` | *All Personal Types* | `personal` | **DELETE** |
| `*_payment*` | *All Personal Types* | `personal` | **DELETE** |

---

### SECTION F: Implementation Recommendations & Risks

#### 9. Risks of Deletion
There are two major risks in deleting the obsolete templates:
1. **Dead UI Code:** `EmailGenerator.tsx` contains hardcoded logic checking for these deleted templates: `const isMulti = ['renewal_switch', 'new_lead', 'payment_reminder'].includes(tplKey)`. This code will become dead and should be removed.
2. **Broken Automated Background Tasks:** If the CRM has backend Cron jobs (e.g., daily scripts running on a Supabase edge function) that automatically send `payment_reminder` or `congrats_new` emails, deleting these records will cause those background jobs to crash. You must audit background jobs before permanently dropping the records. 

#### Recommendation
**Hide in UI first, Delete later.** 
Update the `app/api/superadmin/email-templates` fetching logic or the `send-form/page.tsx` query to only pull `name = 'info_req'` for Personal Lines. This instantly satisfies the client requirement while preserving the database records until a thorough Cron audit is performed.
