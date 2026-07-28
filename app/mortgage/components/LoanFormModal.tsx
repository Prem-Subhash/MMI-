'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Layers, AlertCircle, User, Phone, Mail, Calendar, ChevronDown } from 'lucide-react';
import { MortgageLoan, PipelineType, StageCode } from '@/app/mortgage/lib/types';
import { MORTGAGE_STAGES, getStageConfig } from '@/app/mortgage/lib/stageFields';
import { toast } from '@/lib/toast';
import StageHistorySection from './StageHistorySection';
import {
  EXCEL_TRANSACTION_TYPES,
  EXCEL_LOAN_TYPES,
  EXCEL_LOAN_TERMS,
  EXCEL_WHOLESALE_LENDERS,
  EXCEL_LOAN_OFFICERS,
  EXCEL_PROCESSORS,
} from '@/app/mortgage/lib/excelLookups';

const FormSelect = ({
  className = '',
  containerClassName = 'relative w-full',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { containerClassName?: string }) => (
  <div className={containerClassName}>
    <select
      className={`${className} appearance-none pr-9 cursor-pointer w-full`}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      size={16}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform duration-200"
    />
  </div>
);

interface LoanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (loan: MortgageLoan) => void;
  initialLoan?: MortgageLoan | null;
  defaultPipelineType?: PipelineType;
  editingHistoryRecord?: any;
  isHidden?: boolean;
}

export default function LoanFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialLoan,
  defaultPipelineType = 'NEW_LOAN',
  editingHistoryRecord,
  isHidden,
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
        const msg = 'Client Name, Phone, and Email are required.';
        setError(msg);
        toast('Please fill in required borrower fields (Name, Phone, Email).', 'warning');
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

      const stageCfg = getStageConfig(stage);
      if (isEditing) {
        toast(`Saved "${stageCfg.label}" updates for ${formData.client_name || 'Borrower'}!`, 'success', 4000);
      } else {
        toast(`Successfully created ${stageCfg.label} application for ${formData.client_name || 'Borrower'}!`, 'success', 4000);
      }

      onSuccess(json.loan);
      onClose();
    } catch (err: any) {
      const errMsg = err.message || 'An error occurred while saving.';
      setError(errMsg);
      toast(`Save failed: ${errMsg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const stageConfig = getStageConfig(stage);

  // Common styling for inputs to guarantee crisp readability matching Innovative Insurance CRM
  const inputClass =
    'h-10 w-full border border-gray-300 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-800 text-sm bg-white transition-all shadow-2xs';
  const dateInputClass =
    'mortgage-date-input h-10 w-full border border-gray-300 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-800 text-sm bg-white transition-all shadow-2xs';
  const labelClass = 'block text-gray-700 font-semibold mb-1.5 text-xs sm:text-sm tracking-tight';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in" aria-labelledby="modal-title" role="dialog" aria-modal="true" style={{ display: isHidden ? "none" : "flex" }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-gray-800 animate-in fade-in zoom-in-95 duration-200 my-8">

        {/* Header */}
        <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-8 py-6 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isEditing ? 'Update Stage' : 'New Mortgage Application'}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              {isEditing ? 'Update the current stage and details' : 'Enter application details'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white hover:text-white hover:bg-white/20 rounded-full transition-all duration-200"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Read-only Borrower Context Header when editing a later stage */}
        {isEditing && (
          <div className="shrink-0 px-6 py-3.5 bg-gray-50/80 border-b border-gray-100 flex flex-wrap items-center justify-between text-xs gap-4 text-gray-700 font-medium">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#10B889]" />
              <span className="font-bold text-gray-900 text-sm">{formData.client_name || 'Borrower'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="font-semibold">{formData.phone || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="font-semibold">{formData.email || 'N/A'}</span>
            </div>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          


            {/* Stage Selector Bar */}
            <div className="pb-5 border-b border-gray-100 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex-1 max-w-sm">
                  <label className="block text-emerald-700 font-bold mb-2 text-sm uppercase tracking-wide">
                    Select New Status
                  </label>
                  <FormSelect
                    containerClassName="relative inline-block w-full"
                    value={stage}
                    onChange={(e) => setStage(e.target.value as StageCode)}
                    className="w-full border-2 border-emerald-500 rounded-xl p-3 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 text-gray-900 font-bold appearance-none bg-white cursor-pointer transition-all shadow-sm"
                  >
                    {availableStages.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.label}
                      </option>
                    ))}
                  </FormSelect>
                </div>

                {isEditing && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-sm">
                    Editing Live Application
                  </span>
                )}
              </div>

              {isEditing && (
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2 shadow-sm">
                  <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider">
                    Stage Transition Remarks (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={stageRemarks}
                    onChange={(e) => setStageRemarks(e.target.value)}
                    placeholder={`Optional remarks when moving to ${getStageConfig(stage).label}...`}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700 text-sm bg-white resize-none"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2.5 shadow-2xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* ========================================================= */}
            {/* STAGE 1: BORROWER INTAKE & SUMMARY (New Loan & Pre-Approval) */}
            {/* ========================================================= */}
            {(stage === 'NEW_LOAN' || stage === 'PREAPPROVAL_LOAN') && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                    {stage === 'PREAPPROVAL_LOAN'
                      ? 'Pre-Approval Borrower Contact & Inquiry Details'
                      : 'Borrower Contact & Inquiry Details'}
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
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                    {stage === 'PREAPPROVAL_LOAN'
                      ? 'Pre-Approval Loan Request & Staff Assignment'
                      : 'Loan Request & Staff Assignment'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {/* Transaction Type */}
                    <div>
                      <label className={labelClass}>Transaction Type</label>
                      <FormSelect
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
                      </FormSelect>
                      {(manualInputModes.transaction_type || (formData.transaction_type && !EXCEL_TRANSACTION_TYPES.includes(formData.transaction_type as any))) && (
                        <input
                          type="text"
                          placeholder="Enter custom Transaction Type..."
                          value={formData.transaction_type || ''}
                          onChange={(e) => handleFieldChange('transaction_type', e.target.value)}
                          className="w-full mt-2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700 text-sm bg-white"
                        />
                      )}
                    </div>

                    {/* Loan Type */}
                    <div>
                      <label className={labelClass}>Loan Type</label>
                      <FormSelect
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
                      </FormSelect>
                      {(manualInputModes.loan_type || (formData.loan_type && !EXCEL_LOAN_TYPES.includes(formData.loan_type as any))) && (
                        <input
                          type="text"
                          placeholder="Enter custom Loan Type..."
                          value={formData.loan_type || ''}
                          onChange={(e) => handleFieldChange('loan_type', e.target.value)}
                          className="w-full mt-2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700 text-sm bg-white"
                        />
                      )}
                    </div>

                    {/* Loan Term */}
                    <div>
                      <label className={labelClass}>Loan Term</label>
                      <FormSelect
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
                      </FormSelect>
                      {(manualInputModes.loan_term || (formData.loan_term && !EXCEL_LOAN_TERMS.includes(formData.loan_term as any))) && (
                        <input
                          type="text"
                          placeholder="Enter custom Loan Term..."
                          value={formData.loan_term || ''}
                          onChange={(e) => handleFieldChange('loan_term', e.target.value)}
                          className="w-full mt-2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700 text-sm bg-white"
                        />
                      )}
                    </div>

                    {/* Assigned Loan Officer */}
                    <div>
                      <label className={labelClass}>Assigned Loan Officer</label>
                      <FormSelect
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
                      </FormSelect>
                      {(manualInputModes.loan_officer_name || (formData.loan_officer_name && !EXCEL_LOAN_OFFICERS.includes(formData.loan_officer_name as any))) && (
                        <input
                          type="text"
                          placeholder="Enter custom Loan Officer name..."
                          value={formData.loan_officer_name || ''}
                          onChange={(e) => handleFieldChange('loan_officer_name', e.target.value)}
                          className="w-full mt-2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700 text-sm bg-white"
                        />
                      )}
                    </div>

                    {/* Assigned Processor */}
                    <div>
                      <label className={labelClass}>Assigned Processor</label>
                      <FormSelect
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
                      </FormSelect>
                      {(manualInputModes.processor_name || (formData.processor_name && !EXCEL_PROCESSORS.includes(formData.processor_name as any))) && (
                        <input
                          type="text"
                          placeholder="Enter custom Processor name..."
                          value={formData.processor_name || ''}
                          onChange={(e) => handleFieldChange('processor_name', e.target.value)}
                          className="w-full mt-2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700 text-sm bg-white"
                        />
                      )}
                    </div>

                    {/* Application Received */}
                    <div>
                      <label className={labelClass}>Application Received?</label>
                      <FormSelect
                        value={formData.application_received || 'N'}
                        onChange={(e) => handleFieldChange('application_received', e.target.value)}
                        className={inputClass}
                      >
                        <option value="N">No (Pending)</option>
                        <option value="Y">Yes</option>
                      </FormSelect>
                    </div>

                    {/* Application Received Date (If Yes) */}
                    {formData.application_received === 'Y' && (
                      <div>
                        <label className={labelClass}>Application Received Date</label>
                        <input
                          type="date"
                          value={formData.application_received_date || ''}
                          onChange={(e) => handleFieldChange('application_received_date', e.target.value)}
                          className={dateInputClass}
                        />
                      </div>
                    )}

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
                        value={formData.follow_up_date || ''}
                        onChange={(e) => handleFieldChange('follow_up_date', e.target.value)}
                        className={dateInputClass}
                      />
                    </div>

                    {/* All Documents Received */}
                    <div>
                      <label className={labelClass}>All Documents Received?</label>
                      <FormSelect
                        value={formData.all_documents_received || 'N'}
                        onChange={(e) => handleFieldChange('all_documents_received', e.target.value)}
                        className={inputClass}
                      >
                        <option value="N">No (Missing Docs)</option>
                        <option value="Y">Yes (Complete)</option>
                      </FormSelect>
                    </div>
                  </div>

                  {/* Missing Documents List (if No) */}
                  {formData.all_documents_received === 'N' && (
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
                  )}

                  <div className="mt-5">
                    <label className={labelClass}>Additional Notes</label>
                    <textarea
                      rows={3}
                      value={formData.additional_notes || ''}
                      onChange={(e) => handleFieldChange('additional_notes', e.target.value)}
                      placeholder="Internal borrower notes..."
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-slate-900 resize-none focus:ring-2 focus:ring-[#10B889] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* PRE-APPROVAL STAGE 2: MANUAL UW */}
            {/* ========================================================= */}
            {stage === 'MANUAL_UW' && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                  Manual Underwriting Review & Pre-Approval Letter
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>UW Completed?</label>
                    <FormSelect
                      value={formData.uw_completed || 'N'}
                      onChange={(e) => handleFieldChange('uw_completed', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No (In Review)</option>
                      <option value="Y">Yes (Completed)</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Valuation Requested?</label>
                    <FormSelect
                      value={formData.val_requested || 'N'}
                      onChange={(e) => handleFieldChange('val_requested', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
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
                    <FormSelect
                      value={formData.preapproval_sent_to_client || 'N'}
                      onChange={(e) => handleFieldChange('preapproval_sent_to_client', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes (Sent)</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Pre-Approval Sent Date</label>
                    <input
                      type="date"
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                  Underwriting Submission & Rate Lock Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>Wholesale Lender</label>
                    <FormSelect
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
                    </FormSelect>
                    {(manualInputModes.lender_name || (formData.lender_name && !EXCEL_WHOLESALE_LENDERS.includes(formData.lender_name as any))) && (
                      <input
                        type="text"
                        placeholder="Enter custom Wholesale Lender..."
                        value={formData.lender_name || ''}
                        onChange={(e) => handleFieldChange('lender_name', e.target.value)}
                        className="w-full mt-2 px-3.5 py-2 bg-white border border-[#10B889] rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B889]/30"
                      />
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>Submission Date</label>
                    <input
                      type="date"
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
                    <FormSelect
                      value={formData.moonstar_disclosure_sent || 'N'}
                      onChange={(e) => handleFieldChange('moonstar_disclosure_sent', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Lender Disclosure Sent?</label>
                    <FormSelect
                      value={formData.lender_disclosure_sent || 'N'}
                      onChange={(e) => handleFieldChange('lender_disclosure_sent', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>All UW Documents Received?</label>
                    <FormSelect
                      value={formData.received_all_uw_documents || 'N'}
                      onChange={(e) => handleFieldChange('received_all_uw_documents', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Rate Locked?</label>
                    <FormSelect
                      value={formData.rate_locked || 'N'}
                      onChange={(e) => handleFieldChange('rate_locked', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No (Floating)</option>
                      <option value="Y">Yes (Locked)</option>
                    </FormSelect>
                  </div>

                  {formData.rate_locked === 'Y' && (
                    <>
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
                          value={formData.lock_expire_date || ''}
                          onChange={(e) => handleFieldChange('lock_expire_date', e.target.value)}
                          className={dateInputClass}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* NEW LOAN STAGE 3: INITIAL COMPLIANCE */}
            {/* ========================================================= */}
            {stage === 'INITIAL_COMPLIANCE' && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                  Disclosures, Anti-Predatory Check & Order Tracking
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>Moonstar Disclosure Signed (3-Day)?</label>
                    <FormSelect
                      value={formData.moonstar_disclosure_signed_3day || 'N'}
                      onChange={(e) => handleFieldChange('moonstar_disclosure_signed_3day', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  {formData.moonstar_disclosure_signed_3day === 'Y' && (
                    <div>
                      <label className={labelClass}>Moonstar Signed Date</label>
                      <input
                        type="date"
                        value={formData.moonstar_disclosure_signed_date || ''}
                        onChange={(e) => handleFieldChange('moonstar_disclosure_signed_date', e.target.value)}
                        className={dateInputClass}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Lender Disclosure Signed (3-Day)?</label>
                    <FormSelect
                      value={formData.lender_disclosure_signed_3day || 'N'}
                      onChange={(e) => handleFieldChange('lender_disclosure_signed_3day', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  {formData.lender_disclosure_signed_3day === 'Y' && (
                    <div>
                      <label className={labelClass}>Lender Signed Date</label>
                      <input
                        type="date"
                        value={formData.lender_disclosure_signed_date || ''}
                        onChange={(e) => handleFieldChange('lender_disclosure_signed_date', e.target.value)}
                        className={dateInputClass}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Anti-Predatory Review</label>
                    <FormSelect
                      value={formData.anti_predatory_completed || 'NA'}
                      onChange={(e) => handleFieldChange('anti_predatory_completed', e.target.value)}
                      className={inputClass}
                    >
                      <option value="NA">N/A</option>
                      <option value="N">No (Pending)</option>
                      <option value="Y">Yes (Passed)</option>
                    </FormSelect>
                  </div>

                  {formData.anti_predatory_completed === 'Y' && (
                    <div>
                      <label className={labelClass}>Anti-Predatory Completed Date</label>
                      <input
                        type="date"
                        value={formData.anti_predatory_completed_date || ''}
                        onChange={(e) => handleFieldChange('anti_predatory_completed_date', e.target.value)}
                        className={dateInputClass}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Conditionally Approved?</label>
                    <FormSelect
                      value={formData.conditionally_approved || 'N'}
                      onChange={(e) => handleFieldChange('conditionally_approved', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
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
                    <FormSelect
                      value={formData.appraisal_ordered || 'NA'}
                      onChange={(e) => handleFieldChange('appraisal_ordered', e.target.value)}
                      className={inputClass}
                    >
                      <option value="NA">N/A (Waiver)</option>
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Title Ordered?</label>
                    <FormSelect
                      value={formData.title_ordered || 'N'}
                      onChange={(e) => handleFieldChange('title_ordered', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Condo Questionnaire Req?</label>
                    <FormSelect
                      value={formData.condo_questionnaire_requested || 'NA'}
                      onChange={(e) => handleFieldChange('condo_questionnaire_requested', e.target.value)}
                      className={inputClass}
                    >
                      <option value="NA">N/A (Single Family)</option>
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>HOI Requested?</label>
                    <FormSelect
                      value={formData.hoi_requested || 'NA'}
                      onChange={(e) => handleFieldChange('hoi_requested', e.target.value)}
                      className={inputClass}
                    >
                      <option value="NA">N/A</option>
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* NEW LOAN STAGE 4: FINAL COMPLIANCE */}
            {/* ========================================================= */}
            {stage === 'FINAL_COMPLIANCE' && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                  Second Disclosures, CD Request & Clear to Close (CTC)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>Moonstar Disclosure 2 Signed?</label>
                    <FormSelect
                      value={formData.moonstar_disclosure_2_signed || 'N'}
                      onChange={(e) => handleFieldChange('moonstar_disclosure_2_signed', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  {formData.moonstar_disclosure_2_signed === 'Y' && (
                    <div>
                      <label className={labelClass}>Signed Date</label>
                      <input
                        type="date"
                        value={formData.moonstar_disclosure_2_signed_date || ''}
                        onChange={(e) => handleFieldChange('moonstar_disclosure_2_signed_date', e.target.value)}
                        className={dateInputClass}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Appraisal Sent to Client?</label>
                    <FormSelect
                      value={formData.appraisal_sent_to_client || 'NA'}
                      onChange={(e) => handleFieldChange('appraisal_sent_to_client', e.target.value)}
                      className={inputClass}
                    >
                      <option value="NA">N/A (Waiver)</option>
                      <option value="N">No</option>
                      <option value="Y">Yes (Sent)</option>
                    </FormSelect>
                  </div>

                  {formData.appraisal_sent_to_client === 'Y' && (
                    <div>
                      <label className={labelClass}>Appraisal Sent Date</label>
                      <input
                        type="date"
                        value={formData.appraisal_sent_date || ''}
                        onChange={(e) => handleFieldChange('appraisal_sent_date', e.target.value)}
                        className={dateInputClass}
                      />
                    </div>
                  )}

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
                    <FormSelect
                      value={formData.cd_requested || 'N'}
                      onChange={(e) => handleFieldChange('cd_requested', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Clear to Close (CTC) Status?</label>
                    <FormSelect
                      value={formData.ctc_status || 'N'}
                      onChange={(e) => handleFieldChange('ctc_status', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No (Pending)</option>
                      <option value="Y">Yes (CTC Cleared)</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>CD Acknowledged by Borrower?</label>
                    <FormSelect
                      value={formData.cd_acknowledged || 'N'}
                      onChange={(e) => handleFieldChange('cd_acknowledged', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Closing Confirmed?</label>
                    <FormSelect
                      value={formData.closing_confirmation_received || 'N'}
                      onChange={(e) => handleFieldChange('closing_confirmation_received', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>VOE Cleared?</label>
                    <FormSelect
                      value={formData.voe_cleared || 'N'}
                      onChange={(e) => handleFieldChange('voe_cleared', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* NEW LOAN STAGE 5: CLOSING */}
            {/* ========================================================= */}
            {stage === 'CLOSING' && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                  Invoices, Final Terms & Closing Schedule
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>Credit Report Invoice Submitted?</label>
                    <FormSelect
                      value={formData.credit_report_invoice_submitted || 'N'}
                      onChange={(e) => handleFieldChange('credit_report_invoice_submitted', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Condo Invoice Submitted?</label>
                    <FormSelect
                      value={formData.condo_invoice_submitted || 'NA'}
                      onChange={(e) => handleFieldChange('condo_invoice_submitted', e.target.value)}
                      className={inputClass}
                    >
                      <option value="NA">N/A</option>
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
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
                    <FormSelect
                      value={formData.final_cd_received || 'N'}
                      onChange={(e) => handleFieldChange('final_cd_received', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                  Post-Closing Audit, Document Archiving & Reconciliation
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>Closing Docs Downloaded?</label>
                    <FormSelect
                      value={formData.closing_docs_downloaded || 'N'}
                      onChange={(e) => handleFieldChange('closing_docs_downloaded', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Appraisal Downloaded?</label>
                    <FormSelect
                      value={formData.appraisal_downloaded || 'N'}
                      onChange={(e) => handleFieldChange('appraisal_downloaded', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Title Report Downloaded?</label>
                    <FormSelect
                      value={formData.title_report_downloaded || 'N'}
                      onChange={(e) => handleFieldChange('title_report_downloaded', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Moonstar Audit Completed?</label>
                    <FormSelect
                      value={formData.moonstar_audit_completed || 'N'}
                      onChange={(e) => handleFieldChange('moonstar_audit_completed', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes (Audited)</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Title Check Received?</label>
                    <FormSelect
                      value={formData.title_check_received || 'N'}
                      onChange={(e) => handleFieldChange('title_check_received', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
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
                    <FormSelect
                      value={formData.loan_log_updated || 'N'}
                      onChange={(e) => handleFieldChange('loan_log_updated', e.target.value)}
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>
                </div>
              </div>
          )}

          
          {/* Stage Transition History */}
          {isEditing && initialLoan && (
            <StageHistorySection loanId={initialLoan.id} currentStage={stage} />
          )}
          </div>

          {/* Submit / Action Bar (Fixed Footer outside scrollable div) */}
          <div className="shrink-0 bg-white border-t border-gray-200 px-6 py-4 sm:px-8 flex items-center justify-end gap-3 shadow-sm">
            <button
              type="button"
                onClick={onClose}
                disabled={submitting}
                className="h-10 min-w-[120px] px-6 py-2 border-2 border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-all active:scale-95 text-xs sm:text-sm flex items-center justify-center shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="h-10 min-w-[160px] px-6 py-2 bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-xl text-xs sm:text-sm font-bold text-white shadow-sm hover:shadow transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>
                  {submitting
                    ? 'Saving...'
                    : isEditing
                      ? `Save ${stageConfig.label}`
                      : `Create Application`}
                </span>
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}
