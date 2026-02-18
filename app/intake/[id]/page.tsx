'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

import HomeInsuranceForm from '@/components/forms/HomeInsuranceForm'
import AutoInsuranceForm from '@/components/forms/AutoInsuranceForm'
import PrimaryApplicantForm from '@/components/forms/PrimaryApplicantForm'
import CoApplicantForm from '@/components/forms/CoApplicantForm'

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
    <div className="max-w-4xl mx-auto p-10">
      <h1 className="text-2xl font-semibold mb-6">
        Insurance Intake Form
      </h1>

      {isPreview && (
        <div className="mb-6 p-3 bg-yellow-100 border rounded text-sm">
          🔍 Preview Mode — CSR only
        </div>
      )}

      {/* PDF ORDER – DO NOT CHANGE */}
      <PrimaryApplicantForm
        data={formData.primary_applicant}
        onChange={val => updateSection('primary_applicant', val)}
        disabled={isPreview}
      />

      <CoApplicantForm
        data={formData.co_applicant}
        onChange={val => updateSection('co_applicant', val)}
        disabled={isPreview}
      />

      {(formType === 'home' || formType === 'home_auto') && (
        <HomeInsuranceForm
          data={formData.home}
          onChange={val => updateSection('home', val)}
          disabled={isPreview}
        />
      )}

      {(formType === 'auto' || formType === 'home_auto') && (
        <AutoInsuranceForm
          data={formData.auto}
          onChange={val => updateSection('auto', val)}
          disabled={isPreview}
        />
      )}

      {!isPreview && (
        <div className="mt-8 space-y-3">
          <button
            onClick={handleSave}
            className="w-full bg-gray-600 text-white py-3 rounded"
          >
            Save & Continue Later
          </button>

          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 text-white py-3 rounded"
          >
            Submit Form
          </button>
        </div>
      )}
    </div>
  )
}
