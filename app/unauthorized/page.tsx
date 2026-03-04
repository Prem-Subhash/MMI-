import Link from 'next/link'

export default function UnauthorizedPage() {
    return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
                <h1 className="text-4xl font-bold text-red-600 mb-4">403 - Unauthorized</h1>
                <p className="text-gray-600 mb-6 font-medium">
                    You don't have permission to access the requested role dashboard.
                </p>
                <Link
                    href="/login"
                    className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition"
                >
                    Return to Login
                </Link>
            </div>
        </div>
    )
}
