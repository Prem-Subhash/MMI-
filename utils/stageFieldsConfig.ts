export type FieldConfig = {
  label: string
  type: string
  required?: boolean
  options?: string[]
}

// ==========================================
// PERSONAL LINES (NEW BUSINESS) FIELDS
// ==========================================
export const PERSONAL_NEW_BUSINESS_FIELDS: Record<string, Record<string, FieldConfig>> = {
  'Quoting in Progress': {
    target_completion_date: { label: 'Target Date', type: 'date', required: true },
    info_received: { label: 'Docs Received?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    docs_saved: { label: 'Docs Saved?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Quote Has Been Emailed': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    finalized_quote: { label: 'Quote Finalized?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    carrier_quote_sent: { label: 'Quoted Carrier', type: 'text', required: true },
    quoted_premium: { label: 'Quoted Premium', type: 'number', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Consent Letter Sent': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    payment_method: { label: 'Payment Method', type: 'dropdown', options: ['CC', 'ACH', 'ESCROW'], required: true },
    payment_frequency: { label: 'Payment Frequency', type: 'dropdown', options: ['Full', '2-Pay', '4-Pay', 'Monthly'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed': {
    insurance_company_id: { label: 'Insurance Company', type: 'insurance_company', required: true },
    policy_number: { label: 'Policy Number', type: 'text', required: true },
    bound_premium: { label: 'Bound Premium', type: 'number', required: true },
    expected_commission: { label: 'Commission', type: 'commission', required: true },
    docs_saved: { label: 'Docs Saved?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    policy_docs_sent: { label: 'Docs Sent?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Did Not Bind': {
    reason_not_bound: { label: 'Reason Not Bound', type: 'text', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  }
}

// ==========================================
// PERSONAL LINES RENEWAL FIELDS
// ==========================================
export const PERSONAL_RENEWAL_FIELDS: Record<string, Record<string, FieldConfig>> = {
  'Quoting in Progress': {
    ezlynx_updated: { label: 'EZLynx Updated?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Same Declaration Emailed': {
    quoted_multiple_carriers: { label: 'Quoted Multiple Carriers?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    autopay_setup: { label: 'Autopay Setup?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed (Same)': {
    insurance_company_id: { label: 'Insurance Company', type: 'insurance_company', required: true },
    paid_for_renewal: { label: 'Policy Paid?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Quote Has Been Emailed': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    quote_finalized: { label: 'Quote Finalized?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    carrier_quote_sent: { label: 'Quoted Carrier', type: 'text', required: true },
    quoted_premium: { label: 'Quoted Premium', type: 'number', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Consent Letter Sent': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    payment_method: { label: 'Payment Method', type: 'dropdown', options: ['CC', 'ACH', 'ESCROW'], required: true },
    payment_frequency: { label: 'Payment Frequency', type: 'dropdown', options: ['Full', '2-Pay', '4-Pay', 'Monthly'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed (Switch)': {
    insurance_company_id: { label: 'Insurance Company', type: 'insurance_company', required: true },
    new_carrier: { label: 'New Carrier Name', type: 'text', required: true },
    new_policy_number: { label: 'New Policy Number', type: 'text', required: true },
    new_premium: { label: 'New Bound Premium', type: 'number', required: true },
    expected_commission: { label: 'Commission', type: 'commission', required: true },
    docs_saved_ezlynx: { label: 'Docs Saved?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    docs_sent_to_client: { label: 'Docs Sent?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    cancelled_prev_carrier: { label: 'Prior Term Cancelled?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Cancelled': {
    cancellation_reason: { label: 'Cancellation Reason', type: 'text', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  }
}

// ==========================================
// COMMERCIAL LINES FIELDS
// ==========================================
export const COMMERCIAL_LINES_FIELDS: Record<string, Record<string, FieldConfig>> = {
  'Quoting in Progress': {
    target_completion_date: { label: 'Target Date', type: 'date', required: true },
    required_documents_received: { label: 'Docs Received?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    documents_saved_filecenter: { label: 'Docs Saved?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Quote Has Been Emailed': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    finalized_quote: { label: 'Quote Finalized?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    carrier_name: { label: 'Quoted Carrier', type: 'text', required: true },
    quoted_premium: { label: 'Quoted Premium', type: 'number', required: true },
    agency_fees: { label: 'Agency Fee', type: 'number', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Consent Letter Sent': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    payment_method: { label: 'Payment Method', type: 'dropdown', options: ['CC', 'ACH', 'ESCROW'], required: true },
    payment_frequency: { label: 'Payment Frequency', type: 'dropdown', options: ['Full', '2-Pay', '4-Pay', 'Monthly'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed': {
    insurance_company_id: { label: 'Insurance Company', type: 'insurance_company', required: true },
    policy_number: { label: 'Policy Number', type: 'text', required: true },
    bound_premium: { label: 'Bound Premium', type: 'number', required: true },
    expected_commission: { label: 'Commission', type: 'commission', required: true },
    agency_fees: { label: 'Agency Fee', type: 'number', required: true },
    policy_docs_saved: { label: 'Docs Saved?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    docs_sent_to_client: { label: 'Docs Sent?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Did Not Bind': {
    reason_not_bound: { label: 'Reason Not Bound', type: 'text', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  }
}

// ==========================================
// COMMERCIAL RENEWAL FIELDS
// ==========================================
export const COMMERCIAL_RENEWAL_FIELDS: Record<string, Record<string, FieldConfig>> = {
  'Quoting in Progress': {
    business_profile_updated_ezlynx: { label: 'EZLynx Updated?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Same Declaration Emailed': {
    quoted_multiple_carriers: { label: 'Quoted Multiple Carriers?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    autopay_enabled: { label: 'Autopay Enabled?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    agency_fee: { label: 'Agency Fee', type: 'number', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed (Same)': {
    insurance_company_id: { label: 'Insurance Company', type: 'insurance_company', required: true },
    policy_paid: { label: 'Policy Paid?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Quote Has Been Emailed': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    finalized_quote: { label: 'Quote Finalized?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    carrier_name: { label: 'Quoted Carrier', type: 'text', required: true },
    quoted_premium: { label: 'Quoted Premium', type: 'number', required: true },
    agency_fee: { label: 'Agency Fee', type: 'number', required: true },
    savings_amount: { label: 'Savings', type: 'number', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Consent Letter Sent': {
    follow_up_date: { label: 'Follow-up Date', type: 'date', required: true },
    payment_method: { label: 'Payment Method', type: 'dropdown', options: ['CC', 'ACH', 'ESCROW'], required: true },
    payment_frequency: { label: 'Payment Frequency', type: 'dropdown', options: ['Full', '2-Pay', '4-Pay', 'Monthly'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Completed (Switch)': {
    insurance_company_id: { label: 'Insurance Company', type: 'insurance_company', required: true },
    new_carrier: { label: 'New Carrier Name', type: 'text', required: true },
    new_policy_number: { label: 'New Policy Number', type: 'text', required: true },
    new_premium: { label: 'New Bound Premium', type: 'number', required: true },
    expected_commission: { label: 'Commission', type: 'commission', required: true },
    agency_fee: { label: 'Agency Fee', type: 'number', required: true },
    policy_docs_saved: { label: 'Docs Saved?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    docs_sent_to_client: { label: 'Docs Sent?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    cancelled_previous_carrier: { label: 'Prior Term Cancelled?', type: 'dropdown', options: ['Yes', 'No'], required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  },
  'Cancelled': {
    cancellation_reason: { label: 'Cancellation Reason', type: 'text', required: true },
    notes: { label: 'Notes/Details', type: 'textarea' }
  }
}
