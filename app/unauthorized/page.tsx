'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
    const router = useRouter()

    return (
        <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-4 font-sans">
            <div className="text-center p-8 sm:p-10 bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                    <ShieldAlert size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">403 - Unauthorized</h1>
                <p className="text-gray-600 mb-8 font-medium text-sm sm:text-base leading-relaxed">
                    You do not have permission to access this protected route or portal dashboard.
                </p>
                
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                    >
                        <ArrowLeft size={16} />
                        Go Back to Previous Page
                    </button>

                    <div className="pt-4 border-t border-gray-100">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Or sign in to your portal</p>
                        <div className="grid grid-cols-1 gap-2">
                            <Link
                                href="/login"
                                className="block w-full py-2.5 px-4 rounded-lg bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-700 font-semibold text-xs sm:text-sm transition-all"
                            >
                                Innovative Insurance Login
                            </Link>
                            <Link
                                href="/lending/login"
                                className="block w-full py-2.5 px-4 rounded-lg bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 text-gray-700 hover:text-blue-700 font-semibold text-xs sm:text-sm transition-all"
                            >
                                Accurate Lending Login
                            </Link>
                            <Link
                                href="/mortgage/login"
                                className="block w-full py-2.5 px-4 rounded-lg bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 text-gray-700 hover:text-teal-700 font-semibold text-xs sm:text-sm transition-all"
                            >
                                Moonstar Mortgage Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
