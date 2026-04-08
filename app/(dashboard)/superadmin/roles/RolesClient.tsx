'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, Edit2, ShieldAlert, X } from 'lucide-react'
import { toast } from '@/lib/toast'

type UserProfile = {
    id: string
    email: string
    full_name: string
    role: string
    created_at: string
}

export default function RolesClient() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Edit state
    const [editingUserId, setEditingUserId] = useState<string | null>(null)
    const [editingRole, setEditingRole] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/superadmin/users')
            const j = await res.json()
            if (j.error) throw new Error(j.error)
            setUsers(j.users || [])
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateRole = async (id: string, currentRole: string) => {
        // Simple protection to prevent accidentally removing own superadmin role
        if (editingRole === 'csr' && currentRole === 'superadmin') {
            if (!confirm('Warning: You are demoting a Super Admin. Are you sure you want to proceed?')) {
                return;
            }
        }

        try {
            setError(null)
            const res = await fetch('/api/superadmin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, role: editingRole })
            })
            const j = await res.json()
            if (j.error) throw new Error(j.error)

            setEditingUserId(null)
            toast('Role updated successfully!', 'success')
            fetchUsers()
        } catch (err: any) {
            setError(err.message)
            toast(err.message, 'error')
        }
    }

    return (
        <div className="space-y-6">

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white uppercase text-xs tracking-wider">
                            <th className="p-4 font-semibold text-white text-sm">User</th>
                            <th className="p-4 font-semibold text-white text-sm">Email</th>
                            <th className="p-4 font-semibold text-white text-sm">Current Role</th>
                            <th className="p-4 font-semibold text-white text-sm text-right">Update Access</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500"><Loader2 className="animate-spin mx-auto text-emerald-500" /></td></tr>
                        ) : users.map(user => (
                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                <td className="p-4 text-gray-800 font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                                            {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        {user.full_name || 'No Name'}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600 text-sm">{user.email}</td>
                                <td className="p-4 text-sm w-48">
                                    {editingUserId === user.id ? (
                                        <select
                                            value={editingRole}
                                            onChange={e => setEditingRole(e.target.value)}
                                            className="border-2 border-indigo-400 rounded-md p-2 text-sm bg-indigo-50 outline-none w-full"
                                        >
                                            <option value="csr">CSR</option>
                                            <option value="admin">Admin</option>
                                            <option value="accounting">Accounting</option>
                                            <option value="superadmin">Super Admin</option>
                                        </select>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase tracking-wider border
                                                ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                    user.role === 'admin' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                        user.role === 'accounting' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                            'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                                                {user.role}
                                            </span>
                                            {user.role === 'superadmin' && <ShieldAlert size={14} className="text-purple-600" />}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    {editingUserId === user.id ? (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setEditingUserId(null)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition font-medium flex items-center gap-1">
                                                <X size={14} /> Cancel
                                            </button>
                                            <button onClick={() => handleUpdateRole(user.id, user.role)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition font-medium shadow-sm">
                                                <Save size={16} /> Save
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setEditingUserId(user.id); setEditingRole(user.role) }} className="flex items-center justify-end gap-1 ml-auto px-3 py-1.5 text-sm text-emerald-600 font-medium hover:bg-emerald-50 rounded-lg transition">
                                            <Edit2 size={16} /> Edit Role
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {!loading && users.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No users found in the system.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
