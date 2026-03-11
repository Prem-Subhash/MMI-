'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, CheckCircle2 } from 'lucide-react'

// Map of expected settings keys
const SETTING_KEYS = {
    COMPANY_NAME: 'COMPANY_NAME',
    DEFAULT_EMAIL_SENDER: 'DEFAULT_EMAIL_SENDER',
    TIMEZONE: 'TIMEZONE',
    DEFAULT_PIPELINE: 'DEFAULT_PIPELINE',
}

export default function SystemSettingsClient() {
    const [settings, setSettings] = useState<any>({
        [SETTING_KEYS.COMPANY_NAME]: '',
        [SETTING_KEYS.DEFAULT_EMAIL_SENDER]: '',
        [SETTING_KEYS.TIMEZONE]: 'America/New_York',
        [SETTING_KEYS.DEFAULT_PIPELINE]: '',
    })

    // We also fetch pipelines to populate the Default Pipeline dropdown
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

            // Fetch Settings
            const setRes = await fetch('/api/superadmin/system-settings')
            const setJ = await setRes.json()
            if (setJ.error) throw new Error(setJ.error)

            // Merge fetched settings with default skeleton
            setSettings((prev: any) => ({ ...prev, ...(setJ.settings || {}) }))

            // Fetch Pipelines
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
                body: JSON.stringify(settings)
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

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>

    return (
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-8">
            {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Company Name */}
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-gray-800">Company Name</label>
                    <p className="text-sm text-gray-500 mb-1">Displayed in global email templates and client communications.</p>
                    <input
                        type="text"
                        required
                        value={settings[SETTING_KEYS.COMPANY_NAME] || ''}
                        onChange={(e) => setSettings({ ...settings, [SETTING_KEYS.COMPANY_NAME]: e.target.value })}
                        className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. Acme Insurance Group"
                    />
                </div>

                {/* Default Email Sender */}
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-gray-800">Default Email Sender</label>
                    <p className="text-sm text-gray-500 mb-1">Standard "From" address for automated system emails.</p>
                    <input
                        type="email"
                        required
                        value={settings[SETTING_KEYS.DEFAULT_EMAIL_SENDER] || ''}
                        onChange={(e) => setSettings({ ...settings, [SETTING_KEYS.DEFAULT_EMAIL_SENDER]: e.target.value })}
                        className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="e.g. no-reply@acme.com"
                    />
                </div>

                {/* Timezone */}
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-gray-800">System Timezone</label>
                    <p className="text-sm text-gray-500 mb-1">Used for reporting and automated reminders boundaries.</p>
                    <select
                        required
                        value={settings[SETTING_KEYS.TIMEZONE] || 'America/New_York'}
                        onChange={(e) => setSettings({ ...settings, [SETTING_KEYS.TIMEZONE]: e.target.value })}
                        className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="UTC">UTC</option>
                    </select>
                </div>

                {/* Default Pipeline */}
                <div className="flex flex-col gap-2">
                    <label className="font-semibold text-gray-800">Default Pipeline</label>
                    <p className="text-sm text-gray-500 mb-1">Used when untagged leads enter the CRM via webhook.</p>
                    <select
                        required
                        value={settings[SETTING_KEYS.DEFAULT_PIPELINE] || ''}
                        onChange={(e) => setSettings({ ...settings, [SETTING_KEYS.DEFAULT_PIPELINE]: e.target.value })}
                        className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                        <option value="" disabled>Select a default pipeline...</option>
                        {pipelines.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                        ))}
                    </select>
                </div>
            </div>

            <hr className="border-gray-100" />

            <div className="flex items-center justify-between">
                <div>
                    {success && <span className="flex items-center gap-2 text-emerald-600 font-medium"><CheckCircle2 size={20} /> Settings saved successfully!</span>}
                </div>
                <button type="submit" disabled={saving} className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium shadow-sm disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    Save Settings
                </button>
            </div>
        </form>
    )
}
