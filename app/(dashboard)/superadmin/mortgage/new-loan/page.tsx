"use client";

import React from "react";
import MortgageHeader from "@/app/mortgage/components/MortgageHeader";
import PipelineView from "@/app/mortgage/components/PipelineView";

export default function SuperAdminMortgageNewLoanWrapper() {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <MortgageHeader
        title="New Loan Pipeline"
        subtitle="Manage end-to-end origination from NEW LOAN through SUBMIT TO UW, COMPLIANCE, CLOSING, and AUDIT"
      />
      <PipelineView
        pipelineType="NEW_LOAN"
        title="New Loan Pipeline"
        subtitle="End-to-end mortgage origination workflow"
      />
    </div>
  );
}
