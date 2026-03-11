import UsersClient from './UsersClient'

export default function UsersPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">User Management</h1>
            <p className="text-gray-600 mb-8">Create, modify, and delete users globally across the system.</p>
            <UsersClient />
        </div>
    )
}
