import PipelinesClient from './PipelinesClient'

export default function PipelinesPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Pipeline Management</h1>
            <p className="text-gray-600 mb-8">Manage system workflows, pipelines, and define custom stages.</p>
            <PipelinesClient />
        </div>
    )
}
