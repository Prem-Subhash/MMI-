'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Loader2, Save, X, CheckCircle2, XCircle } from 'lucide-react'

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
            fetchTemplates()
        } catch (err: any) {
            setError(err.message)
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
            fetchTemplates()
        } catch (err: any) {
            setError(err.message)
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
            fetchTemplates()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete template "${name}"? This could break automated reminders.`)) return

        try {
            setError(null)
            const res = await fetch(`/api/superadmin/email-templates?id=${id}`, { method: 'DELETE' })
            const j = await res.json()
            if (j.error) throw new Error(j.error)
            fetchTemplates()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const startEdit = (template: EmailTemplate) => {
        setEditingId(template.id)
        setEditForm({ ...template })
    }

    return (
        <div className="space-y-6">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{error}</div>}

            <div className="flex justify-end">
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium shadow-sm"
                >
                    {showCreate ? <X size={18} /> : <Plus size={18} />}
                    {showCreate ? 'x cancel' : 'Create Template'}
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Template Name</label>
                            <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Welcome Email" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Subject</label>
                            <input required type="text" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Subject line..." />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Category (Optional)</label>
                            <input type="text" value={formData.insurance_category} onChange={e => setFormData({ ...formData, insurance_category: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Personal Lines" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Flow (Optional)</label>
                            <input type="text" value={formData.policy_flow} onChange={e => setFormData({ ...formData, policy_flow: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. New Business" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Email Body (HTML/Text)</label>
                        <textarea required value={formData.body} onChange={e => setFormData({ ...formData, body: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-y" placeholder="Dear client..." />
                    </div>
                    <button type="submit" disabled={createLoading} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700 transition flex justify-center items-center h-[42px] font-medium disabled:opacity-50">
                        {createLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save Template'}
                    </button>
                </form>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white uppercase text-xs tracking-wider">
                            <th className="p-4 font-semibold text-white text-sm">Status</th>
                            <th className="p-4 font-semibold text-white text-sm">Name & Details</th>
                            <th className="p-4 font-semibold text-white text-sm">Subject & Body Preview</th>
                            <th className="p-4 font-semibold text-white text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500"><Loader2 className="animate-spin mx-auto text-emerald-500" /></td></tr>
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
                                                <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-medium flex items-center gap-1"><X size={16} /> x</button>
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
                                            <p className="font-bold text-gray-800">{template.name}</p>
                                            <div className="flex gap-1 mt-1 flex-wrap">
                                                {template.insurance_category && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded">{template.insurance_category}</span>}
                                                {template.policy_flow && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 rounded">{template.policy_flow}</span>}
                                            </div>
                                        </td>
                                        <td className="p-4 align-top min-w-[300px]">
                                            <p className="font-semibold text-gray-700 mb-1">{template.subject}</p>
                                            <p className="text-sm text-gray-500 line-clamp-2">{template.body}</p>
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
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No email templates created yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
