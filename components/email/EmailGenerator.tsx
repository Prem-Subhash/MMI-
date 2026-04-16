'use client'

import React, { useState, useEffect } from 'react'
import { EmailData, PolicyBreakdown, replaceTemplate } from '@/lib/emailTemplating'
import { Plus, Trash2 } from 'lucide-react'

type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
}

interface EmailGeneratorProps {
  templates: EmailTemplate[]
  templateId: string
  setTemplateId: (id: string) => void
  initialClientName: string
  setCustomSubject: (val: string) => void
  
  generatedBody: string
  setGeneratedBody: (val: string) => void
  notes: string
  setNotes: (val: string) => void
  customSubject: string
  formType: string
}

export default function EmailGenerator({
  templates,
  templateId,
  setTemplateId,
  initialClientName,
  setCustomSubject,
  generatedBody,
  setGeneratedBody,
  notes,
  setNotes,
  customSubject,
  formType
}: EmailGeneratorProps) {
  const [data, setData] = useState<EmailData>({
    clientName: initialClientName || '',
    singleCarrier: '',
    defCurrentCarrier: '',
    defNewCarrier: '',
    effDate: '',
    payType: 'bank account',
    last4: '',
    manualYear: new Date().getFullYear().toString(),
    policies: []
  })

  // Rule 4: Dependency check (templateId, data)
  useEffect(() => {
    // Reset policies when switching between HOME and AUTO
    setData(prev => ({ ...prev, policies: [] }));
  }, [formType])

  // Normalize template name to logic key
  const getTemplateKey = (t: EmailTemplate) => t.name.toLowerCase().replace(/\s+/g, '_')

  // Rule 4: Dependency check (templateId, data)
  useEffect(() => {
    if (!templateId) {
      setCustomSubject('')
      setGeneratedBody('')
      return
    }

    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    const key = getTemplateKey(template)

    const newSubject = replaceTemplate(key, template.subject, data)
    const newBody = replaceTemplate(key, template.body, data)

    setCustomSubject(newSubject)
    setGeneratedBody(newBody)
  }, [templateId, data, templates, setCustomSubject, setGeneratedBody])

  const addPolicy = () => {
    setData((prev) => ({
      ...prev,
      // Rule 2: Force type based on formType
      policies: [
        ...prev.policies,
        { 
          id: Math.random().toString(), 
          type: formType === 'auto' ? 'auto' : 'Home', 
          cName: prev.defCurrentCarrier, 
          nName: prev.defNewCarrier, 
          term: '12 months', 
          a1: '', 
          a2: '',
          driver: '',
          vehicle: '',
          vin: '',
          oldPremium: '',
          newPremium: ''
        }
      ]
    }))
  }

  const removePolicy = (id: string) => {
    setData((prev) => ({
      ...prev,
      policies: prev.policies.filter((p) => (p as any).id !== id)
    }))
  }

  const updatePolicy = (id: string, field: keyof PolicyBreakdown, value: string) => {
    setData((prev) => ({
      ...prev,
      policies: prev.policies.map((p) => {
        if ((p as any).id === id) {
             return { ...p, [field]: value, type: 'Home' }
        }
        return p
      })
    }))
  }

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setData((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'defCurrentCarrier') {
        next.policies = next.policies.map(p => p.cName === prev.defCurrentCarrier ? { ...p, cName: value } : p)
      }
      if (name === 'defNewCarrier') {
        next.policies = next.policies.map(p => p.nName === prev.defNewCarrier ? { ...p, nName: value } : p)
      }
      return next
    })
  }

  const activeTpl = templates.find(t => t.id === templateId)
  const tplKey = activeTpl ? getTemplateKey(activeTpl) : ''
  const isMulti = ['renewal_switch', 'new_lead', 'payment_reminder'].includes(tplKey)
  
  return (
    <div className="space-y-8 mt-6">
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-6">
        <h3 className="text-gray-800 font-bold text-lg mb-4">Email Configuration</h3>

        {!templateId && (
          <div className="bg-blue-50 border border-blue-100 text-blue-700 p-4 rounded-xl text-sm flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <p><strong>Generator is offline.</strong> Please select an Email Template from the dropdown above to load the dynamic email interface.</p>
          </div>
        )}

        {/* GENERAL DETAILS */}
        {templateId && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Client Name</label>
              <input name="clientName" value={data.clientName} onChange={handleGeneralChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white text-sm" placeholder="Client Name" />
            </div>
            
            {['new_lead', 'renewal_same', 'renewal_switch', 'congrats_new', 'congrats_existing', 'follow_up'].includes(tplKey) && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Policy Year</label>
                <input name="manualYear" value={data.manualYear} onChange={handleGeneralChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white text-sm font-mono" placeholder="Year" />
              </div>
            )}

            {['renewal_same', 'congrats_new', 'congrats_existing', 'auto_payment'].includes(tplKey) && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Carrier Name</label>
                <input name="singleCarrier" value={data.singleCarrier} onChange={handleGeneralChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white text-sm" placeholder="Carrier Name" />
              </div>
            )}

            {isMulti && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">{['new_lead', 'payment_reminder'].includes(tplKey) ? 'Default Carrier' : 'Default Current Carrier'}</label>
                  <input name="defCurrentCarrier" value={data.defCurrentCarrier} onChange={handleGeneralChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white text-sm" placeholder="Carrier" />
                </div>
                {tplKey === 'renewal_switch' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Default New Carrier</label>
                    <input name="defNewCarrier" value={data.defNewCarrier} onChange={handleGeneralChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white text-sm" placeholder="New Carrier" />
                  </div>
                )}
              </>
            )}

            {['new_lead', 'congrats_new', 'congrats_existing', 'follow_up'].includes(tplKey) && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Effective Date</label>
                <input name="effDate" value={data.effDate} onChange={handleGeneralChange} className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white text-sm" placeholder="MM/DD/YYYY" />
              </div>
            )}

            {tplKey === 'auto_payment' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Payment Type</label>
                  <select name="payType" value={data.payType} onChange={handleGeneralChange} className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white text-sm">
                      <option value="bank account">Bank Account</option>
                      <option value="card">Card</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Last 4 Digits</label>
                  <input name="last4" value={data.last4} onChange={handleGeneralChange} maxLength={4} className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus:bg-white text-sm font-mono" placeholder="Last 4" />
                </div>
              </>
            )}
          </div>
        )}

        {/* POLICY BREAKDOWN */}
        {templateId && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-gray-700 font-bold text-sm">Policy Breakdown</h4>
              <button onClick={addPolicy} className="flex items-center gap-1 text-[11px] font-bold text-[#10B889] bg-[#10B889]/10 px-3 py-1.5 rounded-full hover:bg-[#10B889]/20 transition-colors">
                <Plus size={14} /> Add Policy
              </button>
            </div>

            <div className="space-y-3">
              {data.policies.map((p) => {
                const pId = (p as any).id
                return (
                <div key={pId} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                      <div className="px-2 py-1.5 bg-white border border-gray-200 rounded-md text-sm font-bold text-gray-400 select-none">
                        {formType === 'auto' ? 'Auto Insurance (Forced)' : 'Home Insurance (Forced)'}
                      </div>
                      <button onClick={() => removePolicy(pId)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>

                  {formType === 'auto' && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input type="text" value={p.driver || ''} onChange={(e) => updatePolicy(pId, 'driver', e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" placeholder="Driver Name" />
                      <input type="text" value={p.vehicle || ''} onChange={(e) => updatePolicy(pId, 'vehicle', e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" placeholder="Vehicle" />
                      <input type="text" value={p.vin || ''} onChange={(e) => updatePolicy(pId, 'vin', e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" placeholder="VIN (Optional)" />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                      <input type="text" value={p.cName} onChange={(e) => updatePolicy(pId, 'cName', e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" placeholder={['new_lead', 'payment_reminder'].includes(tplKey) ? 'Carrier' : 'Current Carrier'} />
                      {tplKey === 'renewal_switch' && (
                          <input type="text" value={p.nName} onChange={(e) => updatePolicy(pId, 'nName', e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" placeholder="New Carrier" />
                      )}
                  </div>

                  {!['follow_up', 'auto_payment', 'info_req'].includes(tplKey) && (
                    <div className="flex gap-2">
                        {formType === 'auto' ? (
                          <>
                            <input type="number" value={p.oldPremium || p.a1} onChange={(e) => updatePolicy(pId, 'oldPremium', e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" placeholder="Old Premium" />
                            <input type="number" value={p.newPremium || p.a2} onChange={(e) => updatePolicy(pId, 'newPremium', e.target.value)} className="w-full border-blue-200 rounded-md px-2 py-1.5 text-sm focus:border-blue-400" placeholder="New Premium" />
                          </>
                        ) : (
                          <>
                            <input type="number" value={p.a1} onChange={(e) => updatePolicy(pId, 'a1', e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm" placeholder="Premium" />
                            {tplKey === 'renewal_switch' && (
                                <input type="number" value={p.a2} onChange={(e) => updatePolicy(pId, 'a2', e.target.value)} className="w-full border-blue-200 rounded-md px-2 py-1.5 text-sm focus:border-blue-400" placeholder="New Premium" />
                            )}
                          </>
                        )}
                        {tplKey === 'new_lead' && (
                            <select value={p.term} onChange={(e) => updatePolicy(pId, 'term', e.target.value)} className="w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm">
                                <option value="12 months">12 Months</option>
                                <option value="6 months">6 Months</option>
                            </select>
                        )}
                    </div>
                  )}
                </div>
              )})}
            </div>
          </div>
        )}

        {/* LIVE PREVIEW & MANUAL OVERRIDES */}
        {templateId && (
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <div className="bg-[#2E5C85]/5 p-4 rounded-xl border border-[#2E5C85]/20">
              <h4 className="text-[#2E5C85] font-bold text-sm mb-3">Email Builder</h4>
              <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Subject</label>
                  <input type="text" value={customSubject} onChange={(e) => setCustomSubject(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#10B889] text-sm font-medium" />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Preview (System Generated - Read Only)</label>
                  <div 
                    dangerouslySetInnerHTML={{ __html: generatedBody }} 
                    className="w-full border border-gray-100 rounded-lg p-5 bg-gray-50/50 text-sm text-gray-500 cursor-not-allowed select-none" 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-[#10B889] uppercase tracking-widest ml-1">Additional Notes (Editable)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add your custom message here..."
                    className="w-full border border-green-200 rounded-lg p-5 bg-white text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#10B889] min-h-[150px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
