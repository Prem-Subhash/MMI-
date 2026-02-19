/* =========================================================
   CONSTANTS — MUST MATCH PDF EXACTLY
   Source: Innovative Insurance Questionnaire (Home + Auto)
   ========================================================= */

/* ---------- EDUCATION (Primary / Co / Additional Applicants) ---------- */
export const EDUCATION_OPTIONS = [
  'High School',
  'Currently in College',
  'College Degree',
  'Graduate Degree',
]

/* ---------- BASEMENT TYPE (Home Insurance) ---------- */
export const BASEMENT_TYPES = [
  'Unfinished',
  'Partially Finished',
  'Finished',
]

/* ---------- YES / NO OPTIONS (Checkboxes in PDF) ---------- */
export const YES_NO_OPTIONS = [
  { label: 'Yes', value: 'yes' },
  { label: 'No', value: 'no' },
]

/* ---------- VEHICLE PRIMARY USE (Auto Section Table) ---------- */
export const VEHICLE_PRIMARY_USE = [
  'Pleasure (< 5000 Miles)',
  'Commute',
  'Work',
]

/* ---------- ESTIMATED ANNUAL MILES (Auto Section Table) ---------- */
export const ANNUAL_MILES_OPTIONS = [
  '< 5000',
  '5000 - 5999',
  '6000 - 6999',
  '7000 - 7999',
  '8000 - 8999',
  '9000 - 9999',
  '> 10000',
]

/* ---------- PAYMENT METHOD (Later: Consent / Escrow logic) ---------- */
export const PAYMENT_METHODS = [
  'Credit Card',
  'ACH',
  'Escrow',
]

/* ---------- CLAIMS TIME RANGE (PDF wording preserved) ---------- */
export const CLAIM_TIME_RANGE = 'last 5 years'
