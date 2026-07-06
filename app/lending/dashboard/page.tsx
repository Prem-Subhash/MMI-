'use client'

import { useRouter } from 'next/navigation'
import {
  PlusCircle,
  GitBranch,
  Briefcase,
  Activity,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Building2,
  DollarSign,
  ArrowUpRight
} from 'lucide-react'

export default function LendingDashboardPage() {
  const router = useRouter()

  return (
    <div className="w-full space-y-8 animate-fade-in">
      {/* Prototype Status Alert Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start sm:items-center gap-3 text-slate-800 shadow-sm">
        <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5 sm:mt-0" size={20} />
        <div className="text-xs sm:text-sm">
          <span className="font-bold uppercase tracking-wider text-amber-800 mr-1.5">UI Prototype Mode:</span>
          The figures, cards, and activity summaries below display static demonstration values. Database persistence and underwriting calculations will be connected in Phase 2.
        </div>
      </div>

      {/* Header / Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-8 rounded-2xl border border-gray-200/80 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10B889] mb-1">
            <Building2 size={14} />
            <span>Commercial Finance Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Accurate Lending Dashboard
          </h1>
          <p className="text-slate-500 text-sm sm:text-base mt-1">
            Monitor commercial loan pipelines, term sheets, and closing workflows in real time.
          </p>
        </div>

        <button
          onClick={() => router.push('/lending/loans/new')}
          className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-white font-bold py-3.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group whitespace-nowrap z-10"
        >
          <PlusCircle size={20} className="transition-transform group-hover:rotate-90" />
          <span>New Loan Application</span>
        </button>
      </div>

      {/* Metric Cards Section (Static Placeholders per Spec) */}
      <div>
        <h2 className="text-base font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-blue-600" />
          <span>Pipeline Overview (Demo Placeholders)</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            title="New Loans"
            value="14"
            subtitle="Inquiries & intake queue"
            icon={<PlusCircle size={24} className="text-blue-600" />}
            bgClass="bg-blue-50/60 border-blue-200/80 hover:border-blue-400"
            trend="+3 this week"
            onClick={() => router.push('/lending/pipeline')}
          />
          <MetricCard
            title="Under Review"
            value="8"
            subtitle="Initial screening & UW"
            icon={<Clock size={24} className="text-amber-600" />}
            bgClass="bg-amber-50/60 border-amber-200/80 hover:border-amber-400"
            trend="Active Underwriting"
            onClick={() => router.push('/lending/pipeline')}
          />
          <MetricCard
            title="Term Sheets Received"
            value="5"
            subtitle="Awaiting borrower commitment"
            icon={<FileText size={24} className="text-purple-600" />}
            bgClass="bg-purple-50/60 border-purple-200/80 hover:border-purple-400"
            trend="$6.4M total volume"
            onClick={() => router.push('/lending/pipeline')}
          />
          <MetricCard
            title="Closing in Process"
            value="3"
            subtitle="Checklist & bank deposits"
            icon={<CheckCircle2 size={24} className="text-teal-600" />}
            bgClass="bg-teal-50/60 border-teal-200/80 hover:border-teal-400"
            trend="Pending disbursement"
            onClick={() => router.push('/lending/pipeline')}
          />
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-base font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Briefcase size={18} className="text-teal-600" />
          <span>Lending Operations & Workflows</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <ActionCard
            title="New Loan Application"
            description="Submit a new commercial borrower inquiry with financial & partner details."
            icon={<PlusCircle size={28} className="text-blue-600" />}
            onClick={() => router.push('/lending/loans/new')}
            badge="Sectioned Form"
          />

          <ActionCard
            title="21-Stage Kanban Pipeline"
            description="Visualize loans across all 21 stages from inquiry to check receipt."
            icon={<GitBranch size={28} className="text-teal-600" />}
            onClick={() => router.push('/lending/pipeline')}
            badge="Horizontal View"
          />

          <ActionCard
            title="Loans Directory"
            description="Search, filter, and export active commercial loan portfolios."
            icon={<Briefcase size={28} className="text-purple-600" />}
            onClick={() => router.push('/lending/loans')}
            badge="Portfolio Table"
          />

          <ActionCard
            title="Underwriting Activity Log"
            description="Track document requests, term sheets, and stage progression history."
            icon={<Activity size={28} className="text-amber-600" />}
            onClick={() => router.push('/lending/activity-log')}
            badge="Audit Trail"
          />
        </div>
      </div>

      {/* Recent Sample Loan Applications Table */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Recent Commercial Applications (Static Preview)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Sample representation of active borrower files in the underwriting queue</p>
          </div>
          <button
            onClick={() => router.push('/lending/pipeline')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 uppercase tracking-wider transition-colors"
          >
            <span>View All in Kanban</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Borrower Name</th>
                <th className="px-6 py-4 font-semibold">Loan Type</th>
                <th className="px-6 py-4 font-semibold">Purpose</th>
                <th className="px-6 py-4 font-semibold">Nature of Loan</th>
                <th className="px-6 py-4 font-semibold">Purchase Price</th>
                <th className="px-6 py-4 font-semibold">Current Stage</th>
                <th className="px-6 py-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              <tr className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-900">Apex Logistics LLC</td>
                <td className="px-6 py-4 font-medium text-slate-700">SBA 7a</td>
                <td className="px-6 py-4 text-slate-600">Acquisition</td>
                <td className="px-6 py-4 text-slate-600">Gas Station</td>
                <td className="px-6 py-4 font-bold text-slate-900">$1,450,000</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-purple-50 text-purple-700 border border-purple-200 inline-block">
                    5. Term Sheet Received
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => router.push('/lending/loans/new')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wide"
                  >
                    View Details
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-900">Midwest Health Partners</td>
                <td className="px-6 py-4 font-medium text-slate-700">Conventional</td>
                <td className="px-6 py-4 text-slate-600">Refinance</td>
                <td className="px-6 py-4 text-slate-600">Doctor&apos;s Office</td>
                <td className="px-6 py-4 font-bold text-slate-900">$850,000</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-amber-50 text-amber-700 border border-amber-200 inline-block">
                    14. UW
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => router.push('/lending/loans/new')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wide"
                  >
                    View Details
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-6 py-4 font-bold text-slate-900">Lakeshore Hospitality Inc</td>
                <td className="px-6 py-4 font-medium text-slate-700">SBA 504</td>
                <td className="px-6 py-4 text-slate-600">Construction Loan</td>
                <td className="px-6 py-4 text-slate-600">Hotel/Motel - Flagged</td>
                <td className="px-6 py-4 font-bold text-slate-900">$3,200,000</td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block">
                    16. Closing Checklist – In Process
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => router.push('/lending/loans/new')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wide"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  bgClass,
  trend,
  onClick
}: {
  title: string
  value: string
  subtitle: string
  icon: React.ReactNode
  bgClass: string
  trend: string
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer rounded-2xl p-6 flex flex-col justify-between
        border transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1 group
        ${bgClass}
      `}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</h3>
        </div>
        <div className="p-3 rounded-xl bg-white shadow-sm border border-gray-100 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>

      <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between text-xs font-medium">
        <span className="text-slate-600">{subtitle}</span>
        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md shadow-2xs border border-gray-200">{trend}</span>
      </div>
    </div>
  )
}

function ActionCard({
  title,
  description,
  icon,
  onClick,
  badge
}: {
  title: string
  description: string
  icon: React.ReactNode
  onClick: () => void
  badge: string
}) {
  return (
    <div
      onClick={onClick}
      className={`
        group cursor-pointer rounded-2xl p-6 flex flex-col justify-between
        shadow-sm transition-all duration-300
        bg-white text-gray-800 hover:bg-brand-dark hover:text-white
        border border-gray-200 hover:border-brand-dark
        hover:-translate-y-1 hover:shadow-xl relative overflow-hidden
      `}
    >
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="p-3.5 rounded-2xl bg-slate-50 group-hover:bg-white/10 transition-colors border border-gray-100 group-hover:border-white/20">
          {icon}
        </div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30 transition-colors">
          {badge}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-extrabold mb-1.5 tracking-tight group-hover:text-white transition-colors">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-500 group-hover:text-slate-200 leading-relaxed font-medium transition-colors">
          {description}
        </p>
      </div>

      <div className="mt-6 pt-3 border-t border-gray-100 group-hover:border-white/10 flex items-center justify-between text-xs font-bold text-brand-dark group-hover:text-white transition-colors uppercase tracking-wider">
        <span>Launch Module</span>
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </div>
  )
}
