'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, CheckCircle2, Building2, Mail, Clock, GitBranch } from 'lucide-react'

const SETTING_KEYS = {
    COMPANY_NAME: 'COMPANY_NAME',
    DEFAULT_EMAIL_SENDER: 'DEFAULT_EMAIL_SENDER',
    TIMEZONE: 'TIMEZONE',
    DEFAULT_PIPELINE: 'DEFAULT_PIPELINE',
}

const inputClass = `
    w-full border border-gray-200 bg-gray-50 px-4 py-3 rounded-xl text-sm text-gray-800
    focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:bg-white
    outline-none transition-all placeholder:text-gray-400
`

const fieldIcon = (icon: React.ReactNode) => (
    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
        {icon}
    </div>
)

export default function SystemSettingsClient() {
    const [settings, setSettings] = useState<any>({
        [SETTING_KEYS.COMPANY_NAME]: '',
        [SETTING_KEYS.DEFAULT_EMAIL_SENDER]: '',
        [SETTING_KEYS.TIMEZONE]: 'America/New_York',
        [SETTING_KEYS.DEFAULT_PIPELINE]: '',
    })

    const [pipelines, setPipelines] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const setRes = await fetch('/api/superadmin/system-settings')
            const setJ = await setRes.json()
            if (setJ.error) throw new Error(setJ.error)
            setSettings((prev: any) => ({ ...prev, ...(setJ.settings || {}) }))

            const pipeRes = await fetch('/api/superadmin/pipelines')
            const pipeJ = await pipeRes.json()
            if (pipeJ.pipelines) setPipelines(pipeJ.pipelines)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setSaving(true)
            setError(null)
            setSuccess(false)

            const res = await fetch('/api/superadmin/system-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })
            const j = await res.json()
            if (j.error) throw new Error(j.error)

            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
                <p className="text-sm font-medium">Loading settings...</p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSave} className="space-y-4">

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm font-medium">
                    {error}
                </div>
            )}

            {/* ── Section 1: Company Info ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Building2 size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-800">Company Identity</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Used in emails and client-facing communications</p>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Company Name</label>
                        <input
                            type="text"
                            required
                            value={settings[SETTING_KEYS.COMPANY_NAME] || ''}
                            onChange={(e) => setSettings({ ...settings, [SETTING_KEYS.COMPANY_NAME]: e.target.value })}
                            className={inputClass}
                            placeholder="e.g. Acme Insurance Group"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Default Email Sender</label>
                        <input
                            type="email"
                            required
                            value={settings[SETTING_KEYS.DEFAULT_EMAIL_SENDER] || ''}
                            onChange={(e) => setSettings({ ...settings, [SETTING_KEYS.DEFAULT_EMAIL_SENDER]: e.target.value })}
                            className={inputClass}
                            placeholder="e.g. no-reply@acme.com"
                        />
                    </div>
                </div>
            </div>

            {/* ── Section 2: System Defaults ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Clock size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-800">System Defaults</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Controls reporting, reminders, and lead routing</p>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">System Timezone</label>
                        <select
                            required
                            value={settings[SETTING_KEYS.TIMEZONE] || 'America/New_York'}
                            onChange={(e) => setSettings({ ...settings, [SETTING_KEYS.TIMEZONE]: e.target.value })}
                            className={inputClass}
                        >
                            <option value="America/New_York">Eastern Time (ET)</option>
                            <option value="America/Chicago">Central Time (CT)</option>
                            <option value="America/Denver">Mountain Time (MT)</option>
                            <option value="America/Los_Angeles">Pacific Time (PT)</option>
                            <option value="UTC">UTC</option>
                        </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Default Pipeline</label>
                        <select
                            required
                            value={settings[SETTING_KEYS.DEFAULT_PIPELINE] || ''}
                            onChange={(e) => setSettings({ ...settings, [SETTING_KEYS.DEFAULT_PIPELINE]: e.target.value })}
                            className={inputClass}
                        >
                            <option value="" disabled>Select a default pipeline...</option>
                            {pipelines.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* ── Save Bar ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-h-[24px]">
                    {success && (
                        <span className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                            <CheckCircle2 size={18} />
                            Settings saved successfully!
                        </span>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm shadow-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>

        </form>
    )
}
