'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Spinner } from '@/components/ui/Loading'
import { toast } from '@/lib/toast'
import { COMPANY_ROLE_MAP, CompanyKey, validateCompanyRole } from '@/constants/companyRoles'

type CreateUserModalProps = {
    fixedRole?: string
    onSuccess?: () => void
}

export function CreateUserModal({ fixedRole, onSuccess }: CreateUserModalProps) {
    const [formData, setFormData] = useState<{
        email: string
        full_name: string
        password: string
        company: CompanyKey
        role: string
        insurance_access: string[]
    }>({
        email: '',
        full_name: '',
        password: '',
        company: fixedRole === 'csr' ? 'insurance' : 'insurance',
        role: fixedRole || 'csr',
        insurance_access: ['personal', 'commercial']
    })
    const [createLoading, setCreateLoading] = useState(false)

    const handleCompanyChange = (newCompany: CompanyKey) => {
        if (fixedRole) return
        const defaultRole = COMPANY_ROLE_MAP[newCompany]?.roles[0]?.value || ''
        setFormData({ ...formData, company: newCompany, role: defaultRole })
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()

        const submitRole = fixedRole || formData.role
        if (submitRole === 'csr' && formData.insurance_access.length === 0) {
            toast('Please select at least one insurance access option (Personal or Commercial).', 'error')
            return
        }

        const submitData = {
            ...formData,
            role: submitRole,
            company: fixedRole === 'csr' ? 'insurance' : formData.company,
            insurance_access: submitRole === 'csr' ? formData.insurance_access : undefined
        }

        if (!validateCompanyRole(submitData.company, submitData.role)) {
            toast('Invalid company and role combination selected.', 'error')
            return
        }

        try {
            setCreateLoading(true)
            const res = await fetch('/api/superadmin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submitData)
            })
            const j = await res.json()
            if (j.error) throw new Error(j.error)

            setFormData({
                email: '',
                full_name: '',
                password: '',
                company: fixedRole === 'csr' ? 'insurance' : 'insurance',
                role: fixedRole || 'csr',
                insurance_access: ['personal', 'commercial']
            })
            toast(fixedRole === 'csr' ? 'CSR created successfully!' : 'User created successfully!', 'success')
            onSuccess?.()
        } catch (err: any) {
            toast(err.message, 'error')
        } finally {
            setCreateLoading(false)
        }
    }

    const isCSR = fixedRole === 'csr' || formData.role === 'csr'

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden mb-8">
            <div className="px-6 py-4 bg-gradient-to-r from-[#10B889] to-[#2E5C85] flex items-center gap-3">
                <div className="p-2 bg-white/20 text-white rounded-lg backdrop-blur-sm">
                    <Plus size={18} />
                </div>
                <div>
                    <h2 className="text-xs font-bold text-white uppercase tracking-widest">
                        {fixedRole === 'csr' ? 'New CSR Account' : 'New User Account'}
                    </h2>
                    <p className="text-[10px] text-emerald-50/80 font-medium uppercase tracking-wider mt-0.5">
                        {fixedRole === 'csr' ? 'Create Customer Success Representative' : 'Define access and administrative roles'}
                    </p>
                </div>
            </div>
            <form
                onSubmit={handleCreateUser}
                className="p-4 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6 items-end animate-in fade-in slide-in-from-top-4 duration-300"
            >
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Step 1: Company</label>
                    <select
                        value={fixedRole === 'csr' ? 'insurance' : formData.company}
                        onChange={e => handleCompanyChange(e.target.value as CompanyKey)}
                        disabled={fixedRole === 'csr'}
                        className="bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-sm transition-all w-full font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                    >
                        {Object.entries(COMPANY_ROLE_MAP).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>
                </div>
                {!fixedRole && (
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Step 2: Role</label>
                        <select
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                            className="bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-sm transition-all w-full font-bold"
                        >
                            {COMPANY_ROLE_MAP[formData.company]?.roles.map(r => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Full Name</label>
                    <input
                        required
                        type="text"
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        className="bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-sm transition-all"
                        placeholder="John Doe"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Email</label>
                    <input
                        required
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-sm transition-all"
                        placeholder="john@example.com"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Password</label>
                    <input
                        required
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        className="bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-sm transition-all"
                        placeholder="Min 6 chars"
                    />
                </div>

                {isCSR && (
                    <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-3">
                        <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Insurance Access</label>
                        <div className="flex items-center gap-4 bg-gray-50 border border-gray-200 px-4 h-[46px] rounded-xl focus-within:ring-2 focus-within:ring-emerald-600/20 transition-all">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer hover:text-emerald-700">
                                <input
                                    type="checkbox"
                                    checked={formData.insurance_access.includes('personal')}
                                    onChange={e => {
                                        const updated = e.target.checked
                                            ? [...formData.insurance_access, 'personal']
                                            : formData.insurance_access.filter(a => a !== 'personal')
                                        setFormData({ ...formData, insurance_access: updated })
                                    }}
                                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                />
                                Personal
                            </label>
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer hover:text-emerald-700">
                                <input
                                    type="checkbox"
                                    checked={formData.insurance_access.includes('commercial')}
                                    onChange={e => {
                                        const updated = e.target.checked
                                            ? [...formData.insurance_access, 'commercial']
                                            : formData.insurance_access.filter(a => a !== 'commercial')
                                        setFormData({ ...formData, insurance_access: updated })
                                    }}
                                    className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                                />
                                Commercial
                            </label>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={createLoading}
                    className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-all flex justify-center items-center h-[46px] font-bold disabled:opacity-50 shadow-sm w-full sm:w-auto px-6 sm:col-span-2 lg:col-span-3"
                >
                    {createLoading ? <Spinner size={20} /> : (fixedRole === 'csr' ? 'Create CSR' : 'Create User')}
                </button>
            </form>
        </div>
    )
}
