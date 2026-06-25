const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const anonClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRLS() {
  try {
    console.log('--- TESTING RLS FOR ANONYMOUS CLIENT ---');

    // 1. profiles
    const { data: pAnon, error: pAnonErr } = await anonClient.from('profiles').select('id').limit(1);
    const { data: pService, error: pServiceErr } = await serviceClient.from('profiles').select('id').limit(1);
    console.log(`profiles: Anon Length=${pAnon?.length || 0} (Err: ${pAnonErr?.message || 'None'}), Service Length=${pService?.length || 0}`);

    // 2. temp_leads_basics
    const { data: lAnon, error: lAnonErr } = await anonClient.from('temp_leads_basics').select('id').limit(1);
    const { data: lService, error: lServiceErr } = await serviceClient.from('temp_leads_basics').select('id').limit(1);
    console.log(`temp_leads_basics: Anon Length=${lAnon?.length || 0} (Err: ${lAnonErr?.message || 'None'}), Service Length=${lService?.length || 0}`);

    // 3. lead_stage_history
    const { data: hAnon, error: hAnonErr } = await anonClient.from('lead_stage_history').select('id').limit(1);
    const { data: hService, error: hServiceErr } = await serviceClient.from('lead_stage_history').select('id').limit(1);
    console.log(`lead_stage_history: Anon Length=${hAnon?.length || 0} (Err: ${hAnonErr?.message || 'None'}), Service Length=${hService?.length || 0}`);

    // 4. accounting_logs
    const { data: aAnon, error: aAnonErr } = await anonClient.from('accounting_logs').select('id').limit(1);
    const { data: aService, error: aServiceErr } = await serviceClient.from('accounting_logs').select('id').limit(1);
    console.log(`accounting_logs: Anon Length=${aAnon?.length || 0} (Err: ${aAnonErr?.message || 'None'}), Service Length=${aService?.length || 0}`);

  } catch (err) {
    console.error('Test RLS failed:', err);
  }
}

testRLS();
