const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://welhzcasuabhqoccfxtu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlbGh6Y2FzdWFiaHFvY2NmeHR1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjI4OTA1NSwiZXhwIjoyMDgxODY1MDU1fQ.fbJCzQ_1hh01V99oLniPPGcKGnuObVUODDrScbFXj-g';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('email_templates')
    .select('id, body')
    .eq('name', 'info_req')
    .eq('insurance_category', 'personal')
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching template:', error);
  } else {
    let body = data.body;
    let oldBody = body;
    
    body = body.replace('For your convenience, we have attached a fillable PDF form that collects additional details needed to ensure quote accuracy.', 'For your convenience, please complete our secure online intake form to provide the additional details needed to ensure quote accuracy.');
    body = body.replace('\r\n\r\nTo respond to this email, please select "REPLY ALL" to notify everyone. We are committed to providing you with excellent service!', '');
    
    console.log("Matched replace 1?", oldBody !== body);
    console.log(JSON.stringify(body));
  }
}

run();
