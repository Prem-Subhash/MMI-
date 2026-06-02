// Lead Accounting Page Wrapper
import { createServer } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import LeadAccountingClient from '@/app/(dashboard)/accounting/leads/[id]/LeadAccountingClient'

export default async function LeadAccountingPage({ params }: { params: { id: string } }) {
  const supabase = await createServer()

  // 1. Verify Authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Enforce RBAC (only accounting and superadmin roles allowed)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['accounting', 'superadmin'].includes(profile.role)) {
    redirect('/unauthorized')
  }

  const leadId = params.id

  // 3. Fetch lead details
  const { data: lead, error: leadError } = await supabase
    .from('temp_leads_basics')
    .select(`
      id,
      client_name,
      phone,
      email,
      policy_number,
      carrier,
      policy_flow,
      insurence_category,
      effective_date,
      total_premium,
      expected_commission,
      actual_commission,
      accounting_status,
      accounting_verified,
      accounting_notes,
      carrier_payment_date,
      commission_received_date,
      assigned_csr,
      assigned_user_profile:profiles!fk_profile (
        full_name
      )
    `)
    .eq('id', leadId)
    .single()

  if (leadError || !lead) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center">
        <Link href="/accounting/all-leads">
          <button className="flex items-center gap-2 text-[#2E5C85] hover:text-[#2E5C85]/80 font-medium mb-6 transition">
            <ArrowLeft size={18} /> Back to Accounting Leads
          </button>
        </Link>
        <div className="bg-white rounded-2xl border border-gray-100 p-12 shadow-sm">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Lead Not Found</h1>
          <p className="text-gray-500">The requested lead ID does not exist or you do not have permissions to view it.</p>
        </div>
      </div>
    )
  }

  // 4. Fetch accounting logs for this lead
  const { data: logs } = await supabase
    .from('accounting_logs')
    .select(`
      id,
      lead_id,
      updated_by,
      old_expected_commission,
      new_expected_commission,
      old_actual_commission,
      new_actual_commission,
      old_status,
      new_status,
      notes,
      created_at,
      updater:profiles!updated_by (
        full_name
      )
    `)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  return (
    <LeadAccountingClient 
      initialLead={lead} 
      initialLogs={logs || []} 
      leadId={leadId}
    />
  )
}
