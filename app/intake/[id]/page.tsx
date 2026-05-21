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
  MousePointer2,
  FileText,
  XCircle,
  Trash2,
  Eye
} from 'lucide-react'
import Loading, { Spinner } from '@/components/ui/Loading'
import { useToast } from '@/components/ui/Toast'

import { FormHeader, FormContainer, SectionCard, Button, ConfirmDialog, SuccessDialog } from '@/components/ui/IntakeUI'
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
  const [isDragging, setIsDragging] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; doc: any } | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const { showToast } = useToast()

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

      // Fetch existing documents
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('intake_form_id', intakeId)
      
      if (docs) {
        setUploadedFiles(docs)
      }

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
    
    showToast('Progress saved.', 'success')
  }

  /* ================= PROCESS FILES ================= */
  const processFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0 || !intakeId) return;
    setUploadingFiles(true);
    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formDataFile = new FormData();
      formDataFile.append('file', file);
      formDataFile.append('intakeFormId', intakeId);
      if (leadId) formDataFile.append('leadId', leadId);
      try {
        const res = await fetch('/api/upload-document', { method: 'POST', body: formDataFile });
        const data = await res.json();
        if (data.success) {
          setUploadedFiles(prev => [...prev, data.document]);
          successCount++;
        }
      } catch (err) { console.error(err); }
    }
    setUploadingFiles(false);
    if (successCount > 0) setUploadSuccess(true);
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

    // Removed frontend update to temp_leads_basics; notify-submission handles it.

    await fetch('/api/notify-submission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intakeId, formType })
    })

    setSubmitted(true)
  }

  /* ================= DELETE FILE HANDLER ================= */
  const handleDeleteFile = (doc: any) => {
    setDeleteConfirm({ isOpen: true, doc });
  }

  const confirmDelete = async () => {
    if (!deleteConfirm?.doc) return;
    const doc = deleteConfirm.doc;
    
    try {
      const res = await fetch('/api/delete-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          documentId: doc.id, 
          filePath: doc.file_path, 
          intakeFormId: intakeId 
        })
      });
      
      if (res.ok) {
        setUploadedFiles(prev => prev.filter(f => f.id !== doc.id));
        showToast('Document removed successfully', 'success');
      } else {
        showToast('Failed to delete document', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error deleting document', 'error');
    } finally {
      setDeleteConfirm(null);
    }
  }

  /* ================= UI STATES ================= */
  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-white pb-safe">
        <Loading message="Opening form..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-50 p-6 font-sans pb-safe">
        <div className="p-12 bg-white rounded-[32px] shadow-2xl shadow-black/5 max-w-md text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <XCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">{error}</h2>
          <p className="text-gray-500 font-medium tracking-tight leading-relaxed">The link you followed may be invalid or expired. Please contact support.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-gray-50 p-6 font-sans pb-safe">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-16 rounded-[48px] shadow-2xl shadow-black/5 text-center max-w-xl border border-gray-100"
        >
          <div className="w-24 h-24 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-inner">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4 leading-tight">Insurance team</h2>
          <p className="text-gray-500 text-lg mb-0 leading-relaxed font-medium"> Our insurance team has received your details and will process your quote within 24-48 hours.</p>
        </motion.div>
      </div>
    )
  }

  /* ================= LAYOUT MAPPING ================= */
  const formLayoutMap: Record<string, string> = {
    home: "home",
    condo: "home",
    landlord_home: "home",
    landlord_condo: "home",
    umbrella: "home",
    home_auto: "home_auto",

    auto: "auto",
    motorcycle: "auto"
  }
  
  const mappedLayout = formType ? (formLayoutMap[formType] || formType) : null;
  const isHomeLayout = mappedLayout === 'home' || mappedLayout === 'home_auto';
  const isAutoLayout = mappedLayout === 'auto' || mappedLayout === 'home_auto';

  /* ================= RENDER FORM ================= */
  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 font-sans selection:bg-red-100 selection:text-red-900 overflow-x-hidden pb-safe">
      <FormHeader 
        title="Insurance Application" 
        subtitle="Secure intake portal for Moonstar Mortgage"
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

          {isHomeLayout && (
            <HomeInsuranceForm
              data={formData.home}
              onChange={val => updateSection('home', val)}
              disabled={isPreview}
              formType={formType || 'home'}
            />
          )}

          {isAutoLayout && (
            <AutoInsuranceForm
              data={formData.auto}
              onChange={val => updateSection('auto', val)}
              disabled={isPreview}
              formType={formType || 'auto'}
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
                <label 
                  className="group relative block w-full"
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    processFiles(e.dataTransfer.files);
                  }}
                >
                  <input 
                    type="file" 
                    multiple 
                    className="hidden"
                    accept=".pdf,image/jpeg,image/png,.doc,.docx"
                    onChange={(e) => {
                      processFiles(e.target.files);
                      e.target.value = '';
                    }}
                    disabled={uploadingFiles}
                  />
                  <div className={`border-2 border-dashed rounded-[32px] p-16 transition-all cursor-pointer text-center ${isDragging ? 'bg-red-50 border-red-400' : 'border-gray-100 bg-gray-50/30 group-hover:bg-gray-50 group-hover:border-red-200'}`}>
                    <div className={`w-20 h-20 bg-white rounded-3xl shadow-lg border border-gray-100 flex items-center justify-center mx-auto mb-6 transition-transform ${isDragging ? 'scale-110 text-red-500' : 'text-gray-400 group-hover:scale-110 group-hover:text-red-500'}`}>
                      <UploadCloud size={36} />
                    </div>
                    <p className="text-gray-900 font-black text-2xl tracking-tight mb-2">Drop documents here</p>
                    <p className="text-gray-500 text-base font-bold tracking-tight">PDF, JPG, PNG up to 10MB per file</p>
                  </div>
                </label>
                
                {uploadingFiles && (
                  <div className="flex items-center gap-4 text-emerald-600 font-bold bg-emerald-50 p-6 rounded-2xl border border-emerald-100 ">
                    <Spinner size={24} />
                    Uploading your file ...
                  </div>
                )}
                
                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-1 gap-5">
                    {uploadedFiles.map((doc, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={idx} 
                        className="flex items-center justify-between gap-4 text-gray-700 bg-white px-6 py-5 rounded-2xl border border-black shadow-sm w-full"
                      >
                        <div className="flex items-center gap-4 flex-1 truncate">
                          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0">
                             <FileText size={20} />
                          </div>
                          <span className="truncate font-bold tracking-tight text-lg leading-tight">{doc.file_name}</span>
                        </div>
                        <div className="flex items-center ">
                           <a 
                             href={supabase.storage.from('documents').getPublicUrl(doc.file_path).data.publicUrl}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="p-2 hover:bg-emerald-50 text-emerald-500 rounded-xl transition-all"
                             title="View Document"
                           >
                             <Eye size={20} />
                           </a>
                           <button 
                             type="button"
                             onClick={(e) => {
                               e.preventDefault();
                               handleDeleteFile(doc);
                             }}
                             className="p-2 hover:bg-red-50 text-red-500 rounded-xl transition-all"
                             title="Delete Document"
                           >
                             <Trash2 size={20} />
                           </button>
                        </div>
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
                <span className="flex items-center gap-2 ">
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

      {/* CONFIRMATION MODAL */}
      <ConfirmDialog 
        isOpen={!!deleteConfirm?.isOpen}
        title="Remove Document?"
        message="Are you sure you want to remove this document? This action cannot be undone."
        confirmText="Remove"
        cancelText="Keep File"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />

      <SuccessDialog 
        isOpen={uploadSuccess}
        onClose={() => setUploadSuccess(false)}
        title="Document uploaded sucessfully"
        message="Safe and sound! Your documents are now securely tucked into our vault."
      />
    </div>
  )
}
