'use client'

import { useState } from 'react'
import { Briefcase, GitBranch, ListTodo, Activity } from 'lucide-react'
import { AdminLeadsContent } from '@/components/leads/AdminLeadsContent'
import { AdminAllLeadsContent } from '@/components/leads/AdminAllLeadsContent'
import { AdminAssignmentsContent } from '@/components/leads/AdminAssignmentsContent'


type BusinessCategoryConsoleProps = {
    category: 'personal' | 'commercial'
    flow: 'new' | 'renewal'
    title: string
    description: string
}

export function BusinessCategoryConsole({ category, flow, title, description }: BusinessCategoryConsoleProps) {
    const [activeTab, setActiveTab] = useState<'admin_leads' | 'assign_csr' | 'all_leads'>('admin_leads')

    return (
        <div className="w-full max-w-[1600px] mx-auto">
            {/* Console Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-6 rounded-2xl text-white shadow-lg border border-gray-800">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {category === 'personal' ? 'Personal Lines' : 'Commercial Lines'} ({flow === 'new' ? 'New Business' : 'Renewal Flow'})
                        </span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{title}</h1>
                    <p className="text-gray-300 mt-1 text-sm max-w-2xl">{description}</p>
                </div>
                
                {/* Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-1.5 bg-gray-950/60 p-1.5 rounded-xl border border-gray-700/60 shadow-inner">
                    <button
                        onClick={() => setActiveTab('admin_leads')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                            activeTab === 'admin_leads'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <Briefcase size={16} />
                        <span>Admin Leads</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('assign_csr')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                            activeTab === 'assign_csr'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <ListTodo size={16} />
                        <span>Assign CSR</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('all_leads')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all ${
                            activeTab === 'all_leads'
                                ? 'bg-emerald-600 text-white shadow-md'
                                : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        <GitBranch size={16} />
                        <span>All {category === 'personal' ? 'Personal' : 'Commercial'} Leads</span>
                    </button>
                </div>
            </div>

            {/* Tab Content Area */}
            <div className="mt-4 transition-all duration-200">
                {activeTab === 'admin_leads' && (
                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
                        <AdminLeadsContent categoryProp={category} flowProp={flow} />
                    </div>
                )}

                {activeTab === 'assign_csr' && (
                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
                        <AdminAssignmentsContent categoryProp={category} flowProp={flow} />
                    </div>
                )}
                {activeTab === 'all_leads' && (
                    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
                        <AdminAllLeadsContent categoryProp={category} flowProp={flow} />
                    </div>
                )}
            </div>
        </div>
    )
}
