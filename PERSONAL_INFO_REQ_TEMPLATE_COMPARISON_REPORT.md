# PERSONAL_INFO_REQ_TEMPLATE_COMPARISON_REPORT

This report analyzes all active database templates where `name = 'info_req'` and `insurance_category = 'personal'` to determine differences in wording and the safety of consolidating them.

---

### SECTION A: Template Comparison Matrix

| Policy Type | Subject | PDF Wording? | Reply All Footer? | Unique Section |
| :--- | :--- | :--- | :--- | :--- |
| **Home / Condo / Landlord** | Information Needed to Prepare Your Insurance Quote | Yes | Yes | Property Insurance Details (Deed/Current Policy) |
| **Auto / Motorcycle** | Information Needed to Prepare Your Insurance Quote | Yes | Yes | Driver & Vehicle Information (VINs/Licenses) |
| **Umbrella** | Information Needed to Prepare Your Insurance Quote | Yes | Yes | Umbrella Coverage Details (Underlying policies) |

*(Note: The subjects and introductions are 100% identical across all templates: "Dear [Client Name]... Thank you for reaching out...")*

---

### SECTION B: Differences & Analysis Findings

**1. Are all Personal Lines info_req templates identical?**
**No.** They all share an identical introduction, identical "Additional Information Form" section, and identical conclusion, but they differ in what they specifically ask the client to provide in "Section 1".

**2. Which templates have unique wording?**
- Property types request: *"A copy of your current property insurance policy OR a copy of the purchase agreement"*
- Vehicle types request: *"Driver’s licenses for all household drivers... Vehicle Identification Numbers (VINs)"*
- Umbrella requests: *"A copy of your current underlying home and auto insurance declaration pages"*

**3. Which templates already contain PDF language?**
**All of them.** They all contain the exact paragraph: 
*"For your convenience, we have attached a fillable PDF form that collects additional details needed to ensure quote accuracy."*

**4. Which templates already contain intake-link language?**
**None.** The `{{form_link}}` variable is currently missing from the raw text in the database (it is injected by the EmailGenerator dynamically, but the surrounding text still references a PDF).

**5. Which templates contain the Reply All footer?**
**All of them.** They all end with the identical string:
*"To respond to this email, please select 'REPLY ALL' to notify everyone. We are committed to providing you with excellent service!"*

**6. Can a single standardized template safely replace all of them?**
**YES.** 
Because the new Intake Portal is dynamic and automatically renders the exact questions needed for Home, Auto, or Umbrella, the email no longer needs to explicitly list the document requirements. The email can simply direct the user to the Intake Portal, which will naturally ask them for their VINs or Property Addresses.

---

### SECTION C: Recommended Update Strategy

Because the differences are minimal and completely mitigated by the new Intake Portal's capabilities, **all 7+ Personal Lines templates can be safely collapsed into a single standardized text.**

**Target Standardized Body:**
```html
Hi {{client_name}},<br><br>
Thank you for reaching out to Innovative Insurance. We appreciate the opportunity to assist you and look forward to preparing a competitive and accurate insurance quote tailored to your needs.<br><br>
To proceed, we kindly ask that you complete our secure online intake portal. This portal will guide you through exactly what details and documents are needed to ensure your quote is completely accurate.<br><br>
{{form_link}}<br><br>
Thank you once again for considering Innovative Insurance. If you have any questions or need assistance completing the portal, please feel free to reach out.<br><br>
Thank you,<br>
Moonstar Insurance Team
```

**Implementation Steps:**
1. Execute an `UPDATE` query on all `info_req` templates where `insurance_category = 'personal'`, replacing their fragmented bodies with the exact HTML string above. 
2. This will instantly eliminate the PDF wording, eliminate the Reply All footer, and seamlessly support Multi-Policy leads without requiring specific Home vs Auto wording in the email body itself.
