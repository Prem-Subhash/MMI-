# POLICY_TO_FORM_MAPPING_REPORT

This report analyzes the architecture governing how `policy_type` values are mapped to actual React components in the Intake Engine (`app/intake/[id]/page.tsx`), specifically focusing on Multi-Policy deduplication capabilities.

---

### 1. Supported Policy Types in the CRM

Based on the UI selection parameters and the `formLayoutMap` dictionary, the system explicitly supports the following Personal and Commercial policy types:
- `home`
- `condo`
- `landlord_home`
- `landlord_condo`
- `umbrella`
- `auto`
- `motorcycle`
- `commercial_auto`
- `home_auto` (Legacy Combo)
- *Unmapped Commercial Types*: `workers_comp`, `bop`, `commercial_property`, `general_liability`, `commercial_package`

### 2. Form Rendering Mappings

When the engine evaluates an active policy, it routes it to a specific layout group:

- **`home`** ➔ `<HomeInsuranceForm />`
- **`condo`** ➔ `<HomeInsuranceForm />`
- **`landlord_home`** ➔ `<HomeInsuranceForm />`
- **`landlord_condo`** ➔ `<HomeInsuranceForm />`
- **`umbrella`** ➔ `<HomeInsuranceForm />`
- **`auto`** ➔ `<AutoInsuranceForm />`
- **`motorcycle`** ➔ `<AutoInsuranceForm />`
- **`commercial_auto`** ➔ `<AutoInsuranceForm />`
- **`home_auto`** ➔ `<HomeInsuranceForm />` + `<AutoInsuranceForm />`

### 3. Duplicate Mappings Identified

The system intentionally heavily relies on duplicate mappings to group similar insurance products into generic underlying forms:
- **Property/Liability Group**: `home`, `condo`, `landlord_home`, `landlord_condo`, and `umbrella` all map identically to `home`, forcing the render of `<HomeInsuranceForm />`.
- **Vehicle Group**: `auto`, `motorcycle`, and `commercial_auto` all map to `auto`, forcing the render of `<AutoInsuranceForm />`.

### 4. Does Multi-Policy Render Duplicate Forms?

**No. The system correctly renders only one instance of a form.**
If a user requests `Home + Condo + Umbrella`, the engine evaluates the array: `['home', 'condo', 'umbrella']`.
All three values are mapped to the string `'home'` and pushed into the deduplication logic. The UI successfully renders a single `<HomeInsuranceForm />`.
If a user requests `Home + Auto + Umbrella`, the engine renders exactly one `<HomeInsuranceForm />` and exactly one `<AutoInsuranceForm />`.

### 5. Deduplication Logic Analysis

The `Set<string>` deduplication logic implemented in `app/intake/[id]/page.tsx` is **working perfectly** to achieve your explicitly stated goal.

```typescript
const resolvedLayouts = new Set<string>();
activePolicies.forEach(policy => {
  const layout = formLayoutMap[policy] || policy;
  resolvedLayouts.add(layout);
});
```
Because JavaScript `Set` data structures strictly enforce uniqueness, multiple policies collapsing to the same layout string (`'home'`) are instantly deduplicated. This ensures the client is never subjected to two identical React components stacked on top of each other.

### 6. Policy to Form Matrix

| Policy Type | Form Used | Unique Form Group |
| :--- | :--- | :--- |
| **Home** | `<HomeInsuranceForm />` | `HOME_GROUP` |
| **Condo** | `<HomeInsuranceForm />` | `HOME_GROUP` |
| **Landlord Home** | `<HomeInsuranceForm />` | `HOME_GROUP` |
| **Landlord Condo** | `<HomeInsuranceForm />` | `HOME_GROUP` |
| **Umbrella** | `<HomeInsuranceForm />` | `HOME_GROUP` |
| **Auto** | `<AutoInsuranceForm />` | `AUTO_GROUP` |
| **Motorcycle** | `<AutoInsuranceForm />` | `AUTO_GROUP` |
| **Commercial Auto** | `<AutoInsuranceForm />` | `AUTO_GROUP` |

### 7. Recommendations for Production Implementation

The current `Set<string>` architecture is mathematically sound and perfectly achieves the goal: **"One lead requesting multiple policies should only see each unique intake form once."**

**Recommendations for scaling:**
1. **Commercial Lines Gap:** Unmapped commercial policies (e.g., `workers_comp`) will currently bypass the `formLayoutMap`, get added to the `Set`, but fail to render any form because there is no `<WorkersCompForm />` component or `isWorkersCompLayout` boolean check in the JSX. You must explicitly map commercial lines to a `<CommercialIntakeForm />` and add the corresponding JSX block.
2. **Dynamic Sub-headers:** Because `Home + Umbrella` deduplicates into a single generic `<HomeInsuranceForm />`, the client might be confused about where to put Umbrella details. It is recommended to pass the original `activePolicies` array as a prop into the `<HomeInsuranceForm />` so it can dynamically render sub-headers (e.g., *"Please provide details for your Home and Umbrella policies"*). 

The deduplication core is flawless and production-ready.
