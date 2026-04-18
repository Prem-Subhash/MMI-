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
  leadData?: any
  composeMode?: 'template' | 'manual'
  customBody?: string
  setCustomBody?: (val: string) => void
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
  formType,
  leadData,
  composeMode = 'template',
  customBody,
  setCustomBody
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
    if (composeMode === 'manual') return;

    if (!templateId) {
      setCustomSubject('')
      setGeneratedBody('')
      return
    }

    const template = templates.find((t) => t.id === templateId)
    if (!template) return

    const key = getTemplateKey(template)

    const newSubject = replaceTemplate(key, template.subject, data, leadData)
    const newBody = replaceTemplate(key, template.body, data, leadData)

    setCustomSubject(newSubject)
    setGeneratedBody(newBody)
  }, [templateId, data, templates, setCustomSubject, setGeneratedBody, leadData])

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
    <div className="space-y-4 mt-6">

      {/* ── EMAIL CONFIGURATION CARD (Hide in Manual Mode) ── */}
      {composeMode === 'template' && (
        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

        {/* Card Header */}
        <div className="bg-gradient-to-r from-[#10B889] to-[#2E5C85] px-6 py-5 md:px-8 md:py-6 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E5C85" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <span className="text-base md:text-lg font-bold text-white tracking-tight">Email Configuration</span>
        </div>

        <div className="p-5 bg-white space-y-5">
          {/* READ-ONLY CLIENT DISPLAY */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl">
             <div className="w-2 h-2 rounded-full bg-[#10B889]"></div>
             <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Client:</span>
             <span className="text-sm font-semibold text-slate-800">{leadData?.client_name || initialClientName || 'Target Client'}</span>
          </div>

          {!templateId && (
            <div className="bg-amber-50 border border-amber-100 text-amber-700 p-3.5 rounded-xl text-sm flex items-start gap-3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <p className="text-sm"><strong>Select a template</strong> above to load the email configuration fields.</p>
            </div>
          )}

          {/* GENERAL FIELDS */}
          {templateId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-black uppercase tracking-widest">Client Name</label>
                <input name="clientName" value={data.clientName} onChange={handleGeneralChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none focus:ring-2 focus:ring-[#10B889]/10 text-sm text-gray-900 transition-all"
                  placeholder="Client Name" />
              </div>

              {['new_lead', 'renewal_same', 'renewal_switch', 'congrats_new', 'congrats_existing', 'follow_up'].includes(tplKey) && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-black uppercase tracking-widest">Policy Year</label>
                  <input name="manualYear" value={data.manualYear} onChange={handleGeneralChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none focus:ring-2 focus:ring-[#10B889]/10 text-sm text-gray-900 font-mono transition-all"
                    placeholder="Year" />
                </div>
              )}

              {['renewal_same', 'congrats_new', 'congrats_existing', 'auto_payment'].includes(tplKey) && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-black uppercase tracking-widest">Carrier Name</label>
                  <input name="singleCarrier" value={data.singleCarrier} onChange={handleGeneralChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none focus:ring-2 focus:ring-[#10B889]/10 text-sm text-gray-900 transition-all"
                    placeholder="Carrier Name" />
                </div>
              )}

              {isMulti && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-black uppercase tracking-widest">
                      {['new_lead', 'payment_reminder'].includes(tplKey) ? 'Default Carrier' : 'Default Current Carrier'}
                    </label>
                    <input name="defCurrentCarrier" value={data.defCurrentCarrier} onChange={handleGeneralChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none focus:ring-2 focus:ring-[#10B889]/10 text-sm text-gray-900 transition-all"
                      placeholder="Carrier" />
                  </div>
                  {tplKey === 'renewal_switch' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-black uppercase tracking-widest">Default New Carrier</label>
                      <input name="defNewCarrier" value={data.defNewCarrier} onChange={handleGeneralChange}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none focus:ring-2 focus:ring-[#10B889]/10 text-sm text-gray-900 transition-all"
                        placeholder="New Carrier" />
                    </div>
                  )}
                </>
              )}

              {['new_lead', 'congrats_new', 'congrats_existing', 'follow_up'].includes(tplKey) && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-black uppercase tracking-widest">Effective Date</label>
                  <input name="effDate" value={data.effDate} onChange={handleGeneralChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none focus:ring-2 focus:ring-[#10B889]/10 text-sm text-gray-900 transition-all"
                    placeholder="MM/DD/YYYY" />
                </div>
              )}

              {tplKey === 'auto_payment' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-black uppercase tracking-widest">Payment Type</label>
                    <select name="payType" value={data.payType} onChange={handleGeneralChange}
                      className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none text-sm text-gray-900 transition-all">
                      <option value="bank account">Bank Account</option>
                      <option value="card">Card</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-black uppercase tracking-widest">Last 4 Digits</label>
                    <input name="last4" value={data.last4} onChange={handleGeneralChange} maxLength={4}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none focus:ring-2 focus:ring-[#10B889]/10 text-sm text-gray-900 font-mono transition-all"
                      placeholder="Last 4" />
                  </div>
                </>
              )}
            </div>
          )}

          {/* POLICY BREAKDOWN */}
          {templateId && (
            <div className="pt-1">
              <div className="flex items-center justify-between mb-3 bg-[#10B889]/6 border border-[#10B889]/15 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-[#10B889] rounded-full" />
                  <span className="text-sm font-bold text-black">Policy Breakdown</span>
                </div>
                <button onClick={addPolicy}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#10B889] bg-white border border-[#10B889]/25 px-3 py-1.5 rounded-lg shadow-sm hover:bg-[#10B889]/80 hover:text-white">
                  <Plus size={13} /> Add Policy
                </button>
              </div>

              <div className="space-y-3">
                {data.policies.map((p) => {
                  const pId = (p as any).id
                  return (
                    <div key={pId} className="rounded-xl border border-gray-200 overflow-hidden">
                      {/* Policy card header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#10B889] to-[#2E5C85] md:px-8 md:py-6">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                          </svg>
                          {formType === 'auto' ? 'Auto Insurance' : 'Home Insurance'}
                        </span>
                        <button onClick={() => removePolicy(pId)} className="text-rose-500 p-0.5 rounded bg-white">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Policy card fields */}
                      <div className="p-3 space-y-2">
                        {formType === 'auto' && (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input type="text" value={p.driver || ''} onChange={(e) => updatePolicy(pId, 'driver', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none text-gray-900 transition-all" placeholder="Driver Name" />
                            <input type="text" value={p.vehicle || ''} onChange={(e) => updatePolicy(pId, 'vehicle', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none text-gray-900 transition-all" placeholder="Vehicle" />
                            <input type="text" value={p.vin || ''} onChange={(e) => updatePolicy(pId, 'vin', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none text-gray-900 transition-all" placeholder="VIN (Optional)" />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input type="text" value={p.cName} onChange={(e) => updatePolicy(pId, 'cName', e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none text-black transition-all"
                            placeholder={['new_lead', 'payment_reminder'].includes(tplKey) ? 'Carrier' : 'Current Carrier'} />
                          {tplKey === 'renewal_switch' && (
                            <input type="text" value={p.nName} onChange={(e) => updatePolicy(pId, 'nName', e.target.value)}
                              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none text-black transition-all"
                              placeholder="New Carrier" />
                          )}
                        </div>

                        {!['follow_up', 'auto_payment', 'info_req'].includes(tplKey) && (
                          <div className="flex gap-2">
                            {formType === 'auto' ? (
                              <>
                                <input type="number" value={p.oldPremium || p.a1} onChange={(e) => updatePolicy(pId, 'oldPremium', e.target.value)}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none text-gray-900 transition-all" placeholder="Old Premium" />
                                <input type="number" value={p.newPremium || p.a2} onChange={(e) => updatePolicy(pId, 'newPremium', e.target.value)}
                                  className="w-full border border-[#10B889]/30 rounded-lg px-3 py-2 text-sm bg-[#10B889]/5 focus:bg-white focus:border-[#10B889] focus:outline-none text-gray-900 transition-all" placeholder="New Premium" />
                              </>
                            ) : (
                              <>
                                <input type="number" value={p.a1} onChange={(e) => updatePolicy(pId, 'a1', e.target.value)}
                                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:border-[#10B889] focus:outline-none text-gray-900 transition-all" placeholder="Premium" />
                                {tplKey === 'renewal_switch' && (
                                  <input type="number" value={p.a2} onChange={(e) => updatePolicy(pId, 'a2', e.target.value)}
                                    className="w-full border border-[#10B889]/30 rounded-lg px-3 py-2 text-sm bg-[#10B889]/5 focus:bg-white focus:border-[#10B889] focus:outline-none text-gray-900 transition-all" placeholder="New Premium" />
                                )}
                              </>
                            )}
                            {tplKey === 'new_lead' && (
                              <select value={p.term} onChange={(e) => updatePolicy(pId, 'term', e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none text-gray-900">
                                <option value="12 months">12 Months</option>
                                <option value="6 months">6 Months</option>
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      {/* ── EMAIL BUILDER CARD ── */}
      {(templateId || composeMode === 'manual') && (
        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

          {/* Card Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-[#10B889] to-[#1e4068] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <span className="text-white font-bold text-sm">
                {composeMode === 'manual' ? 'Manual Composer' : 'Email Builder'}
              </span>
            </div>
            <span className="flex items-center gap-1.5 bg-white/10 text-white/80 text-[10px] font-bold px-2.5 py-1 rounded-full border border-white/15 uppercase tracking-widest">
              <span className="w-1.5 h-1.5 bg-[#10B889] rounded-full" />
              {composeMode === 'manual' ? 'Draft' : 'Live'}
            </span>
          </div>

          <div className="bg-white divide-y divide-gray-100 border-b border-gray-200">

            {/* SUBJECT */}
            <div className="px-5 py-4 flex items-center gap-4">
              <span className="text-[10px] font-bold text-black uppercase tracking-widest shrink-0 w-14">Subject</span>
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-[#2E5C85] focus:ring-2 focus:ring-[#2E5C85]/10 transition-all"
                placeholder="Enter email subject..."
              />
            </div>

            {/* PREVIEW / EDITOR */}
            <div className="px-5 pt-4 pb-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-black uppercase tracking-widest">
                   {composeMode === 'manual' ? 'Email Message' : 'Preview'}
                </span>
                <span className="text-[10px] text-black bg-gray-100 px-2 py-0.5 rounded-full font-medium border border-gray-200">
                   {composeMode === 'manual' ? 'Editable' : 'Read Only'}
                </span>
              </div>
              
              {composeMode === 'manual' ? (
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody?.(e.target.value)}
                  placeholder="Write your message..."
                  className="w-full h-[300px] rounded-xl border border-[#10B889]/30 bg-[#10B889]/5 p-5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#10B889]/10 focus:bg-white transition-all resize-none leading-relaxed"
                />
              ) : (
                <div
                  dangerouslySetInnerHTML={{ __html: generatedBody }}
                  className="rounded-xl border border-gray-200 bg-gray-50/60 p-5 text-sm text-gray-700 select-none cursor-default leading-relaxed max-h-[400px] overflow-y-auto"
                />
              )}
            </div>

            {/* ADDITIONAL NOTES (Hide in manual mode) */}
            {composeMode === 'template' && (
              <div className="px-5 pt-4 pb-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-black uppercase tracking-widest">Additional Notes</span>
                  <span className="text-[10px] text-black font-medium">Appended below email body</span>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Type your custom message here..."
                  className="w-full border border-gray-200 rounded-xl p-4 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#10B889]/20 focus:border-[#10B889] focus:bg-white min-h-[120px] resize-none transition-all placeholder:text-gray-400"
                />
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
