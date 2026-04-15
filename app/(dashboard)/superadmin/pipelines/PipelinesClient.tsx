'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, ChevronRight, X } from 'lucide-react'
import Loading, { Spinner } from '@/components/ui/Loading'
import { toast } from '@/lib/toast'
import Link from 'next/link'

type Pipeline = {
    id: string
    name: string
    category: string
    is_renewal: boolean
    created_at: string
}

export default function PipelinesClient() {
    const [pipelines, setPipelines] = useState<Pipeline[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Create new form state
    const [showCreate, setShowCreate] = useState(false)
    const [formData, setFormData] = useState({ name: '', category: 'Personal Lines', is_renewal: false })
    const [createLoading, setCreateLoading] = useState(false)

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({ name: '', category: '', is_renewal: false })

    useEffect(() => {
        fetchPipelines()
    }, [])

    const fetchPipelines = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/superadmin/pipelines')
            const j = await res.json()
            if (j.error) throw new Error(j.error)
            setPipelines(j.pipelines || [])
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
            const res = await fetch('/api/superadmin/pipelines', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const j = await res.json()
            if (j.error) throw new Error(j.error)

            setShowCreate(false)
            setFormData({ name: '', category: 'Personal Lines', is_renewal: false })
            toast('Pipeline created successfully!', 'success')
            fetchPipelines()
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
            const res = await fetch('/api/superadmin/pipelines', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...editForm })
            })
            const j = await res.json()
            if (j.error) throw new Error(j.error)

            setEditingId(null)
            toast('Pipeline updated successfully!', 'success')
            fetchPipelines()
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete pipeline "${name}"? This action cannot be undone and will affect leads associated with it.`)) return

        try {
            setError(null)
            const res = await fetch(`/api/superadmin/pipelines?id=${id}`, { method: 'DELETE' })
            const j = await res.json()
            if (j.error) throw new Error(j.error)
            toast('Pipeline deleted successfully!', 'success')
            fetchPipelines()
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        }
    }

    return (
        <div className="space-y-6">

            <div className="flex justify-end gap-3">
                {showCreate && (
                    <button
                        type="button"
                        onClick={() => setShowCreate(false)}
                        className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl hover:bg-red-700 transition-all font-bold shadow-sm text-sm"
                    >
                        <X size={18} /> Cancel
                    </button>
                )}
                <button
                    type="button"
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-all font-bold shadow-sm text-sm"
                >
                    <Plus size={18} />
                    Create Pipeline
                </button>
            </div>

            {showCreate && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden mb-6">
                    <div className="px-6 py-4 bg-gradient-to-r from-[#10B889] to-[#2E5C85] flex items-center gap-3">
                        <div className="p-2 bg-white/20 text-white rounded-lg backdrop-blur-sm">
                            <Plus size={18} />
                        </div>
                        <div>
                            <h2 className="text-xs font-bold text-white uppercase tracking-widest">New Marketing Pipeline</h2>
                            <p className="text-[10px] text-emerald-50/80 font-medium uppercase tracking-wider mt-0.5">Streamline acquisition and retention</p>
                        </div>
                    </div>
                    <form onSubmit={handleCreate} className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Pipeline Name</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Health Insurance" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Category</label>
                        <input required type="text" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Personal Lines" />
                    </div>
                    <div className="flex items-center gap-2 pb-2 h-[42px]">
                        <input type="checkbox" checked={formData.is_renewal} onChange={e => setFormData({ ...formData, is_renewal: e.target.checked })} className="w-5 h-5 text-indigo-600 rounded" />
                        <label className="text-sm font-medium text-gray-700">Is Renewal Pipeline?</label>
                    </div>
                    <button type="submit" disabled={createLoading} className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-all flex justify-center items-center h-[50px] font-bold disabled:opacity-50 shadow-sm">
                        {createLoading ? <Spinner size={20} /> : 'Create Pipeline'}
                    </button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white uppercase text-xs tracking-wider">
                            <th className="p-4 font-semibold text-white text-sm">Pipeline Name</th>
                            <th className="p-4 font-semibold text-white text-sm">Category</th>
                            <th className="p-4 font-semibold text-white text-sm">Type</th>
                            <th className="p-4 font-semibold text-white text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="p-0">
                                    <Loading message="Fetching pipelines..." />
                                </td>
                            </tr>
                        ) : pipelines.map(pipeline => (
                            <tr key={pipeline.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                <td className="p-4 text-gray-800 font-medium">
                                    {editingId === pipeline.id ? (
                                        <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="border p-1 rounded w-full outline-none" />
                                    ) : pipeline.name}
                                </td>
                                <td className="p-4 text-gray-600 text-sm">
                                    {editingId === pipeline.id ? (
                                        <input type="text" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="border p-1 rounded w-full outline-none" />
                                    ) : pipeline.category}
                                </td>
                                <td className="p-4 text-sm">
                                    {editingId === pipeline.id ? (
                                        <label className="flex items-center gap-1"><input type="checkbox" checked={editForm.is_renewal} onChange={e => setEditForm({ ...editForm, is_renewal: e.target.checked })} /> Renewal</label>
                                    ) : (
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${pipeline.is_renewal ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {pipeline.is_renewal ? 'RENEWAL' : 'NEW'}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2 items-center">
                                    {editingId === pipeline.id ? (
                                        <>
                                            <button onClick={() => handleUpdate(pipeline.id)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded" title="Save"><Save size={16} /></button>
                                            <button onClick={() => setEditingId(null)} className="p-2 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium flex items-center gap-1"><X size={14} /> Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <Link href={`/superadmin/pipelines/${pipeline.id}/stages`}>
                                                <button className="flex items-center gap-1 text-sm text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded transition font-medium mr-2">
                                                    Manage Stages <ChevronRight size={16} />
                                                </button>
                                            </Link>
                                            <button onClick={() => { setEditingId(pipeline.id); setEditForm({ name: pipeline.name, category: pipeline.category, is_renewal: pipeline.is_renewal }) }} className="p-2 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 rounded transition"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(pipeline.id, pipeline.name)} className="p-2 text-red-600 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!loading && pipelines.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No pipelines created yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
