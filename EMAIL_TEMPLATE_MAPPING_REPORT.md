# EMAIL_TEMPLATE_MAPPING_REPORT

This report analyzes the architecture governing how `policy_type` values are mapped to Email Templates, focusing on template retrieval, grouping logic, and intake URL generation.

---

### 1. Template Loading by Policy Type

Unlike the Intake Engine, which uses a sophisticated mapping dictionary to group policies together, the Email Engine executes a **strict 1:1 string match query** against the database.

In `send-form/page.tsx`:
```typescript
const { data: templateData } = await supabase
  .from('email_templates')
  .eq('policy_type', formType)
```

Therefore, the templates are loaded as follows:
- **`home`** ➔ Queries templates where `policy_type = 'home'`
- **`condo`** ➔ Queries templates where `policy_type = 'condo'`
- **`umbrella`** ➔ Queries templates where `policy_type = 'umbrella'`
- **`landlord_home`** ➔ Queries templates where `policy_type = 'landlord_home'`
- **`auto`** ➔ Queries templates where `policy_type = 'auto'`
- **`motorcycle`** ➔ Queries templates where `policy_type = 'motorcycle'`

### 2. Do Multiple Policy Types Share Templates?

**No.** There is absolutely no mapping or sharing logic implemented for Email Templates. 
If a SuperAdmin creates a "Welcome Email" and assigns it to `home`, it will be completely invisible to a CSR who selects `condo` or `umbrella` from the dropdown. The SuperAdmin must manually clone and duplicate the template for every single property type in the database for it to be usable.

### 3. Policy to Email Template Matrix

| Policy Type | Email Template Queried | Email Group |
| :--- | :--- | :--- |
| **Home** | `home` | *None (Strict 1:1)* |
| **Condo** | `condo` | *None (Strict 1:1)* |
| **Landlord Home** | `landlord_home` | *None (Strict 1:1)* |
| **Landlord Condo**| `landlord_condo` | *None (Strict 1:1)* |
| **Umbrella** | `umbrella` | *None (Strict 1:1)* |
| **Auto** | `auto` | *None (Strict 1:1)* |
| **Motorcycle** | `motorcycle` | *None (Strict 1:1)* |
| **Commercial Auto**| `commercial_auto` | *None (Strict 1:1)* |

### 4. Intake URL Generation

The Intake URL is dynamically generated server-side in `app/api/send-email/route.ts` based on the exact strict string passed from the frontend state:
```typescript
const formLink = intakeId && formType && baseUrl 
  ? `${baseUrl}/intake/${intakeId}?type=${formType}` 
  : ''
```
If the CSR selected `condo`, the client receives: `.../intake/1234?type=condo`. 

*(Note: While the Intake system gracefully catches this `?type=condo` and internally resolves it back to `<HomeInsuranceForm />`, the email system remains fragmented).*

### 5. Representing Home + Auto as Groups

Yes! The most glaring architectural flaw is that the Email Engine does not mirror the Intake Engine's grouping model.

If the Email Engine simply imported the `formLayoutMap` from the Intake system:
`condo`, `umbrella`, and `landlord_home` would instantly collapse into the `HOME_GROUP`.
A multi-policy lead (Home + Condo + Auto) could easily be represented as a pure array of groups: `['home', 'auto']`.

### 6. Recommended Production-Ready Architecture

The simplest and most robust production architecture is **Mapping Unification**:

1. **Port the `formLayoutMap` Dictionary**: 
   Apply the exact same layout mapping from `app/intake/[id]/page.tsx` directly into `app/(dashboard)/csr/pipeline/personal/send-form/page.tsx`.
   
2. **Collapse Email Template Queries**:
   When a CSR tries to email a `condo` or `umbrella` client, the UI should resolve the `policy_type` to `home` and fetch the `home` email templates. This eliminates the need for SuperAdmins to maintain duplicate templates for sub-categories of property insurance.

3. **Multi-Policy Resolution**:
   For a true Multi-Policy email (Home + Auto), the UI should resolve the `lead_policies` array into a unique Set of groups (e.g. `Set('home', 'auto')`). 
   If `Set.size > 1`, the UI queries the database for dedicated combo templates (e.g., `policy_type = 'home_auto'`). 

This architecture guarantees that the Email Engine and the Intake Engine are speaking the exact same grouping language, dramatically reducing database clutter and simplifying the UI.
