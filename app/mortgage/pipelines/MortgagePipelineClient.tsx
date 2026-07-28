'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Eye, Search, Layers, FileCheck, Activity } from 'lucide-react'
import { MortgageLoan, PipelineType } from '@/app/mortgage/lib/types'
import { MORTGAGE_STAGES } from '@/app/mortgage/lib/stageFields'
import { formatPhoneNumber } from '@/app/mortgage/lib/phoneUtils'

interface MortgagePipelineClientProps {
    initialLoans: MortgageLoan[]
    isSuperAdmin?: boolean
}

export default function MortgagePipelineClient({ initialLoans = [], isSuperAdmin = false }: MortgagePipelineClientProps) {
    const pipelines = [
        { id: 'NEW_LOAN' as PipelineType, name: 'New Loan Pipeline (6 Stages)', description: 'Full origination workflow from initial intake to audit' },
        { id: 'PRE_APPROVAL' as PipelineType, name: 'Pre-Approval Pipeline (2 Stages)', description: 'Borrower pre-qualification and manual underwriting' }
    ]

    const [selectedPipeline, setSelectedPipeline] = useState<PipelineType>('NEW_LOAN')
    const [stageFilter, setStageFilter] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        setStageFilter(null)
    }, [selectedPipeline])

    const currentStages = MORTGAGE_STAGES.filter(s => s.pipeline === selectedPipeline)

    // Filter loans belonging to selected pipeline
    const pipelineLoans = initialLoans.filter(loan => loan.pipeline_type === selectedPipeline)

    // Stage counts across initialLoans
    const stageCounts: Record<string, number> = {}
    initialLoans.forEach(loan => {
        if (loan.stage) {
            stageCounts[loan.stage] = (stageCounts[loan.stage] || 0) + 1
        }
    })

    const stagedLoans = stageFilter
        ? pipelineLoans.filter(loan => loan.stage === stageFilter)
        : pipelineLoans

    const filteredLoans = stagedLoans.filter(loan => {
        const term = searchTerm.toLowerCase()
        return (
            loan.client_name?.toLowerCase().includes(term) ||
            loan.email?.toLowerCase().includes(term) ||
            loan.phone?.includes(term) ||
            loan.loan_officer_name?.toLowerCase().includes(term) ||
            loan.processor_name?.toLowerCase().includes(term)
        )
    })

    return (
        <div className="w-full animate-fade-in pb-12">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2.5">
                        <Activity className="text-[#10B889]" size={28} />
                        <span>Mortgage Pipeline Monitoring</span>
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Executive breakdown of active mortgage applications across origination and pre-approval stages.
                    </p>
                </div>
                <Link href={isSuperAdmin ? '/superadmin/mortgage/applications' : '/mortgage'} className="w-full sm:w-auto">
                    <button className="w-full sm:w-auto px-4 py-2 bg-[#2E5C85] text-white rounded-lg hover:bg-[#2E5C85]/90 transition font-medium text-sm shadow-sm whitespace-nowrap">
                        Back to Dashboard
                    </button>
                </Link>
            </div>

            {/* Pipeline Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
                {pipelines.map(p => {
                    const totalLoansInPipeline = initialLoans.filter(l => l.pipeline_type === p.id).length
                    const isSelected = p.id === selectedPipeline

                    return (
                        <div
                            key={p.id}
                            onClick={() => setSelectedPipeline(p.id)}
                            className={`cursor-pointer rounded-xl p-5 sm:p-6 flex flex-col justify-between transition shadow-sm border touch-manipulation
                                ${isSelected
                                    ? 'border-[#10B889] bg-[#10B889]/5 ring-1 ring-[#10B889] shadow-md'
                                    : 'bg-white hover:border-[#10B889]/40 hover:shadow-md'
                                }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-2.5">
                                    {p.id === 'NEW_LOAN' ? (
                                        <Layers className={`w-5 h-5 ${isSelected ? 'text-[#10B889]' : 'text-gray-500'}`} />
                                    ) : (
                                        <FileCheck className={`w-5 h-5 ${isSelected ? 'text-[#10B889]' : 'text-gray-500'}`} />
                                    )}
                                    <h3 className={`text-base sm:text-lg font-bold break-words ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}>
                                        {p.name}
                                    </h3>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5 line-clamp-1">{p.description}</p>
                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-500">Total Applications</span>
                                <span className={`text-2xl font-bold ${isSelected ? 'text-[#10B889]' : 'text-gray-700'}`}>
                                    {totalLoansInPipeline}
                                </span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Selected Pipeline Stages & Filter Tabs */}
            <div className="mt-6">
                <div className="flex gap-2 mb-5 flex-wrap items-center">
                    <button
                        onClick={() => setStageFilter(null)}
                        className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition-colors touch-manipulation
                            ${stageFilter === null
                                ? 'bg-[#2E5C85] text-white border-[#2E5C85] shadow-sm'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                            }`}
                    >
                        All Stages ({pipelineLoans.length})
                    </button>
                    {currentStages.map(s => {
                        const isActive = s.code === stageFilter
                        const count = stageCounts[s.code] || 0

                        return (
                            <button
                                key={s.code}
                                onClick={() => setStageFilter(s.code)}
                                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold border transition-colors touch-manipulation flex items-center gap-1.5
                                    ${isActive
                                        ? 'bg-[#10B889] text-white border-[#10B889] shadow-sm'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <span>{s.label}</span>
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Table Section */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-3 sm:p-4 border-b border-gray-100 bg-gray-50/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search client name, email, phone, officer..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm transition-all shadow-2xs"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="text-sm text-gray-500 font-bold whitespace-nowrap bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                            {filteredLoans.length} Application{filteredLoans.length !== 1 ? 's' : ''} Found
                        </div>
                    </div>

                    {filteredLoans.length === 0 ? (
                        <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center">
                            <Activity className="w-12 h-12 text-gray-300 mb-2" />
                            <p className="font-bold text-gray-700 text-base">No applications match the current filter</p>
                            <p className="text-xs text-gray-500 mt-1 max-w-xs">Select another stage or clear your search query to view applications.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left table-fixed min-w-[1450px]">
                                <colgroup>
                                    <col className="w-[220px]" />
                                    <col className="w-[140px]" />
                                    <col className="w-[220px]" />
                                    <col className="w-[150px]" />
                                    <col className="w-[160px]" />
                                    <col className="w-[180px]" />
                                    <col className="w-[180px]" />
                                    <col className="w-[120px]" />
                                    <col className="w-[80px]" />
                                </colgroup>
                                <thead className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white uppercase text-xs border-b border-gray-100 tracking-wider">
                                    <tr>
                                        <th className="px-4 sm:px-6 py-4 font-semibold">Client Name</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold">Phone</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold">Email</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold">Loan Type</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold">Amount / Value</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold">Stage</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold">Loan Officer</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold">Created</th>
                                        <th className="px-4 sm:px-6 py-4 font-semibold text-center">Action</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-gray-100">
                                    {filteredLoans.map(loan => {
                                        const stage = loan.stage || 'NEW_LOAN'
                                        const amount = loan.loan_amount || loan.estimated_property_value || loan.preapproval_amount || 0

                                        return (
                                            <tr key={loan.id} className="hover:bg-gray-50/80 transition-colors group">
                                                <td className="px-4 sm:px-6 py-4 font-bold text-gray-900 break-words align-top">{loan.client_name}</td>
                                                <td className="px-4 sm:px-6 py-4 text-gray-600 align-top">{formatPhoneNumber(loan.phone)}</td>
                                                <td className="px-4 sm:px-6 py-4 text-gray-600 break-all align-top">{loan.email}</td>
                                                <td className="px-4 sm:px-6 py-4 text-gray-700 font-semibold break-words align-top uppercase">
                                                    {loan.loan_type || 'CONVENTIONAL'}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 font-bold text-emerald-700 align-top">
                                                    {amount > 0 ? `$${Number(amount).toLocaleString()}` : '—'}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 align-top">
                                                    <StageBadge stage={stage} />
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 align-top">
                                                    {loan.loan_officer_name ? (
                                                        <span className="font-bold text-gray-700 text-xs break-words bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                                                            {loan.loan_officer_name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-amber-600 font-semibold text-xs">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-gray-500 whitespace-nowrap text-xs align-top">
                                                    {loan.created_at ? new Date(loan.created_at).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4 text-center align-top">
                                                    {(() => {
                                                        const targetRoute = isSuperAdmin
                                                            ? (loan.pipeline_type === 'PRE_APPROVAL' ? '/superadmin/mortgage/pre-approval' : '/superadmin/mortgage/new-loan')
                                                            : (loan.pipeline_type === 'PRE_APPROVAL' ? '/mortgage/pipeline/pre-approval' : '/mortgage/pipeline/new-loan');
                                                        return (
                                                            <Link
                                                                href={targetRoute}
                                                                className="text-[#2E5C85] hover:text-[#10B889] transition-colors p-1.5 rounded-lg hover:bg-gray-100 inline-flex items-center justify-center border border-transparent hover:border-gray-200 shadow-2xs"
                                                                title="View Application"
                                                            >
                                                                <Eye size={18} />
                                                            </Link>
                                                        );
                                                    })()}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

function StageBadge({ stage }: { stage: string }) {
    const stageInfo = MORTGAGE_STAGES.find(s => s.code === stage)
    const label = stageInfo ? stageInfo.label : stage

    let badgeClass = 'bg-gray-100 text-gray-700 border border-gray-300'
    if (stage === 'NEW_LOAN' || stage === 'PREAPPROVAL_LOAN') {
        badgeClass = 'bg-blue-50 text-blue-700 border border-blue-200'
    } else if (stage === 'SUBMIT_TO_UW' || stage === 'MANUAL_UW') {
        badgeClass = 'bg-purple-50 text-purple-700 border border-purple-200'
    } else if (stage === 'INITIAL_COMPLIANCE' || stage === 'FINAL_COMPLIANCE') {
        badgeClass = 'bg-amber-50 text-amber-700 border border-amber-200'
    } else if (stage === 'CLOSING' || stage === 'CLOSED') {
        badgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    } else if (stage === 'AUDIT') {
        badgeClass = 'bg-pink-50 text-pink-700 border border-pink-200'
    }

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-2xs ${badgeClass}`}>
            {label}
        </span>
    )
}
