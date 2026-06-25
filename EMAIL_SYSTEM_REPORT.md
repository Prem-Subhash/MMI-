# Moonstar Insurance CRM - Email System Internal Report

This report provides a strict, purely descriptive architectural overview of the existing email functionality in the Moonstar Insurance CRM. It focuses exclusively on trace logic, execution flows, and integrations.

---

## 1. 📌 EMAIL SYSTEM OVERVIEW

The system currently supports three distinct automated email features, primarily facilitated by Next.js API routes and the Microsoft Graph API. 

The existing email features are:
1. **Intake Emails**: Outbound emails sent to external clients (leads) containing links to fill out intake forms. Triggered by a CSR/Admin user action.
2. **Submission Notification Emails**: Inbound/Internal emails sent to assigned CSRs and Administrators when a client successfully submits an intake form.
3. **Automated Reminder Emails**: Internal follow-up alerts sent to assigned CSRs and Administrators when a client has not filled out a form 48 hours after the intake email was sent.

---

## 2. 📂 FILE TRACE (VERY IMPORTANT)

### API Routes
*   **`app/api/send-email/route.ts`**
    *   **Purpose**: Handles outbound client communications (Intake Form Links).
    *   **When it is used**: Executed when a CSR or Admin clicks an action to email a client an intake form link.
    *   **Connections**: Queries Supabase (`temp_leads_basics`, `email_templates`), invokes `sendGraphEmail`, updates lead statuses (`WAITING_FOR_SUBMISSION`) and `follow_up_date`.
*   **`app/api/notify-submission/route.ts`**
    *   **Purpose**: Handles internal notification emails upon client activity.
    *   **When it is used**: Automatically triggered whenever a client submits their assigned intake form.
    *   **Connections**: Resolves Lead/Intake IDs, pulls the CSR’s email from Supabase Auth (`supabaseServer.auth.admin.getUserById`), invokes `sendGraphEmail`, and inserts records into `user_notifications`.
*   **`app/api/reminder-check/route.ts`**
    *   **Purpose**: Acts as a background/automated job (via GET request) to check for stale leads.
    *   **When it is used**: Likely hit by a cron job or external scheduler.
    *   **Connections**: Queries active leads where `follow_up_date` is in the past, invokes `sendGraphEmail` to notify CSRs/Admins, and updates the `reminder_sent` boolean field in `temp_leads_basics`.

### Utilities
*   **`lib/microsoftGraph.ts`**
    *   **Purpose**: The central engine for dispatching all emails and handling Microsoft OAuth2 tokens.
    *   **When it is used**: Imported and executed by all three API routes mentioned above. 
    *   **Connections**: Contacts `login.microsoftonline.com` and `graph.microsoft.com`. Directly interacts with Supabase to blindly write a local trace log to the `email_logs` table upon success or failure.

---

## 3. 🔌 EMAIL FLOW (END-TO-END)

**Example: CSR Sends Intake Email**
1.  **User Action**: The CSR initiates the email on the frontend (passing `leadId`, `templateId`, `intakeId`, `formType`).
2.  **API**: Request hits `POST /api/send-email/route.ts`.
3.  **Data Fetch**: The API queries the lead's email and client name, and pulls the selected HTML template subject/body from the DB.
4.  **Transformation**: The template macros `{{client_name}}` and `{{form_link}}` are replaced with concrete values.
5.  **Service**: The transformed data is pushed to `sendGraphEmail()`.
6.  **External API**: `microsoftGraph.ts` fetches a Bearer token, then POSTs the message JSON to Microsoft Graph.
7.  **Database Trace**: `microsoftGraph.ts` logs success to `email_logs`. The `route.ts` file updates the lead's status and establishes a +48h `follow_up_date`.

---

## 4. 🧠 INTERNAL LOGIC (DETAILED)

### `POST /api/send-email`
*   **Trigger**: Frontend UI event by authorized users (`csr`, `admin`, `superadmin`).
*   **Input**: `{ leadId, templateId, formType, intakeId, customSubject, customBody }`
*   **Subject/Body Logic**: It prioritizes `customSubject`/`customBody` if provided. Otherwise, it queries `email_templates` by `templateId`. It performs manual `.replace()` on strings `{{client_name}}` and `{{form_link}}`. 
*   **Recipients**: The client (Lead) email pulled from `temp_leads_basics.email`.

### `POST /api/notify-submission`
*   **Trigger**: End of the successful intake form submission workflow.
*   **Input**: `{ leadId, intakeId, formType }`
*   **Subject/Body Logic**: Strictly **hardcoded**. Subject: `"New Form Submitted"`. Body: `<p>Client has submitted the form (${formType}).</p>`.
*   **Recipients**: The assigned CSR (fetched from Supabase Auth via Admin client) and the Admin (`process.env.ADMIN_NOTIFICATION_EMAIL` or fallback default sender email). Deduplicates recipients automatically.

### `GET /api/reminder-check`
*   **Trigger**: API call (Cron) mapping to a dynamic non-cached endpoint.
*   **Input**: None. It queries `temp_leads_basics` against the current timestamp.
*   **Subject/Body Logic**: Strictly **hardcoded**. Generates an HTML payload containing a direct dashboard link to the lead/intake.
*   **Recipients**: The assigned CSR and the Admin.

---

## 5. 📨 EMAIL TEMPLATE SYSTEM (CRITICAL)

The system does **NOT** rely on a singular template engine. It splits implementation into two halves:

1.  **Database-Driven Templates (Outbound to Client)**:
    *   Used specifically by the `send-email` API.
    *   Templates denote rows in the `email_templates` database table comprising `subject` and `body`.
    *   Data substitution is basic regex-replace for `{{ client_name }}` and `{{ form_link }}`.
    *   Emails are dispatched as **HTML**.
2.  **Hardcoded Templates (Inbound/System logic)**:
    *   Used by notifications and reminders.
    *   Subjects and HTML body strings are explicitly typed using structural string literals directly inside `notify-submission` and `reminder-check` `route.ts` files.

---

## 6. 🔗 MICROSOFT GRAPH INTEGRATION

The `lib/microsoftGraph.ts` operates entirely statelessly without caching the OAuth session.

*   **OAuth2 Token Flow**: The `getAccessToken()` function issues a POST request to `https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token` using a standard `client_credentials` grant structure.
*   **Sending Mail**: Initiates a POST call to `https://graph.microsoft.com/v1.0/users/${sender}/sendMail` where `${sender}` comes from `MICROSOFT_SENDER_EMAIL`.
*   **Email Payload Structure**:
    ```json
    {
      "message": {
        "subject": "<subject>",
        "body": {
          "contentType": "HTML",
          "content": "<body>"
        },
        "toRecipients": [{"emailAddress": {"address": "<email>"}}]
      },
      "saveToSentItems": true
    }
    ```
*   **Log Engine**: Internally hooks into the `email_logs` table (mapping `lead_id`, `email_type`, `recipient`, and `status`) within the `try/catch` block for every sent Graph Email.

---

## 7. 🔄 DATA FLOW

1.  **Identity Derivation**: Inbound/Internal emails dynamically fetch real user emails from `supabaseServer.auth.admin.getUserById` based on foreign key relationships (`assigned_csr`). Outbound email fetches from `temp_leads_basics`.
2.  **Transformation**: All templating data transformation happens procedurally in the respective Next.js API Routes prior to hitting the library handler.
3.  **State Management Output**: The side effect of email events inherently writes new data loops:
    *   Sending an email writes `follow_up_date` to trigger cron logic.
    *   Submitting a form updates lead states, stopping the cron logic loop.

---

## 8. 🔁 REAL EXECUTION FLOWS

1.  **Intake Email (CSR -> Client)**:
    CSR chooses Template → POST `/api/send-email` fetches Lead ID `123`, Template ID `456` → Replaces `{{form_link}}` with `.../intake/789` → `sendGraphEmail` executes POST request to Microsoft → Success! → DB maps `follow_up_date` to `Now() + 48 Hours`.
2.  **Notification Email (System -> CSR)**:
    Client visits `.../intake/789`, completes fields → Form submission POST fires → Chain reaction calls `/api/notify-submission` → System queries CSR ID for Email Address → System hardcodes `"New Form Submitted"` string → Graph Email dispatches → System injects UI notifications via `user_notifications` table.
3.  **Automated Reminder (System -> CSR)**:
    Cron hits `/api/reminder-check` on Friday → Query engine detects Lead `123` breached 48 hours and `form_submitted_at` is null → Loop invokes `sendGraphEmail` informing assigned CSR → Lead database object is securely updated `reminder_sent = true` to prevent double-triggering.

---

## 9. 📑 FINAL SUMMARY

| Feature | API / Trigger File | Util | DB Entities Affected / Handled | Logic Type |
| :--- | :--- | :--- | :--- | :--- |
| **Outbound Intake** | `app/api/send-email/route.ts` | `microsoftGraph.ts` | `temp_leads_basics`, `email_templates`, `email_logs` | Dynamic Templates (DB) |
| **Inbound Notification** | `app/api/notify-submission/route.ts` | `microsoftGraph.ts` | `temp_leads_basics`, `user_notifications`, `auth.users` | Hardcoded / Static string |
| **Cron Reminders** | `app/api/reminder-check/route.ts` | `microsoftGraph.ts` | `temp_leads_basics`, `auth.users` | Hardcoded / Static string |
