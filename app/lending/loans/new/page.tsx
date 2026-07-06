'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  UserPlus,
  Trash2,
  Save,
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  FileText,
  Users,
  Landmark,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'
import { toast } from '@/lib/toast'

interface Partner {
  id: string
  fullName: string
  mobile: string
  email: string
  ownership: string
}

export default function LendingAddLoanFormPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'tab1' | 'tab2' | 'tab3'>('tab1')

  // Tab 1 State
  const [inquiryDate, setInquiryDate] = useState(new Date().toISOString().split('T')[0])
  const [borrowerName, setBorrowerName] = useState('Apex Logistics LLC')
  const [clientLegalName, setClientLegalName] = useState('Robert Vance')
  const [clientPhone, setClientPhone] = useState('(312) 555-0198')
  const [clientEmail, setClientEmail] = useState('rvance@apexlogistics.com')
  const [clientCreditScore, setClientCreditScore] = useState('740')
  const [loanType, setLoanType] = useState('SBA 7a')
  const [loanPurpose, setLoanPurpose] = useState('Acquisition')
  const [natureOfLoan, setNatureOfLoan] = useState('Gas Station')
  const [address, setAddress] = useState('742 Evergreen Terrace, Chicago, IL 60601')
  const [loanSummary, setLoanSummary] = useState('Acquisition of operating 12-pump fuel station with convenience store. Strong historical EBITDA and real estate included.')
  const [purchasePrice, setPurchasePrice] = useState('1450000')
  const [downPayment, setDownPayment] = useState('20')

  // Tab 2 State (Partners & Leads)
  const [partners, setPartners] = useState<Partner[]>([
    { id: '1', fullName: 'Robert Vance', mobile: '(312) 555-0198', email: 'rvance@apexlogistics.com', ownership: '60' },
    { id: '2', fullName: 'Sarah Vance', mobile: '(312) 555-0199', email: 'svance@apexlogistics.com', ownership: '40' }
  ])
  const [leadSource, setLeadSource] = useState('Loan Officer')
  const [referralName, setReferralName] = useState('David Miller (Senior LO)')

  // Tab 3 State (Lenders & Deposits)
  const [selectedLenders, setSelectedLenders] = useState<string[]>(['American Commercial Bank & Trust', 'Byline Bank'])
  const [lenderContactName, setLenderContactName] = useState('Michael Chang (VP Lending)')
  const [lenderContactEmail, setLenderContactEmail] = useState('mchang@amcombank.com')
  const [lenderContactPhone, setLenderContactPhone] = useState('(312) 888-4321')
  const [accutaxAmountReq, setAccutaxAmountReq] = useState('2500')
  const [accurateLendingAmountReq, setAccurateLendingAmountReq] = useState('2500')
  const [internalAmountRec, setInternalAmountRec] = useState('5000')
  const [bankAmountReq, setBankAmountReq] = useState('10000')
  const [bankAmountRec, setBankAmountRec] = useState('10000')

  const availableBanks = [
    'American Commercial Bank & Trust',
    'Byline Bank',
    'Celtic Bank',
    'Center Stone SBA Lending',
    'First Financial Bank',
    'Harvest Bank',
    'LakeSide Bank',
    'Merchants Bank',
    'US Bank'
  ]

  const toggleLender = (bank: string) => {
    if (selectedLenders.includes(bank)) {
      if (selectedLenders.length <= 1) {
        toast('At least one bank must remain selected', 'error')
        return
      }
      setSelectedLenders(selectedLenders.filter(l => l !== bank))
    } else {
      setSelectedLenders([...selectedLenders, bank])
    }
  }

  const handleAddPartner = () => {
    const newId = (partners.length + 1).toString()
    setPartners([...partners, { id: newId, fullName: '', mobile: '', email: '', ownership: '' }])
    toast('Added new partner input section', 'info')
  }

  const handleRemovePartner = (id: string) => {
    if (partners.length <= 1) {
      toast('At least one partner is required', 'error')
      return
    }
    setPartners(partners.filter(p => p.id !== id))
  }

  const handlePartnerChange = (id: string, field: keyof Partner, value: string) => {
    setPartners(partners.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast('Commercial Loan Application saved (UI Prototype Demo)', 'success', 4000)
    router.push('/lending/pipeline')
  }

  return (
    <div className="w-full space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-200/80 shadow-sm">
        <div>
          <button
            type="button"
            onClick={() => router.push('/lending/dashboard')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#10B889] hover:text-[#2E5C85] uppercase tracking-widest mb-2 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#10B889] mb-1">
            <Building2 size={14} />
            <span>Commercial Loan Intake Form</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            New Loan Application / File Review
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Sectioned tab layout implementing exact business fields for commercial borrower onboarding.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-extrabold shadow-2xs">
          <AlertCircle size={16} className="text-amber-600" />
          <span>Prototype Form (No CRUD Persistence)</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-2 shadow-sm flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('tab1')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'tab1'
              ? 'bg-brand text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <FileText size={18} />
          <span>Tab 1: Basic &amp; Financials (Sec A–B)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tab2')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'tab2'
              ? 'bg-brand text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Users size={18} />
          <span>Tab 2: Partners &amp; Leads (Sec C–D)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tab3')}
          className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'tab3'
              ? 'bg-brand text-white shadow-md'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <Landmark size={18} />
          <span>Tab 3: Lender &amp; Deposits (Sec E–G)</span>
        </button>
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ==================== TAB 1: BASIC & FINANCIALS ==================== */}
        {activeTab === 'tab1' && (
          <div className="space-y-6 animate-fade-in">
            {/* Section A */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-extrabold">A</span>
                  <span>Section A — Basic / Loan Information</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Primary intake metadata, borrower identity, and loan classification.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Inquiry Date</label>
                  <input
                    type="date"
                    value={inquiryDate}
                    onChange={e => setInquiryDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Borrower / Company Name</label>
                  <input
                    type="text"
                    value={borrowerName}
                    onChange={e => setBorrowerName(e.target.value)}
                    placeholder="e.g. Apex Logistics LLC"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Client Full Legal Name</label>
                  <input
                    type="text"
                    value={clientLegalName}
                    onChange={e => setClientLegalName(e.target.value)}
                    placeholder="e.g. Robert Vance"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Client Phone</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={e => setClientPhone(e.target.value)}
                    placeholder="(312) 555-0198"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Client Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={e => setClientEmail(e.target.value)}
                    placeholder="rvance@apexlogistics.com"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Client Credit Score</label>
                  <input
                    type="number"
                    value={clientCreditScore}
                    onChange={e => setClientCreditScore(e.target.value)}
                    placeholder="740"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Loan Type</label>
                  <select
                    value={loanType}
                    onChange={e => setLoanType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    <option value="SBA 7a">SBA 7a</option>
                    <option value="SBA 504">SBA 504</option>
                    <option value="Conventional">Conventional</option>
                    <option value="Bridge Loan">Bridge Loan</option>
                    <option value="Private Loan">Private Loan</option>
                    <option value="Equipment Financing">Equipment Financing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Purpose of Loan</label>
                  <select
                    value={loanPurpose}
                    onChange={e => setLoanPurpose(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    <option value="Acquisition">Acquisition</option>
                    <option value="Refinance">Refinance</option>
                    <option value="Start-up">Start-up</option>
                    <option value="Partner Buyout">Partner Buyout</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Nature of Loan (Business Type)</label>
                  <select
                    value={natureOfLoan}
                    onChange={e => setNatureOfLoan(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  >
                    <option value="Cannabis Dispensary">Cannabis Dispensary</option>
                    <option value="Day Care">Day Care</option>
                    <option value="Doctor's Office">Doctor&apos;s Office</option>
                    <option value="Franchise - Restaurant">Franchise - Restaurant</option>
                    <option value="Gas Station">Gas Station</option>
                    <option value="Grocery Store">Grocery Store</option>
                    <option value="Hotel/Motel - Flagged">Hotel/Motel - Flagged</option>
                    <option value="Hotel/Motel - Independent">Hotel/Motel - Independent</option>
                    <option value="Laundramat">Laundramat</option>
                    <option value="Liquor Store">Liquor Store</option>
                    <option value="Multi-Unit">Multi-Unit</option>
                    <option value="Other">Other</option>
                    <option value="Strip Mall">Strip Mall</option>
                    <option value="Truck Stop">Truck Stop</option>
                    <option value="Warehouse">Warehouse</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Business / Real Estate Location</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="742 Evergreen Terrace, Chicago, IL 60601"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Loan Summary &amp; Executive Notes</label>
                  <textarea
                    rows={3}
                    value={loanSummary}
                    onChange={e => setLoanSummary(e.target.value)}
                    placeholder="Provide executive summary of the commercial loan request..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section B */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-extrabold">B</span>
                  <span>Section B — Financial Information</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Capital structure, valuation, and borrower down payment commitments.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Purchase Price / Total Valuation ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input
                      type="number"
                      value={purchasePrice}
                      onChange={e => setPurchasePrice(e.target.value)}
                      placeholder="1450000"
                      className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base font-extrabold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Borrower Down Payment (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={downPayment}
                      onChange={e => setDownPayment(e.target.value)}
                      placeholder="20"
                      className="w-full pl-4 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-xl text-base font-extrabold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tab2')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="bg-brand hover:bg-brand-dark text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
              >
                <span>Continue to Tab 2: Partners &amp; Leads</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 2: PARTNERS & LEADS ==================== */}
        {activeTab === 'tab2' && (
          <div className="space-y-6 animate-fade-in">
            {/* Section C */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-extrabold">C</span>
                    <span>Section C — Partner Information ({partners.length} Active)</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Dynamic visual repetition block for multi-member ownership entities.</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddPartner}
                  className="bg-emerald-50 hover:bg-[#10B889] text-emerald-700 hover:text-white font-bold py-2 px-4 rounded-xl transition-all text-xs border border-emerald-200 hover:border-[#10B889] shadow-2xs flex items-center gap-1.5"
                >
                  <UserPlus size={16} />
                  <span>+ Add Another Partner</span>
                </button>
              </div>

              <div className="space-y-4">
                {partners.map((partner, idx) => (
                  <div key={partner.id} className="p-5 bg-slate-50 border border-gray-200 rounded-2xl space-y-4 relative group">
                    <div className="flex items-center justify-between border-b border-gray-200/60 pb-2.5">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full">
                        Partner #{idx + 1}
                      </span>
                      {partners.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePartner(partner.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Remove partner"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">First &amp; Last Name</label>
                        <input
                          type="text"
                          value={partner.fullName}
                          onChange={e => handlePartnerChange(partner.id, 'fullName', e.target.value)}
                          placeholder="e.g. Robert Vance"
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">Mobile Number</label>
                        <input
                          type="text"
                          value={partner.mobile}
                          onChange={e => handlePartnerChange(partner.id, 'mobile', e.target.value)}
                          placeholder="(312) 555-0198"
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">Email Address</label>
                        <input
                          type="email"
                          value={partner.email}
                          onChange={e => handlePartnerChange(partner.id, 'email', e.target.value)}
                          placeholder="partner@company.com"
                          className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-purple-500 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">% Ownership</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={partner.ownership}
                            onChange={e => handlePartnerChange(partner.id, 'ownership', e.target.value)}
                            placeholder="50"
                            className="w-full pl-3.5 pr-8 py-2 bg-white border border-gray-200 rounded-xl text-sm font-extrabold focus:ring-2 focus:ring-purple-500 transition-all"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section D */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-extrabold">D</span>
                  <span>Section D — Lead Information</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Origination channel and referring agent attribution.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Lead Source Channel</label>
                  <select
                    value={leadSource}
                    onChange={e => setLeadSource(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  >
                    <option value="Loan Officer">Loan Officer</option>
                    <option value="Other Referral">Other Referral</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Referral Officer / Broker Name</label>
                  <input
                    type="text"
                    value={referralName}
                    onChange={e => setReferralName(e.target.value)}
                    placeholder="e.g. David Miller (Senior LO)"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tab1')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-3 px-6 rounded-xl transition-all text-sm"
              >
                ← Back to Tab 1
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('tab3')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="bg-brand hover:bg-brand-dark text-white font-bold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
              >
                <span>Continue to Tab 3: Lender &amp; Deposits</span>
                <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ==================== TAB 3: LENDER & DEPOSITS ==================== */}
        {activeTab === 'tab3' && (
          <div className="space-y-6 animate-fade-in">
            {/* Section E */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-extrabold">E</span>
                  <span>Section E — Lender Information</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Assigned financial institution and bank underwriting contact officer.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="sm:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase text-gray-700">Assigned Commercial Lenders (Multi-Select)</label>
                    <span className="text-xs font-bold text-[#10B889] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {selectedLenders.length} {selectedLenders.length === 1 ? 'Bank Selected' : 'Banks Selected'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Click to select or deselect all banks this loan file was sent to for visual tracking.</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {availableBanks.map(bank => {
                      const isSelected = selectedLenders.includes(bank)
                      return (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => toggleLender(bank)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#10B889] text-white border-[#10B889] shadow-sm'
                              : 'bg-gray-50 text-slate-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <span>{bank}</span>
                          {isSelected && <span className="text-white font-mono">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                  <div className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-200 mt-2">
                    <p className="text-[11px] font-bold uppercase text-slate-500 mb-1.5 flex items-center gap-1.5">
                      <Landmark size={14} className="text-[#10B889]" />
                      <span>Visual Tracking — File Sent To:</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedLenders.map(b => (
                        <span key={b} className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-extrabold text-slate-800 shadow-2xs">
                          <span>{b}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Bank Underwriter Officer Name</label>
                  <input
                    type="text"
                    value={lenderContactName}
                    onChange={e => setLenderContactName(e.target.value)}
                    placeholder="e.g. Michael Chang (VP Lending)"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Bank Contact Email / Phone</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="email"
                      value={lenderContactEmail}
                      onChange={e => setLenderContactEmail(e.target.value)}
                      placeholder="mchang@bank.com"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                    <input
                      type="text"
                      value={lenderContactPhone}
                      onChange={e => setLenderContactPhone(e.target.value)}
                      placeholder="(312) 888-4321"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section F */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-extrabold">F</span>
                  <span>Section F — Internal Good Faith Deposit</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Accurate Lending good faith escrow and commitment verification.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Accutax Amount Requested ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input
                      type="number"
                      value={accutaxAmountReq}
                      onChange={e => setAccutaxAmountReq(e.target.value)}
                      placeholder="2500"
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Accurate Lending Amount Requested ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input
                      type="number"
                      value={accurateLendingAmountReq}
                      onChange={e => setAccurateLendingAmountReq(e.target.value)}
                      placeholder="2500"
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Actual Amount Received ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input
                      type="number"
                      value={internalAmountRec}
                      onChange={e => setInternalAmountRec(e.target.value)}
                      placeholder="5000"
                      className="w-full pl-8 pr-4 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-sm font-extrabold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section G */}
            <div className="bg-white border border-gray-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-extrabold">G</span>
                  <span>Section G — Bank Good Faith Deposit</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Financial institution commitment escrow tracking.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Assigned Bank(s)</label>
                  <input
                    type="text"
                    readOnly
                    value={selectedLenders.join(', ') || 'None selected'}
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-sm font-bold text-gray-700 cursor-not-allowed truncate"
                    title={selectedLenders.join(', ')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Requested Amount ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input
                      type="number"
                      value={bankAmountReq}
                      onChange={e => setBankAmountReq(e.target.value)}
                      placeholder="10000"
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-700 mb-1.5">Actual Amount Received ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                    <input
                      type="number"
                      value={bankAmountRec}
                      onChange={e => setBankAmountRec(e.target.value)}
                      placeholder="10000"
                      className="w-full pl-8 pr-4 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-sm font-extrabold text-emerald-900 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tab2')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="bg-gray-200 hover:bg-gray-300 text-slate-800 font-bold py-3 px-6 rounded-xl transition-all text-sm"
              >
                ← Back to Tab 2
              </button>

              <button
                type="submit"
                className="bg-brand hover:bg-brand-dark text-white font-bold py-3.5 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-base"
              >
                <Save size={20} />
                <span>Save Loan Application (UI Prototype)</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
