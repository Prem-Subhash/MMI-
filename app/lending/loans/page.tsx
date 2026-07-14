'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Search, Filter, Eye, ArrowUpRight, Building2, AlertCircle } from 'lucide-react'

const STATIC_LOANS = [
  {
    id: 'loan-001',
    borrower: 'Apex Logistics LLC',
    type: 'SBA 7a',
    purpose: 'Acquisition',
    nature: 'Gas Station',
    amount: '$1,450,000',
    downPayment: '20%',
    lender: 'American Commercial Bank & Trust',
    stage: '5. Term Sheet Received',
    date: '2026-06-28',
    statusColor: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  {
    id: 'loan-002',
    borrower: 'Midwest Health Partners',
    type: 'Conventional',
    purpose: 'Refinance',
    nature: "Doctor's Office",
    amount: '$850,000',
    downPayment: '20%',
    lender: 'Byline Bank',
    stage: '14. UW',
    date: '2026-06-24',
    statusColor: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  {
    id: 'loan-003',
    borrower: 'Lakeshore Hospitality Inc',
    type: 'SBA 504',
    purpose: 'Construction Loan',
    nature: 'Hotel/Motel - Flagged',
    amount: '$3,200,000',
    downPayment: '20%',
    lender: 'US Bank',
    stage: '16. Closing Checklist – In Process',
    date: '2026-06-18',
    statusColor: 'bg-teal-100 text-teal-800 border-teal-200'
  },
  {
    id: 'loan-004',
    borrower: 'GreenLeaf Dispensary Co',
    type: 'Private Loan',
    purpose: 'Start-up',
    nature: 'Cannabis Dispensary',
    amount: '$650,000',
    downPayment: '30%',
    lender: 'Celtic Bank',
    stage: '3. Initial Screening',
    date: '2026-07-02',
    statusColor: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  {
    id: 'loan-005',
    borrower: 'Sunrise Early Education LLC',
    type: 'SBA 7a',
    purpose: 'Acquisition',
    nature: 'Day Care',
    amount: '$920,000',
    downPayment: '20%',
    lender: 'First Financial Bank',
    stage: '7. Good Faith Deposit Received',
    date: '2026-06-30',
    statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  {
    id: 'loan-006',
    borrower: 'Fresh Market Grocery LLC',
    type: 'Equipment Financing',
    purpose: 'Refinance',
    nature: 'Grocery Store',
    amount: '$410,000',
    downPayment: '20%',
    lender: 'Harvest Bank',
    stage: '18. Loan Closed',
    date: '2026-06-10',
    statusColor: 'bg-green-100 text-green-800 border-green-200'
  }
]

export default function LendingLoansDirectoryPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')

  const filteredLoans = STATIC_LOANS.filter(loan => {
    const matchesSearch = 
      loan.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.lender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.nature.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'ALL' || loan.type === selectedType

    return matchesSearch && matchesType
  })

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10B889] mb-1">
            <Building2 size={14} />
            <span>Commercial Loan Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Active Loan Portfolio
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Static UI prototype showing borrower applications, bank assignments, and stage status.
          </p>
        </div>

        <button
          onClick={() => router.push('/lending/loans/new')}
          className="w-full sm:w-auto bg-brand hover:bg-brand-dark text-white font-bold py-3 px-5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle size={18} />
          <span> New Loan Application</span>
        </button>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search borrower, lender, or nature..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#10B889]/20 focus:border-[#10B889] transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1.5 mr-1 whitespace-nowrap">
            <Filter size={14} />
            Loan Type:
          </span>
          {['ALL', 'SBA 7a', 'SBA 504', 'Conventional', 'Bridge Loan', 'Equipment Financing'].map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                selectedType === type
                  ? 'bg-brand-dark text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type === 'ALL' ? 'All Types' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Showing {filteredLoans.length} of {STATIC_LOANS.length} Prototype Loans
          </span>
          <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            UI Prototype Preview
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white text-xs uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Borrower Name</th>
                <th className="px-6 py-4 font-semibold">Loan Type</th>
                <th className="px-6 py-4 font-semibold">Purpose & Nature</th>
                <th className="px-6 py-4 font-semibold">Purchase Price / Amount</th>
                <th className="px-6 py-4 font-semibold">Assigned Lender</th>
                <th className="px-6 py-4 font-semibold">Pipeline Stage</th>
                <th className="px-6 py-4 font-semibold text-center">Inquiry Date</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredLoans.map(loan => (
                <tr key={loan.id} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-extrabold text-slate-900">{loan.borrower}</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {loan.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md text-xs border border-slate-200">
                      {loan.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{loan.purpose}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{loan.nature}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-extrabold text-slate-900 text-base">{loan.amount}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Down: {loan.downPayment}</p>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">
                    {loan.lender}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap border inline-block ${loan.statusColor}`}>
                      {loan.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-500 font-medium whitespace-nowrap">
                    {loan.date}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() =>
                        loan.stage.includes('Term Sheet')
                          ? router.push('/lending/term-sheet-received')
                          : router.push('/lending/loans/new')
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-[#10B889] text-emerald-700 hover:text-white font-bold rounded-lg transition-all text-xs border border-emerald-200 hover:border-[#10B889] shadow-2xs"
                    >
                      <Eye size={14} />
                      <span>{loan.stage.includes('Term Sheet') ? 'Term Sheets UI' : 'View Form'}</span>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredLoans.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No commercial loans found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
