import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function main() {
  const { data: forms, error: fError } = await supabase.from('temp_intake_forms').select('id, lead_id, status, form_type, submitted_at');
  console.log("Forms:", forms);

  const { data: docs, error: dError } = await supabase.from('uploaded_documents').select('*');
  console.log("Docs:", docs);
}

main();
