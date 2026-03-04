'use client'

import { useState } from 'react'
import { FileUp } from 'lucide-react'

export default function RenewalPipelinePage() {
    // State for filters (placeholders for now as no logic is requested)
    const [renewalMonth, setRenewalMonth] = useState('')
    const [assignedCsr, setAssignedCsr] = useState('')
    const [policyType, setPolicyType] = useState('')
    const [sortBy, setSortBy] = useState('')

    return (
        <div className="p-8">
            <div className="flex justify-between items-end mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Personal Lines Renewal Pipeline</h1>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <FileUp size={20} />
                        Import CSV/Excel
                    </button>
                </div>
            </div>

            {/* FILTERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Renewal Month */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Renewal Month
                    </label>
                    <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={renewalMonth}
                        onChange={(e) => setRenewalMonth(e.target.value)}
                    >
                        <option value="">All Months</option>
                        <option value="January">January</option>
                        <option value="February">February</option>
                        <option value="March">March</option>
                        <option value="April">April</option>
                        <option value="May">May</option>
                        <option value="June">June</option>
                        <option value="July">July</option>
                        <option value="August">August</option>
                        <option value="September">September</option>
                        <option value="October">October</option>
                        <option value="November">November</option>
                        <option value="December">December</option>
                    </select>
                </div>

                {/* Assigned CSR */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Assigned CSR
                    </label>
                    <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={assignedCsr}
                        onChange={(e) => setAssignedCsr(e.target.value)}
                    >
                        <option value="">All CSRs</option>
                        <option value="CSR 1">CSR 1</option>
                        <option value="CSR 2">CSR 2</option>
                        <option value="CSR 3">CSR 3</option>
                        <option value="CSR 4">CSR 4</option>
                        <option value="CSR 5">CSR 5</option>
                    </select>
                </div>

                {/* Policy Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Policy Type
                    </label>
                    <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={policyType}
                        onChange={(e) => setPolicyType(e.target.value)}
                    >
                        <option value="">All Types</option>
                        <option value="Home">Home</option>
                        <option value="Auto">Auto</option>
                        <option value="Condo">Condo</option>
                        <option value="Landlord Home/Condo">Landlord Home/Condo</option>
                        <option value="Motorcycle">Motorcycle</option>
                        <option value="Umbrella">Umbrella</option>
                    </select>
                </div>

                {/* Sort By */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sort By
                    </label>
                    <select
                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="Renewal Date (Earliest)">Renewal Date (Earliest)</option>
                        <option value="Renewal Date (Latest)">Renewal Date (Latest)</option>
                        <option value="Client Name (A-Z)">Client Name (A-Z)</option>
                        <option value="Client Name (Z-A)">Client Name (Z-A)</option>
                        <option value="Premium (Low–High)">Premium (Low–High)</option>
                        <option value="Premium (High–Low)">Premium (High–Low)</option>
                    </select>
                </div>
            </div>

            {/* COUNTER */}
            <div className="mb-6 text-gray-600">
                Showing 0 policies
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto bg-white border rounded-xl shadow-sm">
                <table className="min-w-full text-sm">
                    <thead className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white uppercase text-xs tracking-wider">
                        <tr>
                            <th className="px-4 py-3 text-left">Client Name</th>
                            <th className="px-4 py-3 text-left">Policy Type</th>
                            <th className="px-4 py-3 text-left">Renewal Date</th>
                            <th className="px-4 py-3 text-left">Carrier</th>
                            <th className="px-4 py-3 text-left">Policy ID</th>
                            <th className="px-4 py-3 text-left">Total Premium</th>
                            <th className="px-4 py-3 text-left">Renewal Premium</th>
                            <th className="px-4 py-3 text-left">Assigned CSR</th>
                            <th className="px-4 py-3 text-left">Referral</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Table body remains empty until data is fetched */}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
