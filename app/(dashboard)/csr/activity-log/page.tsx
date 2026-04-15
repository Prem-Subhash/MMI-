'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Search, 
  Filter, 
  ChevronRight, 
  Activity,
  Calendar,
  Layers
} from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import Loading, { Spinner } from '@/components/ui/Loading'

export default function ActivityLogPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    const fetchLog = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('temp_leads_basics')
        .select(`
          id,
          client_name,
          business_name,
          insurence_category,
          policy_type,
          policy_flow,
          created_at,
          current_stage:pipeline_stages (
            stage_name
          )
        `)
        .eq('assigned_csr', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        const formatted = (data as any[]).map(l => ({
          ...l,
          name: l.business_name || l.client_name,
          status: Array.isArray(l.current_stage) 
            ? l.current_stage[0]?.stage_name 
            : (l.current_stage as any)?.stage_name || 'New Lead'
        }))
        setLeads(formatted)
      }
      setLoading(false)
    }

    fetchLog()
  }, [])

  const filteredLeads = leads.filter(l => {
    const matchesSearch = l.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         l.policy_type?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || l.insurence_category === categoryFilter
    return matchesSearch && matchesCategory
  })

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="text-[#10B889]" size={28} />
              Activity Log
            </h1>
            <p className="text-gray-500 mt-1">Full history of lead statuses and pipeline movements.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl border border-emerald-100 font-bold text-sm">
            {filteredLeads.length} Total Activities
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by client or business name..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-[#10B889] transition-all outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['all', 'personal', 'commercial'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`
                px-5 py-2.5 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-all border
                ${categoryFilter === cat 
                  ? 'bg-[#2E5C85] text-white border-[#2E5C85] shadow-lg shadow-blue-900/10' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Log List */}
      <div className="space-y-4">
        {loading ? (
          <Loading message="Loading your activity history..." />
        ) : filteredLeads.length > 0 ? (
          filteredLeads.map((item, idx) => (
            <div 
              key={item.id}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden active:scale-[0.99] cursor-pointer"
              onClick={() => router.push(`/csr/leads/${item.id}`)}
            >
              {/* Status Indicator Strip */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                item.status === 'Completed' ? 'bg-emerald-500' : 
                item.status === 'Quoting in Progress' ? 'bg-amber-500' : 
                'bg-[#2E5C85]'
              }`} />

              <div className="flex items-center gap-5 flex-1 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#10B889] group-hover:text-white transition-colors flex-shrink-0">
                  <User size={24} />
                </div>
                
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#2E5C85] transition-colors truncate">
                    {item.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-1">
                    <span className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                      <Layers size={14} className="text-[#10B889]" />
                      {item.policy_type} ({item.policy_flow})
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                      item.insurence_category === 'commercial' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-pink-50 text-pink-700 border-pink-100'
                    }`}>
                      {item.insurence_category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="flex flex-col md:items-end gap-2 w-full md:w-auto">
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Current Status</p>
                    <p className={`text-sm font-bold ${
                      item.status === 'Completed' ? 'text-emerald-600' : 'text-[#2E5C85]'
                    }`}>
                      {item.status}
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-gray-300 group-hover:text-[#10B889] transition-all group-hover:translate-x-1" />
                </div>
                
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium whitespace-nowrap">
                  <Clock size={12} />
                  {new Date(item.created_at).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white border border-dashed border-gray-200 rounded-3xl p-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Activity size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No activities found</h3>
            <p className="text-gray-500 max-w-xs">We couldn't find any activities matching your current filters.</p>
          </div>
        )}
      </div>
    </div>
  )
}
