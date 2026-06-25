# DATABASE TO UI DEPENDENCY MAP: temp_leads_basics

This report outlines the complete field-level impact across the CRM for every column in the `temp_leads_basics` table.

### `id`
**Risk Level:** Critical

**Pages using it:**
- `app/(dashboard)/accounting/all-leads/page.tsx`
- `app/(dashboard)/accounting/leads/[id]/page.tsx`
- `app/(dashboard)/accounting/page.tsx`
- `app/(dashboard)/accounting/reports/page.tsx`
- `app/(dashboard)/admin/assignments/page.tsx`
- `app/(dashboard)/admin/csrs/page.tsx`
- `app/(dashboard)/admin/csrs/[id]/page.tsx`
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/admin/leads/page.tsx`
- `app/(dashboard)/admin/pipelines/page.tsx`
- `app/(dashboard)/csr/activity-log/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/page.tsx`
- `app/(dashboard)/csr/leads/[id]/page.tsx`
- `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/debug/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
- `app/(dashboard)/csr/reports/page.tsx`
- `app/(dashboard)/superadmin/page.tsx`
- `app/(dashboard)/superadmin/pipelines/[id]/stages/page.tsx`
- `app/intake/[id]/page.tsx`
- `app/login/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/accounting/reports/ReportsClient.tsx`
- `app/(dashboard)/admin/pipelines/PipelineClient.tsx`
- `app/(dashboard)/superadmin/audit-logs/AuditLogsClient.tsx`
- `app/(dashboard)/superadmin/email-templates/EmailTemplatesClient.tsx`
- `app/(dashboard)/superadmin/forms/FormTemplatesClient.tsx`
- `app/(dashboard)/superadmin/pipelines/PipelinesClient.tsx`
- `app/(dashboard)/superadmin/pipelines/[id]/stages/StagesClient.tsx`
- `app/(dashboard)/superadmin/roles/RolesClient.tsx`
- `app/(dashboard)/superadmin/system-settings/SystemSettingsClient.tsx`
- `app/(dashboard)/superadmin/users/UsersClient.tsx`
- `components/email/EmailGenerator.tsx`
- `components/email/EmailModal.tsx`
- `components/forms/AutoInsuranceForm.tsx`
- `components/forms/CoApplicantForm.tsx`
- `components/forms/HomeInsuranceForm.tsx`
- `components/forms/PrimaryApplicantForm.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/TopBar.tsx`
- `components/leads/DocumentViewer.tsx`
- `components/leads/EditClientModal.tsx`
- `components/pipeline/UpdateStageModal.tsx`
- `components/ui/IntakeUI.tsx`
- `utils/auth.ts`
**APIs modifying/reading it:**
- `app/api/accounting/reconciliation/route.ts`
- `app/api/accounting/update-commission/route.ts`
- `app/api/accounting/verify-policy/route.ts`
- `app/api/delete-document/route.ts`
- `app/api/documents/[id]/route.ts`
- `app/api/notify-submission/route.ts`
- `app/api/reminder-check/route.ts`
- `app/api/reports/monthly/route.ts`
- `app/api/send-email/route.ts`
- `app/api/superadmin/audit-logs/route.ts`
- `app/api/superadmin/email-templates/route.ts`
- `app/api/superadmin/form-templates/route.ts`
- `app/api/superadmin/pipelines/route.ts`
- `app/api/superadmin/pipelines/stages/route.ts`
- `app/api/superadmin/system-settings/route.ts`
- `app/api/superadmin/users/route.ts`
- `app/api/update-client/route.ts`
- `app/api/update-stage/route.ts`
- `app/api/upload-document/route.ts`
- `lib/emailTemplating.ts`
- `lib/supabaseClient.ts`
- `lib/toast.ts`
- `lib/ToastContext.tsx`
**Reports using it:**
- `app/api/reports/monthly/route.ts`
**Emails using it:**
- `app/api/send-email/route.ts`
- `app/api/superadmin/email-templates/route.ts`
- `lib/emailTemplating.ts`
**Notifications using it:**
- `app/api/reminder-check/route.ts`

---

### `phone`
**Risk Level:** High

**Pages using it:**
- `app/(dashboard)/accounting/all-leads/page.tsx`
- `app/(dashboard)/accounting/leads/[id]/page.tsx`
- `app/(dashboard)/admin/csrs/[id]/page.tsx`
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/admin/leads/page.tsx`
- `app/(dashboard)/admin/pipelines/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/page.tsx`
- `app/(dashboard)/csr/leads/[id]/page.tsx`
- `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/admin/pipelines/PipelineClient.tsx`
- `components/email/EmailModal.tsx`
- `components/leads/EditClientModal.tsx`
**APIs modifying/reading it:**
- `app/api/update-client/route.ts`
- `lib/emailTemplating.ts`
**Emails using it:**
- `lib/emailTemplating.ts`

---

### `email`
**Risk Level:** High

**Pages using it:**
- `app/(dashboard)/accounting/all-leads/page.tsx`
- `app/(dashboard)/accounting/leads/[id]/page.tsx`
- `app/(dashboard)/admin/csrs/page.tsx`
- `app/(dashboard)/admin/csrs/[id]/page.tsx`
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/admin/leads/page.tsx`
- `app/(dashboard)/admin/pipelines/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/page.tsx`
- `app/(dashboard)/csr/leads/[id]/page.tsx`
- `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/debug/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
- `app/(dashboard)/csr/reports/page.tsx`
- `app/(dashboard)/superadmin/email-templates/page.tsx`
- `app/(dashboard)/superadmin/page.tsx`
- `app/login/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/admin/pipelines/PipelineClient.tsx`
- `app/(dashboard)/superadmin/audit-logs/AuditLogsClient.tsx`
- `app/(dashboard)/superadmin/email-templates/EmailTemplatesClient.tsx`
- `app/(dashboard)/superadmin/roles/RolesClient.tsx`
- `app/(dashboard)/superadmin/system-settings/SystemSettingsClient.tsx`
- `app/(dashboard)/superadmin/users/UsersClient.tsx`
- `components/email/EmailGenerator.tsx`
- `components/email/EmailModal.tsx`
- `components/layout/Sidebar.tsx`
- `components/layout/TopBar.tsx`
- `components/leads/EditClientModal.tsx`
**APIs modifying/reading it:**
- `app/api/notify-submission/route.ts`
- `app/api/reminder-check/route.ts`
- `app/api/send-email/route.ts`
- `app/api/superadmin/audit-logs/route.ts`
- `app/api/superadmin/users/route.ts`
- `app/api/update-client/route.ts`
- `app/api/update-stage/route.ts`
- `lib/emailTemplating.ts`
- `lib/microsoftGraph.ts`
**Emails using it:**
- `app/api/send-email/route.ts`
- `lib/emailTemplating.ts`
- `lib/microsoftGraph.ts`
**Notifications using it:**
- `app/api/reminder-check/route.ts`

---

### `insurence_category`
**Risk Level:** Critical

**Pages using it:**
- `app/(dashboard)/accounting/all-leads/page.tsx`
- `app/(dashboard)/accounting/leads/[id]/page.tsx`
- `app/(dashboard)/admin/csrs/[id]/page.tsx`
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/admin/leads/page.tsx`
- `app/(dashboard)/admin/pipelines/page.tsx`
- `app/(dashboard)/csr/activity-log/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/page.tsx`
- `app/(dashboard)/csr/leads/[id]/page.tsx`
- `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`
- `app/(dashboard)/csr/reports/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/accounting/reports/ReportsClient.tsx`
- `app/(dashboard)/admin/pipelines/PipelineClient.tsx`
- `components/email/EmailModal.tsx`
**APIs modifying/reading it:**
- `app/api/reports/monthly/route.ts`
**Reports using it:**
- `app/api/reports/monthly/route.ts`

---

### `policy_type`
**Risk Level:** Low

**Pages using it:**
- `app/(dashboard)/admin/assignments/page.tsx`
- `app/(dashboard)/admin/csrs/[id]/page.tsx`
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/csr/activity-log/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/[id]/page.tsx`
- `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
- `app/(dashboard)/csr/reports/page.tsx`
**Components displaying it:**
- `app/(dashboard)/superadmin/email-templates/EmailTemplatesClient.tsx`
- `components/email/EmailModal.tsx`
**APIs modifying/reading it:**
- `app/api/reports/monthly/route.ts`
- `app/api/superadmin/email-templates/route.ts`
- `lib/fieldLabels.ts`
**Reports using it:**
- `app/api/reports/monthly/route.ts`
**Emails using it:**
- `app/api/superadmin/email-templates/route.ts`

---

### `assigned_csr`
**Risk Level:** Critical

**Pages using it:**
- `app/(dashboard)/accounting/leads/[id]/page.tsx`
- `app/(dashboard)/admin/assignments/page.tsx`
- `app/(dashboard)/admin/csrs/[id]/page.tsx`
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/csr/activity-log/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/page.tsx`
- `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/debug/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
- `app/(dashboard)/csr/reports/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/accounting/reports/ReportsClient.tsx`
- `components/layout/TopBar.tsx`
**APIs modifying/reading it:**
- `app/api/notify-submission/route.ts`
- `app/api/reminder-check/route.ts`
- `app/api/reports/monthly/route.ts`
**Reports using it:**
- `app/api/reports/monthly/route.ts`
**Notifications using it:**
- `app/api/reminder-check/route.ts`

---

### `created_at`
**Risk Level:** Low

**Pages using it:**
- `app/(dashboard)/accounting/all-leads/page.tsx`
- `app/(dashboard)/accounting/leads/[id]/page.tsx`
- `app/(dashboard)/accounting/page.tsx`
- `app/(dashboard)/admin/assignments/page.tsx`
- `app/(dashboard)/admin/csrs/page.tsx`
- `app/(dashboard)/admin/csrs/[id]/page.tsx`
- `app/(dashboard)/admin/leads/page.tsx`
- `app/(dashboard)/admin/pipelines/page.tsx`
- `app/(dashboard)/csr/activity-log/page.tsx`
- `app/(dashboard)/csr/leads/page.tsx`
- `app/(dashboard)/csr/leads/[id]/page.tsx`
- `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- `app/(dashboard)/csr/renewals/debug/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/accounting/reports/ReportsClient.tsx`
- `app/(dashboard)/admin/pipelines/PipelineClient.tsx`
- `app/(dashboard)/superadmin/audit-logs/AuditLogsClient.tsx`
- `app/(dashboard)/superadmin/email-templates/EmailTemplatesClient.tsx`
- `app/(dashboard)/superadmin/forms/FormTemplatesClient.tsx`
- `app/(dashboard)/superadmin/pipelines/PipelinesClient.tsx`
- `app/(dashboard)/superadmin/pipelines/[id]/stages/StagesClient.tsx`
- `app/(dashboard)/superadmin/roles/RolesClient.tsx`
- `app/(dashboard)/superadmin/users/UsersClient.tsx`
- `components/email/EmailModal.tsx`
- `components/layout/TopBar.tsx`
**APIs modifying/reading it:**
- `app/api/accounting/update-commission/route.ts`
- `app/api/accounting/verify-policy/route.ts`
- `app/api/reports/monthly/route.ts`
- `app/api/send-email/route.ts`
- `app/api/superadmin/audit-logs/route.ts`
- `app/api/superadmin/email-templates/route.ts`
- `app/api/superadmin/form-templates/route.ts`
- `app/api/superadmin/pipelines/route.ts`
- `app/api/superadmin/users/route.ts`
**Reports using it:**
- `app/api/reports/monthly/route.ts`
**Emails using it:**
- `app/api/send-email/route.ts`
- `app/api/superadmin/email-templates/route.ts`

---

### `policy_flow`
**Risk Level:** Critical

**Pages using it:**
- `app/(dashboard)/accounting/all-leads/page.tsx`
- `app/(dashboard)/accounting/leads/[id]/page.tsx`
- `app/(dashboard)/admin/csrs/[id]/page.tsx`
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/admin/leads/page.tsx`
- `app/(dashboard)/admin/pipelines/page.tsx`
- `app/(dashboard)/csr/activity-log/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/page.tsx`
- `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/debug/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`
- `app/(dashboard)/csr/reports/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/accounting/reports/ReportsClient.tsx`
- `app/(dashboard)/admin/pipelines/PipelineClient.tsx`
- `app/(dashboard)/superadmin/email-templates/EmailTemplatesClient.tsx`
- `components/email/EmailGenerator.tsx`
- `components/email/EmailModal.tsx`
- `components/layout/TopBar.tsx`
**APIs modifying/reading it:**
- `app/api/reports/monthly/route.ts`
- `app/api/send-email/route.ts`
- `app/api/superadmin/email-templates/route.ts`
**Reports using it:**
- `app/api/reports/monthly/route.ts`
**Emails using it:**
- `app/api/send-email/route.ts`
- `app/api/superadmin/email-templates/route.ts`

---

### `client_name`
**Risk Level:** Medium

**Pages using it:**
- `app/(dashboard)/accounting/all-leads/page.tsx`
- `app/(dashboard)/accounting/leads/[id]/page.tsx`
- `app/(dashboard)/accounting/page.tsx`
- `app/(dashboard)/admin/assignments/page.tsx`
- `app/(dashboard)/admin/csrs/[id]/page.tsx`
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/admin/leads/page.tsx`
- `app/(dashboard)/admin/pipelines/page.tsx`
- `app/(dashboard)/csr/activity-log/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/page.tsx`
- `app/(dashboard)/csr/leads/[id]/page.tsx`
- `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/debug/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
- `app/(dashboard)/csr/reports/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/accounting/reports/ReportsClient.tsx`
- `app/(dashboard)/admin/pipelines/PipelineClient.tsx`
- `app/(dashboard)/superadmin/email-templates/EmailTemplatesClient.tsx`
- `components/email/EmailGenerator.tsx`
- `components/email/EmailModal.tsx`
- `components/layout/TopBar.tsx`
- `components/leads/EditClientModal.tsx`
**APIs modifying/reading it:**
- `app/api/notify-submission/route.ts`
- `app/api/reminder-check/route.ts`
- `app/api/reports/monthly/route.ts`
- `app/api/send-email/route.ts`
- `app/api/update-client/route.ts`
- `lib/emailTemplating.ts`
**Reports using it:**
- `app/api/reports/monthly/route.ts`
**Emails using it:**
- `app/api/send-email/route.ts`
- `lib/emailTemplating.ts`
**Notifications using it:**
- `app/api/reminder-check/route.ts`

---

### `form_submitted_at`
**Risk Level:** High

**APIs modifying/reading it:**
- `app/api/reminder-check/route.ts`
**Notifications using it:**
- `app/api/reminder-check/route.ts`

---

### `pipeline_id`
**Risk Level:** Critical

**Pages using it:**
- `app/(dashboard)/admin/assignments/page.tsx`
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/admin/pipelines/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/[id]/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
**Components displaying it:**
- `app/(dashboard)/admin/pipelines/PipelineClient.tsx`
- `app/(dashboard)/superadmin/pipelines/[id]/stages/StagesClient.tsx`
- `components/pipeline/UpdateStageModal.tsx`
**APIs modifying/reading it:**
- `app/api/superadmin/pipelines/stages/route.ts`
- `app/api/update-stage/route.ts`
- `lib/supabaseClient.ts`

---

### `current_stage_id`
**Risk Level:** Critical

**Pages using it:**
- `app/(dashboard)/admin/assignments/page.tsx`
- `app/(dashboard)/admin/pipelines/page.tsx`
- `app/(dashboard)/csr/leads/[id]/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
**Components displaying it:**
- `app/(dashboard)/admin/pipelines/PipelineClient.tsx`
**APIs modifying/reading it:**
- `app/api/update-stage/route.ts`

---

### `follow_up_date`
**Risk Level:** High

**Components displaying it:**
- `components/pipeline/UpdateStageModal.tsx`
**APIs modifying/reading it:**
- `app/api/reminder-check/route.ts`
- `app/api/send-email/route.ts`
**Emails using it:**
- `app/api/send-email/route.ts`
**Notifications using it:**
- `app/api/reminder-check/route.ts`

---

### `x_date`
**Risk Level:** Low

**Components displaying it:**
- `components/pipeline/UpdateStageModal.tsx`
**APIs modifying/reading it:**
- `app/api/update-stage/route.ts`
- `lib/fieldLabels.ts`

---

### `received_date`
**Risk Level:** Low

*No explicit references found in frontend/API code (May be used dynamically or via wildcard SQL).* 

---

### `request_type`
**Risk Level:** Low

**Pages using it:**
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`

---

### `referral`
**Risk Level:** Low

**Pages using it:**
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/debug/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`

---

### `notes`
**Risk Level:** Low

**Pages using it:**
- `app/(dashboard)/accounting/leads/[id]/page.tsx`
- `app/(dashboard)/accounting/page.tsx`
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/accounting/reports/ReportsClient.tsx`
- `components/email/EmailGenerator.tsx`
- `components/email/EmailModal.tsx`
- `components/pipeline/UpdateStageModal.tsx`
**APIs modifying/reading it:**
- `app/api/accounting/verify-policy/route.ts`
- `app/api/update-stage/route.ts`
- `lib/fieldLabels.ts`

---

### `send_email`
**Risk Level:** Low

**Pages using it:**
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
**APIs modifying/reading it:**
- `app/api/send-email/route.ts`
**Emails using it:**
- `app/api/send-email/route.ts`

---

### `stage_metadata`
**Risk Level:** Critical

**Pages using it:**
- `app/(dashboard)/csr/leads/[id]/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
- `app/(dashboard)/superadmin/page.tsx`
**APIs modifying/reading it:**
- `app/api/notify-submission/route.ts`
- `app/api/reminder-check/route.ts`
- `app/api/send-email/route.ts`
- `app/api/update-stage/route.ts`
**Emails using it:**
- `app/api/send-email/route.ts`
**Notifications using it:**
- `app/api/reminder-check/route.ts`

---

### `client_id`
**Risk Level:** Low

**Pages using it:**
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
**APIs modifying/reading it:**
- `app/api/update-client/route.ts`
- `lib/microsoftGraph.ts`
**Emails using it:**
- `lib/microsoftGraph.ts`

---

### `renewal_date`
**Risk Level:** Medium

**Pages using it:**
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/debug/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
- `app/(dashboard)/csr/reports/page.tsx`
**APIs modifying/reading it:**
- `app/api/reports/monthly/route.ts`
- `app/api/update-stage/route.ts`
- `lib/emailTemplating.ts`
- `lib/fieldLabels.ts`
**Reports using it:**
- `app/api/reports/monthly/route.ts`
**Emails using it:**
- `lib/emailTemplating.ts`

---

### `carrier`
**Risk Level:** Medium

**Pages using it:**
- `app/(dashboard)/accounting/all-leads/page.tsx`
- `app/(dashboard)/accounting/leads/[id]/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/accounting/reports/ReportsClient.tsx`
- `components/forms/AutoInsuranceForm.tsx`
- `components/forms/HomeInsuranceForm.tsx`
- `components/pipeline/UpdateStageModal.tsx`
**APIs modifying/reading it:**
- `app/api/reports/monthly/route.ts`
- `app/api/update-stage/route.ts`
- `lib/emailTemplating.ts`
**Reports using it:**
- `app/api/reports/monthly/route.ts`
**Emails using it:**
- `lib/emailTemplating.ts`

---

### `policy_number`
**Risk Level:** Medium

**Pages using it:**
- `app/(dashboard)/accounting/leads/[id]/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/accounting/reports/ReportsClient.tsx`
- `components/pipeline/UpdateStageModal.tsx`
**APIs modifying/reading it:**
- `app/api/reports/monthly/route.ts`
- `app/api/update-stage/route.ts`
- `lib/fieldLabels.ts`
**Reports using it:**
- `app/api/reports/monthly/route.ts`

---

### `current_premium`
**Risk Level:** Medium

**Pages using it:**
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
**APIs modifying/reading it:**
- `lib/fieldLabels.ts`

---

### `renewal_premium`
**Risk Level:** Medium

**Pages using it:**
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`
- `app/(dashboard)/csr/renewals/[id]/page.tsx`
**APIs modifying/reading it:**
- `app/api/reports/monthly/route.ts`
- `app/api/update-stage/route.ts`
- `lib/emailTemplating.ts`
- `lib/fieldLabels.ts`
**Reports using it:**
- `app/api/reports/monthly/route.ts`
**Emails using it:**
- `lib/emailTemplating.ts`

---

### `reminder_sent`
**Risk Level:** Low

**APIs modifying/reading it:**
- `app/api/reminder-check/route.ts`
- `app/api/update-stage/route.ts`
**Notifications using it:**
- `app/api/reminder-check/route.ts`

---

### `business_name`
**Risk Level:** Low

**Pages using it:**
- `app/(dashboard)/csr/activity-log/page.tsx`
- `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/import/page.tsx`
- `app/(dashboard)/csr/renewals/commercial/page.tsx`
- `app/(dashboard)/csr/renewals/personal/import/page.tsx`
- `app/(dashboard)/csr/renewals/personal/page.tsx`

---

### `date_received`
**Risk Level:** Low

*No explicit references found in frontend/API code (May be used dynamically or via wildcard SQL).* 

---

### `send_email_to_client`
**Risk Level:** Low

**Pages using it:**
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`

---

### `total_premium`
**Risk Level:** High

**Pages using it:**
- `app/(dashboard)/accounting/all-leads/page.tsx`
- `app/(dashboard)/accounting/leads/[id]/page.tsx`
- `app/(dashboard)/accounting/page.tsx`
- `app/(dashboard)/csr/reports/page.tsx`
- `app/(dashboard)/superadmin/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/accounting/reports/ReportsClient.tsx`
**APIs modifying/reading it:**
- `app/api/reports/monthly/route.ts`
- `app/api/update-stage/route.ts`
**Reports using it:**
- `app/api/reports/monthly/route.ts`

---

### `status`
**Risk Level:** Medium

**Pages using it:**
- `app/(dashboard)/accounting/all-leads/page.tsx`
- `app/(dashboard)/accounting/page.tsx`
- `app/(dashboard)/csr/activity-log/page.tsx`
- `app/(dashboard)/csr/leads/[id]/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/[id]/page.tsx`
- `app/intake/[id]/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/accounting/reports/ReportsClient.tsx`
- `app/(dashboard)/superadmin/email-templates/EmailTemplatesClient.tsx`
- `components/email/EmailModal.tsx`
- `components/layout/TopBar.tsx`
- `components/pipeline/UpdateStageModal.tsx`
**APIs modifying/reading it:**
- `app/api/accounting/reconciliation/route.ts`
- `app/api/accounting/update-commission/route.ts`
- `app/api/accounting/verify-policy/route.ts`
- `app/api/delete-document/route.ts`
- `app/api/documents/route.ts`
- `app/api/documents/[id]/route.ts`
- `app/api/notify-submission/route.ts`
- `app/api/reminder-check/route.ts`
- `app/api/reports/monthly/route.ts`
- `app/api/send-email/route.ts`
- `app/api/superadmin/audit-logs/route.ts`
- `app/api/superadmin/email-templates/route.ts`
- `app/api/superadmin/form-templates/route.ts`
- `app/api/superadmin/pipelines/route.ts`
- `app/api/superadmin/pipelines/stages/route.ts`
- `app/api/superadmin/system-settings/route.ts`
- `app/api/superadmin/users/route.ts`
- `app/api/update-client/route.ts`
- `app/api/update-stage/route.ts`
- `app/api/upload-document/route.ts`
- `lib/microsoftGraph.ts`
**Reports using it:**
- `app/api/reports/monthly/route.ts`
**Emails using it:**
- `app/api/send-email/route.ts`
- `app/api/superadmin/email-templates/route.ts`
- `lib/microsoftGraph.ts`
**Notifications using it:**
- `app/api/reminder-check/route.ts`

---

### `current_stage`
**Risk Level:** Medium

**Pages using it:**
- `app/(dashboard)/accounting/all-leads/page.tsx`
- `app/(dashboard)/admin/csrs/[id]/page.tsx`
- `app/(dashboard)/admin/leads/new/page.tsx`
- `app/(dashboard)/admin/leads/page.tsx`
- `app/(dashboard)/admin/pipelines/page.tsx`
- `app/(dashboard)/csr/activity-log/page.tsx`
- `app/(dashboard)/csr/leads/new/page.tsx`
- `app/(dashboard)/csr/leads/page.tsx`
- `app/(dashboard)/csr/leads/[id]/page.tsx`
- `app/(dashboard)/csr/pipeline/commercial/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/new/page.tsx`
- `app/(dashboard)/csr/pipeline/personal/page.tsx`
- `app/(dashboard)/superadmin/page.tsx`
**Components displaying it:**
- `app/(dashboard)/admin/pipelines/PipelineClient.tsx`
- `components/layout/TopBar.tsx`
**APIs modifying/reading it:**
- `app/api/update-stage/route.ts`

---

### `accepted_at`
**Risk Level:** Low

*No explicit references found in frontend/API code (May be used dynamically or via wildcard SQL).* 

---

### `intake_email_sent`
**Risk Level:** Low

**APIs modifying/reading it:**
- `app/api/send-email/route.ts`
**Emails using it:**
- `app/api/send-email/route.ts`

---

### `effective_date`
**Risk Level:** High

**Pages using it:**
- `app/(dashboard)/accounting/leads/[id]/page.tsx`
- `app/(dashboard)/csr/reports/page.tsx`
**Components displaying it:**
- `app/(dashboard)/accounting/leads/[id]/LeadAccountingClient.tsx`
- `app/(dashboard)/accounting/reports/ReportsClient.tsx`
**APIs modifying/reading it:**
- `app/api/reports/monthly/route.ts`
- `app/api/update-stage/route.ts`
**Reports using it:**
- `app/api/reports/monthly/route.ts`

---

# IF A CLIENT REQUESTS A CHANGE, START BY CHECKING THESE FILES FIRST

When a change request arrives that modifies data structures, pipeline logic, or client schemas, these files act as the foundational entry points. Failing to update these safely will result in cascading failures across RLS, Middleware, and Type mappings.

### 1. The Gateway & Data Handlers
- **`lib/supabaseServer.ts`**: The core mutation gateway. Always verify if the client request introduces new schema limits here.
- **`app/api/update-stage/route.ts`**: The beating heart of the CRM. If a client wants a new pipeline rule (e.g., "Don't let them quote without X document"), it MUST be evaluated here.
### 2. Form Intakes (The Outer Boundary)
- **`components/forms/AutoInsuranceForm.tsx`** (and similar forms): If you add a database column like `secondary_email`, the unauthenticated intake boundary must be updated to capture and push it to `stage_metadata`.
### 3. User Experience & UI
- **`components/pipeline/UpdateStageModal.tsx`**: This dynamic component relies entirely on `mandatory_fields`. Any client request changing how agents "move" a lead must pass through this modal's local state validation.
- **`app/(dashboard)/layout.tsx`**: Handles the global Sidebar tracking role constraints natively. If a new user role (e.g., "Underwriter") is requested, start by updating the navigation boundaries here alongside `proxy.ts`.
### 4. Scheduled Automations
- **`app/api/reminder-check/route.ts`**: Changing SLA timelines (e.g., "Send reminders at 72 hours instead of 48") starts explicitly here.
- **`lib/microsoftGraph.ts`**: Any change to email deliverability, template parsing, or sender identities natively occurs strictly within this wrapper.
