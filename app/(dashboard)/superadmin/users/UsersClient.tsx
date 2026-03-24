'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Loader2, Save, X } from 'lucide-react'

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
        <div className="space-y-8">
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3 animate-shake">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold shadow-sm text-sm
                        ${showCreate ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
                >
                    {showCreate ? <X size={18} /> : <Plus size={18} />}
                    {showCreate ? 'x' : 'Create New User'}
                </button>
            </div>

            {showCreate && (
                <form onSubmit={handleCreateUser} className="bg-white p-6 md:p-8 rounded-2xl border border-gray-200 shadow-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-end animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Full Name</label>
                        <input required type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} className="bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-sm transition-all" placeholder="John Doe" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Email</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-sm transition-all" placeholder="john@example.com" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Password</label>
                        <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-sm transition-all" placeholder="Min 6 chars" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-black uppercase tracking-widest ml-1">Role</label>
                        <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className="bg-gray-50 border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none text-sm transition-all">
                            <option value="csr">CSR</option>
                            <option value="admin">Admin</option>
                            <option value="accounting">Accounting</option>
                            <option value="superadmin">Super Admin</option>
                        </select>
                    </div>
                    <button type="submit" disabled={createLoading} className="bg-emerald-600 text-white p-3 rounded-xl hover:bg-emerald-700 transition-all flex justify-center items-center h-[50px] font-bold disabled:opacity-50 shadow-sm">
                        {createLoading ? <Loader2 size={20} className="animate-spin" /> : 'Create User'}
                    </button>
                </form>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] text-white uppercase text-xs tracking-wider">
                                <th className="p-4 font-bold text-white text-[10px] uppercase tracking-wider">Name</th>
                                <th className="p-4 font-bold text-white text-[10px] uppercase tracking-wider">Email</th>
                                <th className="p-4 font-bold text-white text-[10px] uppercase tracking-wider">Role</th>
                                <th className="p-4 font-bold text-white text-[10px] uppercase tracking-wider">Created At</th>
                                <th className="p-4 font-bold text-white text-[10px] uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400">
                                        <Loader2 className="animate-spin mx-auto text-emerald-500 mb-2" size={32} />
                                        <p className="text-sm font-bold">Synchronizing users...</p>
                                    </td>
                                </tr>
                            ) : users.map(user => (
                                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 text-gray-800 font-bold text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs ring-2 ring-indigo-50/50">
                                                {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            {user.full_name || 'No Name'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600 text-xs font-medium">{user.email}</td>
                                    <td className="p-4">
                                        {editingUserId === user.id ? (
                                            <select
                                                value={editingRole}
                                                onChange={e => setEditingRole(e.target.value)}
                                                className="bg-white border border-gray-200 rounded-xl p-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                            >
                                                <option value="csr">csr</option>
                                                <option value="admin">admin</option>
                                                <option value="accounting">accounting</option>
                                                <option value="superadmin">superadmin</option>
                                            </select>
                                        ) : (
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border
                                                ${user.role === 'superadmin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                    user.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        user.role === 'accounting' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                            'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                                {user.role}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-gray-400 text-[10px] font-mono">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-1">
                                            {editingUserId === user.id ? (
                                                <button onClick={() => handleUpdateRole(user.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Save Role">
                                                    <Save size={18} />
                                                </button>
                                            ) : (
                                                <button onClick={() => { setEditingUserId(user.id); setEditingRole(user.role) }} className="p-2 text-emerald-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Edit Role">
                                                    <Edit2 size={18} />
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(user.id)} className="p-2 text-red-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete User">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {!loading && users.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-gray-400 text-sm font-bold">No users found in the system.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
