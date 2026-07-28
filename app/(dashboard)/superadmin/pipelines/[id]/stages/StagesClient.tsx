'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Save, ArrowUp, ArrowDown, X, GitBranch } from 'lucide-react'
import Loading, { Spinner } from '@/components/ui/Loading'
import { toast } from '@/lib/toast'
import { motion, AnimatePresence } from 'framer-motion'

type Stage = {
    id: string
    pipeline_id: string
    stage_name: string
    stage_order: number
    mandatory_fields: any
    created_at: string
}

export default function StagesClient({ pipelineId }: { pipelineId: string }) {
    const [stages, setStages] = useState<Stage[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Create new form state
    const [showCreate, setShowCreate] = useState(false)
    const [formData, setFormData] = useState({ stage_name: '', stage_order: 1 })
    const [createLoading, setCreateLoading] = useState(false)

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({ stage_name: '', stage_order: 1, mandatory_fields: '{}' })

    useEffect(() => {
        fetchStages()
    }, [pipelineId])

    const fetchStages = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/superadmin/pipelines/stages?pipeline_id=${pipelineId}`)
            const j = await res.json()
            if (j.error) throw new Error(j.error)

            const sorted = (j.stages || []).sort((a: Stage, b: Stage) => a.stage_order - b.stage_order)
            setStages(sorted)
            setFormData(prev => ({ ...prev, stage_order: sorted.length > 0 ? sorted[sorted.length - 1].stage_order + 1 : 1 }))
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
            const res = await fetch('/api/superadmin/pipelines/stages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pipeline_id: pipelineId, ...formData, mandatory_fields: {} })
            })
            const j = await res.json()
            if (j.error) throw new Error(j.error)

            setShowCreate(false)
            setFormData({ stage_name: '', stage_order: formData.stage_order + 1 })
            toast('Stage created successfully!', 'success')
            fetchStages()
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
                parsedFields = JSON.parse(editForm.mandatory_fields)
            } catch (e) {
                throw new Error("Invalid JSON in mandatory fields.")
            }

            const res = await fetch('/api/superadmin/pipelines/stages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, stage_name: editForm.stage_name, stage_order: editForm.stage_order, mandatory_fields: parsedFields })
            })
            const j = await res.json()
            if (j.error) throw new Error(j.error)

            setEditingId(null)
            toast('Stage updated successfully!', 'success')
            fetchStages()
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete stage "${name}"? This action cannot be undone.`)) return

        try {
            setError(null)
            const res = await fetch(`/api/superadmin/pipelines/stages?id=${id}`, { method: 'DELETE' })
            const j = await res.json()
            if (j.error) throw new Error(j.error)
            toast('Stage deleted successfully!', 'success')
            fetchStages()
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        }
    }

    const handleReorder = async (id: string, direction: -1 | 1) => {
        const index = stages.findIndex(s => s.id === id)
        if (index < 0) return

        const swapIndex = index + direction
        if (swapIndex < 0 || swapIndex >= stages.length) return // Boundary check

        const currentStage = stages[index]
        const targetStage = stages[swapIndex]

        // Swap orders simply by calling PATCH twice. In a real app an RPC would be safer, but this works.
        const currentNewOrder = targetStage.stage_order
        const targetNewOrder = currentStage.stage_order

        try {
            setError(null)
            // Update current
            await fetch('/api/superadmin/pipelines/stages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: currentStage.id, stage_order: currentNewOrder })
            })
            // Update target
            await fetch('/api/superadmin/pipelines/stages', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: targetStage.id, stage_order: targetNewOrder })
            })

            toast('Stages reordered', 'success')
            fetchStages()
        } catch (err: any) {
            setError('Failed to reorder stages')
            toast('Failed to reorder stages', 'error')
        }
    }

    return (
        <div className="space-y-6">

            {/* Top Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-sm text-gray-500 font-medium mb-1">Total Stages</p>
                    <p className="text-2xl font-bold text-gray-800">{stages.length}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-sm text-gray-500 font-medium mb-1">Initial Stage</p>
                    <p className="text-lg font-bold text-gray-800 break-words">{stages[0]?.stage_name || 'N/A'}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                    <p className="text-sm text-gray-500 font-medium mb-1">Final Stage</p>
                    <p className="text-lg font-bold text-gray-800 break-words">{stages[stages.length - 1]?.stage_name || 'N/A'}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-lg font-bold text-gray-800 tracking-tight">Stage Management</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                    {showCreate && (
                        <button
                            onClick={() => setShowCreate(false)}
                            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 px-4 py-2 rounded-lg transition font-medium shadow-sm text-sm"
                        >
                            <X size={18} /> Cancel
                        </button>
                    )}
                    {!showCreate && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition font-medium shadow-sm text-sm"
                        >
                            <Plus size={18} /> Add Stage
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
                <div className="bg-white rounded-2xl border border-orange-100 shadow-xl overflow-hidden mt-4">
                    <div className="px-6 py-4 bg-orange-50 flex items-center gap-3 border-b border-orange-100">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <GitBranch size={18} />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-800 tracking-tight">New Pipeline Stage</h2>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">Stages define the linear progression of your pipelines.</p>
                        </div>
                    </div>
                    <form onSubmit={handleCreate} className="p-6 flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex flex-col gap-1.5 flex-1 w-full">
                            <label className="text-sm font-medium text-gray-700">Stage Name</label>
                            <input required type="text" value={formData.stage_name} onChange={e => setFormData({ ...formData, stage_name: e.target.value })} className="border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all w-full" placeholder="e.g. Quoting in Progress" />
                        </div>
                        <div className="flex flex-col gap-1.5 w-full sm:w-32">
                            <label className="text-sm font-medium text-gray-700">Order</label>
                            <input required type="number" value={formData.stage_order} onChange={e => setFormData({ ...formData, stage_order: parseInt(e.target.value) || 1 })} className="border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all w-full" />
                        </div>
                        <button type="submit" disabled={createLoading} className="bg-orange-600 text-white p-2.5 rounded-lg w-full sm:w-32 h-[46px] hover:bg-orange-700 transition-all flex justify-center items-center font-bold disabled:opacity-50 shadow-sm mt-4 sm:mt-0">
                            {createLoading ? <Spinner size={18} /> : 'Save Stage'}
                        </button>
                    </form>
                </div>
                </motion.div>
            )}
            </AnimatePresence>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-6 flex justify-center"><Loading message="Fetching pipeline stages..." /></div>
                    ) : stages.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No stages created for this pipeline.</div>
                    ) : stages.map((stage, index) => (
                        <div key={stage.id} className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center">
                                        <button onClick={() => handleReorder(stage.id, -1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-orange-600 disabled:opacity-30 disabled:hover:text-gray-400"><ArrowUp size={16} /></button>
                                        <span className="font-bold text-gray-700 text-sm">{stage.stage_order}</span>
                                        <button onClick={() => handleReorder(stage.id, 1)} disabled={index === stages.length - 1} className="p-1 text-gray-400 hover:text-orange-600 disabled:opacity-30 disabled:hover:text-gray-400"><ArrowDown size={16} /></button>
                                    </div>
                                    <div className="flex-1">
                                        {editingId === stage.id ? (
                                            <input type="text" value={editForm.stage_name} onChange={e => setEditForm({ ...editForm, stage_name: e.target.value })} className="border p-2 rounded w-full outline-none font-bold text-gray-800" />
                                        ) : (
                                            <div className="font-bold text-gray-800 text-base break-words">{stage.stage_name}</div>
                                        )}
                                    </div>
                                </div>
                                {!editingId && (
                                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                        <button onClick={() => { setEditingId(stage.id); setEditForm({ stage_name: stage.stage_name, stage_order: stage.stage_order, mandatory_fields: JSON.stringify(stage.mandatory_fields, null, 2) }) }} className="p-2 text-gray-500 hover:text-orange-600 bg-orange-50/50 hover:bg-orange-50 rounded transition"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(stage.id, stage.stage_name)} className="p-2 text-gray-500 hover:text-red-600 bg-red-50/50 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
                                    </div>
                                )}
                            </div>
                            
                            {editingId === stage.id && (
                                <div className="flex flex-col gap-2 mt-2">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">Mandatory Fields (JSON):</label>
                                    <textarea value={editForm.mandatory_fields} onChange={e => setEditForm({ ...editForm, mandatory_fields: e.target.value })} className="border p-2 rounded w-full h-24 outline-none resize-y text-xs font-mono" />
                                    <div className="flex gap-2 w-full mt-2">
                                        <button onClick={() => setEditingId(null)} className="flex-1 justify-center px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 rounded-lg text-sm font-medium flex items-center gap-1 shadow-sm"><X size={14} /> Cancel</button>
                                        <button onClick={() => handleUpdate(stage.id)} className="flex-1 justify-center px-3 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium flex items-center gap-1 shadow-sm"><Save size={16} /> Save</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                        <tr className= "bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white  tracking-wider">
                            <th className="p-4 font-semibold text-white text-sm w-20">Order</th>
                            <th className="p-4 font-semibold text-white text-sm">Stage Name</th>
                            <th className="p-4 font-semibold text-white text-sm">Mandatory Fields (JSON)</th>
                            <th className="p-4 font-semibold text-white text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="p-0">
                                    <Loading message="Fetching pipeline stages..." />
                                </td>
                            </tr>
                        ) : stages.map((stage, index) => (
                            <tr key={stage.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                <td className="p-4">
                                    {editingId === stage.id ? (
                                        <input type="number" value={editForm.stage_order} onChange={e => setEditForm({ ...editForm, stage_order: parseInt(e.target.value) || 1 })} className="border p-1 w-16 rounded outline-none" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-700 w-6 text-center">{stage.stage_order}</span>
                                            <div className="flex flex-col">
                                                <button onClick={() => handleReorder(stage.id, -1)} disabled={index === 0} className="text-gray-400 hover:text-orange-600 disabled:opacity-30 disabled:hover:text-gray-400"><ArrowUp size={14} /></button>
                                                <button onClick={() => handleReorder(stage.id, 1)} disabled={index === stages.length - 1} className="text-gray-400 hover:text-orange-600 disabled:opacity-30 disabled:hover:text-gray-400"><ArrowDown size={14} /></button>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-gray-800 font-medium tracking-tight break-words align-top">
                                    {editingId === stage.id ? (
                                        <input type="text" value={editForm.stage_name} onChange={e => setEditForm({ ...editForm, stage_name: e.target.value })} className="border p-1 rounded w-full outline-none" />
                                    ) : stage.stage_name}
                                </td>
                                <td className="p-4 text-xs font-mono text-gray-500 break-all align-top">
                                    {editingId === stage.id ? (
                                        <textarea value={editForm.mandatory_fields} onChange={e => setEditForm({ ...editForm, mandatory_fields: e.target.value })} className="border p-1 rounded w-full h-24 outline-none resize-y" />
                                    ) : (
                                        <div title={JSON.stringify(stage.mandatory_fields, null, 2)}>
                                            {JSON.stringify(stage.mandatory_fields) === '{}' ? 'None' : JSON.stringify(stage.mandatory_fields)}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2 items-center h-full">
                                    {editingId === stage.id ? (
                                        <>
                                            <button onClick={() => handleUpdate(stage.id)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded" title="Save"><Save size={16} /></button>
                                            <button onClick={() => setEditingId(null)} className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 rounded text-sm font-medium flex items-center gap-1"><X size={14} /> Cancel</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => { setEditingId(stage.id); setEditForm({ stage_name: stage.stage_name, stage_order: stage.stage_order, mandatory_fields: JSON.stringify(stage.mandatory_fields, null, 2) }) }} className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded transition"><Edit2 size={16} /></button>
                                            <button onClick={() => handleDelete(stage.id, stage.stage_name)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition"><Trash2 size={16} /></button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!loading && stages.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No stages created for this pipeline.</td></tr>
                        )}
                    </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
