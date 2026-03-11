import AuditLogsClient from './AuditLogsClient'

export default function AuditLogsPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">System Audit Logs</h1>
            <p className="text-gray-600 mb-8">View a chronological record of critical system actions performed by users.</p>
            <AuditLogsClient />
        </div>
    )
}
