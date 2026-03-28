'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { motion } from 'framer-motion'
import { 
  Save, 
  UploadCloud, 
  ChevronRight, 
  CheckCircle2, 
  Loader2, 
  MousePointer2,
  FileText
} from 'lucide-react'

import { FormHeader, FormContainer, SectionCard, Button } from '@/components/ui/IntakeUI'
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
  const [leadId, setLeadId] = useState<string | null>(null)
  const [formData, setFormData] = useState<any>({
    primary_applicant: {},
    co_applicant: {},
    home: {},
    auto: {},
  })
  const [loading, setLoading] = useState(true)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])

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

      setFormType(data.form_type)
      setLeadId(data.lead_id)
      setFormData({
        primary_applicant: {},
        co_applicant: {},
        home: {},
        auto: {},
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

    alert('Progress saved.')
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

    if (leadId) {
      await supabase
        .from('temp_leads_basics')
        .update({
          form_submitted_at: new Date().toISOString(),
          follow_up_date: null
        })
        .eq('id', leadId)
    }

    await fetch('/api/notify-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeId, formType })
    })

    setSubmitted(true)
  }

  /* ================= UI STATES ================= */
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
        <p className="mt-4 text-gray-500 font-medium tracking-tight">Syncing application...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans">
        <div className="p-12 bg-white rounded-[32px] shadow-2xl shadow-black/5 max-w-md text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">{error}</h2>
          <p className="text-gray-500 font-medium tracking-tight leading-relaxed">The link you followed may be invalid or expired. Please contact support.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-16 rounded-[48px] shadow-2xl shadow-black/5 text-center max-w-xl border border-gray-100"
        >
          <div className="w-24 h-24 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4 leading-tight">Submission Received</h2>
          <p className="text-gray-500 text-lg mb-0 leading-relaxed font-medium">Thank you for your trust. Our underwriting team has received your details and will process your quote within 24 hours.</p>
        </motion.div>
      </div>
    )
  }

  /* ================= RENDER FORM ================= */
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans selection:bg-red-100 selection:text-red-900 overflow-x-hidden">
      <FormHeader 
        title="Insurance Application" 
        subtitle="Secure intake portal for Innovative Insurance Solutions"
        logoSrc="/innovative_logo_-removebg-preview.png"
      />

      <FormContainer>
        <div className="space-y-4">
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

          {/* DOCUMENT SECTION */}
          {!isPreview && (
            <SectionCard
              icon={<UploadCloud size={32} strokeWidth={2.5} />}
              title="Identity & Proof"
              subtitle="Securely upload required documentation"
              isLast={true}
            >
              <div className="space-y-8">
                <label className="group relative block w-full">
                  <input 
                    type="file" 
                    multiple 
                    className="hidden"
                    accept=".pdf,image/jpeg,image/png,.doc,.docx"
                    onChange={async (e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0 || !intakeId) return;
                      setUploadingFiles(true);
                      for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        const formDataFile = new FormData();
                        formDataFile.append('file', file);
                        formDataFile.append('intakeFormId', intakeId);
                        if (leadId) formDataFile.append('leadId', leadId);
                        try {
                          const res = await fetch('/api/upload-document', { method: 'POST', body: formDataFile });
                          const data = await res.json();
                          if (data.success) setUploadedFiles(prev => [...prev, data.document]);
                        } catch (err) { console.error(err); }
                      }
                      setUploadingFiles(false);
                      e.target.value = '';
                    }}
                    disabled={uploadingFiles}
                  />
                  <div className="border-2 border-dashed border-gray-100 rounded-[32px] p-16 transition-all group-hover:bg-gray-50 group-hover:border-red-200 cursor-pointer text-center bg-gray-50/30">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-lg border border-gray-100 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform text-gray-400 group-hover:text-red-500">
                      <UploadCloud size={36} />
                    </div>
                    <p className="text-gray-900 font-black text-2xl tracking-tight mb-2">Drop documents here</p>
                    <p className="text-gray-500 text-base font-bold tracking-tight">PDF, JPG, PNG up to 10MB per file</p>
                  </div>
                </label>
                
                {uploadingFiles && (
                  <div className="flex items-center gap-4 text-red-600 font-bold bg-red-50 p-6 rounded-2xl border border-red-100 animate-pulse">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Encrypting and moving to secure storage...
                  </div>
                )}
                
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {uploadedFiles.map((doc, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={idx} 
                        className="flex items-center justify-between gap-4 text-gray-700 bg-white px-6 py-5 rounded-2xl border border-gray-100 shadow-sm"
                      >
                        <div className="flex items-center gap-4 truncate">
                          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                             <FileText size={20} />
                          </div>
                          <span className="truncate font-bold tracking-tight text-lg">{doc.file_name}</span>
                        </div>
                        <CheckCircle2 size={24} className="text-emerald-500" strokeWidth={3} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* ACTION FOOTER */}
          {!isPreview && (
            <div className="mt-20 pt-16 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-8">
              <Button
                variant="secondary"
                onClick={handleSave}
                className="w-full sm:w-auto"
              >
                <span className="flex items-center gap-2">
                   <Save size={24} />
                   Save as Draft
                </span>
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={handleSubmit}
                className="w-full sm:flex-1"
              >
                <span className="flex items-center gap-3">
                  Confirm Application
                  <ChevronRight size={32} />
                </span>
              </Button>
            </div>
          )}
        </div>
      </FormContainer>

      {isPreview && (
        <div className="fixed bottom-10 right-10 z-50 p-6 bg-white border border-gray-100 rounded-[32px] shadow-[0_24px_64px_rgba(0,0,0,0.12)] flex items-center gap-5 max-w-sm animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="bg-red-50 p-4 rounded-2xl text-red-600">
             <MousePointer2 size={28} />
          </div>
          <div>
            <p className="font-extrabold text-gray-900 text-xl tracking-tight">Interactive Preview</p>
            <p className="text-gray-500 font-bold tracking-tight text-sm">You are viewing the client experience. Interaction is enabled but submission is halted.</p>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}
