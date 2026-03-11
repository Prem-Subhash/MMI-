'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

import HomeInsuranceForm from '@/components/forms/HomeInsuranceForm'
import AutoInsuranceForm from '@/components/forms/AutoInsuranceForm'
import PrimaryApplicantForm from '@/components/forms/PrimaryApplicantForm'
import CoApplicantForm from '@/components/forms/CoApplicantForm'
import Footer from '@/components/layout/Footer'

export default function IntakeFormPage() {
  /* ================= ROUTER PARAMS ================= */
  const params = useParams<{ id: string }>()
  const intakeId = params?.id

  const searchParams = useSearchParams()
  const isPreview = searchParams.get('preview') === 'true'

  /* ================= STATE ================= */
  const [formType, setFormType] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({
    primary_applicant: {},
    co_applicant: {},
    home: {},
    auto: {},
    vehicles: [],
    additional_applicants: []
  })
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* ================= LOAD INTAKE FORM ================= */
  useEffect(() => {
    if (!intakeId) {
      setError('Invalid intake link')
      setLoading(false)
      return
    }

    const loadIntake = async () => {
      const { data, error } = await supabase
        .from('temp_intake_forms')
        .select('*')
        .eq('id', intakeId)
        .maybeSingle()

      if (error || !data) {
        setError('Form not found')
        setLoading(false)
        return
      }

      if (!data.form_type) {
        setError('Form type not assigned')
        setLoading(false)
        return
      }

      setFormType(data.form_type)
      setFormData({
        primary_applicant: {},
        co_applicant: {},
        home: {},
        auto: {},
        vehicles: [],
        additional_applicants: [],
        ...(data.form_data || {})
      })

      setLoading(false)
    }

    loadIntake()
  }, [intakeId])

  /* ================= SECTION UPDATE HANDLER ================= */
  const updateSection = (section: string, value: any) => {
    if (isPreview) return
    setFormData((prev: any) => ({
      ...prev,
      [section]: value
    }))
  }

  /* ================= SAVE (PARTIAL) ================= */
  const handleSave = async () => {
    if (isPreview || !intakeId) return

    await supabase
      .from('temp_intake_forms')
      .update({
        form_data: formData,
        status: 'draft'
      })
      .eq('id', intakeId)

    alert('Progress saved. You can continue later.')
  }

  /* ================= SUBMIT (FINAL) ================= */
  const handleSubmit = async () => {
    if (isPreview || !intakeId) return

    setError(null)

    const { error } = await supabase
      .from('temp_intake_forms')
      .update({
        form_data: formData,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      })
      .eq('id', intakeId)

    if (error) {
      setError(error.message)
      return
    }

    // Notify backend
    await fetch('/api/notify-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeId, formType })
    })

    setSubmitted(true)
  }

  /* ================= UI STATES ================= */
  if (loading) return <div className="p-10">Loading...</div>

  if (error) {
    return <div className="p-10 text-red-600 font-medium">{error}</div>
  }

  if (submitted) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-2xl font-semibold">Thank you!</h2>
        <p className="mt-2">Your form has been submitted successfully.</p>
      </div>
    )
  }

  /* ================= RENDER FORM ================= */
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#e2e8f0] via-[#cbd5e1] to-[#94a3b8] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 md:py-16 flex-1 w-full">
        {/* CENTERED BRAND LOGO */}
        <div className="flex flex-col items-center mb-10 md:mb-16 text-center">
          <div className="relative w-full max-w-[200px] md:max-w-[280px] animate-in fade-in slide-in-from-top-4 duration-1000">
             <img 
               src="/innovative_logo_-removebg-preview.png"
               alt="Innovative Insurance Solutions" 
               className="w-full h-auto object-contain mx-auto"
             />
          </div>
        </div>

        {isPreview && (
          <div className="mb-12 p-6 bg-amber-50/50 border border-amber-200/50 rounded-[2rem] text-amber-950 text-sm flex items-center gap-5 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="bg-amber-100 p-3 rounded-full">
              <span className="text-2xl">🔍</span>
            </div>
            <div>
              <p className="font-extrabold text-lg tracking-tight uppercase">Admin Preview</p>
              <p className="text-amber-900/80 font-medium">This is exactly what the client will see.</p>
            </div>
          </div>
        )}

        {/* UNIFIED FORM CONTAINER - COLOR SYNCED */}
        <div className="space-y-12">
          {/* PDF ORDER – DO NOT CHANGE */}
          <div className="relative bg-white/90 backdrop-blur-2xl rounded-[1.5rem] md:rounded-[2.5rem] shadow-[0_40px_100px_rgba(15,23,42,0.15)] border border-white/60 overflow-hidden">
            {/* BRAND ACCENT BAR */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-rose-700 via-rose-600 to-slate-900 z-10" />
            
            <div className="divide-y divide-slate-100/80">
              <div className="form-section relative hover:bg-rose-50/10 transition-colors duration-500">
                <PrimaryApplicantForm
                  data={formData.primary_applicant}
                  onChange={val => updateSection('primary_applicant', val)}
                  disabled={isPreview}
                />
              </div>

              <div className="form-section relative hover:bg-rose-50/10 transition-colors duration-500">
                <CoApplicantForm
                  data={formData.co_applicant}
                  onChange={val => updateSection('co_applicant', val)}
                  disabled={isPreview}
                />
              </div>

              {(formType === 'home' || formType === 'home_auto') && (
                <div className="form-section relative hover:bg-rose-50/10 transition-colors duration-500">
                  <HomeInsuranceForm
                    data={formData.home}
                    onChange={val => updateSection('home', val)}
                    disabled={isPreview}
                  />
                </div>
              )}

              {(formType === 'auto' || formType === 'home_auto') && (
                <div className="form-section relative hover:bg-rose-50/10 transition-colors duration-500">
                  <AutoInsuranceForm
                    data={formData.auto}
                    onChange={val => updateSection('auto', val)}
                    disabled={isPreview}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {!isPreview && (
          <div className="mt-10 md:mt-16 flex flex-col sm:grid sm:grid-cols-2 gap-4 md:gap-8 pb-32">
            <button
              onClick={handleSave}
              className="group relative overflow-hidden bg-slate-100 border-2 border-transparent text-slate-900 py-4 md:py-5 px-6 md:px-10 rounded-[1.5rem] md:rounded-[2rem] font-black transition-all hover:bg-slate-200 active:scale-[0.98] shadow-sm tracking-tight order-2 sm:order-1"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                Save Progress
              </span>
            </button>

            <button
              onClick={handleSubmit}
              style={{ backgroundColor: '#CF1C45' }}
              className="group relative overflow-hidden text-white py-4 md:py-5 px-6 md:px-10 rounded-[1.5rem] md:rounded-[2rem] font-black transition-all hover:brightness-110 active:scale-[0.98] shadow-[0_15px_30px_rgba(207,28,69,0.3)] hover:shadow-[0_20px_40px_rgba(207,28,69,0.4)] tracking-tight order-1 sm:order-2"
            >
               <span className="relative z-10 flex items-center justify-center gap-3 text-xl md:text-2xl">
                Submit Form
                <svg className="transition-transform group-hover:translate-x-1" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </span>
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
