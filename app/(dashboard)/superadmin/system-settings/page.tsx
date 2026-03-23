import SystemSettingsClient from './SystemSettingsClient'
import { Settings2 } from 'lucide-react'

export default function SystemSettingsPage() {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Settings2 size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">System Settings</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Manage global configuration for the application environment.</p>
                    </div>
                </div>

                <SystemSettingsClient />
            </div>
        </div>
    )
}
