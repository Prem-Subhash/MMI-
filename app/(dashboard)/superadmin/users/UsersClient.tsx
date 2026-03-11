'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Loader2, Save } from 'lucide-react'

type UserProfile = {
    id: string
    email: string
    full_name: string
    role: string
    created_at: string
}

export default function UsersClient() {
    const [users, setUsers] = useState<UserProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Create new user form state
    const [showCreate, setShowCreate] = useState(false)
    const [formData, setFormData] = useState({ email: '', full_name: '', password: '', role: 'csr' })
    const [createLoading, setCreateLoading] = useState(false)

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
        } finally {
            setLoading(false)
        }
    }

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setCreateLoading(true)
            setError(null)
            const res = await fetch('/api/superadmin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })
            const j = await res.json()
            if (j.error) throw new Error(j.error)

            setShowCreate(false)
            setFormData({ email: '', full_name: '', password: '', role: 'csr' })
            fetchUsers()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setCreateLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return

        try {
            setError(null)
            const res = await fetch(`/api/superadmin/users?id=${id}`, { method: 'DELETE' })
            const j = await res.json()
            if (j.error) throw new Error(j.error)
            fetchUsers()
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleUpdateRole = async (id: string) => {
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
            fetchUsers()
        } catch (err: any) {
            setError(err.message)
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
                    <Plus size={18} />
                    {showCreate ? 'Cancel Create' : 'Create New User'}
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <input required type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John Doe" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="john@example.com" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Min 6 chars" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-gray-700">Role</label>
                        <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                            <option value="csr">CSR</option>
                            <option value="admin">Admin</option>
                            <option value="accounting">Accounting</option>
                            <option value="superadmin">Super Admin</option>
                        </select>
                    </div>
                    <button type="submit" disabled={createLoading} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-700 transition flex justify-center items-center h-[42px] font-medium disabled:opacity-50">
                        {createLoading ? <Loader2 size={18} className="animate-spin" /> : 'Create User'}
                    </button>
                </form>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="p-4 font-semibold text-gray-600 text-sm">Name</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Email</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Role</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm">Created At</th>
                            <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500"><Loader2 className="animate-spin mx-auto text-indigo-500" /></td></tr>
                        ) : users.map(user => (
                            <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                                <td className="p-4 text-gray-800 font-medium">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                                            {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        {user.full_name || 'No Name'}
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600 text-sm">{user.email}</td>
                                <td className="p-4 text-sm">
                                    {editingUserId === user.id ? (
                                        <select
                                            value={editingRole}
                                            onChange={e => setEditingRole(e.target.value)}
                                            className="border rounded p-1 text-sm bg-white"
                                        >
                                            <option value="csr">csr</option>
                                            <option value="admin">admin</option>
                                            <option value="accounting">accounting</option>
                                            <option value="superadmin">superadmin</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wider
                                            ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                                                user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                                    user.role === 'accounting' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-emerald-100 text-emerald-700'}`}>
                                            {user.role}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-gray-500 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    {editingUserId === user.id ? (
                                        <button onClick={() => handleUpdateRole(user.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded" title="Save Role">
                                            <Save size={18} />
                                        </button>
                                    ) : (
                                        <button onClick={() => { setEditingUserId(user.id); setEditingRole(user.role) }} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition" title="Edit Role">
                                            <Edit2 size={18} />
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition" title="Delete User">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {!loading && users.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-500">No users found in the system.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
