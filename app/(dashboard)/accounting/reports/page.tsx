import { createServer } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import ReportsClient from './ReportsClient'

export default async function AccountingReportsPage() {
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

  // 3. Fetch CSR/User Profiles for filters
  const { data: csrs } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .order('full_name')

  return (
    <ReportsClient 
      csrs={csrs || []} 
    />
  )
}
