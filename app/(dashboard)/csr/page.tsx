'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  UserPlus,
  GitBranch,
  List,
  Briefcase,
  RefreshCw,
} from 'lucide-react'
import CategorySelectionModal from '@/components/leads/CategorySelectionModal'
import { supabase } from '@/lib/supabaseClient'

export default function DashboardPage() {
  const router = useRouter()
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [insuranceAccess, setInsuranceAccess] = useState<string[]>([])

  useEffect(() => {
    let mounted = true
    const fetchAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user && mounted) {
        const { data } = await supabase
          .from('profiles')
          .select('insurance_access')
          .eq('id', session.user.id)
          .single()
        if (data?.insurance_access && mounted) {
          setInsuranceAccess(data.insurance_access)
        }
      }
    }
    fetchAccess()
    return () => { mounted = false }
  }, [])

  const handleNewClient = () => {
    if (insuranceAccess.length === 1) {
      router.push(`/csr/leads/new?category=${insuranceAccess[0]}`)
    } else {
      setIsCategoryModalOpen(true)
    }
  }

  return (
    <section className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          Quick Actions
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        <ActionCard
          title="New Client"
          icon={<UserPlus size={28} />}
          onClick={handleNewClient}
        />

        {insuranceAccess.includes('personal') && (
          <>
            <ActionCard
              title="Personal Pipeline"
              icon={<GitBranch size={28} />}
              onClick={() => router.push('/csr/pipeline/personal')}
            />
            <ActionCard
              title="Personal Renewal Pipeline"
              icon={<RefreshCw size={28} />}
              onClick={() => router.push('/csr/renewals/personal')}
            />
          </>
        )}

        {insuranceAccess.includes('commercial') && (
          <>
            <ActionCard
              title="Commercial Pipeline"
              icon={<Briefcase size={28} />}
              onClick={() => router.push('/csr/pipeline/commercial')}
            />
            <ActionCard
              title="Commercial Renewal Pipeline"
              icon={<RefreshCw size={28} />}
              onClick={() => router.push('/csr/renewals/commercial')}
            />
          </>
        )}

        <ActionCard
          title="Activity Log"
          icon={<List size={28} />}
          onClick={() => router.push('/csr/activity-log')}
        />
      </div>

      <CategorySelectionModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelect={(category) => {
          setIsCategoryModalOpen(false)
          router.push(`/csr/leads/new?category=${category}`)
        }}
      />
    </section>
  )
}

function ActionCard({
  title,
  icon,
  onClick,
}: {
  title: string
  icon: React.ReactNode
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`
        group
        cursor-pointer rounded-2xl p-8 flex items-center gap-5
        shadow-md transition-all duration-300
        bg-white text-gray-800 hover:bg-brand-dark hover:text-white
        border-2 border-brand-dark
        hover:scale-[1.05] hover:shadow-xl
      `}
    >
      <div
        className="p-3 rounded-xl bg-gray-100 group-hover:bg-white/20 transition-colors"
      >
        {icon}
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
  )
}