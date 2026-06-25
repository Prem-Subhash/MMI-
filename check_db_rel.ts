import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function main() {
  const { data: forms, error } = await supabase.from('temp_intake_forms').select('id, lead_id, status').order('submitted_at', { ascending: false }).limit(5)
  console.log("Recent Forms:", forms)

  if (forms && forms.length > 0) {
     const { data: docs } = await supabase.from('uploaded_documents').select('*').in('intake_form_id', forms.map(f => f.id))
     console.log("Documents for these forms:", docs)
  }
}

main()
