import RolesClient from './RolesClient'

export default function RolesPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Role Management</h1>
            <p className="text-gray-600 mb-8">Quickly view and update system access roles for all users.</p>
            <RolesClient />
        </div>
    )
}
