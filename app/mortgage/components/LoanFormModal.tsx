'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Layers, AlertCircle, User, Phone, Mail, Calendar } from 'lucide-react';
import { MortgageLoan, PipelineType, StageCode } from '@/app/mortgage/lib/types';
import { MORTGAGE_STAGES, getStageConfig } from '@/app/mortgage/lib/stageFields';
import {
  EXCEL_TRANSACTION_TYPES,
  EXCEL_LOAN_TYPES,
  EXCEL_LOAN_TERMS,
  EXCEL_WHOLESALE_LENDERS,
  EXCEL_LOAN_OFFICERS,
  EXCEL_PROCESSORS,
} from '@/app/mortgage/lib/excelLookups';
import StageHistorySection from './StageHistorySection';

interface LoanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (loan: MortgageLoan) => void;
  initialLoan?: MortgageLoan | null;
  defaultPipelineType?: PipelineType;
}

export default function LoanFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialLoan,
  defaultPipelineType = 'NEW_LOAN',
}: LoanFormModalProps) {
  const isEditing = !!initialLoan;

  const [pipelineType, setPipelineType] = useState<PipelineType>(
    initialLoan?.pipeline_type || defaultPipelineType
  );
  const [stage, setStage] = useState<StageCode>(
    initialLoan?.stage || (defaultPipelineType === 'PRE_APPROVAL' ? 'PREAPPROVAL_LOAN' : 'NEW_LOAN')
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageRemarks, setStageRemarks] = useState('');

  // Track if "Other (Manual Input)" mode is active for each dropdown
  const [manualInputModes, setManualInputModes] = useState<Record<string, boolean>>({});

  // Form Fields State (no automatic dropdown defaults!)
  const [formData, setFormData] = useState<Partial<MortgageLoan>>({
    client_name: '',
    phone: '',
    email: '',
    address: '',
    state: 'CA',
    application_received: 'N',
    application_received_date: '',
    inquiry_date: new Date().toISOString().split('T')[0],
    transaction_type: '',
    loan_type: '',
    estimated_property_value: undefined,
    estimated_credit_score: undefined,
    loan_term: '',
    target_closing_date: '',
    loan_officer_name: '',
    processor_name: '',
    all_documents_received: 'N',
    missing_documents_list: '',
    follow_up_date: '',
    expected_commission: undefined,
    additional_notes: '',

    // Pre-Approval Stage 2
    uw_completed: 'N',
    val_requested: 'N',
    preapproval_amount: undefined,
    down_payment_request: undefined,
    preapproval_sent_to_client: 'N',
    preapproval_sent_date: '',

    // New Loan Stage 2
    lender_name: '',
    submission_date: '',
    loan_amount: undefined,
    moonstar_disclosure_sent: 'N',
    lender_disclosure_sent: 'N',
    received_all_uw_documents: 'N',
    rate_locked: 'N',
    interest_rate: undefined,
    lock_expire_date: '',

    // New Loan Stage 3
    moonstar_disclosure_signed_3day: 'N',
    moonstar_disclosure_signed_date: '',
    lender_disclosure_signed_3day: 'N',
    lender_disclosure_signed_date: '',
    anti_predatory_completed: 'NA',
    anti_predatory_completed_date: '',
    conditionally_approved: 'N',
    pending_conditions_text: '',
    appraisal_ordered: 'NA',
    title_ordered: 'N',
    condo_questionnaire_requested: 'NA',
    hoi_requested: 'NA',

    // New Loan Stage 4
    moonstar_disclosure_2_signed: 'N',
    moonstar_disclosure_2_signed_date: '',
    appraisal_sent_to_client: 'NA',
    appraisal_sent_date: '',
    cd_requested: 'N',
    appraised_value_amount: undefined,
    ctc_status: 'N',
    cd_acknowledged: 'N',
    closing_confirmation_received: 'N',
    voe_cleared: 'N',

    // New Loan Stage 5
    credit_report_invoice_submitted: 'N',
    condo_invoice_submitted: 'NA',
    final_interest_rate: undefined,
    final_loan_amount: undefined,
    final_cd_received: 'N',
    closing_schedule: '',

    // New Loan Stage 6
    closing_docs_downloaded: 'N',
    appraisal_downloaded: 'N',
    title_report_downloaded: 'N',
    moonstar_audit_completed: 'N',
    title_check_received: 'N',
    check_wire_amount_received: undefined,
    client_refund_amount: undefined,
    loan_log_updated: 'N',
  });

  useEffect(() => {
    if (initialLoan) {
      setPipelineType(initialLoan.pipeline_type);
      setStage(initialLoan.stage);
      setFormData({ ...initialLoan });

      const modes: Record<string, boolean> = {};
      if (initialLoan.transaction_type && !EXCEL_TRANSACTION_TYPES.includes(initialLoan.transaction_type as any)) {
        modes.transaction_type = true;
      }
      if (initialLoan.loan_type && !EXCEL_LOAN_TYPES.includes(initialLoan.loan_type as any)) {
        modes.loan_type = true;
      }
      if (initialLoan.loan_term && !EXCEL_LOAN_TERMS.includes(initialLoan.loan_term as any)) {
        modes.loan_term = true;
      }
      if (initialLoan.loan_officer_name && !EXCEL_LOAN_OFFICERS.includes(initialLoan.loan_officer_name as any)) {
        modes.loan_officer_name = true;
      }
      if (initialLoan.processor_name && !EXCEL_PROCESSORS.includes(initialLoan.processor_name as any)) {
        modes.processor_name = true;
      }
      if (initialLoan.lender_name && !EXCEL_WHOLESALE_LENDERS.includes(initialLoan.lender_name as any)) {
        modes.lender_name = true;
      }
      setManualInputModes(modes);
    } else {
      const initPipeline = defaultPipelineType;
      setPipelineType(initPipeline);
      setStage(initPipeline === 'PRE_APPROVAL' ? 'PREAPPROVAL_LOAN' : 'NEW_LOAN');
      setManualInputModes({});
      setFormData({
        client_name: '',
        phone: '',
        email: '',
        address: '',
        state: 'CA',
        application_received: 'N',
        application_received_date: '',
        inquiry_date: new Date().toISOString().split('T')[0],
        transaction_type: '',
        loan_type: '',
        estimated_property_value: undefined,
        estimated_credit_score: undefined,
        loan_term: '',
        target_closing_date: '',
        loan_officer_name: '',
        processor_name: '',
        all_documents_received: 'N',
        missing_documents_list: '',
        follow_up_date: '',
        expected_commission: undefined,
        additional_notes: '',
        uw_completed: 'N',
        val_requested: 'N',
        preapproval_sent_to_client: 'N',
        lender_name: '',
        moonstar_disclosure_sent: 'N',
        lender_disclosure_sent: 'N',
        received_all_uw_documents: 'N',
        rate_locked: 'N',
        moonstar_disclosure_signed_3day: 'N',
        lender_disclosure_signed_3day: 'N',
        anti_predatory_completed: 'NA',
        conditionally_approved: 'N',
        appraisal_ordered: 'NA',
        title_ordered: 'N',
        condo_questionnaire_requested: 'NA',
        hoi_requested: 'NA',
        moonstar_disclosure_2_signed: 'N',
        appraisal_sent_to_client: 'NA',
        cd_requested: 'N',
        ctc_status: 'N',
        cd_acknowledged: 'N',
        closing_confirmation_received: 'N',
        voe_cleared: 'N',
        credit_report_invoice_submitted: 'N',
        condo_invoice_submitted: 'NA',
        final_cd_received: 'N',
        closing_docs_downloaded: 'N',
        appraisal_downloaded: 'N',
        title_report_downloaded: 'N',
        moonstar_audit_completed: 'N',
        title_check_received: 'N',
        loan_log_updated: 'N',
      });
    }
  }, [initialLoan, defaultPipelineType, isOpen]);

  if (!isOpen) return null;

  const availableStages = MORTGAGE_STAGES.filter((s) => s.pipeline === pipelineType);

  const handleFieldChange = (field: keyof MortgageLoan, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDropdownChange = (
    field: keyof MortgageLoan,
    value: string,
    standardOptions: readonly string[]
  ) => {
    if (value === 'Other (Manual Input)') {
      setManualInputModes((prev) => ({ ...prev, [field]: true }));
      handleFieldChange(field, '');
    } else {
      setManualInputModes((prev) => ({ ...prev, [field]: false }));
      handleFieldChange(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (stage === 'NEW_LOAN' || stage === 'PREAPPROVAL_LOAN' || !isEditing) {
      if (!formData.client_name || !formData.phone || !formData.email) {
        setError('Client Name, Phone, and Email are required.');
        return;
      }
    }

    try {
      setSubmitting(true);
      const url = isEditing
        ? `/api/mortgage/loans/${initialLoan.id}`
        : `/api/mortgage/loans`;
      const method = isEditing ? 'PUT' : 'POST';

      const cleanedData: Record<string, any> = { ...formData };
      Object.keys(cleanedData).forEach((k) => {
        if (typeof cleanedData[k] === 'string' && cleanedData[k].trim() === '') {
          cleanedData[k] = null;
        }
      });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...cleanedData,
          pipeline_type: pipelineType,
          stage,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save mortgage application');
      }

      onSuccess(json.loan);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving.');
    } finally {
      setSubmitting(false);
    }
  };

  const stageConfig = getStageConfig(stage);

  // Common styling for inputs to guarantee crisp readability & date picker contrast
  const inputClass =
    'w-full h-10 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-medium placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all';
  const dateInputClass =
    'mortgage-date-input w-full h-10 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all';
  const labelClass = 'block text-xs font-semibold text-slate-300 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/95 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${stageConfig.badgeBg}`}>
              <Layers className={`w-5 h-5 ${stageConfig.badgeText}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  {isEditing ? 'Update Stage & Loan Application' : 'New Mortgage Application'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border ${stageConfig.badgeBg} ${stageConfig.badgeText}`}>
                  {stageConfig.label}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {stageConfig.description}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-only Borrower Context Header when editing a later stage */}
        {isEditing && (
          <div className="px-6 py-3 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between text-xs gap-4 text-slate-300">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              <span className="font-bold text-white text-sm">{formData.client_name || 'Borrower'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{formData.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{formData.email || 'N/A'}</span>
            </div>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Stage Selector Bar */}
          <div className="pb-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Selected Pipeline Stage
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value as StageCode)}
                  className="h-10 bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {availableStages.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isEditing && stage !== initialLoan?.stage && (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1.5">
                <label className="block text-xs font-bold text-blue-300 uppercase tracking-wider">
                  Stage Transition Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={stageRemarks}
                  onChange={(e) => setStageRemarks(e.target.value)}
                  placeholder={`Optional remarks when moving to ${getStageConfig(stage).label}...`}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 1: NEW LOAN (Intake & Borrower Summary) */}
          {/* ========================================================= */}
          {stage === 'NEW_LOAN' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2 mb-4">
                  Borrower Contact & Inquiry Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>
                      Client Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.client_name || ''}
                      onChange={(e) => handleFieldChange('client_name', e.target.value)}
                      placeholder="Enter borrower full name..."
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone || ''}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="(555) 000-0000"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="client@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>Property / Subject Address</label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      placeholder="123 Main St, Apt 4B"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>State</label>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => handleFieldChange('state', e.target.value)}
                      placeholder="CA"
                      maxLength={2}
                      className={`${inputClass} uppercase`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-2 mb-4">
                  Loan Request & Staff Assignment
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {/* Transaction Type */}
                  <div>
                    <label className={labelClass}>Transaction Type</label>
                    <select
                      value={
                        manualInputModes.transaction_type
                          ? 'Other (Manual Input)'
                          : EXCEL_TRANSACTION_TYPES.includes(formData.transaction_type as any)
                          ? formData.transaction_type
                          : formData.transaction_type
                          ? 'Other (Manual Input)'
                          : ''
                      }
                      onChange={(e) => handleDropdownChange('transaction_type', e.target.value, EXCEL_TRANSACTION_TYPES)}
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      {EXCEL_TRANSACTION_TYPES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    {(manualInputModes.transaction_type || (formData.transaction_type && !EXCEL_TRANSACTION_TYPES.includes(formData.transaction_type as any))) && (
                      <input
                        type="text"
                        placeholder="Enter custom Transaction Type..."
                        value={formData.transaction_type || ''}
                        onChange={(e) => handleFieldChange('transaction_type', e.target.value)}
                        className="w-full mt-2 h-9 px-3 py-1.5 bg-slate-950 border border-blue-500/60 rounded-lg text-xs text-white focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Loan Type */}
                  <div>
                    <label className={labelClass}>Loan Type</label>
                    <select
                      value={
                        manualInputModes.loan_type
                          ? 'Other (Manual Input)'
                          : EXCEL_LOAN_TYPES.includes(formData.loan_type as any)
                          ? formData.loan_type
                          : formData.loan_type
                          ? 'Other (Manual Input)'
                          : ''
                      }
                      onChange={(e) => handleDropdownChange('loan_type', e.target.value, EXCEL_LOAN_TYPES)}
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      {EXCEL_LOAN_TYPES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    {(manualInputModes.loan_type || (formData.loan_type && !EXCEL_LOAN_TYPES.includes(formData.loan_type as any))) && (
                      <input
                        type="text"
                        placeholder="Enter custom Loan Type..."
                        value={formData.loan_type || ''}
                        onChange={(e) => handleFieldChange('loan_type', e.target.value)}
                        className="w-full mt-2 h-9 px-3 py-1.5 bg-slate-950 border border-blue-500/60 rounded-lg text-xs text-white focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Loan Term */}
                  <div>
                    <label className={labelClass}>Loan Term</label>
                    <select
                      value={
                        manualInputModes.loan_term
                          ? 'Other (Manual Input)'
                          : EXCEL_LOAN_TERMS.includes(formData.loan_term as any)
                          ? formData.loan_term
                          : formData.loan_term
                          ? 'Other (Manual Input)'
                          : ''
                      }
                      onChange={(e) => handleDropdownChange('loan_term', e.target.value, EXCEL_LOAN_TERMS)}
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      {EXCEL_LOAN_TERMS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    {(manualInputModes.loan_term || (formData.loan_term && !EXCEL_LOAN_TERMS.includes(formData.loan_term as any))) && (
                      <input
                        type="text"
                        placeholder="Enter custom Loan Term..."
                        value={formData.loan_term || ''}
                        onChange={(e) => handleFieldChange('loan_term', e.target.value)}
                        className="w-full mt-2 h-9 px-3 py-1.5 bg-slate-950 border border-blue-500/60 rounded-lg text-xs text-white focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Assigned Loan Officer */}
                  <div>
                    <label className={labelClass}>Assigned Loan Officer</label>
                    <select
                      value={
                        manualInputModes.loan_officer_name
                          ? 'Other (Manual Input)'
                          : EXCEL_LOAN_OFFICERS.includes(formData.loan_officer_name as any)
                          ? formData.loan_officer_name
                          : formData.loan_officer_name
                          ? 'Other (Manual Input)'
                          : ''
                      }
                      onChange={(e) => handleDropdownChange('loan_officer_name', e.target.value, EXCEL_LOAN_OFFICERS)}
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      {EXCEL_LOAN_OFFICERS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    {(manualInputModes.loan_officer_name || (formData.loan_officer_name && !EXCEL_LOAN_OFFICERS.includes(formData.loan_officer_name as any))) && (
                      <input
                        type="text"
                        placeholder="Enter custom Loan Officer name..."
                        value={formData.loan_officer_name || ''}
                        onChange={(e) => handleFieldChange('loan_officer_name', e.target.value)}
                        className="w-full mt-2 h-9 px-3 py-1.5 bg-slate-950 border border-blue-500/60 rounded-lg text-xs text-white focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Assigned Processor */}
                  <div>
                    <label className={labelClass}>Assigned Processor</label>
                    <select
                      value={
                        manualInputModes.processor_name
                          ? 'Other (Manual Input)'
                          : EXCEL_PROCESSORS.includes(formData.processor_name as any)
                          ? formData.processor_name
                          : formData.processor_name
                          ? 'Other (Manual Input)'
                          : ''
                      }
                      onChange={(e) => handleDropdownChange('processor_name', e.target.value, EXCEL_PROCESSORS)}
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      {EXCEL_PROCESSORS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    {(manualInputModes.processor_name || (formData.processor_name && !EXCEL_PROCESSORS.includes(formData.processor_name as any))) && (
                      <input
                        type="text"
                        placeholder="Enter custom Processor name..."
                        value={formData.processor_name || ''}
                        onChange={(e) => handleFieldChange('processor_name', e.target.value)}
                        className="w-full mt-2 h-9 px-3 py-1.5 bg-slate-950 border border-blue-500/60 rounded-lg text-xs text-white focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Application Received */}
                  <div>
                    <label className={labelClass}>Application Received?</label>
                    <select
                      value={formData.application_received || 'N'}
                      onChange={(e) => handleFieldChange('application_received', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No (Pending)</option>
                      <option value="Y">Yes</option>
                    </select>
                  </div>

                  {/* Estimated Property Value */}
                  <div>
                    <label className={labelClass}>Estimated Property Value ($)</label>
                    <input
                      type="number"
                      value={formData.estimated_property_value || ''}
                      onChange={(e) => handleFieldChange('estimated_property_value', e.target.value)}
                      placeholder="e.g. 500000"
                      className={inputClass}
                    />
                  </div>

                  {/* Estimated Credit Score */}
                  <div>
                    <label className={labelClass}>Estimated Credit Score</label>
                    <input
                      type="number"
                      value={formData.estimated_credit_score || ''}
                      onChange={(e) => handleFieldChange('estimated_credit_score', e.target.value)}
                      placeholder="e.g. 740"
                      className={inputClass}
                    />
                  </div>

                  {/* Expected Commission */}
                  <div>
                    <label className={labelClass}>Expected Commission ($)</label>
                    <input
                      type="number"
                      value={formData.expected_commission || ''}
                      onChange={(e) => handleFieldChange('expected_commission', e.target.value)}
                      placeholder="e.g. 5000"
                      className={inputClass}
                    />
                  </div>

                  {/* Target Closing Date (Fixed Datepicker UI) */}
                  <div>
                    <label className={labelClass}>Target Closing Date</label>
                    <input
                      type="date"
                      style={{ colorScheme: 'dark' }}
                      value={formData.target_closing_date || ''}
                      onChange={(e) => handleFieldChange('target_closing_date', e.target.value)}
                      className={dateInputClass}
                    />
                  </div>

                  {/* Follow Up Date (Fixed Datepicker UI) */}
                  <div>
                    <label className={labelClass}>Follow Up Date</label>
                    <input
                      type="date"
                      style={{ colorScheme: 'dark' }}
                      value={formData.follow_up_date || ''}
                      onChange={(e) => handleFieldChange('follow_up_date', e.target.value)}
                      className={dateInputClass}
                    />
                  </div>

                  {/* All Documents Received */}
                  <div>
                    <label className={labelClass}>All Documents Received?</label>
                    <select
                      value={formData.all_documents_received || 'N'}
                      onChange={(e) => handleFieldChange('all_documents_received', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No (Missing Docs)</option>
                      <option value="Y">Yes (Complete)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5">
                  <label className={labelClass}>Missing Documents List</label>
                  <input
                    type="text"
                    value={formData.missing_documents_list || ''}
                    onChange={(e) => handleFieldChange('missing_documents_list', e.target.value)}
                    placeholder="e.g. 2024 W2, 2 months bank statements"
                    className={inputClass}
                  />
                </div>

                <div className="mt-5">
                  <label className={labelClass}>Additional Notes</label>
                  <textarea
                    rows={3}
                    value={formData.additional_notes || ''}
                    onChange={(e) => handleFieldChange('additional_notes', e.target.value)}
                    placeholder="Internal borrower notes..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PRE-APPROVAL STAGE 1: PRE-APPROVAL LOAN */}
          {/* ========================================================= */}
          {stage === 'PREAPPROVAL_LOAN' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 border-b border-slate-800 pb-2 mb-4">
                  Pre-Approval Borrower Intake
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>
                      Client Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.client_name || ''}
                      onChange={(e) => handleFieldChange('client_name', e.target.value)}
                      placeholder="Enter borrower full name..."
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Phone Number <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.phone || ''}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      placeholder="(555) 000-0000"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email || ''}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      placeholder="client@example.com"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Transaction Type</label>
                    <select
                      value={
                        manualInputModes.transaction_type
                          ? 'Other (Manual Input)'
                          : EXCEL_TRANSACTION_TYPES.includes(formData.transaction_type as any)
                          ? formData.transaction_type
                          : formData.transaction_type
                          ? 'Other (Manual Input)'
                          : ''
                      }
                      onChange={(e) => handleDropdownChange('transaction_type', e.target.value, EXCEL_TRANSACTION_TYPES)}
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      {EXCEL_TRANSACTION_TYPES.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    {(manualInputModes.transaction_type || (formData.transaction_type && !EXCEL_TRANSACTION_TYPES.includes(formData.transaction_type as any))) && (
                      <input
                        type="text"
                        placeholder="Enter custom Transaction Type..."
                        value={formData.transaction_type || ''}
                        onChange={(e) => handleFieldChange('transaction_type', e.target.value)}
                        className="w-full mt-2 h-9 px-3 py-1.5 bg-slate-950 border border-indigo-500/60 rounded-lg text-xs text-white focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Loan Officer</label>
                    <select
                      value={
                        manualInputModes.loan_officer_name
                          ? 'Other (Manual Input)'
                          : EXCEL_LOAN_OFFICERS.includes(formData.loan_officer_name as any)
                          ? formData.loan_officer_name
                          : formData.loan_officer_name
                          ? 'Other (Manual Input)'
                          : ''
                      }
                      onChange={(e) => handleDropdownChange('loan_officer_name', e.target.value, EXCEL_LOAN_OFFICERS)}
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      {EXCEL_LOAN_OFFICERS.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                    {(manualInputModes.loan_officer_name || (formData.loan_officer_name && !EXCEL_LOAN_OFFICERS.includes(formData.loan_officer_name as any))) && (
                      <input
                        type="text"
                        placeholder="Enter custom Loan Officer..."
                        value={formData.loan_officer_name || ''}
                        onChange={(e) => handleFieldChange('loan_officer_name', e.target.value)}
                        className="w-full mt-2 h-9 px-3 py-1.5 bg-slate-950 border border-indigo-500/60 rounded-lg text-xs text-white focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Estimated Credit Score</label>
                    <input
                      type="number"
                      value={formData.estimated_credit_score || ''}
                      onChange={(e) => handleFieldChange('estimated_credit_score', e.target.value)}
                      placeholder="e.g. 740"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PRE-APPROVAL STAGE 2: MANUAL UW */}
          {/* ========================================================= */}
          {stage === 'MANUAL_UW' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 border-b border-slate-800 pb-2 mb-4">
                Manual Underwriting Review & Pre-Approval Letter
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>UW Completed?</label>
                  <select
                    value={formData.uw_completed || 'N'}
                    onChange={(e) => handleFieldChange('uw_completed', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No (In Review)</option>
                    <option value="Y">Yes (Completed)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Valuation Requested?</label>
                  <select
                    value={formData.val_requested || 'N'}
                    onChange={(e) => handleFieldChange('val_requested', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Approved Preapproval Amount ($)</label>
                  <input
                    type="number"
                    value={formData.preapproval_amount || ''}
                    onChange={(e) => handleFieldChange('preapproval_amount', e.target.value)}
                    placeholder="e.g. 450000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Down Payment Request ($)</label>
                  <input
                    type="number"
                    value={formData.down_payment_request || ''}
                    onChange={(e) => handleFieldChange('down_payment_request', e.target.value)}
                    placeholder="e.g. 90000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Pre-Approval Sent to Client?</label>
                  <select
                    value={formData.preapproval_sent_to_client || 'N'}
                    onChange={(e) => handleFieldChange('preapproval_sent_to_client', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes (Sent)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Pre-Approval Sent Date</label>
                  <input
                    type="date"
                    style={{ colorScheme: 'dark' }}
                    value={formData.preapproval_sent_date || ''}
                    onChange={(e) => handleFieldChange('preapproval_sent_date', e.target.value)}
                    className={dateInputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* NEW LOAN STAGE 2: SUBMIT TO UW */}
          {/* ========================================================= */}
          {stage === 'SUBMIT_TO_UW' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 border-b border-slate-800 pb-2 mb-4">
                Underwriting Submission & Rate Lock Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Wholesale Lender</label>
                  <select
                    value={
                      manualInputModes.lender_name
                        ? 'Other (Manual Input)'
                        : EXCEL_WHOLESALE_LENDERS.includes(formData.lender_name as any)
                        ? formData.lender_name
                        : formData.lender_name
                        ? 'Other (Manual Input)'
                        : ''
                    }
                    onChange={(e) => handleDropdownChange('lender_name', e.target.value, EXCEL_WHOLESALE_LENDERS)}
                    className={inputClass}
                  >
                    <option value="">Select...</option>
                    {EXCEL_WHOLESALE_LENDERS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                  {(manualInputModes.lender_name || (formData.lender_name && !EXCEL_WHOLESALE_LENDERS.includes(formData.lender_name as any))) && (
                    <input
                      type="text"
                      placeholder="Enter custom Wholesale Lender..."
                      value={formData.lender_name || ''}
                      onChange={(e) => handleFieldChange('lender_name', e.target.value)}
                      className="w-full mt-2 h-9 px-3 py-1.5 bg-slate-950 border border-purple-500/60 rounded-lg text-xs text-white focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className={labelClass}>Submission Date</label>
                  <input
                    type="date"
                    style={{ colorScheme: 'dark' }}
                    value={formData.submission_date || ''}
                    onChange={(e) => handleFieldChange('submission_date', e.target.value)}
                    className={dateInputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Submitted Loan Amount ($)</label>
                  <input
                    type="number"
                    value={formData.loan_amount || ''}
                    onChange={(e) => handleFieldChange('loan_amount', e.target.value)}
                    placeholder="e.g. 400000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Moonstar Disclosure Sent?</label>
                  <select
                    value={formData.moonstar_disclosure_sent || 'N'}
                    onChange={(e) => handleFieldChange('moonstar_disclosure_sent', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Lender Disclosure Sent?</label>
                  <select
                    value={formData.lender_disclosure_sent || 'N'}
                    onChange={(e) => handleFieldChange('lender_disclosure_sent', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>All UW Documents Received?</label>
                  <select
                    value={formData.received_all_uw_documents || 'N'}
                    onChange={(e) => handleFieldChange('received_all_uw_documents', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Rate Locked?</label>
                  <select
                    value={formData.rate_locked || 'N'}
                    onChange={(e) => handleFieldChange('rate_locked', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No (Floating)</option>
                    <option value="Y">Yes (Locked)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Locked Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interest_rate || ''}
                    onChange={(e) => handleFieldChange('interest_rate', e.target.value)}
                    placeholder="e.g. 6.125"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Lock Expiration Date</label>
                  <input
                    type="date"
                    style={{ colorScheme: 'dark' }}
                    value={formData.lock_expire_date || ''}
                    onChange={(e) => handleFieldChange('lock_expire_date', e.target.value)}
                    className={dateInputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* NEW LOAN STAGE 3: INITIAL COMPLIANCE */}
          {/* ========================================================= */}
          {stage === 'INITIAL_COMPLIANCE' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 border-b border-slate-800 pb-2 mb-4">
                Disclosures, Anti-Predatory Check & Order Tracking
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Moonstar Disclosure Signed (3-Day)?</label>
                  <select
                    value={formData.moonstar_disclosure_signed_3day || 'N'}
                    onChange={(e) => handleFieldChange('moonstar_disclosure_signed_3day', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Moonstar Signed Date</label>
                  <input
                    type="date"
                    style={{ colorScheme: 'dark' }}
                    value={formData.moonstar_disclosure_signed_date || ''}
                    onChange={(e) => handleFieldChange('moonstar_disclosure_signed_date', e.target.value)}
                    className={dateInputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Lender Disclosure Signed (3-Day)?</label>
                  <select
                    value={formData.lender_disclosure_signed_3day || 'N'}
                    onChange={(e) => handleFieldChange('lender_disclosure_signed_3day', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Lender Signed Date</label>
                  <input
                    type="date"
                    style={{ colorScheme: 'dark' }}
                    value={formData.lender_disclosure_signed_date || ''}
                    onChange={(e) => handleFieldChange('lender_disclosure_signed_date', e.target.value)}
                    className={dateInputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Anti-Predatory Review</label>
                  <select
                    value={formData.anti_predatory_completed || 'NA'}
                    onChange={(e) => handleFieldChange('anti_predatory_completed', e.target.value)}
                    className={inputClass}
                  >
                    <option value="NA">N/A</option>
                    <option value="N">No (Pending)</option>
                    <option value="Y">Yes (Passed)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Anti-Predatory Completed Date</label>
                  <input
                    type="date"
                    style={{ colorScheme: 'dark' }}
                    value={formData.anti_predatory_completed_date || ''}
                    onChange={(e) => handleFieldChange('anti_predatory_completed_date', e.target.value)}
                    className={dateInputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Conditionally Approved?</label>
                  <select
                    value={formData.conditionally_approved || 'N'}
                    onChange={(e) => handleFieldChange('conditionally_approved', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelClass}>Pending UW Conditions List</label>
                  <input
                    type="text"
                    value={formData.pending_conditions_text || ''}
                    onChange={(e) => handleFieldChange('pending_conditions_text', e.target.value)}
                    placeholder="e.g. Provide updated paystub and hazard insurance policy"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Appraisal Ordered?</label>
                  <select
                    value={formData.appraisal_ordered || 'NA'}
                    onChange={(e) => handleFieldChange('appraisal_ordered', e.target.value)}
                    className={inputClass}
                  >
                    <option value="NA">N/A (Waiver)</option>
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Title Ordered?</label>
                  <select
                    value={formData.title_ordered || 'N'}
                    onChange={(e) => handleFieldChange('title_ordered', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Condo Questionnaire Req?</label>
                  <select
                    value={formData.condo_questionnaire_requested || 'NA'}
                    onChange={(e) => handleFieldChange('condo_questionnaire_requested', e.target.value)}
                    className={inputClass}
                  >
                    <option value="NA">N/A (Single Family)</option>
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>HOI Requested?</label>
                  <select
                    value={formData.hoi_requested || 'NA'}
                    onChange={(e) => handleFieldChange('hoi_requested', e.target.value)}
                    className={inputClass}
                  >
                    <option value="NA">N/A</option>
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* NEW LOAN STAGE 4: FINAL COMPLIANCE */}
          {/* ========================================================= */}
          {stage === 'FINAL_COMPLIANCE' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 border-b border-slate-800 pb-2 mb-4">
                Second Disclosures, CD Request & Clear to Close (CTC)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Moonstar Disclosure 2 Signed?</label>
                  <select
                    value={formData.moonstar_disclosure_2_signed || 'N'}
                    onChange={(e) => handleFieldChange('moonstar_disclosure_2_signed', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Signed Date</label>
                  <input
                    type="date"
                    style={{ colorScheme: 'dark' }}
                    value={formData.moonstar_disclosure_2_signed_date || ''}
                    onChange={(e) => handleFieldChange('moonstar_disclosure_2_signed_date', e.target.value)}
                    className={dateInputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Appraisal Sent to Client?</label>
                  <select
                    value={formData.appraisal_sent_to_client || 'NA'}
                    onChange={(e) => handleFieldChange('appraisal_sent_to_client', e.target.value)}
                    className={inputClass}
                  >
                    <option value="NA">N/A (Waiver)</option>
                    <option value="N">No</option>
                    <option value="Y">Yes (Sent)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Appraisal Sent Date</label>
                  <input
                    type="date"
                    style={{ colorScheme: 'dark' }}
                    value={formData.appraisal_sent_date || ''}
                    onChange={(e) => handleFieldChange('appraisal_sent_date', e.target.value)}
                    className={dateInputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Appraised Value ($)</label>
                  <input
                    type="number"
                    value={formData.appraised_value_amount || ''}
                    onChange={(e) => handleFieldChange('appraised_value_amount', e.target.value)}
                    placeholder="e.g. 510000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>CD Requested?</label>
                  <select
                    value={formData.cd_requested || 'N'}
                    onChange={(e) => handleFieldChange('cd_requested', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Clear to Close (CTC) Status?</label>
                  <select
                    value={formData.ctc_status || 'N'}
                    onChange={(e) => handleFieldChange('ctc_status', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No (Pending)</option>
                    <option value="Y">Yes (CTC Cleared)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>CD Acknowledged by Borrower?</label>
                  <select
                    value={formData.cd_acknowledged || 'N'}
                    onChange={(e) => handleFieldChange('cd_acknowledged', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Closing Confirmed?</label>
                  <select
                    value={formData.closing_confirmation_received || 'N'}
                    onChange={(e) => handleFieldChange('closing_confirmation_received', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>VOE Cleared?</label>
                  <select
                    value={formData.voe_cleared || 'N'}
                    onChange={(e) => handleFieldChange('voe_cleared', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* NEW LOAN STAGE 5: CLOSING */}
          {/* ========================================================= */}
          {stage === 'CLOSING' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800 pb-2 mb-4">
                Invoices, Final Terms & Closing Schedule
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Credit Report Invoice Submitted?</label>
                  <select
                    value={formData.credit_report_invoice_submitted || 'N'}
                    onChange={(e) => handleFieldChange('credit_report_invoice_submitted', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Condo Invoice Submitted?</label>
                  <select
                    value={formData.condo_invoice_submitted || 'NA'}
                    onChange={(e) => handleFieldChange('condo_invoice_submitted', e.target.value)}
                    className={inputClass}
                  >
                    <option value="NA">N/A</option>
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Final Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.final_interest_rate || ''}
                    onChange={(e) => handleFieldChange('final_interest_rate', e.target.value)}
                    placeholder="e.g. 6.125"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Final Loan Amount ($)</label>
                  <input
                    type="number"
                    value={formData.final_loan_amount || ''}
                    onChange={(e) => handleFieldChange('final_loan_amount', e.target.value)}
                    placeholder="e.g. 400000"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Final CD Received?</label>
                  <select
                    value={formData.final_cd_received || 'N'}
                    onChange={(e) => handleFieldChange('final_cd_received', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Closing Schedule (Date & Time)</label>
                  <input
                    type="text"
                    value={formData.closing_schedule || ''}
                    onChange={(e) => handleFieldChange('closing_schedule', e.target.value)}
                    placeholder="e.g. 2026-07-20 2:00 PM EST"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* NEW LOAN STAGE 6: AUDIT */}
          {/* ========================================================= */}
          {stage === 'AUDIT' && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-pink-400 border-b border-slate-800 pb-2 mb-4">
                Post-Closing Audit, Document Archiving & Reconciliation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                <div>
                  <label className={labelClass}>Closing Docs Downloaded?</label>
                  <select
                    value={formData.closing_docs_downloaded || 'N'}
                    onChange={(e) => handleFieldChange('closing_docs_downloaded', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Appraisal Downloaded?</label>
                  <select
                    value={formData.appraisal_downloaded || 'N'}
                    onChange={(e) => handleFieldChange('appraisal_downloaded', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Title Report Downloaded?</label>
                  <select
                    value={formData.title_report_downloaded || 'N'}
                    onChange={(e) => handleFieldChange('title_report_downloaded', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Moonstar Audit Completed?</label>
                  <select
                    value={formData.moonstar_audit_completed || 'N'}
                    onChange={(e) => handleFieldChange('moonstar_audit_completed', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes (Audited)</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Title Check Received?</label>
                  <select
                    value={formData.title_check_received || 'N'}
                    onChange={(e) => handleFieldChange('title_check_received', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Wire / Check Amount Received ($)</label>
                  <input
                    type="number"
                    value={formData.check_wire_amount_received || ''}
                    onChange={(e) => handleFieldChange('check_wire_amount_received', e.target.value)}
                    placeholder="e.g. 12500"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Client Refund Amount ($)</label>
                  <input
                    type="number"
                    value={formData.client_refund_amount || ''}
                    onChange={(e) => handleFieldChange('client_refund_amount', e.target.value)}
                    placeholder="0.00"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Master Loan Log Updated?</label>
                  <select
                    value={formData.loan_log_updated || 'N'}
                    onChange={(e) => handleFieldChange('loan_log_updated', e.target.value)}
                    className={inputClass}
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Stage Transition History */}
          {isEditing && initialLoan && (
            <StageHistorySection loanId={initialLoan.id} currentStage={stage} />
          )}

          {/* Submit / Action Bar */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-slate-900/95 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Saving Application...'
                  : isEditing
                  ? `Save ${stageConfig.label} Updates`
                  : `Create ${stageConfig.label} Application`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
