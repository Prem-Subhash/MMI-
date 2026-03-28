import UsersClient from './UsersClient'

export default function UsersPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 tracking-tight">User Management</h1>
            <p className="text-gray-600 mb-8 max-w-2xl text-sm md:text-base">Create, modify, and delete users globally across the system.</p>
            <UsersClient />
        </div>
    )
}
