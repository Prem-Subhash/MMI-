'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Loader2, Save, ArrowUp, ArrowDown, X } from 'lucide-react'

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
            fetchStages()
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
            fetchStages()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete stage "${name}"? This action cannot be undone.`)) return

        try {
            setError(null)
            const res = await fetch(`/api/superadmin/pipelines/stages?id=${id}`, { method: 'DELETE' })
            const j = await res.json()
            if (j.error) throw new Error(j.error)
            fetchStages()
        } catch (err: any) {
            setError(err.message)
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

            fetchStages()
        } catch (err: any) {
            setError('Failed to reorder stages')
        }
    }

    return (
        <div className="space-y-6">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{error}</div>}

            <div className="flex justify-end">
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition font-medium shadow-sm"
                >
                    {showCreate ? <X size={18} /> : <Plus size={18} />}
                    {showCreate ? 'x' : 'Add Stage'}
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex flex-col gap-1 flex-1">
                        <label className="text-sm font-medium text-gray-700">Stage Name</label>
                        <input required type="text" value={formData.stage_name} onChange={e => setFormData({ ...formData, stage_name: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Quoting in Progress" />
                    </div>
                    <div className="flex flex-col gap-1 w-32">
                        <label className="text-sm font-medium text-gray-700">Order</label>
                        <input required type="number" value={formData.stage_order} onChange={e => setFormData({ ...formData, stage_order: parseInt(e.target.value) || 1 })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>
                    <button type="submit" disabled={createLoading} className="bg-emerald-600 text-white p-2 rounded w-32 h-[42px] hover:bg-emerald-700 transition flex justify-center items-center font-medium disabled:opacity-50">
                        {createLoading ? <Loader2 size={18} className="animate-spin" /> : 'Save Stage'}
                    </button>
                </form>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 font-semibold text-gray-600 text-sm w-20">Order</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Stage Name</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Mandatory Fields (JSON)</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500"><Loader2 className="animate-spin mx-auto text-emerald-500" /></td></tr>
                        ) : stages.map((stage, index) => (
                            <tr key={stage.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                <td className="p-4">
                                    {editingId === stage.id ? (
                                        <input type="number" value={editForm.stage_order} onChange={e => setEditForm({ ...editForm, stage_order: parseInt(e.target.value) || 1 })} className="border p-1 w-16 rounded outline-none" />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-gray-700 w-6 text-center">{stage.stage_order}</span>
                                            <div className="flex flex-col">
                                                <button onClick={() => handleReorder(stage.id, -1)} disabled={index === 0} className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-400"><ArrowUp size={14} /></button>
                                                <button onClick={() => handleReorder(stage.id, 1)} disabled={index === stages.length - 1} className="text-gray-400 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-400"><ArrowDown size={14} /></button>
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-gray-800 font-medium tracking-tight">
                                    {editingId === stage.id ? (
                                        <input type="text" value={editForm.stage_name} onChange={e => setEditForm({ ...editForm, stage_name: e.target.value })} className="border p-1 rounded w-full outline-none" />
                                    ) : stage.stage_name}
                                </td>
                                <td className="p-4 text-xs font-mono text-gray-500 max-w-[200px] truncate">
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
                                            <button onClick={() => setEditingId(null)} className="p-2 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium flex items-center gap-1"><X size={14} /> x</button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => { setEditingId(stage.id); setEditForm({ stage_name: stage.stage_name, stage_order: stage.stage_order, mandatory_fields: JSON.stringify(stage.mandatory_fields, null, 2) }) }} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"><Edit2 size={16} /></button>
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
    )
}
