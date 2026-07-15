import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { MORTGAGE_STAGES } from '@/app/mortgage/lib/stageFields';

export async function GET() {
  try {
    const { data: allLoans, error } = await supabaseServer
      .from('mortgage_loans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const loans = allLoans || [];

    const totalLoans = loans.length;
    const newLoansCount = loans.filter((l) => l.pipeline_type === 'NEW_LOAN').length;
    const preApprovalsCount = loans.filter((l) => l.pipeline_type === 'PRE_APPROVAL').length;
    const loansClosingCount = loans.filter((l) => l.stage === 'CLOSING').length;
    const loansInAuditCount = loans.filter((l) => l.stage === 'AUDIT').length;

    const todayStr = new Date().toISOString().split('T')[0];
    const upcomingFollowUpsList = loans
      .filter((l) => l.follow_up_date && l.follow_up_date >= todayStr)
      .sort((a, b) => (a.follow_up_date! > b.follow_up_date! ? 1 : -1));

    const upcomingFollowUpsCount = upcomingFollowUpsList.length;

    const totalProjectedCommission = loans.reduce(
      (sum, l) => sum + (Number(l.expected_commission) || 0),
      0
    );

    // Stage Distribution
    const stageDistribution = MORTGAGE_STAGES.map((s) => {
      const stageLoans = loans.filter((l) => l.stage === s.code);
      const volume = stageLoans.reduce(
        (acc, l) => acc + (Number(l.loan_amount) || Number(l.estimated_property_value) || 0),
        0
      );
      return {
        stage: s.code,
        name: s.label,
        count: stageLoans.length,
        volume,
      };
    });

    // Loan Officer Summary
    const officerMap: Record<string, { count: number; commission: number }> = {};
    loans.forEach((l) => {
      const officer = l.loan_officer_name || 'Unassigned';
      if (!officerMap[officer]) {
        officerMap[officer] = { count: 0, commission: 0 };
      }
      officerMap[officer].count += 1;
      officerMap[officer].commission += Number(l.expected_commission) || 0;
    });
    const loanOfficerSummary = Object.entries(officerMap).map(([name, val]) => ({
      name,
      count: val.count,
      commission: val.commission,
    }));

    // Processor Summary
    const processorMap: Record<string, { count: number }> = {};
    loans.forEach((l) => {
      const processor = l.processor_name || 'Unassigned';
      if (!processorMap[processor]) {
        processorMap[processor] = { count: 0 };
      }
      processorMap[processor].count += 1;
    });
    const processorSummary = Object.entries(processorMap).map(([name, val]) => ({
      name,
      count: val.count,
    }));

    // Recent Applications (Top 8)
    const recentApplications = loans.slice(0, 8);

    return NextResponse.json({
      success: true,
      stats: {
        totalLoans,
        newLoansCount,
        preApprovalsCount,
        loansClosingCount,
        loansInAuditCount,
        upcomingFollowUpsCount,
        totalProjectedCommission,
        stageDistribution,
        loanOfficerSummary,
        processorSummary,
        recentApplications,
        upcomingFollowUps: upcomingFollowUpsList.slice(0, 8),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
