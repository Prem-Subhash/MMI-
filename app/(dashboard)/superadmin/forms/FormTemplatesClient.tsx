'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, FileJson, X, Info, Code2, TrendingUp, Zap, FileBox } from 'lucide-react'
import Loading, { Spinner } from '@/components/ui/Loading'
import { toast } from '@/lib/toast'
import { motion, AnimatePresence } from 'framer-motion'

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
            toast('Form template created successfully!', 'success')
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
            toast('Form template updated successfully!', 'success')
            fetchTemplates()
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete form "${name}"? This action cannot be undone.`)) return

        try {
            setError(null)
            const res = await fetch(`/api/superadmin/form-templates?id=${id}`, { method: 'DELETE' })
            const j = await res.json()
            if (j.error) throw new Error(j.error)
            toast('Form template deleted successfully!', 'success')
            fetchTemplates()
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        }
    }

    const startEdit = (t: FormTemplate) => {
        setEditingId(t.id)
        setEditForm({ form_name: t.form_name, insurance_category: t.insurance_category || '', is_active: t.is_active, fieldsStr: JSON.stringify(t.fields, null, 2) })
    }

    return (
        <div className="space-y-6">

            {/* Top Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Total Schemas */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-300">
                        <FileJson size={80} className="text-violet-600" />
                    </div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Schemas</p>
                            <div className="flex items-end gap-3">
                                <h4 className="text-3xl font-black text-gray-800">{templates.length}</h4>
                                <span className="flex items-center text-xs font-medium text-emerald-600 mb-1 bg-emerald-50 px-2 py-0.5 rounded-full">
                                    <TrendingUp size={12} className="mr-1" /> Updated
                                </span>
                            </div>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-violet-50 to-violet-100 text-violet-600 rounded-xl shadow-inner border border-violet-100/50">
                            <FileJson size={22} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                        Structured data forms
                    </p>
                </div>

                {/* Active Forms */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-300">
                        <Zap size={80} className="text-emerald-600" />
                    </div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Active Forms</p>
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

                {/* Recent Version */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-300">
                        <FileBox size={80} className="text-indigo-500" />
                    </div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Recent Version</p>
                            <div className="flex items-end gap-3">
                                <h4 className="text-3xl font-black text-indigo-600">v{templates.length > 0 ? Math.max(...templates.map(t => t.version)) : '1'}</h4>
                            </div>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-600 rounded-xl shadow-inner border border-indigo-100/50">
                            <FileBox size={22} />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        Latest schema iteration
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-lg font-bold text-gray-800 tracking-tight">Form Schemas</h3>
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
                            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-brand text-white px-5 py-2.5 rounded-xl hover:bg-brand transition font-bold shadow-sm text-sm"
                        >
                            <Plus size={18} /> Build Form
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
                <div className="bg-white rounded-2xl border border-violet-100 shadow-xl overflow-hidden mt-4">
                    <div className="px-6 py-4 bg-violet-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-violet-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 text-emerald-500 rounded-lg">
                                <FileJson size={18} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-gray-800 tracking-tight">New Form Schema</h2>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Define structured intake fields</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-violet-100 text-xs font-medium text-emerald-800 shadow-sm">
                            <Info size={14} className="text-emerald-500" />
                            Use valid JSON array for the fields schema.
                        </div>
                    </div>
                    <form onSubmit={handleCreate} className="p-4 sm:p-6 flex flex-col gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Form Name</label>
                                <input required type="text" value={formData.form_name} onChange={e => setFormData({ ...formData, form_name: e.target.value })} className="border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. Commercial Auto Intake" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700">Category (Optional)</label>
                                <input type="text" value={formData.insurance_category} onChange={e => setFormData({ ...formData, insurance_category: e.target.value })} className="border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="e.g. Commercial Lines" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                <Code2 size={16} className="text-emerald-500" /> JSON Schema Builder
                            </label>
                            <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-inner">
                                <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                                </div>
                                <textarea required value={formData.fields} onChange={e => setFormData({ ...formData, fields: e.target.value })} className="w-full bg-transparent p-4 text-emerald-400 font-mono text-sm h-48 outline-none resize-y placeholder-slate-600" placeholder='{ "fields": [...] }' />
                            </div>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button type="submit" disabled={createLoading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-all flex justify-center items-center font-bold disabled:opacity-50 shadow-sm w-full sm:w-auto">
                                {createLoading ? <Spinner size={20} /> : 'Save Form Schema'}
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
                        <div className="p-6 flex justify-center"><Loading message="Fetching form templates..." /></div>
                    ) : templates.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">No form templates defined.</div>
                    ) : templates.map(template => (
                        <div key={template.id} className="p-4 space-y-4 hover:bg-gray-50 transition-colors">
                            {editingId === template.id ? (
                                <div className="flex flex-col gap-4 p-4 bg-indigo-50 rounded-lg">
                                    <div className="flex flex-col gap-3">
                                        <input type="text" value={editForm.form_name} onChange={e => setEditForm({ ...editForm, form_name: e.target.value })} className="border p-2 rounded w-full outline-none font-bold" placeholder="Name" />
                                        <input type="text" value={editForm.insurance_category} onChange={e => setEditForm({ ...editForm, insurance_category: e.target.value })} className="border p-2 rounded w-full outline-none text-sm" placeholder="Category" />
                                    </div>
                                    <textarea value={editForm.fieldsStr} onChange={e => setEditForm({ ...editForm, fieldsStr: e.target.value })} className="border p-2 rounded w-full outline-none font-mono text-xs h-32" placeholder="{}" />
                                    <div className="flex gap-2 w-full mt-2">
                                        <button onClick={() => setEditingId(null)} className="flex-1 justify-center px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 rounded-lg font-medium flex items-center gap-1 shadow-sm text-sm"><X size={14} /> Cancel</button>
                                        <button onClick={() => handleUpdate(template.id)} className="flex-1 justify-center px-3 py-2 flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium shadow-sm text-sm"><Save size={16} /> Save</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <p className="font-bold text-gray-800 text-base leading-tight">{template.form_name}</p>
                                            <div className="flex flex-wrap gap-2 mt-1.5">
                                                {template.insurance_category && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase tracking-wide font-bold">{template.insurance_category}</span>}
                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold uppercase">v{template.version}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button onClick={() => startEdit(template)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(template.id, template.form_name)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 max-h-32 overflow-y-auto overflow-x-hidden font-mono text-[10px] text-gray-500 break-all w-full">
                                            {JSON.stringify(template.fields)}
                                        </div>
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
                            <th className="p-4 font-semibold text-white text-sm w-1/4">Name & Category</th>
                            <th className="p-4 font-semibold text-white text-sm w-1/2">Schema Preview</th>
                            <th className="p-4 font-semibold text-white text-sm text-right w-1/4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="p-0">
                                    <Loading message="Fetching form templates..." />
                                </td>
                            </tr>
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
                                                <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 rounded font-medium flex items-center gap-1"><X size={16} /> Cancel</button>
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
                                                <button onClick={() => startEdit(template)} className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDelete(template.id, template.form_name)} className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                        {!loading && templates.length === 0 && (
                            <tr>
                                <td colSpan={3} className="p-12 text-center">
                                    <div className="flex flex-col items-center justify-center text-gray-400">
                                        <FileJson size={48} className="mb-4 opacity-20 text-violet-500" />
                                        <p className="text-base font-medium text-gray-500">No form templates defined.</p>
                                        <p className="text-sm mt-1 text-gray-400">Click "Build Form" to define your first custom schema.</p>
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
