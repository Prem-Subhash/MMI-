import EmailTemplatesClient from './EmailTemplatesClient'

export default function EmailTemplatesPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Email Templates</h1>
            <p className="text-gray-600 mb-8">Create and manage automated email templates used across the CRM.</p>
            <EmailTemplatesClient />
        </div>
    )
}
