import { StageCode } from './types';

export interface StageDefinition {
  code: StageCode;
  label: string;
  pipeline: 'NEW_LOAN' | 'PRE_APPROVAL';
  description: string;
  color: string;
  badgeBg: string;
  badgeText: string;
}

export const MORTGAGE_STAGES: StageDefinition[] = [
  // New Loan Pipeline
  {
    code: 'NEW_LOAN',
    label: 'NEW LOAN',
    pipeline: 'NEW_LOAN',
    description: 'Initial intake, borrower summary, and document intake',
    color: '#3B82F6',
    badgeBg: 'bg-blue-500/10 border-blue-500/20',
    badgeText: 'text-blue-400',
  },
  {
    code: 'SUBMIT_TO_UW',
    label: 'SUBMIT TO UW',
    pipeline: 'NEW_LOAN',
    description: 'Underwriting submission, wholesale lender, and rate lock details',
    color: '#8B5CF6',
    badgeBg: 'bg-purple-500/10 border-purple-500/20',
    badgeText: 'text-purple-400',
  },
  {
    code: 'INITIAL_COMPLIANCE',
    label: 'INITIAL COMPLIANCE',
    pipeline: 'NEW_LOAN',
    description: 'Initial disclosures, anti-predatory review, conditional approval, and orders',
    color: '#F59E0B',
    badgeBg: 'bg-amber-500/10 border-amber-500/20',
    badgeText: 'text-amber-400',
  },
  {
    code: 'FINAL_COMPLIANCE',
    label: 'FINAL COMPLIANCE',
    pipeline: 'NEW_LOAN',
    description: 'Second disclosures, appraisal sent, Closing Disclosure & CTC status',
    color: '#10B981',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/20',
    badgeText: 'text-emerald-400',
  },
  {
    code: 'CLOSING',
    label: 'CLOSING',
    pipeline: 'NEW_LOAN',
    description: 'Final interest rate, final loan amount, invoices & closing schedule',
    color: '#06B6D4',
    badgeBg: 'bg-cyan-500/10 border-cyan-500/20',
    badgeText: 'text-cyan-400',
  },
  {
    code: 'AUDIT',
    label: 'AUDIT',
    pipeline: 'NEW_LOAN',
    description: 'Closing document downloads, reconciliation, wires & audit sign-off',
    color: '#EC4899',
    badgeBg: 'bg-pink-500/10 border-pink-500/20',
    badgeText: 'text-pink-400',
  },

  // Pre-Approval Pipeline
  {
    code: 'PREAPPROVAL_LOAN',
    label: 'PRE-APPROVAL',
    pipeline: 'PRE_APPROVAL',
    description: 'Initial intake and borrower profile for pre-approval evaluation',
    color: '#6366F1',
    badgeBg: 'bg-indigo-500/10 border-indigo-500/20',
    badgeText: 'text-indigo-400',
  },
  {
    code: 'MANUAL_UW',
    label: 'MANUAL UW',
    pipeline: 'PRE_APPROVAL',
    description: 'Manual underwriting review, pre-approval amount & client letter delivery',
    color: '#14B8A6',
    badgeBg: 'bg-teal-500/10 border-teal-500/20',
    badgeText: 'text-teal-400',
  },
];

export function getStageConfig(stageCode: StageCode): StageDefinition {
  return (
    MORTGAGE_STAGES.find((s) => s.code === stageCode) || {
      code: stageCode,
      label: stageCode,
      pipeline: 'NEW_LOAN',
      description: '',
      color: '#6B7280',
      badgeBg: 'bg-gray-500/10 border-gray-500/20',
      badgeText: 'text-gray-400',
    }
  );
}

/**
 * Returns which specific field names belong to each stage so dynamic forms only display
 * the fields for the active stage (+ core summary info).
 */
export const STAGE_FIELD_GROUPS: Record<StageCode, string[]> = {
  NEW_LOAN: [
    'client_name',
    'phone',
    'email',
    'address',
    'state',
    'application_received',
    'application_received_date',
    'inquiry_date',
    'transaction_type',
    'loan_type',
    'estimated_property_value',
    'estimated_credit_score',
    'loan_term',
    'target_closing_date',
    'loan_officer_name',
    'processor_name',
    'all_documents_received',
    'missing_documents_list',
    'follow_up_date',
    'expected_commission',
    'additional_notes',
  ],
  SUBMIT_TO_UW: [
    'lender_name',
    'submission_date',
    'loan_amount',
    'moonstar_disclosure_sent',
    'lender_disclosure_sent',
    'received_all_uw_documents',
    'rate_locked',
    'interest_rate',
    'lock_expire_date',
  ],
  INITIAL_COMPLIANCE: [
    'moonstar_disclosure_signed_3day',
    'moonstar_disclosure_signed_date',
    'lender_disclosure_signed_3day',
    'lender_disclosure_signed_date',
    'anti_predatory_completed',
    'anti_predatory_completed_date',
    'conditionally_approved',
    'pending_conditions_text',
    'appraisal_ordered',
    'title_ordered',
    'condo_questionnaire_requested',
    'hoi_requested',
  ],
  FINAL_COMPLIANCE: [
    'moonstar_disclosure_2_signed',
    'moonstar_disclosure_2_signed_date',
    'appraisal_sent_to_client',
    'appraisal_sent_date',
    'cd_requested',
    'appraised_value_amount',
    'ctc_status',
    'cd_acknowledged',
    'closing_confirmation_received',
    'voe_cleared',
  ],
  CLOSING: [
    'credit_report_invoice_submitted',
    'condo_invoice_submitted',
    'final_interest_rate',
    'final_loan_amount',
    'final_cd_received',
    'closing_schedule',
  ],
  AUDIT: [
    'closing_docs_downloaded',
    'appraisal_downloaded',
    'title_report_downloaded',
    'moonstar_audit_completed',
    'title_check_received',
    'check_wire_amount_received',
    'client_refund_amount',
    'loan_log_updated',
  ],
  PREAPPROVAL_LOAN: [
    'client_name',
    'phone',
    'email',
    'address',
    'state',
    'application_received',
    'application_received_date',
    'inquiry_date',
    'transaction_type',
    'loan_type',
    'estimated_property_value',
    'estimated_credit_score',
    'loan_term',
    'target_closing_date',
    'loan_officer_name',
    'processor_name',
    'all_documents_received',
    'missing_documents_list',
    'follow_up_date',
    'expected_commission',
    'additional_notes',
  ],
  MANUAL_UW: [
    'uw_completed',
    'val_requested',
    'preapproval_amount',
    'down_payment_request',
    'preapproval_sent_to_client',
    'preapproval_sent_date',
  ],
};
