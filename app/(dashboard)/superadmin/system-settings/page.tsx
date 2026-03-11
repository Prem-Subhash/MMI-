import SystemSettingsClient from './SystemSettingsClient'

export default function SystemSettingsPage() {
    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">System Settings</h1>
            <p className="text-gray-600 mb-8">Manage global configuration for the application environment.</p>
            <SystemSettingsClient />
        </div>
    )
}
