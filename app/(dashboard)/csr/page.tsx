'use client'

import { useRouter } from 'next/navigation'
import {
  UserPlus,
  GitBranch,
  List,
  Briefcase,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()

  return (
    <section className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
          Quick Actions
        </h2>
        <button
          onClick={() => router.push('/')}
          title="Back to Home"
          aria-label="Back to Home"
          className="flex items-center justify-center gap-1.5 p-2 md:px-3.5 md:py-2 rounded-full md:rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 hover:text-[#10B889] text-xs md:text-sm font-bold transition-all shadow-sm hover:shadow group flex-shrink-0"
        >
          <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5 flex-shrink-0" />
          <span className="hidden md:inline">Back to Home</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        <ActionCard
          title="New Client"
          icon={<UserPlus size={28} />}
          onClick={() => router.push('/csr/leads/new')}
        />

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

        <ActionCard
          title="Activity Log"
          icon={<List size={28} />}
          onClick={() => router.push('/csr/activity-log')}
        />
      </div>
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