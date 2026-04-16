'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from '@/lib/toast'
import {
    User,
    Phone,
    Mail,
    Shield,
    Send,
    ChevronDown,
} from 'lucide-react'

export default function AdminNewLeadPage() {
    /* ---------------- STATE ---------------- */
    const [isLocked, setIsLocked] = useState(false)
    
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [existingClient, setExistingClient] = useState<{ id: string, client_name: string, source: string } | null>(null)

    const [form, setForm] = useState({
        client_name: '',
        phone: '',
        email: '',
        request_type: '',
        insurence_category: '', // keeping exact original typo
        policy_flow: '',
        policy_type: '',
        referral: '',
        notes: '',
        send_email_to_client: false,
    })

    /* ---------------- DUPLICATE CHECK (REAL-TIME) ---------------- */
    useEffect(() => {
        const checkDuplicates = async () => {
            if (form.phone.length < 10 && !form.email) {
                setExistingClient(null)
                return
            }
            try {
                let phoneData = null
                let emailData = null

                if (form.phone.length === 10) {
                    const { data } = await supabase
                        .from('clients')
                        .select('id, client_name, email')
                        .eq('phone', form.phone)
                        .maybeSingle()
                    phoneData = data
                }

                if (form.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                    const { data } = await supabase
                        .from('clients')
                        .select('id, client_name, phone')
                        .eq('email', form.email)
                        .maybeSingle()
                    emailData = data
                }

                // Conflict: Phone and Email found but they belong to different people
                if (phoneData && emailData && phoneData.id !== emailData.id) {
                    setError(`Data Mismatch: The phone number belongs to "${phoneData.client_name}" but the email belongs to "${emailData.client_name}".`)
                    setExistingClient(null)
                    return
                }

                // Clear error if it was a mismatch error
                if (error?.includes('Data Mismatch')) {
                    setError(null)
                }

                const match = phoneData || emailData
                if (match) {
                    const source = phoneData ? 'phone' : 'email'
                    setExistingClient({ ...match, source })

                    // Auto-fill
                    setForm(prev => ({
                        ...prev,
                        client_name: prev.client_name || match.client_name || '',
                        phone: prev.phone || (match as any).phone || prev.phone,
                        email: prev.email || (match as any).email || prev.email
                    }))
                } else {
                    setExistingClient(null)
                }
            } catch (e) {
                console.error('Duplicate check error:', e)
            }
        }

        const timer = setTimeout(checkDuplicates, 500)
        return () => clearTimeout(timer)
    }, [form.phone, form.email])

    /* ---------------- VALIDATION ---------------- */
    const isPhoneValid = /^\d{10}$/.test(form.phone)
    const isEmailValid =
        !form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)

    /* ---------------- INPUT HANDLER ---------------- */
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target

        if (name === 'phone') {
            const digitsOnly = value.replace(/\D/g, '').slice(0, 10)
            setForm(prev => ({ ...prev, phone: digitsOnly }))
            return
        }

        setForm(prev => ({ ...prev, [name]: value }))
    }

    /* ---------------- CLIENT HELPERS ---------------- */
    const getOrCreateClient = async () => {
        // 1. Check if phone is already in use
        const { data: phoneMatch } = await supabase
            .from('clients')
            .select('id, client_name, email')
            .eq('phone', form.phone)
            .maybeSingle()

        // 2. Check if email is already in use (if provided)
        let emailMatch = null
        if (form.email) {
            const { data } = await supabase
                .from('clients')
                .select('id, client_name, phone')
                .eq('email', form.email)
                .maybeSingle()
            emailMatch = data
        }

        // --- LOGIC ---

        // Conflict check: phone and email belong to different people
        if (phoneMatch && emailMatch && phoneMatch.id !== emailMatch.id) {
            throw new Error(`Duplicate Conflict: Phone belongs to "${phoneMatch.client_name}" but Email belongs to "${emailMatch.client_name}".`)
        }

        // Use existing if found by either (prioritizing phone)
        const existing = phoneMatch || emailMatch
        if (existing) {
            return existing.id
        }

        // If none found, create NEW
        const { data, error } = await supabase
            .from('clients')
            .insert({
                phone: form.phone,
                email: form.email,
                client_name: form.client_name
            })
            .select()
            .single()

        if (error) throw error
        return data.id
    }

    const checkDuplicateActiveLead = async (clientId: string) => {
        const { data } = await supabase
            .from('temp_leads_basics')
            .select(`
        id,
        current_stage:pipeline_stages(stage_name)
      `)
            .eq('client_id', clientId)
            .eq('policy_type', form.policy_type)
            .eq('policy_flow', form.policy_flow)
            .not('current_stage.stage_name', 'in', '("Completed","Did Not Bind")')

        return data && data.length > 0
    }

    /* ---------------- CREATE LEAD ---------------- */
    const handleCreateClient = async () => {
        setError(null)

        if (
            !form.client_name ||
            !form.phone ||
            !form.request_type ||
            !form.insurence_category ||
            !form.policy_type
        ) {
            setError('Please fill all mandatory fields')
            return
        }

        if (!isPhoneValid) {
            setError('Phone number must be exactly 10 digits')
            return
        }

        if (!isEmailValid) {
            setError('Please enter a valid email address')
            return
        }

        setLoading(true)
        setIsLocked(true)

        const { data: auth } = await supabase.auth.getUser()
        if (!auth?.user) {
            setError('User not authenticated')
            setLoading(false)
            setIsLocked(false)
            return
        }

        try {
            const clientId = await getOrCreateClient()
            const duplicate = await checkDuplicateActiveLead(clientId)

            if (duplicate) {
                setError('An active policy already exists for this client.')
                setLoading(false)
                setIsLocked(false)
                return
            }

            const { data: lead, error } = await supabase
                .from('temp_leads_basics')
                .insert({
                    ...form,
                    // DB expects boolean, default to false if undefined
                    send_email_to_client: form.send_email_to_client ?? false,
                    client_id: clientId,
                    assigned_csr: null, // MODIFIED FOR ADMIN Lead Creation
                    pipeline_id: form.insurence_category === 'commercial' 
                        ? '930d64f7-d10a-4305-9036-67892a6075d3' 
                        : 'f77d068d-1754-421b-b2ce-d527ec8bd0f3',
                })
                .select()
                .single()

            if (error || !lead) throw error



            /* ✅ SUCCESS UI */
            toast('Lead created successfully (Unassigned)!', 'success')
            setForm({
                client_name: '',
                phone: '',
                email: '',
                request_type: '',
                insurence_category: '', // Exact typo preserved
                policy_flow: '',
                policy_type: '',
                referral: '',
                notes: '',
                send_email_to_client: false,
            })

            setIsLocked(false)

            if (form.send_email_to_client) {
                toast('Redirecting to email templates...', 'info')
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong')
            setIsLocked(false)
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4 flex justify-center">


            <div className="w-full max-w-4xl bg-white rounded-3xl shadow-lg border overflow-hidden">

                <div className="bg-gradient-to-r from-gray-800 to-gray-600 p-8 text-white">
                    <h1 className="text-3xl font-bold">Add New Lead (Admin)</h1>
                    <p className="opacity-80 mt-1">Create a new lead to distribute. It will initially remain unassigned.</p>
                </div>

                <div className="p-8 space-y-6">

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 rounded animate-in fade-in slide-in-from-left-2">
                            <p className="font-semibold flex items-center gap-2">
                                ⚠️ Error
                            </p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {existingClient && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-800 rounded animate-in fade-in slide-in-from-left-2 shadow-sm">
                            <p className="font-semibold flex items-center gap-2">
                                <Shield className="w-5 h-5 text-red-600" />
                                Existing Client Identified
                            </p>
                            <p className="text-sm mt-1">
                                This client is already registered to <strong>"{existingClient.client_name}"</strong>.
                                Details have been auto-filled.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input icon={<User />} name="client_name" value={form.client_name} onChange={handleChange} placeholder="Client Name *" disabled={isLocked} />
                        <Input
                            icon={<Phone />}
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="Phone *"
                            disabled={isLocked}
                            inputMode="numeric"
                            maxLength={10}
                            error={form.phone.length > 0 && !isPhoneValid ? "Enter valid mobile number" : undefined}
                        />

                        <Input
                            icon={<Mail />}
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Email"
                            disabled={isLocked}
                            error={form.email.length > 0 && !isEmailValid ? "Enter valid mail" : undefined}
                        />
                        <Select name="request_type" value={form.request_type} onChange={handleChange} placeholder="Request Type *"
                            options={[
                                { value: 'new_lead', label: 'New Lead' },
                                { value: 'endorsement', label: 'Endorsement' },
                                { value: 'cancellation', label: 'Cancellation' },
                                { value: 'carrier_request', label: 'Carrier Request' },
                            ]}
                        />
                        <Select name="insurence_category" value={form.insurence_category} onChange={handleChange} placeholder="Insurance Category *"
                            options={[
                                { value: 'personal', label: 'Personal' },
                                { value: 'commercial', label: 'Commercial' },
                            ]}
                        />
                        <Select name="policy_flow" value={form.policy_flow} onChange={handleChange} placeholder="Policy Flow"
                            options={[
                                { value: 'new', label: 'New' },
                                { value: 'renewal', label: 'Renewal' },
                            ]}
                        />
                    </div>

                    <Select name="policy_type" value={form.policy_type} onChange={handleChange} placeholder="Policy Coverage *"
                        options={
                            form.insurence_category === 'commercial' // Must match the state strictly!
                                ? [
                                    { value: 'workers_comp', label: 'Workers Comp' },
                                    { value: 'bop', label: 'Business Owners Policy (BOP)' },
                                    { value: 'commercial_auto', label: 'Commercial Auto' },
                                    { value: 'commercial_package', label: 'Commercial Package' },
                                    { value: 'umbrella', label: 'Umbrella (Excess Liability)' },
                                    { value: 'general_liability', label: 'General Liability' },
                                    { value: 'flood', label: 'Flood' },
                                    { value: 'builders_risk', label: 'Builders Risk' },
                                    { value: 'lessor_risk', label: 'Lessor Risk' },
                                    { value: 'surety_bond', label: 'Surety Bond' },
                                    { value: 'inland_marine', label: 'Inland Marine' },
                                    { value: 'employment_practices_liability', label: 'Employment Practices Liability' },
                                    { value: 'cyber_liability', label: 'Cyber Liability' },
                                    { value: 'professional_liability', label: 'Errors & Omissions / Professional Liability' },
                                    { value: 'liquor_liability', label: 'Liquor Liability' },
                                    { value: 'crime_fidelity_bond', label: 'Crime Fidelity Bond' },
                                    { value: 'commercial_property', label: 'Commercial Property' },
                                    { value: 'other', label: 'Other' }
                                ]
                                : [
                                    { value: 'home', label: 'Home' },
                                    { value: 'auto', label: 'Auto' },
                                    { value: 'home_auto', label: 'Home + Auto' },
                                    { value: 'condo', label: 'Condo' },
                                    { value: 'landlord', label: 'Landlord Home/Condo' },
                                    { value: 'motorcycle', label: 'Motorcycle' },
                                    { value: 'umbrella', label: 'Umbrella' }
                                ]
                        }
                    />

                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-xl border">
                        <input
                            type="checkbox"
                            id="send_email"
                            className="w-5 h-5 text-gray-800 rounded focus:ring-gray-800"
                            checked={form.send_email_to_client}
                            onChange={(e) => setForm(prev => ({ ...prev, send_email_to_client: e.target.checked }))}
                        />
                        <label htmlFor="send_email" className="text-gray-700 font-medium cursor-pointer select-none">
                            Send an email to the client requesting documents?
                        </label>
                    </div>

                    <Input icon={<User />} name="referral" value={form.referral} onChange={handleChange} placeholder="Referral (Optional)" />

                    <textarea
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        placeholder="Additional Notes..."
                        className="w-full border rounded-xl p-4"
                    />

                    <button
                        onClick={handleCreateClient}
                        disabled={loading}
                        className="w-full py-4 bg-gray-800 hover:bg-gray-900 transition-colors text-white rounded-xl font-bold flex justify-center gap-2"
                    >
                        {loading ? 'Creating...' : 'Create Lead'}
                        {!loading && <Send />}
                    </button>

                </div>
            </div>
        </div>
    )
}

/* ---------------- UI HELPERS ---------------- */

const Input = ({
    icon,
    error,
    ...props
}: {
    icon: React.ReactNode
    error?: string | boolean
} & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="flex flex-col gap-1 w-full">
        <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                {icon}
            </div>
            <input
                {...props}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border transition outline-none
          ${error
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-2 focus:ring-gray-200'
                    }`}
            />
        </div>
        {typeof error === 'string' && error && (
            <span className="text-red-500 text-[11px] font-medium ml-1 animate-in fade-in slide-in-from-top-1">
                {error}
            </span>
        )}
    </div>
)


const Select = ({ options, placeholder, ...props }: any) => (
    <div className="relative">
        <select {...props} className="w-full px-4 py-3 border rounded-xl appearance-none bg-white">
            <option value="">{placeholder}</option>
            {options.map((o: any) => (
                <option key={o.value} value={o.value}>{o.label}</option>
            ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
    </div>
)
