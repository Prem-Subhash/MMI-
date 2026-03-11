import FormTemplatesClient from './FormTemplatesClient'

export default function FormTemplatesPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Form Templates</h1>
            <p className="text-gray-600 mb-8">Build and manage JSON schema forms for lead intake and processing.</p>
            <FormTemplatesClient />
        </div>
    )
}
