# EMAIL_SYSTEM_IMPACT_REPORT

This report analyzes the core email infrastructure (`send-form`, `EmailGenerator`, `send-email API`, and database tables) to identify technical bottlenecks and architecture solutions for Multi-Policy support.

---

### 1. Exact Assumptions Requiring a Single `policy_type`

The current email system is deeply hardcoded to expect a single policy string at every layer:

* **UI State (`send-form/page.tsx`)**: 
  - Hardcodes `const [formType, setFormType] = useState('home')`.
  - Filters the `email_templates` dropdown strictly by `.eq('policy_type', formType)`.
* **Component Rendering (`EmailGenerator.tsx`)**:
  - Computes policy card headers dynamically based on `formType === 'auto'`. 
  - Restricts the policy breakdown rows to a single `type` mapping.
* **Database Queries (`email_templates`)**:
  - The table relies on a `policy_type` string column to classify whether a template is for "home" or "auto".
* **Intake Form Generation (`temp_intake_forms`)**:
  - Inserts the generated form link URL with a singular `form_type` column requirement.
* **Link Compilation (`app/api/send-email/route.ts`)**:
  - Appends the query parameter `?type=${formType}` to the Intake URL string.

---

### 2. Requirements to Support (Home+Auto) & (Home+Auto+Umbrella)

To support multi-policy payloads, the system must bridge the gap between an array of policies `['home', 'auto', 'umbrella']` and a cohesive email document.

**Requirements:**
1. **Frontend**: The Send Email modal must intercept the `lead_policies` array and map it to a "Multi-Policy" state rather than a strict `home/auto` toggle.
2. **Database**: The `email_templates` and `temp_intake_forms` tables must recognize combination strings (e.g., `home_auto`) or generic fallback strings (e.g., `multi_policy`).
3. **EmailGenerator Component**: Must be updated to allow mixing row types (e.g., Row 1: Home Details, Row 2: Auto Details, Row 3: Umbrella Details) rather than forcing all rows to mirror the single `formType` state.

---

### 3. Architectural Comparison: Simplicity vs Scalability

#### Option A: Dynamic Template Composition
*(System fetches the Home template AND the Auto template, then concatenates the bodies: `Home Body + <hr> + Auto Body`)*
* **Pros**: Infinitely scalable. Automatically supports bizarre combinations (e.g., Motorcycle + Landlord Condo + Umbrella) without requiring Admins to create specific templates for them.
* **Cons**: **Highly complex to implement.** You would have to rewrite `EmailGenerator.tsx` to handle array-based React state for multiple concurrent templates. Furthermore, concatenated emails look robotic, featuring multiple introductions and redundant greetings.

#### Option B: Dedicated Combination Templates
*(Admins create specific templates assigned to combinations, e.g., `policy_type = 'home_auto'`)*
* **Pros**: **Extremely simple to implement.** Requires ZERO database schema changes. The `replaceTemplate` engine already supports rendering arrays of policies via the `{{policy_table}}` token. The email narratives remain cohesive and human-readable.
* **Cons**: Combinatorial explosion. If an agency supports 10 policy types, creating dedicated templates for every possible combination is impossible.

---

### 4. Recommended Production-Ready Architecture

I strongly recommend **Option B (Dedicated Combination Templates) combined with a Generic "Multi-Policy" Fallback.**

**Why it is the best approach:**
The CRM's existing `EmailGenerator` engine (`replaceTemplate`) is *already* capable of looping through multiple policies to build HTML tables. 

Instead of rewriting the entire system to dynamically stitch raw HTML strings together (Option A), you should:
1. **Implement "Combo Strings":** For common combinations, pass a joined string to the API: `['home', 'auto'].join('_') -> 'home_auto'`.
2. **Dedicated Templates:** Let agencies write beautiful, specific templates for their highest-volume combinations (e.g., `policy_type = 'home_auto'`). 
3. **Generic Fallback:** If a lead requests a rare combination (e.g., `home_auto_umbrella`), the UI passes `policy_type = 'multi_policy'`. The system fetches a generic "Multi-Policy" template, and the existing `{{policy_table}}` engine simply loops through the 3 policies to render the specific details cleanly inside the generic email shell. 

This requires no schema redesigns, minimal React refactoring, and provides the most professional output to the client.
