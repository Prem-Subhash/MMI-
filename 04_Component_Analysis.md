# 04. Exhaustive React Component Analysis
**System Name:** Moonstar Enterprise Insurance, Mortgage & Commercial Lending CRM  

---

## 1. Component Layer Architecture

The UI layer is organized cleanly by business domain inside the `components/` directory (`layout/`, `forms/`, `leads/`, `pipeline/`, `email/`, `lending/`, `mortgage/`, `ui/`). All interactive forms and modals are marked with `'use client'` and communicate with the backend via API route mutations (`fetch('/api/...')`) and `useToast()` notifications.

---

## 2. Layout Components (`components/layout/`)

### `TopBar.tsx`
- **Purpose**: Global application header rendered inside `DashboardClientLayout.tsx`. Displays active user profile name, role badge, portal switcher dropdown, real-time unread notifications (`user_notifications` table), and logout button.
- **Props**: `{ user: User | null; profile: Profile | null }`
- **State**: `isNotificationOpen` (boolean), `isProfileMenuOpen` (boolean), `notifications` (Array).
- **Hooks**: `useState()`, `useEffect()`, `useRouter()`, `useToast()`.
- **Business Logic**: On mount, queries `user_notifications` where `user_id = auth.uid() AND is_read = false`. When the user clicks the notification bell, marks them as read. When logging out, calls `supabase.auth.signOut()` and redirects to `/login`.
- **Dependencies**: `lucide-react`, `lib/supabaseClient`, `lib/ToastContext`.
- **Complexity**: **Medium** (Real-time notification polling & multi-portal routing logic).

### `Sidebar.tsx`
- **Purpose**: Main navigation sidebar for the **Innovative Insurance** portal. Dynamically renders navigation links (`/csr`, `/admin`, `/superadmin`, `/accounting`) based strictly on the user's `role` prop.
- **Props**: `{ role: string; isOpen: boolean; onClose: () => void }`
- **State**: `activePath` (string derived from `usePathname()`).
- **Hooks**: `usePathname()`.
- **Business Logic**: Hides admin/superadmin links if `role === 'csr'`. Highlights the currently active route using `Tailwind` conditional classes (`bg-brand/10 text-brand font-semibold`).
- **Dependencies**: `lucide-react`, `next/link`, `next/navigation`.
- **Complexity**: **Low** (Declarative role-based link filtering).

### `Footer.tsx`
- **Purpose**: Static footer displayed at the bottom of the portal selection landing page (`app/page.tsx`) and public intake forms (`app/intake/[id]/page.tsx`). Displays copyright, compliance disclaimers, and support contacts.
- **Props**: None.
- **Complexity**: **Low** (Pure presentation).

---

## 3. Pipeline & Stage Progression Components (`components/pipeline/`)

### `UpdateStageModal.tsx`
- **Purpose**: The core progression modal of the CRM. When a CSR clicks on a lead card to advance its stage, this modal fetches the target stage's mandatory requirements (`mandatory_fields` JSON array), presents conditional form inputs (`follow_up_date`, `quoted_premium`, `policy_number`, etc.), and validates input before allowing the transition.
- **Props**:
  ```typescript
  interface UpdateStageModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    currentStage: string;
    pipelineId: string;
    onSuccess: () => void;
  }
  ```
- **State**: `targetStageId` (string), `stageMetadata` (Record<string, any>), `remarks` (string), `isSubmitting` (boolean), `missingMandatory` (string[]).
- **Hooks**: `useState()`, `useEffect()`, `useToast()`.
- **Business Logic**:
  1. On mount or stage change, fetches `pipeline_stages` for the given `pipelineId`.
  2. Evaluates `mandatory_fields` against the current `lead` object and local `stageMetadata`.
  3. If required fields like `quoted_premium` or `ezlynx_updated` are empty or unchecked, displays warning banners and disables the submit button.
  4. On submission, sends POST payload containing `{ lead_id, target_stage_id, stage_metadata, remarks }` to `/api/update-stage`.
- **Dependencies**: `lucide-react`, `lib/ToastContext`, `components/ui/Loading`.
- **Complexity**: **High** (Dynamic form generation from JSONB metadata, state validation, and transactional API calling).

---

## 4. Client Intake & Line-of-Business Forms (`components/forms/`)

### `AutoInsuranceForm.tsx`, `HomeInsuranceForm.tsx`, `VehicleListForm.tsx`, `PrimaryApplicantForm.tsx`, `CoApplicantForm.tsx`, `AdditionalApplicantsForm.tsx`
- **Purpose**: Reusable domain-specific intake forms capturing granular insurance data (e.g., VIN numbers, driver license numbers, property square footage, roof construction type, coverage deductibles).
- **Props**: `{ initialData?: Record<string, any>; onChange: (data: Record<string, any>) => void; isReadOnly?: boolean }`
- **State**: Local form field state (`formData: Record<string, any>`).
- **Hooks**: `useState()`, `useEffect()`.
- **Business Logic**: Updates local state on every input change (`handleChange(e)`) and propagates the updated object to the parent via `onChange(updatedData)`. Enforces HTML5 and regex validation for phone numbers, emails, and VIN lengths.
- **Who Uses It**:
  - `components/ui/IntakeUI.tsx` (during public unauthenticated intake).
  - `components/leads/EditClientModal.tsx` (during CSR manual edits inside `/csr`).
- **Complexity**: **Medium** (Large multi-field state management and validation).

---

## 5. Client Management & Document Components (`components/leads/`)

### `EditClientModal.tsx`
- **Purpose**: Comprehensive tabbed modal enabling CSRs to edit core demographic details (`temp_leads_basics`), inspect policy histories, and update line-of-business intake data.
- **Props**: `{ isOpen: boolean; onClose: () => void; leadId: string; onUpdate: () => void }`
- **State**: `activeTab` ('demographics' | 'intake' | 'documents'), `clientData` (object), `isLoading` (boolean).
- **Hooks**: `useState()`, `useEffect()`, `useToast()`.
- **API Calls**: Calls `/api/update-client` on save.
- **Complexity**: **High** (Multi-tab orchestration, nested form updates, and document rendering).

### `DocumentViewer.tsx`
- **Purpose**: File previewer for declaration pages and closing files. Displays PDFs inside an `iframe` or renders images directly (`<img />`), generating signed storage URLs via `supabase.storage.from('documents').getPublicUrl()`.
- **Props**: `{ documents: Array<{ id: string; file_name: string; file_path: string }>; onDelete?: (id: string) => void }`
- **Complexity**: **Medium** (Storage URL handling and secure file deletion confirmation).

### `CategorySelectionModal.tsx`
- **Purpose**: Lightweight modal presented when clicking "New Lead". Allows the CSR to choose between **Personal Lines** and **Commercial Lines**, instantly routing to the appropriate creation form or pipeline.
- **Complexity**: **Low**.

---

## 6. Email & Communication Components (`components/email/`)

### `EmailModal.tsx` & `EmailGenerator.tsx`
- **Purpose**: Email composition and template preview system. Allows CSRs to select pre-configured templates (`email_templates` table), automatically populates merge tags (`{{client_name}}`, `{{intake_link}}`, `{{quote_amount}}`), allows rich text editing, and dispatches via MS Graph.
- **Props**: `{ isOpen: boolean; onClose: () => void; lead: Lead; defaultTemplateId?: string }`
- **State**: `selectedTemplateId` (string), `subject` (string), `body` (string), `isSending` (boolean).
- **Hooks**: `useState()`, `useEffect()`, `useToast()`.
- **Business Logic**: When `selectedTemplateId` changes, invokes `lib/emailTemplating.ts` to substitute placeholder tokens with actual values from the `lead` prop. On submit, sends POST request to `/api/send-email`. UPon success, automatically sets `lead.follow_up_date` to `CURRENT_TIMESTAMP + 48 hours` to establish SLA tracking.
- **Complexity**: **High** (Dynamic template merging, rich text preview, and Azure Graph integration).

---

## 7. Accurate Lending Components (`components/lending/`)

### `SectionELenderInfo.tsx`
- **Purpose**: Multi-bank management interface rendered inside `/lending/loans/[id]`. Enables commercial loan officers and underwriters to add, edit, and reorder multiple participating lender banks (`lending_bank_assignments`), tracking bank officer contact info, underwriter names, title agencies, and closing agents.
- **Props**: `{ loanId: string; assignments: BankAssignment[]; onUpdate: () => void }`
- **State**: `assignmentsList` (Array), `editingBankId` (string | null), `isSubmitting` (boolean).
- **API Calls**: Direct mutations on `lending_bank_assignments` table or via `/api/lending/*`.
- **Complexity**: **High** (Dynamic array sorting, multi-bank CRUD operations within a single parent modal).

### `TermSheetReceivedStageUI.tsx`
- **Purpose**: Specialized stage component for Stage 5 (`Term Sheet Received`). Displays comparison cards across participating banks (`term_amount`, `interest_rate`, `term_months`), allowing underwriters to mark specific bank offers as `'Accepted'` or `'In Review'`, while managing uploaded term sheet PDFs (`lending_documents`).
- **Complexity**: **High** (Comparative financial presentation and document status management).

---

## 8. Generic UI Primitives (`components/ui/`)

### `Loading.tsx`
- **Purpose**: Animated spinner (`lucide-react` Loader2 with `animate-spin`) rendered during async data fetching across modals and pages.
- **Complexity**: **Low**.

### `Toast.tsx` (`lib/ToastContext.tsx`)
- **Purpose**: Floating notification system (`showToast(message, type: 'success' | 'error' | 'info')`) rendering at the top-right of the viewport with Framer Motion slide-in transitions.
- **Complexity**: **Medium** (React Context provider, auto-dismiss timers, and animation orchestration).

### `IntakeUI.tsx`
- **Purpose**: Master container for the public unauthenticated intake flow (`app/intake/[id]/page.tsx`). Manages multi-step navigation between personal details, vehicle lists, property structures, and file uploads.
- **Complexity**: **High** (Multi-step wizard state management and public storage uploads).
