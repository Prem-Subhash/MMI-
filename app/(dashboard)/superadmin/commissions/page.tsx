import CommissionsClient from './CommissionsClient'

export default function CommissionsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 tracking-tight">Commissions Management</h1>
            <p className="text-gray-600 mb-8 max-w-2xl text-sm md:text-base">Manage master commission percentages for Referrals and Insurance Companies.</p>
            <CommissionsClient />
        </div>
    )
}
