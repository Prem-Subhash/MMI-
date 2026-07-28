export type PipelineType = 'NEW_LOAN' | 'PRE_APPROVAL';

export type StageCode =
  | 'NEW_LOAN'
  | 'SUBMIT_TO_UW'
  | 'INITIAL_COMPLIANCE'
  | 'FINAL_COMPLIANCE'
  | 'CLOSING'
  | 'AUDIT'
  | 'PREAPPROVAL_LOAN'
  | 'MANUAL_UW';

export interface MortgageLoan {
  id: string;
  pipeline_type: PipelineType;
  stage: StageCode;

  // Summary / Master Grid Columns (A - U)
  client_name: string;
  phone: string;
  email: string;
  address?: string;
  state: string;
  application_received: 'Y' | 'N';
  application_received_date?: string;
  inquiry_date: string;
  transaction_type: string;
  loan_type: string;
  estimated_property_value?: number;
  estimated_credit_score?: number;
  loan_term: string;
  target_closing_date?: string;
  loan_officer_name: string;
  processor_name?: string;
  assigned_mortgage_officer?: string;
  all_documents_received: 'Y' | 'N';
  missing_documents_list?: string;
  follow_up_date?: string;
  expected_commission?: number;
  additional_notes?: string;

  // Pre-Approval Specific Columns (Stage 2: MANUAL UW)
  uw_completed: 'Y' | 'N';
  val_requested: 'Y' | 'N';
  preapproval_amount?: number;
  down_payment_request?: number;
  preapproval_sent_to_client: 'Y' | 'N';
  preapproval_sent_date?: string;

  // New Loan Pipeline Stage 2: SUBMIT TO UW
  lender_name?: string;
  submission_date?: string;
  loan_amount?: number;
  moonstar_disclosure_sent: 'Y' | 'N';
  lender_disclosure_sent: 'Y' | 'N';
  received_all_uw_documents: 'Y' | 'N';
  rate_locked: 'Y' | 'N';
  interest_rate?: number;
  lock_expire_date?: string;

  // New Loan Pipeline Stage 3: INITIAL COMPLIANCE
  moonstar_disclosure_signed_3day: 'Y' | 'N';
  moonstar_disclosure_signed_date?: string;
  lender_disclosure_signed_3day: 'Y' | 'N';
  lender_disclosure_signed_date?: string;
  anti_predatory_completed: 'Y' | 'N' | 'NA';
  anti_predatory_completed_date?: string;
  conditionally_approved: 'Y' | 'N';
  pending_conditions_text?: string;
  appraisal_ordered: 'Y' | 'N' | 'NA';
  title_ordered: 'Y' | 'N';
  condo_questionnaire_requested: 'Y' | 'N' | 'NA';
  hoi_requested: 'Y' | 'N' | 'NA';

  // New Loan Pipeline Stage 4: FINAL COMPLIANCE
  moonstar_disclosure_2_signed: 'Y' | 'N';
  moonstar_disclosure_2_signed_date?: string;
  appraisal_sent_to_client: 'Y' | 'N' | 'NA';
  appraisal_sent_date?: string;
  cd_requested: 'Y' | 'N';
  appraised_value_amount?: number;
  ctc_status: 'Y' | 'N';
  cd_acknowledged: 'Y' | 'N';
  closing_confirmation_received: 'Y' | 'N';
  voe_cleared: 'Y' | 'N';

  // New Loan Pipeline Stage 5: CLOSING
  credit_report_invoice_submitted: 'Y' | 'N';
  condo_invoice_submitted: 'Y' | 'N' | 'NA';
  final_interest_rate?: number;
  final_loan_amount?: number;
  final_cd_received: 'Y' | 'N';
  closing_schedule?: string;

  // New Loan Pipeline Stage 6: AUDIT
  closing_docs_downloaded: 'Y' | 'N';
  appraisal_downloaded: 'Y' | 'N';
  title_report_downloaded: 'Y' | 'N';
  moonstar_audit_completed: 'Y' | 'N';
  title_check_received: 'Y' | 'N';
  check_wire_amount_received?: number;
  client_refund_amount?: number;
  loan_log_updated: 'Y' | 'N';

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalLoans: number;
  newLoansCount: number;
  preApprovalsCount: number;
  loansClosingCount: number;
  loansInAuditCount: number;
  upcomingFollowUpsCount: number;
  totalProjectedCommission: number;
  stageDistribution: { stage: StageCode; name: string; count: number; volume: number }[];
  loanOfficerSummary: { name: string; count: number; commission: number }[];
  processorSummary: { name: string; count: number }[];
  recentApplications: MortgageLoan[];
  upcomingFollowUps: MortgageLoan[];
}

export interface MortgageStageHistory {
  id: string;
  loan_id: string;
  previous_stage: StageCode | string;
  current_stage: StageCode | string;
  updated_by: string;
  remarks?: string;
  stage_data?: Record<string, any>;
  changed_at: string;
}
