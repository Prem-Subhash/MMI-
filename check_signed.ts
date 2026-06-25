import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

async function main() {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl('0cea746f-1744-4010-9396-9d3349b9d73b/1778053837263-ux31o.pdf', 3600)
  console.log("Signed URL:", data, error);
}

main();
