"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Save,
  Layers,
  AlertCircle,
  User,
  Phone,
  Mail,
  Calendar,
  ChevronDown,
} from "lucide-react";
import {
  MortgageLoan,
  PipelineType,
  StageCode,
} from "@/app/mortgage/lib/types";
import {
  MORTGAGE_STAGES,
  getStageConfig,
} from "@/app/mortgage/lib/stageFields";
import { formatPhoneNumber } from "@/app/mortgage/lib/phoneUtils";
import { toast } from "@/lib/toast";
import {
  EXCEL_TRANSACTION_TYPES,
  EXCEL_LOAN_TYPES,
  EXCEL_LOAN_TERMS,
  EXCEL_WHOLESALE_LENDERS,
  EXCEL_LOAN_OFFICERS,
  EXCEL_PROCESSORS,
} from "@/app/mortgage/lib/excelLookups";
import { Modal } from "@/components/ui/Modal";

const FormSelect = ({
  className = "",
  containerClassName = "relative w-full",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  containerClassName?: string;
}) => (
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
  defaultPipelineType = "NEW_LOAN",
  editingHistoryRecord,
  isHidden,
}: LoanFormModalProps) {
  const isEditing = !!initialLoan;

  const [pipelineType, setPipelineType] = useState<PipelineType>(
    initialLoan?.pipeline_type || defaultPipelineType,
  );
  const [stage, setStage] = useState<StageCode>(
    initialLoan?.stage ||
      (defaultPipelineType === "PRE_APPROVAL"
        ? "PREAPPROVAL_LOAN"
        : "NEW_LOAN"),
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageRemarks, setStageRemarks] = useState("");

  // Track if "Other (Manual Input)" mode is active for each dropdown
  const [manualInputModes, setManualInputModes] = useState<
    Record<string, boolean>
  >({});

  // Local state for formatted ROI fields
  const [localInterestRate, setLocalInterestRate] = useState("");
  const [localFinalInterestRate, setLocalFinalInterestRate] = useState("");

  // Form Fields State (no automatic dropdown defaults!)
  const [formData, setFormData] = useState<Partial<MortgageLoan>>({
    client_name: "",
    phone: "",
    email: "",
    address: "",
    state: "CA",
    application_received: "N",
    application_received_date: "",
    inquiry_date: new Date().toISOString().split("T")[0],
    transaction_type: "",
    loan_type: "",
    estimated_property_value: undefined,
    estimated_credit_score: undefined,
    loan_term: "",
    target_closing_date: "",
    loan_officer_name: "",
    processor_name: "",
    all_documents_received: "N",
    missing_documents_list: "",
    follow_up_date: "",
    expected_commission: undefined,
    expected_commission_type: "AMOUNT",
    commission_source: undefined,
    additional_notes: "",

    // Pre-Approval Stage 2
    uw_completed: "N",
    val_requested: "N",
    preapproval_amount: undefined,
    down_payment_request: undefined,
    preapproval_sent_to_client: "N",
    preapproval_sent_date: "",

    // New Loan Stage 2
    lender_name: "",
    submission_date: "",
    loan_amount: undefined,
    moonstar_disclosure_sent: "N",
    lender_disclosure_sent: "N",
    received_all_uw_documents: "N",
    rate_locked: "N",
    interest_rate: undefined,
    lock_expire_date: "",

    // New Loan Stage 3
    moonstar_disclosure_signed_3day: "N",
    moonstar_disclosure_signed_date: "",
    lender_disclosure_signed_3day: "N",
    lender_disclosure_signed_date: "",
    anti_predatory_completed: "NA",
    anti_predatory_completed_date: "",
    conditionally_approved: "N",
    pending_conditions_text: "",
    appraisal_ordered: "NA",
    title_ordered: "N",
    condo_questionnaire_requested: "NA",
    hoi_requested: "NA",

    // New Loan Stage 4
    moonstar_disclosure_2_signed: "N",
    moonstar_disclosure_2_signed_date: "",
    appraisal_sent_to_client: "NA",
    appraisal_sent_date: "",
    cd_requested: "N",
    appraised_value_amount: undefined,
    ctc_status: "N",
    cd_acknowledged: "N",
    closing_confirmation_received: "N",
    voe_cleared: "N",

    // New Loan Stage 5
    credit_report_invoice_submitted: "N",
    condo_invoice_submitted: "NA",
    final_interest_rate: undefined,
    final_loan_amount: undefined,
    final_cd_received: "N",
    closing_schedule: "",

    // New Loan Stage 6
    closing_docs_downloaded: "N",
    appraisal_downloaded: "N",
    title_report_downloaded: "N",
    moonstar_audit_completed: "N",
    title_check_received: "N",
    check_wire_amount_received: undefined,
    client_refund_amount: undefined,
    loan_log_updated: "N",
    borrowers: [
      {
        client_name: "",
        phone: "",
        email: "",
        is_primary: true,
        display_order: 0,
      },
    ],
  });

  useEffect(() => {
    if (initialLoan) {
      setPipelineType(initialLoan.pipeline_type);
      setStage(initialLoan.stage);

      let loadedBorrowers = initialLoan.borrowers;
      if (!loadedBorrowers || loadedBorrowers.length === 0) {
        loadedBorrowers = [
          {
            client_name: initialLoan.client_name || "",
            phone: initialLoan.phone || "",
            email: initialLoan.email || "",
            is_primary: true,
            display_order: 0,
          },
        ];
      }
      setFormData({ ...initialLoan, borrowers: loadedBorrowers });

      const modes: Record<string, boolean> = {};
      if (
        initialLoan.transaction_type &&
        !EXCEL_TRANSACTION_TYPES.includes(initialLoan.transaction_type as any)
      ) {
        modes.transaction_type = true;
      }
      if (
        initialLoan.loan_type &&
        !EXCEL_LOAN_TYPES.includes(initialLoan.loan_type as any)
      ) {
        modes.loan_type = true;
      }
      if (
        initialLoan.loan_term &&
        !EXCEL_LOAN_TERMS.includes(initialLoan.loan_term as any)
      ) {
        modes.loan_term = true;
      }
      if (
        initialLoan.loan_officer_name &&
        !EXCEL_LOAN_OFFICERS.includes(initialLoan.loan_officer_name as any)
      ) {
        modes.loan_officer_name = true;
      }
      if (
        initialLoan.processor_name &&
        !EXCEL_PROCESSORS.includes(initialLoan.processor_name as any)
      ) {
        modes.processor_name = true;
      }
      if (
        initialLoan.lender_name &&
        !EXCEL_WHOLESALE_LENDERS.includes(initialLoan.lender_name as any)
      ) {
        modes.lender_name = true;
      }
      setManualInputModes(modes);

      // Initialize local formatted state
      const initRate =
        initialLoan.interest_rate !== undefined &&
        initialLoan.interest_rate !== null
          ? Number(initialLoan.interest_rate).toFixed(3)
          : "";
      const initFinal =
        initialLoan.final_interest_rate !== undefined &&
        initialLoan.final_interest_rate !== null
          ? Number(initialLoan.final_interest_rate).toFixed(3)
          : "";
      setLocalInterestRate(initRate);
      setLocalFinalInterestRate(initFinal);
    } else {
      const initPipeline = defaultPipelineType;
      setPipelineType(initPipeline);
      setStage(
        initPipeline === "PRE_APPROVAL" ? "PREAPPROVAL_LOAN" : "NEW_LOAN",
      );
      setManualInputModes({});
      setFormData({
        client_name: "",
        phone: "",
        email: "",
        address: "",
        state: "CA",
        application_received: "N",
        application_received_date: "",
        inquiry_date: new Date().toISOString().split("T")[0],
        transaction_type: initPipeline === "PRE_APPROVAL" ? "Pre-approval" : "",
        loan_type: "",
        estimated_property_value: undefined,
        estimated_credit_score: undefined,
        expected_commission: undefined,
        expected_commission_type: "AMOUNT",
        commission_source: undefined,
        loan_term: "30_YRS",
        target_closing_date: "",
        loan_officer_name: "",
        processor_name: "",
        all_documents_received: "N",
        missing_documents_list: "",
        follow_up_date: "",
        additional_notes: "",
        uw_completed: "N",
        val_requested: "N",
        preapproval_sent_to_client: "N",
        lender_name: "",
        moonstar_disclosure_sent: undefined,
        lender_disclosure_sent: undefined,
        received_all_uw_documents: undefined,
        rate_locked: undefined,
        moonstar_disclosure_signed_3day: "N",
        lender_disclosure_signed_3day: "N",
        anti_predatory_completed: "NA",
        conditionally_approved: "N",
        appraisal_ordered: "NA",
        title_ordered: "N",
        condo_questionnaire_requested: "NA",
        hoi_requested: "NA",
        moonstar_disclosure_2_signed: "N",
        appraisal_sent_to_client: "NA",
        cd_requested: "N",
        ctc_status: "N",
        cd_acknowledged: "N",
        closing_confirmation_received: "N",
        voe_cleared: "N",
        credit_report_invoice_submitted: "N",
        condo_invoice_submitted: "NA",
        final_cd_received: "N",
        closing_docs_downloaded: "N",
        appraisal_downloaded: "N",
        title_report_downloaded: "N",
        moonstar_audit_completed: "N",
        title_check_received: "N",
        loan_log_updated: "N",
        borrowers: [
          {
            client_name: "",
            phone: "",
            email: "",
            is_primary: true,
            display_order: 0,
          },
        ],
      });
      setLocalInterestRate("");
      setLocalFinalInterestRate("");
    }
  }, [initialLoan, defaultPipelineType, isOpen]);

  if (!isOpen) return null;

  const availableStages = MORTGAGE_STAGES.filter(
    (s) => s.pipeline === pipelineType,
  );

  const handleFieldChange = (field: keyof MortgageLoan, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const oldSelectionStart = input.selectionStart;
    const oldLength = input.value.length;

    const formatted = formatPhoneNumber(input.value);
    handleFieldChange("phone", formatted);

    requestAnimationFrame(() => {
      if (input && oldSelectionStart !== null) {
        const diff = formatted.length - oldLength;
        const newCursor = Math.max(0, oldSelectionStart + diff);
        input.setSelectionRange(newCursor, newCursor);
      }
    });
  };

  const handleBorrowerChange = (
    index: number,
    field: string,
    value: string,
  ) => {
    setFormData((prev) => {
      const newBorrowers = [...(prev.borrowers || [])];
      if (newBorrowers[index]) {
        newBorrowers[index] = { ...newBorrowers[index], [field]: value };
      }
      if (index === 0) {
        return {
          ...prev,
          borrowers: newBorrowers,
          [field]: value,
        };
      }
      return { ...prev, borrowers: newBorrowers };
    });
  };

  const handleBorrowerPhoneChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = e.target;
    const oldSelectionStart = input.selectionStart;
    const oldLength = input.value.length;

    const formatted = formatPhoneNumber(input.value);
    handleBorrowerChange(index, "phone", formatted);

    requestAnimationFrame(() => {
      if (input && oldSelectionStart !== null) {
        const diff = formatted.length - oldLength;
        const newCursor = Math.max(0, oldSelectionStart + diff);
        input.setSelectionRange(newCursor, newCursor);
      }
    });
  };

  const addBorrower = () => {
    setFormData((prev) => ({
      ...prev,
      borrowers: [
        ...(prev.borrowers || []),
        {
          client_name: "",
          phone: "",
          email: "",
          is_primary: false,
          display_order: prev.borrowers?.length || 0,
        },
      ],
    }));
  };

  const removeBorrower = (index: number) => {
    if (index === 0) return;
    setFormData((prev) => {
      const newBorrowers = [...(prev.borrowers || [])];
      newBorrowers.splice(index, 1);
      return { ...prev, borrowers: newBorrowers };
    });
  };

  const handleDropdownChange = (
    field: keyof MortgageLoan,
    value: string,
    standardOptions: readonly string[],
  ) => {
    if (value === "Other (Manual Input)") {
      setManualInputModes((prev) => ({ ...prev, [field]: true }));
      handleFieldChange(field, "");
    } else {
      setManualInputModes((prev) => ({ ...prev, [field]: false }));
      handleFieldChange(field, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pipelineType === "PRE_APPROVAL" || stage === "PREAPPROVAL_LOAN") {
      const missing: string[] = [];
      const isMissing = (val: any) =>
        val === undefined || val === null || val === "";

      if (isMissing(formData.client_name)) missing.push("Client Name");
      if (isMissing(formData.phone)) missing.push("Phone Number");
      if (isMissing(formData.email)) missing.push("Email Address");
      if (isMissing(formData.loan_type)) missing.push("Loan Type");
      if (isMissing(formData.loan_term)) missing.push("Loan Term");
      if (isMissing(formData.estimated_property_value))
        missing.push("Estimated Property Value");
      if (isMissing(formData.estimated_credit_score))
        missing.push("Estimated Credit Score");
      if (isMissing(formData.expected_commission))
        missing.push("Expected Commission");
      if (isMissing(formData.loan_officer_name))
        missing.push("Assigned Loan Officer");
      if (isMissing(formData.processor_name))
        missing.push("Assigned Processor");
      if (isMissing(formData.state)) missing.push("State");
      if (
        formData.application_received === "Y" &&
        isMissing(formData.application_received_date)
      ) {
        missing.push("Application Received Date");
      }

      if (missing.length > 0) {
        const msg = `Please complete all required fields before creating the application. Missing: ${missing.join(", ")}`;
        setError(msg);
        toast(
          `Validation failed. ${missing.length} fields missing.`,
          "warning",
        );
        return;
      }
    } else if (stage === "NEW_LOAN" || !isEditing) {
      const missing: string[] = [];
      const isMissing = (val: any) =>
        val === undefined || val === null || val === "";

      if (isMissing(formData.client_name)) missing.push("Primary Client Name");
      if (isMissing(formData.phone)) missing.push("Primary Phone Number");
      if (isMissing(formData.email)) missing.push("Primary Email Address");

      formData.borrowers?.forEach((b, idx) => {
        if (isMissing(b.client_name)) missing.push(`Co-Borrower ${idx} Name`);
      });

      if (isMissing(formData.expected_commission))
        missing.push("Expected Commission");
      if (isMissing(formData.expected_commission_type))
        missing.push("Commission Type");
      if (isMissing(formData.commission_source))
        missing.push("Commission Source");

      if (missing.length > 0) {
        const msg = `Please complete all required fields. Missing: ${missing.join(", ")}`;
        setError(msg);
        toast(
          `Validation failed. ${missing.length} fields missing.`,
          "warning",
        );
        return;
      }
    } else if (stage === "SUBMIT_TO_UW") {
      const missing: string[] = [];
      const isMissing = (val: any) =>
        val === undefined || val === null || val === "";

      if (isMissing(formData.lender_name)) missing.push("Wholesale Lender");
      if (isMissing(formData.submission_date)) missing.push("Submission Date");
      if (isMissing(formData.loan_amount))
        missing.push("Submitted Loan Amount");
      if (isMissing(formData.moonstar_disclosure_sent))
        missing.push("Moonstar Disclosure Sent");
      if (isMissing(formData.lender_disclosure_sent))
        missing.push("Lender Disclosure Sent");
      if (isMissing(formData.received_all_uw_documents))
        missing.push("All UW Documents Received");
      if (isMissing(formData.rate_locked)) missing.push("Rate Locked");

      if (formData.rate_locked === "Y") {
        if (isMissing(formData.interest_rate))
          missing.push("Locked Interest Rate");
        if (isMissing(formData.lock_expire_date))
          missing.push("Lock Expiration Date");
      }

      if (missing.length > 0) {
        const msg = `Please complete all required fields for SUBMIT TO UW stage. Missing: ${missing.join(", ")}`;
        setError(msg);
        toast(
          `Validation failed. ${missing.length} fields missing.`,
          "warning",
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      const url = isEditing
        ? `/api/mortgage/loans/${initialLoan.id}`
        : `/api/mortgage/loans`;
      const method = isEditing ? "PUT" : "POST";

      const cleanedData: Record<string, any> = { ...formData };
      Object.keys(cleanedData).forEach((k) => {
        if (
          typeof cleanedData[k] === "string" &&
          cleanedData[k].trim() === ""
        ) {
          cleanedData[k] = null;
        }
      });

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...cleanedData,
          pipeline_type: pipelineType,
          stage,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to save mortgage application");
      }

      const stageCfg = getStageConfig(stage);
      if (isEditing) {
        toast(
          `Saved "${stageCfg.label}" updates for ${formData.client_name || "Borrower"}!`,
          "success",
          4000,
        );
      } else {
        toast(
          `Successfully created ${stageCfg.label} application for ${formData.client_name || "Borrower"}!`,
          "success",
          4000,
        );
      }

      onSuccess(json.loan);
      onClose();
    } catch (err: any) {
      const errMsg = err.message || "An error occurred while saving.";
      setError(errMsg);
      toast(`Save failed: ${errMsg}`, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const stageConfig = getStageConfig(stage);

  // Common styling for inputs to guarantee crisp readability matching Innovative Insurance CRM
  const inputClass =
    "h-10 w-full border border-gray-300 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-800 text-sm bg-white transition-all shadow-2xs";
  const dateInputClass =
    "mortgage-date-input h-10 w-full border border-gray-300 rounded-xl px-3.5 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-800 text-sm bg-white transition-all shadow-2xs";
  const labelClass =
    "block text-gray-700 font-semibold mb-1.5 text-xs sm:text-sm tracking-tight";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isHidden={isHidden}
      title={isEditing ? "Update Stage" : "New Mortgage Application"}
      subtitle={isEditing ? "Update the current stage and details" : "Enter application details"}
      maxWidth="max-w-4xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 h-[46px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="loan-form"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-2 h-[46px] disabled:opacity-50 disabled:shadow-none shadow-emerald-200 hover:shadow-emerald-300"
          >
            <Save className="w-4 h-4 shrink-0" />
            <span>
              {submitting
                ? "Saving..."
                : isEditing
                  ? `Save ${stageConfig.label}`
                  : `Create Application`}
            </span>
          </button>
        </>
      }
    >
      <div className="flex flex-col h-full space-y-0 -mx-6 sm:-mx-8 -my-6 sm:-my-8">
        {/* Read-only Borrower Context Header when editing a later stage */}
        {isEditing && (
          <div className="shrink-0 px-6 sm:px-8 py-3.5 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center justify-between text-xs gap-4 text-gray-700 font-medium z-10 sticky top-0">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#10B889]" />
              <span className="font-bold text-gray-900 text-sm">
                {formData.client_name || "Borrower"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="font-semibold">{formData.phone || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="font-semibold">{formData.email || "N/A"}</span>
            </div>
          </div>
        )}

        {/* Form Content */}
        <form
          id="loan-form"
          onSubmit={handleSubmit}
          className="flex-1 flex flex-col min-h-0"
        >
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
            {(stage === "NEW_LOAN" || stage === "PREAPPROVAL_LOAN") && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                    {stage === "PREAPPROVAL_LOAN"
                      ? "Pre-Approval Borrower Contact & Inquiry Details"
                      : "Borrower Contact & Inquiry Details"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    <div className="sm:col-span-3 space-y-4">
                      {formData.borrowers?.map((b, idx) => (
                        <div
                          key={idx}
                          className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 relative group"
                        >
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => removeBorrower(idx)}
                              className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X size={16} />
                            </button>
                          )}
                          <div className="flex items-center gap-2 mb-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${idx === 0 ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}
                            >
                              {idx === 0
                                ? "Primary Borrower"
                                : `Co-Borrower ${idx}`}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className={labelClass}>
                                Client Name{" "}
                                <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={b.client_name}
                                onChange={(e) =>
                                  handleBorrowerChange(
                                    idx,
                                    "client_name",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter borrower full name..."
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>
                                Phone Number{" "}
                                {idx === 0 && (
                                  <span className="text-red-400">*</span>
                                )}
                              </label>
                              <input
                                type="tel"
                                required={idx === 0}
                                value={b.phone}
                                onChange={(e) =>
                                  handleBorrowerPhoneChange(idx, e)
                                }
                                placeholder="(555) 000-0000"
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>
                                Email Address{" "}
                                {idx === 0 && (
                                  <span className="text-red-400">*</span>
                                )}
                              </label>
                              <input
                                type="email"
                                required={idx === 0}
                                value={b.email}
                                onChange={(e) =>
                                  handleBorrowerChange(
                                    idx,
                                    "email",
                                    e.target.value,
                                  )
                                }
                                placeholder="client@example.com"
                                className={inputClass}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addBorrower}
                        className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5"
                      >
                        + Add Borrower
                      </button>
                    </div>

                    <div className="sm:col-span-2">
                      <label className={labelClass}>
                        Property / Subject Address
                      </label>
                      <input
                        type="text"
                        value={formData.address || ""}
                        onChange={(e) =>
                          handleFieldChange("address", e.target.value)
                        }
                        placeholder="123 Main St, Apt 4B"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>State</label>
                      <input
                        type="text"
                        value={formData.state || ""}
                        onChange={(e) =>
                          handleFieldChange("state", e.target.value)
                        }
                        placeholder="CA"
                        maxLength={2}
                        className={`${inputClass} uppercase`}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                    {stage === "PREAPPROVAL_LOAN"
                      ? "Pre-Approval Loan Request & Staff Assignment"
                      : "Loan Request & Staff Assignment"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {/* Transaction Type */}
                    <div>
                      <label className={labelClass}>Transaction Type</label>
                      {pipelineType === "PRE_APPROVAL" ? (
                        <input
                          type="text"
                          readOnly
                          value="Pre-approval"
                          className={`${inputClass} bg-gray-50 text-gray-500 cursor-not-allowed select-none`}
                        />
                      ) : (
                        <>
                          <FormSelect
                            value={
                              manualInputModes.transaction_type
                                ? "Other (Manual Input)"
                                : EXCEL_TRANSACTION_TYPES.includes(
                                      formData.transaction_type as any,
                                    )
                                  ? formData.transaction_type
                                  : formData.transaction_type
                                    ? "Other (Manual Input)"
                                    : ""
                            }
                            onChange={(e) =>
                              handleDropdownChange(
                                "transaction_type",
                                e.target.value,
                                EXCEL_TRANSACTION_TYPES,
                              )
                            }
                            className={inputClass}
                          >
                            <option value="">Select...</option>
                            {EXCEL_TRANSACTION_TYPES.map((item) => (
                              <option key={item} value={item}>
                                {item}
                              </option>
                            ))}
                          </FormSelect>
                          {(manualInputModes.transaction_type ||
                            (formData.transaction_type &&
                              !EXCEL_TRANSACTION_TYPES.includes(
                                formData.transaction_type as any,
                              ))) && (
                            <input
                              type="text"
                              placeholder="Enter custom Transaction Type..."
                              value={formData.transaction_type || ""}
                              onChange={(e) =>
                                handleFieldChange(
                                  "transaction_type",
                                  e.target.value,
                                )
                              }
                              className={`${inputClass} mt-2`}
                              required
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* Loan Type */}
                    <div>
                      <label className={labelClass}>Loan Type</label>
                      <FormSelect
                        value={
                          manualInputModes.loan_type
                            ? "Other (Manual Input)"
                            : EXCEL_LOAN_TYPES.includes(
                                  formData.loan_type as any,
                                )
                              ? formData.loan_type
                              : formData.loan_type
                                ? "Other (Manual Input)"
                                : ""
                        }
                        onChange={(e) =>
                          handleDropdownChange(
                            "loan_type",
                            e.target.value,
                            EXCEL_LOAN_TYPES,
                          )
                        }
                        className={inputClass}
                      >
                        <option value="">Select...</option>
                        {EXCEL_LOAN_TYPES.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </FormSelect>
                      {(manualInputModes.loan_type ||
                        (formData.loan_type &&
                          !EXCEL_LOAN_TYPES.includes(
                            formData.loan_type as any,
                          ))) && (
                        <input
                          type="text"
                          placeholder="Enter custom Loan Type..."
                          value={formData.loan_type || ""}
                          onChange={(e) =>
                            handleFieldChange("loan_type", e.target.value)
                          }
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
                            ? "Other (Manual Input)"
                            : EXCEL_LOAN_TERMS.includes(
                                  formData.loan_term as any,
                                )
                              ? formData.loan_term
                              : formData.loan_term
                                ? "Other (Manual Input)"
                                : ""
                        }
                        onChange={(e) =>
                          handleDropdownChange(
                            "loan_term",
                            e.target.value,
                            EXCEL_LOAN_TERMS,
                          )
                        }
                        className={inputClass}
                      >
                        <option value="">Select...</option>
                        {EXCEL_LOAN_TERMS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </FormSelect>
                      {(manualInputModes.loan_term ||
                        (formData.loan_term &&
                          !EXCEL_LOAN_TERMS.includes(
                            formData.loan_term as any,
                          ))) && (
                        <input
                          type="text"
                          placeholder="Enter custom Loan Term..."
                          value={formData.loan_term || ""}
                          onChange={(e) =>
                            handleFieldChange("loan_term", e.target.value)
                          }
                          className="w-full mt-2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700 text-sm bg-white"
                        />
                      )}
                    </div>

                    {/* Assigned Loan Officer */}
                    <div>
                      <label className={labelClass}>
                        Assigned Loan Officer
                      </label>
                      <FormSelect
                        value={
                          manualInputModes.loan_officer_name
                            ? "Other (Manual Input)"
                            : EXCEL_LOAN_OFFICERS.includes(
                                  formData.loan_officer_name as any,
                                )
                              ? formData.loan_officer_name
                              : formData.loan_officer_name
                                ? "Other (Manual Input)"
                                : ""
                        }
                        onChange={(e) =>
                          handleDropdownChange(
                            "loan_officer_name",
                            e.target.value,
                            EXCEL_LOAN_OFFICERS,
                          )
                        }
                        className={inputClass}
                      >
                        <option value="">Select...</option>
                        {EXCEL_LOAN_OFFICERS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </FormSelect>
                      {(manualInputModes.loan_officer_name ||
                        (formData.loan_officer_name &&
                          !EXCEL_LOAN_OFFICERS.includes(
                            formData.loan_officer_name as any,
                          ))) && (
                        <input
                          type="text"
                          placeholder="Enter custom Loan Officer name..."
                          value={formData.loan_officer_name || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              "loan_officer_name",
                              e.target.value,
                            )
                          }
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
                            ? "Other (Manual Input)"
                            : EXCEL_PROCESSORS.includes(
                                  formData.processor_name as any,
                                )
                              ? formData.processor_name
                              : formData.processor_name
                                ? "Other (Manual Input)"
                                : ""
                        }
                        onChange={(e) =>
                          handleDropdownChange(
                            "processor_name",
                            e.target.value,
                            EXCEL_PROCESSORS,
                          )
                        }
                        className={inputClass}
                      >
                        <option value="">Select...</option>
                        {EXCEL_PROCESSORS.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </FormSelect>
                      {(manualInputModes.processor_name ||
                        (formData.processor_name &&
                          !EXCEL_PROCESSORS.includes(
                            formData.processor_name as any,
                          ))) && (
                        <input
                          type="text"
                          placeholder="Enter custom Processor name..."
                          value={formData.processor_name || ""}
                          onChange={(e) =>
                            handleFieldChange("processor_name", e.target.value)
                          }
                          className="w-full mt-2 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-gray-700 text-sm bg-white"
                        />
                      )}
                    </div>

                    {/* Application Received */}
                    <div>
                      <label className={labelClass}>
                        Application Received?
                      </label>
                      <FormSelect
                        value={formData.application_received || "N"}
                        onChange={(e) =>
                          handleFieldChange(
                            "application_received",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      >
                        <option value="N">No (Pending)</option>
                        <option value="Y">Yes</option>
                      </FormSelect>
                    </div>

                    {/* Application Received Date (If Yes) */}
                    {formData.application_received === "Y" && (
                      <div>
                        <label className={labelClass}>
                          Application Received Date
                        </label>
                        <input
                          type="date"
                          value={formData.application_received_date || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              "application_received_date",
                              e.target.value,
                            )
                          }
                          className={dateInputClass}
                        />
                      </div>
                    )}

                    {/* Estimated Property Value */}
                    <div>
                      <label className={labelClass}>
                        Estimated Property Value ($)
                      </label>
                      <input
                        type="number"
                        value={formData.estimated_property_value || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "estimated_property_value",
                            e.target.value,
                          )
                        }
                        placeholder="e.g. 500000"
                        className={inputClass}
                      />
                    </div>

                    {/* Estimated Credit Score */}
                    <div>
                      <label className={labelClass}>
                        Estimated Credit Score
                      </label>
                      <input
                        type="number"
                        value={formData.estimated_credit_score || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "estimated_credit_score",
                            e.target.value,
                          )
                        }
                        placeholder="e.g. 740"
                        className={inputClass}
                      />
                    </div>

                    {/* Expected Commission Group */}
                    <div className="col-span-1 sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Commission Type */}
                      <div>
                        <label className={labelClass}>
                          Commission Type{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <FormSelect
                          value={formData.expected_commission_type || "AMOUNT"}
                          onChange={(e) =>
                            handleFieldChange(
                              "expected_commission_type",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                        >
                          <option value="AMOUNT">Amount ($)</option>
                          <option value="PERCENTAGE">Percentage (%)</option>
                        </FormSelect>
                      </div>

                      {/* Expected Commission Value */}
                      <div>
                        <label className={labelClass}>
                          Expected Commission (
                          {formData.expected_commission_type === "PERCENTAGE"
                            ? "%"
                            : "$"}
                          ) <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm font-medium">
                              {formData.expected_commission_type ===
                              "PERCENTAGE"
                                ? "%"
                                : "$"}
                            </span>
                          </div>
                          <input
                            type="number"
                            value={formData.expected_commission || ""}
                            onChange={(e) =>
                              handleFieldChange(
                                "expected_commission",
                                e.target.value,
                              )
                            }
                            placeholder={
                              formData.expected_commission_type === "PERCENTAGE"
                                ? "e.g. 2"
                                : "e.g. 5000"
                            }
                            className={`${inputClass} pl-8`}
                          />
                        </div>
                      </div>

                      {/* Commission Source */}
                      <div>
                        <label className={labelClass}>
                          Commission Source{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <FormSelect
                          value={formData.commission_source || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              "commission_source",
                              e.target.value,
                            )
                          }
                          className={inputClass}
                        >
                          <option value="" disabled>
                            Select Source...
                          </option>
                          <option value="LENDER_PAID">LENDER_PAID</option>
                          <option value="BORROWER_PAID">BORROWER_PAID</option>
                        </FormSelect>
                      </div>
                    </div>

                    {/* Target Closing Date (Fixed Datepicker UI) */}
                    {!(
                      (pipelineType === "PRE_APPROVAL" ||
                        stage === "PREAPPROVAL_LOAN") &&
                      !isEditing
                    ) && (
                      <div>
                        <label className={labelClass}>
                          Target Closing Date
                        </label>
                        <input
                          type="date"
                          value={formData.target_closing_date || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              "target_closing_date",
                              e.target.value,
                            )
                          }
                          className={dateInputClass}
                        />
                      </div>
                    )}

                    {/* Follow Up Date (Fixed Datepicker UI) */}
                    <div>
                      <label className={labelClass}>Follow Up Date</label>
                      <input
                        type="date"
                        value={formData.follow_up_date || ""}
                        onChange={(e) =>
                          handleFieldChange("follow_up_date", e.target.value)
                        }
                        className={dateInputClass}
                      />
                    </div>

                    {/* All Documents Received */}
                    <div>
                      <label className={labelClass}>
                        All Documents Received?
                      </label>
                      <FormSelect
                        value={formData.all_documents_received || "N"}
                        onChange={(e) =>
                          handleFieldChange(
                            "all_documents_received",
                            e.target.value,
                          )
                        }
                        className={inputClass}
                      >
                        <option value="N">No (Missing Docs)</option>
                        <option value="Y">Yes (Complete)</option>
                      </FormSelect>
                    </div>
                  </div>

                  {/* Missing Documents List (if No) */}
                  {formData.all_documents_received === "N" && (
                    <div className="mt-5">
                      <label className={labelClass}>
                        Missing Documents List
                      </label>
                      <input
                        type="text"
                        value={formData.missing_documents_list || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "missing_documents_list",
                            e.target.value,
                          )
                        }
                        placeholder="e.g. 2024 W2, 2 months bank statements"
                        className={inputClass}
                      />
                    </div>
                  )}

                  <div className="mt-5">
                    <label className={labelClass}>Additional Notes</label>
                    <textarea
                      rows={3}
                      value={formData.additional_notes || ""}
                      onChange={(e) =>
                        handleFieldChange("additional_notes", e.target.value)
                      }
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
            {stage === "MANUAL_UW" && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                  Manual Underwriting Review & Pre-Approval Letter
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>UW Completed?</label>
                    <FormSelect
                      value={formData.uw_completed || "N"}
                      onChange={(e) =>
                        handleFieldChange("uw_completed", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="N">No (In Review)</option>
                      <option value="Y">Yes (Completed)</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Approved Preapproval Amount ($)
                    </label>
                    <input
                      type="number"
                      value={formData.preapproval_amount || ""}
                      onChange={(e) =>
                        handleFieldChange("preapproval_amount", e.target.value)
                      }
                      placeholder="e.g. 450000"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Down Payment Request ($)
                    </label>
                    <input
                      type="number"
                      value={formData.down_payment_request || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "down_payment_request",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. 90000"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Pre-Approval Sent to Client?
                    </label>
                    <FormSelect
                      value={formData.preapproval_sent_to_client || "N"}
                      onChange={(e) =>
                        handleFieldChange(
                          "preapproval_sent_to_client",
                          e.target.value,
                        )
                      }
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
                      value={formData.preapproval_sent_date || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "preapproval_sent_date",
                          e.target.value,
                        )
                      }
                      className={dateInputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* NEW LOAN STAGE 2: SUBMIT TO UW */}
            {/* ========================================================= */}
            {stage === "SUBMIT_TO_UW" && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                  Underwriting Submission & Rate Lock Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>
                      Wholesale Lender <span className="text-red-400">*</span>
                    </label>
                    <FormSelect
                      value={
                        manualInputModes.lender_name
                          ? "Other (Manual Input)"
                          : EXCEL_WHOLESALE_LENDERS.includes(
                                formData.lender_name as any,
                              )
                            ? formData.lender_name
                            : formData.lender_name
                              ? "Other (Manual Input)"
                              : ""
                      }
                      onChange={(e) =>
                        handleDropdownChange(
                          "lender_name",
                          e.target.value,
                          EXCEL_WHOLESALE_LENDERS,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="">Select...</option>
                      {EXCEL_WHOLESALE_LENDERS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </FormSelect>
                    {(manualInputModes.lender_name ||
                      (formData.lender_name &&
                        !EXCEL_WHOLESALE_LENDERS.includes(
                          formData.lender_name as any,
                        ))) && (
                      <input
                        type="text"
                        placeholder="Enter custom Wholesale Lender..."
                        value={formData.lender_name || ""}
                        onChange={(e) =>
                          handleFieldChange("lender_name", e.target.value)
                        }
                        className="w-full mt-2 px-3.5 py-2 bg-white border border-[#10B889] rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-[#10B889]/30"
                      />
                    )}
                  </div>

                  <div>
                    <label className={labelClass}>
                      Submission Date <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.submission_date || ""}
                      onChange={(e) =>
                        handleFieldChange("submission_date", e.target.value)
                      }
                      className={dateInputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Submitted Loan Amount ($){" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.loan_amount || ""}
                      onChange={(e) =>
                        handleFieldChange("loan_amount", e.target.value)
                      }
                      placeholder="e.g. 400000"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Moonstar Disclosure Sent?{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <FormSelect
                      value={formData.moonstar_disclosure_sent || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "moonstar_disclosure_sent",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Lender Disclosure Sent?{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <FormSelect
                      value={formData.lender_disclosure_sent || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "lender_disclosure_sent",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>
                      All UW Documents Received?{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <FormSelect
                      value={formData.received_all_uw_documents || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "received_all_uw_documents",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Rate Locked? <span className="text-red-400">*</span>
                    </label>
                    <FormSelect
                      value={formData.rate_locked || ""}
                      onChange={(e) =>
                        handleFieldChange("rate_locked", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      <option value="N">No (Floating)</option>
                      <option value="Y">Yes (Locked)</option>
                    </FormSelect>
                  </div>

                  {formData.rate_locked === "Y" && (
                    <>
                      <div>
                        <label className={labelClass}>
                          Locked Interest Rate (%){" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={localInterestRate}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9.]/g, "");
                            if ((val.match(/\./g) || []).length > 1) return;
                            setLocalInterestRate(val);
                            handleFieldChange(
                              "interest_rate",
                              val === "" ? undefined : Number(val),
                            );
                          }}
                          onBlur={() => {
                            if (
                              localInterestRate &&
                              !isNaN(Number(localInterestRate))
                            ) {
                              const formatted =
                                Number(localInterestRate).toFixed(3);
                              setLocalInterestRate(formatted);
                              handleFieldChange(
                                "interest_rate",
                                Number(formatted),
                              );
                            }
                          }}
                          placeholder="e.g. 6.125"
                          className={inputClass}
                        />
                      </div>

                      <div>
                        <label className={labelClass}>
                          Lock Expiration Date{" "}
                          <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.lock_expire_date || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              "lock_expire_date",
                              e.target.value,
                            )
                          }
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
            {stage === "INITIAL_COMPLIANCE" && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                  Disclosures, Anti-Predatory Check & Order Tracking
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>
                      Moonstar Disclosure Signed (3-Day)?
                    </label>
                    <FormSelect
                      value={formData.moonstar_disclosure_signed_3day || "N"}
                      onChange={(e) =>
                        handleFieldChange(
                          "moonstar_disclosure_signed_3day",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  {formData.moonstar_disclosure_signed_3day === "Y" && (
                    <div>
                      <label className={labelClass}>Moonstar Signed Date</label>
                      <input
                        type="date"
                        value={formData.moonstar_disclosure_signed_date || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "moonstar_disclosure_signed_date",
                            e.target.value,
                          )
                        }
                        className={dateInputClass}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>
                      Lender Disclosure Signed (3-Day)?
                    </label>
                    <FormSelect
                      value={formData.lender_disclosure_signed_3day || "N"}
                      onChange={(e) =>
                        handleFieldChange(
                          "lender_disclosure_signed_3day",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  {formData.lender_disclosure_signed_3day === "Y" && (
                    <div>
                      <label className={labelClass}>Lender Signed Date</label>
                      <input
                        type="date"
                        value={formData.lender_disclosure_signed_date || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "lender_disclosure_signed_date",
                            e.target.value,
                          )
                        }
                        className={dateInputClass}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Anti-Predatory Review</label>
                    <FormSelect
                      value={formData.anti_predatory_completed || "NA"}
                      onChange={(e) =>
                        handleFieldChange(
                          "anti_predatory_completed",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="NA">N/A</option>
                      <option value="N">No (Pending)</option>
                      <option value="Y">Yes (Passed)</option>
                    </FormSelect>
                  </div>

                  {formData.anti_predatory_completed === "Y" && (
                    <div>
                      <label className={labelClass}>
                        Anti-Predatory Completed Date
                      </label>
                      <input
                        type="date"
                        value={formData.anti_predatory_completed_date || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "anti_predatory_completed_date",
                            e.target.value,
                          )
                        }
                        className={dateInputClass}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>
                      Conditionally Approved?
                    </label>
                    <FormSelect
                      value={formData.conditionally_approved || "N"}
                      onChange={(e) =>
                        handleFieldChange(
                          "conditionally_approved",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div className="sm:col-span-2">
                    <label className={labelClass}>
                      Pending UW Conditions List
                    </label>
                    <input
                      type="text"
                      value={formData.pending_conditions_text || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "pending_conditions_text",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. Provide updated paystub and hazard insurance policy"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Appraisal Ordered?</label>
                    <FormSelect
                      value={formData.appraisal_ordered || "NA"}
                      onChange={(e) =>
                        handleFieldChange("appraisal_ordered", e.target.value)
                      }
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
                      value={formData.title_ordered || "N"}
                      onChange={(e) =>
                        handleFieldChange("title_ordered", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Condo Questionnaire Req?
                    </label>
                    <FormSelect
                      value={formData.condo_questionnaire_requested || "NA"}
                      onChange={(e) =>
                        handleFieldChange(
                          "condo_questionnaire_requested",
                          e.target.value,
                        )
                      }
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
                      value={formData.hoi_requested || "NA"}
                      onChange={(e) =>
                        handleFieldChange("hoi_requested", e.target.value)
                      }
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
            {stage === "FINAL_COMPLIANCE" && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                  Second Disclosures, CD Request & Clear to Close (CTC)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>
                      Moonstar Disclosure 2 Signed?
                    </label>
                    <FormSelect
                      value={formData.moonstar_disclosure_2_signed || "N"}
                      onChange={(e) =>
                        handleFieldChange(
                          "moonstar_disclosure_2_signed",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  {formData.moonstar_disclosure_2_signed === "Y" && (
                    <div>
                      <label className={labelClass}>Signed Date</label>
                      <input
                        type="date"
                        value={formData.moonstar_disclosure_2_signed_date || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "moonstar_disclosure_2_signed_date",
                            e.target.value,
                          )
                        }
                        className={dateInputClass}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>
                      Appraisal Sent to Client?
                    </label>
                    <FormSelect
                      value={formData.appraisal_sent_to_client || "NA"}
                      onChange={(e) =>
                        handleFieldChange(
                          "appraisal_sent_to_client",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="NA">N/A (Waiver)</option>
                      <option value="N">No</option>
                      <option value="Y">Yes (Sent)</option>
                    </FormSelect>
                  </div>

                  {formData.appraisal_sent_to_client === "Y" && (
                    <div>
                      <label className={labelClass}>Appraisal Sent Date</label>
                      <input
                        type="date"
                        value={formData.appraisal_sent_date || ""}
                        onChange={(e) =>
                          handleFieldChange(
                            "appraisal_sent_date",
                            e.target.value,
                          )
                        }
                        className={dateInputClass}
                      />
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Appraised Value ($)</label>
                    <input
                      type="number"
                      value={formData.appraised_value_amount || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "appraised_value_amount",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. 510000"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>CD Requested?</label>
                    <FormSelect
                      value={formData.cd_requested || "N"}
                      onChange={(e) =>
                        handleFieldChange("cd_requested", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Clear to Close (CTC) Status?
                    </label>
                    <FormSelect
                      value={formData.ctc_status || "N"}
                      onChange={(e) =>
                        handleFieldChange("ctc_status", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="N">No (Pending)</option>
                      <option value="Y">Yes (CTC Cleared)</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>
                      CD Acknowledged by Borrower?
                    </label>
                    <FormSelect
                      value={formData.cd_acknowledged || "N"}
                      onChange={(e) =>
                        handleFieldChange("cd_acknowledged", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Closing Confirmed?</label>
                    <FormSelect
                      value={formData.closing_confirmation_received || "N"}
                      onChange={(e) =>
                        handleFieldChange(
                          "closing_confirmation_received",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>VOE Cleared?</label>
                    <FormSelect
                      value={formData.voe_cleared || "N"}
                      onChange={(e) =>
                        handleFieldChange("voe_cleared", e.target.value)
                      }
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
            {stage === "CLOSING" && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                  Invoices, Final Terms & Closing Schedule
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>
                      Credit Report Invoice Submitted?
                    </label>
                    <FormSelect
                      value={formData.credit_report_invoice_submitted || "N"}
                      onChange={(e) =>
                        handleFieldChange(
                          "credit_report_invoice_submitted",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Condo Invoice Submitted?
                    </label>
                    <FormSelect
                      value={formData.condo_invoice_submitted || "NA"}
                      onChange={(e) =>
                        handleFieldChange(
                          "condo_invoice_submitted",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="NA">N/A</option>
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Final Interest Rate (%)
                    </label>
                    <input
                      type="text"
                      value={localFinalInterestRate}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        if ((val.match(/\./g) || []).length > 1) return;
                        setLocalFinalInterestRate(val);
                        handleFieldChange(
                          "final_interest_rate",
                          val === "" ? undefined : Number(val),
                        );
                      }}
                      onBlur={() => {
                        if (
                          localFinalInterestRate &&
                          !isNaN(Number(localFinalInterestRate))
                        ) {
                          const formatted = Number(
                            localFinalInterestRate,
                          ).toFixed(3);
                          setLocalFinalInterestRate(formatted);
                          handleFieldChange(
                            "final_interest_rate",
                            Number(formatted),
                          );
                        }
                      }}
                      placeholder="e.g. 6.125"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Final Loan Amount ($)</label>
                    <input
                      type="number"
                      value={formData.final_loan_amount || ""}
                      onChange={(e) =>
                        handleFieldChange("final_loan_amount", e.target.value)
                      }
                      placeholder="e.g. 400000"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Final CD Received?</label>
                    <FormSelect
                      value={formData.final_cd_received || "N"}
                      onChange={(e) =>
                        handleFieldChange("final_cd_received", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Closing Schedule (Date & Time)
                    </label>
                    <input
                      type="text"
                      value={formData.closing_schedule || ""}
                      onChange={(e) =>
                        handleFieldChange("closing_schedule", e.target.value)
                      }
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
            {stage === "AUDIT" && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#2E5C85] border-b border-gray-100 pb-2 mb-4">
                  Post-Closing Audit, Document Archiving & Reconciliation
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  <div>
                    <label className={labelClass}>
                      Closing Docs Downloaded?
                    </label>
                    <FormSelect
                      value={formData.closing_docs_downloaded || "N"}
                      onChange={(e) =>
                        handleFieldChange(
                          "closing_docs_downloaded",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Appraisal Downloaded?</label>
                    <FormSelect
                      value={formData.appraisal_downloaded || "N"}
                      onChange={(e) =>
                        handleFieldChange(
                          "appraisal_downloaded",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Title Report Downloaded?
                    </label>
                    <FormSelect
                      value={formData.title_report_downloaded || "N"}
                      onChange={(e) =>
                        handleFieldChange(
                          "title_report_downloaded",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Moonstar Audit Completed?
                    </label>
                    <FormSelect
                      value={formData.moonstar_audit_completed || "N"}
                      onChange={(e) =>
                        handleFieldChange(
                          "moonstar_audit_completed",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes (Audited)</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>Title Check Received?</label>
                    <FormSelect
                      value={formData.title_check_received || "N"}
                      onChange={(e) =>
                        handleFieldChange(
                          "title_check_received",
                          e.target.value,
                        )
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Wire / Check Amount Received ($)
                    </label>
                    <input
                      type="number"
                      value={formData.check_wire_amount_received || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "check_wire_amount_received",
                          e.target.value,
                        )
                      }
                      placeholder="e.g. 12500"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Client Refund Amount ($)
                    </label>
                    <input
                      type="number"
                      value={formData.client_refund_amount || ""}
                      onChange={(e) =>
                        handleFieldChange(
                          "client_refund_amount",
                          e.target.value,
                        )
                      }
                      placeholder="0.00"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Master Loan Log Updated?
                    </label>
                    <FormSelect
                      value={formData.loan_log_updated || "N"}
                      onChange={(e) =>
                        handleFieldChange("loan_log_updated", e.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </FormSelect>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
}
