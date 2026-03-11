'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Loader2, Save, FileJson } from 'lucide-react'

type FormTemplate = {
    id: string
    form_name: string
    insurance_category?: string
    fields: any
    is_active: boolean
    version: number
    created_at: string
}

export default function FormTemplatesClient() {
    const [templates, setTemplates] = useState<FormTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Create new form state
    const [showCreate, setShowCreate] = useState(false)
    const [formData, setFormData] = useState({ form_name: '', insurance_category: '', is_active: true, fields: '{}' })
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
            const res = await fetch('/api/superadmin/form-templates')
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
            let parsedFields = {}
            try {
                parsedFields = JSON.parse(formData.fields)
            } catch (e) {
                throw new Error("Invalid JSON in fields.")
            }

            const res = await fetch('/api/superadmin/form-templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, fields: parsedFields })
            })
            const j = await res.json()
            if (j.error) throw new Error(j.error)

            setShowCreate(false)
            setFormData({ form_name: '', insurance_category: '', is_active: true, fields: '{}' })
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
            let parsedFields = {}
            try {
                parsedFields = JSON.parse(editForm.fieldsStr)
            } catch (e) {
                throw new Error("Invalid JSON in fields schema.")
            }

            const res = await fetch('/api/superadmin/form-templates', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, form_name: editForm.form_name, insurance_category: editForm.insurance_category, is_active: editForm.is_active, fields: parsedFields })
            })
            const j = await res.json()
            if (j.error) throw new Error(j.error)

            setEditingId(null)
            fetchTemplates()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete form "${name}"? This action cannot be undone.`)) return

        try {
            setError(null)
            const res = await fetch(`/api/superadmin/form-templates?id=${id}`, { method: 'DELETE' })
            const j = await res.json()
            if (j.error) throw new Error(j.error)
            fetchTemplates()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const startEdit = (t: FormTemplate) => {
        setEditingId(t.id)
        setEditForm({ form_name: t.form_name, insurance_category: t.insurance_category || '', is_active: t.is_active, fieldsStr: JSON.stringify(t.fields, null, 2) })
    }

    return (
        <div className="space-y-6">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 flex gap-2"><FileJson size={20} />{error}</div>}

            <div className="flex justify-end">
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm"
                >
                    <Plus size={18} />
                    {showCreate ? 'Cancel Create' : 'Build Form'}
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Form Name</label>
                            <input required type="text" value={formData.form_name} onChange={e => setFormData({ ...formData, form_name: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Commercial Auto Intake" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">Category (Optional)</label>
                            <input type="text" value={formData.insurance_category} onChange={e => setFormData({ ...formData, insurance_category: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Commercial Lines" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700 flex justify-between">
                            JSON Schema
                            <span className="text-gray-400 font-normal">Must be valid JSON object</span>
                        </label>
                        <textarea required value={formData.fields} onChange={e => setFormData({ ...formData, fields: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none h-40 font-mono text-sm resize-y" placeholder='{ "fields": [...] }' />
                    </div>
                    <button type="submit" disabled={createLoading} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700 transition flex justify-center items-center h-[42px] font-medium disabled:opacity-50">
                        {createLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save Form Schema'}
                    </button>
                </form>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 font-semibold text-gray-600 text-sm w-1/4">Name & Category</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm w-1/2">Schema Preview</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm text-right w-1/4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={3} className="p-8 text-center text-gray-500"><Loader2 className="animate-spin mx-auto text-indigo-500" /></td></tr>
                        ) : templates.map(template => (
                            <tr key={template.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                {editingId === template.id ? (
                                    <td colSpan={3} className="p-4">
                                        <div className="flex flex-col gap-4 p-4 bg-indigo-50 rounded-lg">
                                            <div className="grid grid-cols-2 gap-4">
                                                <input type="text" value={editForm.form_name} onChange={e => setEditForm({ ...editForm, form_name: e.target.value })} className="border p-2 rounded w-full outline-none" placeholder="Name" />
                                                <input type="text" value={editForm.insurance_category} onChange={e => setEditForm({ ...editForm, insurance_category: e.target.value })} className="border p-2 rounded w-full outline-none" placeholder="Category" />
                                            </div>
                                            <textarea value={editForm.fieldsStr} onChange={e => setEditForm({ ...editForm, fieldsStr: e.target.value })} className="border p-2 rounded w-full outline-none font-mono text-xs h-32" placeholder="{}" />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded font-medium">Cancel</button>
                                                <button onClick={() => handleUpdate(template.id)} className="px-4 py-2 flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-medium"><Save size={16} /> Save JSON Schema</button>
                                            </div>
                                        </div>
                                    </td>
                                ) : (
                                    <>
                                        <td className="p-4 align-top">
                                            <p className="font-bold text-gray-800">{template.form_name}</p>
                                            <div className="flex gap-2 mt-1">
                                                {template.insurance_category && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 rounded uppercase tracking-wide">{template.insurance_category}</span>}
                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 rounded">v{template.version}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 align-top">
                                            <div className="bg-gray-50 p-2 rounded border border-gray-100 max-h-24 overflow-auto font-mono text-xs text-gray-500">
                                                {JSON.stringify(template.fields)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right align-top">
                                            <div className="flex justify-end gap-1">
                                                <button onClick={() => startEdit(template)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(template.id, template.form_name)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {!loading && templates.length === 0 && (
                            <tr><td colSpan={3} className="p-8 text-center text-gray-500">No forms built yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
