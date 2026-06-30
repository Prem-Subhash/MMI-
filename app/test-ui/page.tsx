'use client'
import React, { useState } from 'react';
import EmailGenerator from '@/components/email/EmailGenerator';

export default function TestPage() {
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <div className="p-10 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 shadow rounded-lg" id="capture-area">
        <h1 className="text-2xl font-bold mb-4">Send Email Modal (Simulation)</h1>
        <EmailGenerator
          templates={[]}
          templateId={templateId}
          setTemplateId={setTemplateId}
          initialClientName="John Doe"
          setCustomSubject={setSubject}
          generatedBody={body}
          setGeneratedBody={setBody}
          notes={notes}
          setNotes={setNotes}
          customSubject={subject}
          formType="home"
          leadData={{ insurence_category: 'personal' }}
          isPersonalLines={true}
        />
      </div>
    </div>
  );
}
