'use client'

import { useState, useEffect } from 'react'
import { Activity } from 'lucide-react'
import Loading, { Spinner } from '@/components/ui/Loading'
import { toast } from '@/lib/toast'

type AuditLog = {
    id: string
    user_id: string
    profiles: { full_name: string, email: string } | null
    action: string
    entity: string
    entity_id: string | null
    metadata: any
    created_at: string
}

export default function AuditLogsClient() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/superadmin/audit-logs')
            const j = await res.json()
            if (j.error) throw new Error(j.error)
            setLogs(j.logs || [])
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string) => {
        const d = new Date(dateString)
        return new Intl.DateTimeFormat('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit', second: '2-digit'
        }).format(d)
    }

    const formatJSON = (data: any) => {
        if (!data || Object.keys(data).length === 0) return 'None'
        return JSON.stringify(data, null, 2)
    }

    return (
        <div className="space-y-6">

            <div className="bg-white sm:rounded-xl shadow-sm sm:border border-gray-200 overflow-hidden -mx-3 sm:mx-0">
                {/* Mobile Cards View */}
                <div className="md:hidden divide-y divide-gray-100">
                    {loading ? (
                        <div className="p-6 flex justify-center"><Loading message="Fetching audit logs..." /></div>
                    ) : logs.length === 0 ? (
                        <div className="p-12 text-center text-gray-400">
                            <Activity className="mx-auto mb-2 opacity-50" size={32} />
                            No audit logs recorded yet.
                        </div>
                    ) : logs.map(log => (
                        <div key={log.id} className="p-4 space-y-3 hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start gap-2">
                                <div>
                                    <div className="text-sm font-bold text-gray-800">{log.profiles?.full_name || 'System / Unknown'}</div>
                                    <div className="text-xs text-gray-500 break-all">{log.profiles?.email || 'N/A'}</div>
                                </div>
                                <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] uppercase font-bold tracking-wider rounded border border-indigo-100 whitespace-nowrap flex-shrink-0">
                                    {log.action}
                                </span>
                            </div>
                            
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm font-semibold text-gray-700">{log.entity}</div>
                                    <div className="text-[10px] font-mono text-gray-400">{formatDate(log.created_at)}</div>
                                </div>
                                {log.entity_id && <div className="text-[10px] font-mono text-gray-400 break-all w-full" title={log.entity_id}>ID: {log.entity_id}</div>}
                                <div className="text-[10px] font-mono text-gray-600 bg-white p-2 rounded border border-gray-200 mt-1 max-h-32 overflow-y-auto w-full overflow-x-hidden whitespace-pre-wrap">
                                    {formatJSON(log.metadata)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white tracking-wider">
                                <th className="p-4 font-semibold text-white text-sm w-48">Timestamp</th>
                                <th className="p-4 font-semibold text-white text-sm w-48">User</th>
                                <th className="p-4 font-semibold text-white text-sm w-48">Action</th>
                                <th className="p-4 font-semibold text-white text-sm w-48">Entity / ID</th>
                                <th className="p-4 font-semibold text-white text-sm">Metadata</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-0">
                                        <Loading message="Fetching audit logs..." />
                                    </td>
                                </tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                    <td className="p-4 text-xs font-mono text-gray-500 align-top">
                                        {formatDate(log.created_at)}
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="text-sm font-medium text-gray-800 break-words">{log.profiles?.full_name || 'System / Unknown'}</div>
                                        <div className="text-xs text-gray-500 break-all">{log.profiles?.email || 'N/A'}</div>
                                    </td>
                                    <td className="p-4 align-top">
                                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] uppercase font-bold tracking-wider rounded border border-indigo-100 whitespace-nowrap">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="text-sm font-semibold text-gray-700 break-words">{log.entity}</div>
                                        {log.entity_id && <div className="text-xs font-mono text-gray-400 break-all" title={log.entity_id}>{log.entity_id}</div>}
                                    </td>
                                    <td className="p-4 align-top">
                                        <div className="bg-gray-50 p-2 rounded border border-gray-100 text-xs font-mono text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto w-full max-w-lg">
                                            {formatJSON(log.metadata)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && logs.length === 0 && (
                                <tr><td colSpan={5} className="p-12 text-center text-gray-400">
                                    <Activity className="mx-auto mb-2 opacity-50" size={32} />
                                    No audit logs recorded yet.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
