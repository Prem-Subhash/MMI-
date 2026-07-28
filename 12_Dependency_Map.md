# 12. Exhaustive Dependency Map & Blast-Radius Analysis
**System Name:** Moonstar Enterprise Insurance, Mortgage & Commercial Lending CRM  

---

## 1. Architectural Dependency Matrix

Understanding the dependency tree is essential before refactoring or extending core utilities. The table below outlines the direct dependents and blast radius of the system's most foundational files:

| Core File | Primary Role | Direct Dependents (Who Imports/Calls It) | Blast Radius if Broken / Modified Carelessly |
| :--- | :--- | :--- | :--- |
| **`proxy.ts`** | Next.js Middleware handling auth & portal routing | Every single non-static HTTP request (`/csr`, `/admin`, `/lending`, `/mortgage`, `/api/*`) | **CATASTROPHIC (100% of App)**: Modifying path regexes or `accessMatrix` incorrectly can either lock all users out (`307 Infinite Redirects`) or expose admin/superadmin routes to unauthorized CSRs (`Security Breach`). |
| **`lib/supabaseServer.ts`** | Server-side Supabase factories (`createServer()`, `supabaseServer`) | All 18+ API routes (`app/api/*`) and all Server Component pages (`app/(dashboard)/*`, `app/lending/*`, `app/mortgage/*`) | **CRITICAL (90% of App)**: Breaking `createServer()` breaks all initial page data loads and causes SSR rendering failures (`500 Server Error`). Breaking `supabaseServer` breaks all admin API mutations. |
| **`utils/auth.ts`** | API authentication and role verification (`authenticateApiRequest`) | Every secure API route (`/api/update-stage`, `/api/send-email`, `/api/mortgage/loans`, `/api/upload-document`) | **CRITICAL (All Backend APIs)**: Modifying this function could cause every API route to return `401 Unauthorized` or skip role checks, disabling the entire mutation layer. |
| **`lib/supabaseClient.ts`** | Browser-side Supabase client (`supabaseClient`) | All client interactive components (`TopBar.tsx`, `EditClientModal.tsx`, `DocumentViewer.tsx`) | **HIGH (All Client UI Interactions)**: Breaks file preview URL generation, live notification updates, and client-side lookups. |
| **`lib/microsoftGraph.ts`** | Azure OAuth2 token and Graph API mailer | `/api/send-email/route.ts`, `/api/reminder-check/route.ts`, `/api/notify-submission/route.ts` | **HIGH (Communication Layer)**: Breaks all outbound intake links, quote delivery emails, and automated SLA reminders. |
| **`lib/ToastContext.tsx`** | Global notification context provider | Root `app/layout.tsx` + every interactive form/modal across all 3 portals | **MEDIUM (UI Feedback)**: Breaking the context provider throws `Unhandled Runtime Error: useToast must be used within ToastProvider` across all pages. |
| **`app/api/update-stage/route.ts`** | Master pipeline progression API | `components/pipeline/UpdateStageModal.tsx`, `Lending` & `Mortgage` pipeline drag/drop handlers | **HIGH (Core Workflow)**: Prevents CSRs and loan officers from advancing any leads across stages. |

---

## 2. Deep-Dive File Dependency Profiles

### 2.1 `proxy.ts` (Next.js Security Middleware)
```
[Browser HTTP Request] 
       │
       ▼
 ┌───────────┐         ┌────────────────────────────────────────────────────────┐
 │ proxy.ts  │ ──────► │ @supabase/ssr (exchanges cookies & refreshes tokens)   │
 └───────────┘         └────────────────────────────────────────────────────────┘
       │
       ▼ (Queries profiles table via supabaseAdmin)
 ┌──────────────────────────────────────────────────────────────────────────────┐
 │ Route Decision:                                                              │
 │  ├── If @moonstar.com OR portal_access == ['mortgage'] ─► /mortgage          │
 │  ├── If portal_access contains 'lending'               ─► /lending/dashboard │
 │  ├── If role in accessMatrix[role]                     ─► /csr, /admin, etc. │
 │  └── Else                                              ─► /unauthorized      │
 └──────────────────────────────────────────────────────────────────────────────┘
```
- **Dependencies**: `@supabase/ssr`, `lib/supabaseServer.ts` (`supabaseAdmin`).
- **Failure Modes**:
  - If `@supabase/ssr` cookies are improperly serialized in `response.cookies.set(...)`, the browser loses session context during page navigation, logging the user out every time they click a sidebar link.

---

### 2.2 `utils/auth.ts` (`authenticateApiRequest`)
```
[Any HTTP Request to /app/api/*]
       │
       ▼
 ┌────────────────────────┐      ┌──────────────────────────────────────────┐
 │ authenticateApiRequest │ ───► │ Checks Authorization Bearer Header       │
 └────────────────────────┘      └──────────────────────────────────────────┘
       │                                     │ (Fallback if no header)
       ▼                                     ▼
 ┌────────────────────────┐      ┌──────────────────────────────────────────┐
 │ Reads profiles table   │ ◄─── │ Checks @supabase/ssr Session Cookie      │
 └────────────────────────┘      └──────────────────────────────────────────┘
       │
       ▼
 [Returns { user, profile } OR { error, status: 401/403 }]
```
- **Dependencies**: `lib/supabaseServer.ts` (`createServer()`, `supabaseServer`).
- **Dependents**: Included at the top of every route handler:
  ```typescript
  import { authenticateApiRequest } from '@/utils/auth';
  // Inside GET/POST handler:
  const auth = await authenticateApiRequest(request, ['csr', 'admin', 'superadmin']);
  if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status });
  ```

---

### 2.3 `lib/microsoftGraph.ts` & `lib/emailTemplating.ts`
```
[/api/send-email] ──┐
                    ▼
[/api/reminder-check] ─► [emailTemplating.ts] (Merges {{client_name}} tags)
                    │           │
[/api/notify-sub] ──┘           ▼
                       [microsoftGraph.ts]
                                │
                                ▼
                   [Azure OAuth2 Token Endpoint]
                                │
                                ▼
                   [MS Graph /sendMail Endpoint]
                                │
                                ▼
                  [INSERT INTO email_logs table]
```
- **Failure Modes**: If Azure client secrets (`AZURE_CLIENT_SECRET`) expire inside Vercel environment variables, `getAccessToken()` throws `401 Unauthorized`, halting all client intake delivery and SLA cron jobs without breaking the UI dashboard.
