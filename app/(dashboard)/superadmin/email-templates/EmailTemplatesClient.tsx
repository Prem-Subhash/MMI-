'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, X, CheckCircle2, XCircle, Mail, Info, TrendingUp, Zap, Inbox } from 'lucide-react'
import Loading, { Spinner } from '@/components/ui/Loading'
import { toast } from '@/lib/toast'
import { motion, AnimatePresence } from 'framer-motion'

type EmailTemplate = {
    id: string
    name: string
    subject: string
    body: string
    insurance_category?: string
    policy_type?: string
    policy_flow?: string
    is_active: boolean
    created_at: string
}

export default function EmailTemplatesClient() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Create new form state
    const [showCreate, setShowCreate] = useState(false)
    const [formData, setFormData] = useState({ name: '', subject: '', body: '', insurance_category: '', policy_type: '', policy_flow: '', is_active: true })
    const [createLoading, setCreateLoading] = useState(false)

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<any>({})

    useEffect(() => {
        fetchTemplates()
    }, [])

    const fetchTemplates = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/superadmin/email-templates')
            const j = await res.json()
            if (j.error) throw new Error(j.error)
            setTemplates(j.templates || [])
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setCreateLoading(true)
            setError(null)
            const res = await fetch('/api/superadmin/email-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const j = await res.json()
            if (j.error) throw new Error(j.error)

            setShowCreate(false)
            setFormData({ name: '', subject: '', body: '', insurance_category: '', policy_type: '', policy_flow: '', is_active: true })
            toast('Email template created successfully!', 'success')
            fetchTemplates()
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        } finally {
            setCreateLoading(false)
        }
    }

    const handleUpdate = async (id: string) => {
        try {
            setError(null)
            const res = await fetch('/api/superadmin/email-templates', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...editForm })
            })
            const j = await res.json()
            if (j.error) throw new Error(j.error)

            setEditingId(null)
            toast('Email template updated successfully!', 'success')
            fetchTemplates()
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        }
    }

    const handleToggleStatus = async (id: string, currentStatus: boolean, name: string) => {
        try {
            setError(null)
            const res = await fetch('/api/superadmin/email-templates', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, is_active: !currentStatus })
            })
            const j = await res.json()
            if (j.error) throw new Error(j.error)
            toast('Template status updated!', 'success')
            fetchTemplates()
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete template "${name}"? This could break automated reminders.`)) return

        try {
            setError(null)
            const res = await fetch(`/api/superadmin/email-templates?id=${id}`, { method: 'DELETE' })
            const j = await res.json()
            if (j.error) throw new Error(j.error)
            toast('Template deleted successfully!', 'success')
            fetchTemplates()
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        }
    }

    const startEdit = (template: EmailTemplate) => {
        setEditingId(template.id)
        setEditForm({ ...template })
    }

    return (
        <div className="space-y-6">

            {/* Top Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Total Templates */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-300">
                        <Mail size={80} className="text-blue-600" />
                    </div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Templates</p>
                            <div className="flex items-end gap-3">
                                <h4 className="text-3xl font-black text-gray-800">{templates.length}</h4>
                                <span className="flex items-center text-xs font-medium text-emerald-600 mb-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <TrendingUp size={12} className="mr-1" /> Active
                                </span>
                            </div>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-xl shadow-inner border border-blue-100/50">
                            <Mail size={22} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Automated communication schemas
                    </p>
                </div>

                {/* Active Workflows */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-300">
                        <Zap size={80} className="text-emerald-600" />
                    </div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Active Workflows</p>
                            <div className="flex items-end gap-3">
                                <h4 className="text-3xl font-black text-emerald-600">{templates.filter(t => t.is_active).length}</h4>
                            </div>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-600 rounded-xl shadow-inner border border-emerald-100/50">
                            <Zap size={22} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Currently live in production
                    </p>
                </div>

                {/* Inactive Templates */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-300">
                        <Inbox size={80} className="text-gray-400" />
                    </div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Inactive Templates</p>
                            <div className="flex items-end gap-3">
                                <h4 className="text-3xl font-black text-gray-500">{templates.filter(t => !t.is_active).length}</h4>
                            </div>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 text-gray-500 rounded-xl shadow-inner border border-gray-200/50">
                            <Inbox size={22} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        Drafts or deprecated flows
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-lg font-bold text-gray-800 tracking-tight">Email Templates</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                    {showCreate && (
                        <button
                            onClick={() => setShowCreate(false)}
                            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 px-5 py-2.5 rounded-xl transition font-bold shadow-sm text-sm"
                        >
                            <X size={18} /> Cancel
                        </button>
                    )}
                    {!showCreate && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl hover:bg-brand-70 transition font-bold shadow-sm text-sm"
                        >
                            <Plus size={18} /> Create Template
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
            {showCreate && (
                <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="overflow-hidden"
                >
                <div className="bg-white rounded-2xl border border-blue-100 shadow-xl overflow-hidden mt-4">
                    <div className="px-6 py-4 bg-blue-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-blue-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Mail size={18} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-800 tracking-tight">New Email Template</h2>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Design automated communication workflows</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-blue-100 text-xs font-medium text-blue-800 shadow-sm">
                            <Info size={14} className="text-blue-500" />
                            Tip: Use {'{client_name}'} or {'{csr_name}'} to personalize.
                        </div>
                    </div>
                    <form onSubmit={handleCreate} className="p-4 sm:p-6 flex flex-col gap-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Template Name</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="e.g. Welcome Email" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Subject</label>
                            <input required type="text" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="Subject line..." />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Category (Optional)</label>
                            <input type="text" value={formData.insurance_category} onChange={e => setFormData({ ...formData, insurance_category: e.target.value })} className="border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="e.g. Personal Lines" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Flow (Optional)</label>
                            <input type="text" value={formData.policy_flow} onChange={e => setFormData({ ...formData, policy_flow: e.target.value })} className="border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" placeholder="e.g. New Business" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Email Body (HTML/Text)</label>
                        <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2 flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            </div>
                            <textarea required value={formData.body} onChange={e => setFormData({ ...formData, body: e.target.value })} className="w-full p-4 outline-none h-40 resize-y text-sm font-mono text-gray-700 bg-white" placeholder="Dear {client_name}..." />
                        </div>
                    </div>
                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={createLoading} className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-all flex justify-center items-center font-bold disabled:opacity-50 shadow-sm w-full sm:w-auto">
                            {createLoading ? <Spinner size={20} /> : 'Save Template'}
                        </button>
                    </div>
                    </form>
                </div>
                </motion.div>
            )}
            </AnimatePresence>

            <div className="bg-white sm:rounded-xl shadow-sm sm:border border-gray-200 overflow-hidden -mx-3 sm:mx-0">
                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-6 flex justify-center"><Loading message="Fetching email templates..." /></div>
                    ) : templates.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No email templates created yet.</div>
                    ) : templates.map(template => (
                        <div key={template.id} className="p-4 space-y-4 hover:bg-gray-50 transition-colors">
                            {editingId === template.id ? (
                                <div className="flex flex-col gap-4 p-4 bg-indigo-50 rounded-lg">
                                    <div className="flex flex-col gap-3">
                                        <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="border p-2 rounded w-full outline-none font-bold" placeholder="Name" />
                                        <input type="text" value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} className="border p-2 rounded w-full outline-none text-sm" placeholder="Subject" />
                                        <input type="text" value={editForm.insurance_category || ''} onChange={e => setEditForm({ ...editForm, insurance_category: e.target.value })} className="border p-2 rounded w-full outline-none text-sm" placeholder="Category" />
                                        <input type="text" value={editForm.policy_flow || ''} onChange={e => setEditForm({ ...editForm, policy_flow: e.target.value })} className="border p-2 rounded w-full outline-none text-sm" placeholder="Flow" />
                                    </div>
                                    <textarea value={editForm.body} onChange={e => setEditForm({ ...editForm, body: e.target.value })} className="border p-2 rounded w-full outline-none h-24" placeholder="Body" />
                                    <div className="flex gap-2 w-full mt-2">
                                        <button onClick={() => setEditingId(null)} className="flex-1 justify-center px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 rounded-lg font-medium flex items-center gap-1 shadow-sm text-sm"><X size={14} /> Cancel</button>
                                        <button onClick={() => handleUpdate(template.id)} className="flex-1 justify-center px-3 py-2 flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium shadow-sm text-sm"><Save size={16} /> Save</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex flex-col gap-1.5">
                                            <p className="font-bold text-gray-800 text-base leading-tight">{template.name}</p>
                                            <button onClick={() => handleToggleStatus(template.id, template.is_active, template.name)} title={`Click to ${template.is_active ? 'Deactivate' : 'Activate'}`} className={`inline-flex self-start items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold ${template.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {template.is_active ? <><CheckCircle2 size={12} /> Active</> : <><XCircle size={12} /> Inactive</>}
                                            </button>
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {template.insurance_category && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded">{template.insurance_category}</span>}
                                                {template.policy_flow && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 rounded">{template.policy_flow}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => startEdit(template)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(template.id, template.name)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <p className="font-semibold text-gray-700 text-sm mb-1 break-words">{template.subject}</p>
                                        <p className="text-xs text-gray-500 break-words whitespace-pre-wrap max-h-40 overflow-y-auto">{template.body}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white  tracking-wider">
                            <th className="p-4 font-semibold text-white text-sm">Status</th>
                            <th className="p-4 font-semibold text-white text-sm">Name & Details</th>
                            <th className="p-4 font-semibold text-white text-sm">Subject & Body Preview</th>
                            <th className="p-4 font-semibold text-white text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="p-0">
                                    <Loading message="Fetching email templates..." />
                                </td>
                            </tr>
                        ) : templates.map(template => (
                            <tr key={template.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                {editingId === template.id ? (
                                    <td colSpan={4} className="p-4">
                                        <div className="flex flex-col gap-4 p-2 bg-indigo-50 rounded-lg">
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="border p-2 rounded w-full outline-none" placeholder="Name" />
                                                <input type="text" value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })} className="border p-2 rounded w-full outline-none" placeholder="Subject" />
                                                <input type="text" value={editForm.insurance_category || ''} onChange={e => setEditForm({ ...editForm, insurance_category: e.target.value })} className="border p-2 rounded w-full outline-none" placeholder="Category" />
                                                <input type="text" value={editForm.policy_flow || ''} onChange={e => setEditForm({ ...editForm, policy_flow: e.target.value })} className="border p-2 rounded w-full outline-none" placeholder="Flow" />
                                            </div>
                                            <textarea value={editForm.body} onChange={e => setEditForm({ ...editForm, body: e.target.value })} className="border p-2 rounded w-full outline-none h-24" placeholder="Body" />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 rounded font-medium flex items-center gap-1"><X size={16} /> Cancel</button>
                                                <button onClick={() => handleUpdate(template.id)} className="px-4 py-2 flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-medium"><Save size={16} /> Save Changes</button>
                                            </div>
                                        </div>
                                    </td>
                                ) : (
                                    <>
                                        <td className="p-4 align-top w-20">
                                            <button onClick={() => handleToggleStatus(template.id, template.is_active, template.name)} title={`Click to ${template.is_active ? 'Deactivate' : 'Activate'}`} className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${template.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                {template.is_active ? <><CheckCircle2 size={14} /> Active</> : <><XCircle size={14} /> Inactive</>}
                                            </button>
                                        </td>
                                        <td className="p-4 align-top w-1/4">
                                            <p className="font-bold text-gray-800 break-words">{template.name}</p>
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {template.insurance_category && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded">{template.insurance_category}</span>}
                                                {template.policy_flow && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 rounded">{template.policy_flow}</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top min-w-[300px]">
                                            <p className="font-semibold text-gray-700 mb-1 break-words">{template.subject}</p>
                                            <div className="text-sm text-gray-500 break-words whitespace-pre-wrap max-h-40 overflow-y-auto">{template.body}</div>
                                        </td>
                                        <td className="p-4 text-right align-top w-24">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => startEdit(template)} className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(template.id, template.name)} className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {!loading && templates.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <Mail size={48} className="mb-4 opacity-20" />
                                        <p className="text-base font-medium text-gray-500">No email templates created yet.</p>
                                        <p className="text-sm mt-1 text-gray-400">Click "Create Template" to build your first automated email.</p>
                                    </div>
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
