'use client'

import { useRouter } from 'next/navigation'
import {
  UserPlus,
  GitBranch,
  List,
} from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()

  return (
    <section className="p-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        Quick Actions
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          title="New Client"
          icon={<UserPlus size={28} />}
          onClick={() => router.push('/dashboard/leads/new')}
        />

        <ActionCard
          title="Personal Pipeline"
          icon={<GitBranch size={28} />}
          onClick={() => router.push('/dashboard/leads')}
        />

        <ActionCard
          title="Activity Log"
          icon={<List size={28} />}
          onClick={() => alert('Activity log coming soon')}
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
        bg-white text-gray-800 hover:bg-[#5C8F3E] hover:text-white
        border-2 border-[#5C8F3E]
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