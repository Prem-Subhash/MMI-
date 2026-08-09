'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { CreateUserModal } from '@/components/users/CreateUserModal'
import { useRouter } from 'next/navigation'

export function AdminCsrCreationHeader() {
    const [showCreate, setShowCreate] = useState(false)
    const router = useRouter()

    return (
        <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">CSR Management</h1>
                    <p className="text-gray-600 mt-1">View and manage all Customer Success Representatives in the system.</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className={`w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl transition-all font-bold shadow-sm text-sm border
                        ${showCreate ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600' : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'}`}
                >
                    {showCreate ? <X size={18} /> : <Plus size={18} />}
                    {showCreate ? 'Cancel' : 'Create CSR'}
                </button>
            </div>

            <CreateUserModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                fixedRole="csr"
                onSuccess={() => {
                    setShowCreate(false)
                    router.refresh()
                }}
            />
        </div>
    )
}
