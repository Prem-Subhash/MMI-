const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function testAccess() {
  const userId = '8f2b99e9-6fa2-4223-8079-8ab69e8efafd';
  const email = 'accounting@test.com';
  const tempPassword = 'TestPassword123!';

  try {
    console.log(`Setting temporary password for ${email}...`);
    const { data: userUpdate, error: updateErr } = await serviceClient.auth.admin.updateUserById(
      userId,
      { password: tempPassword }
    );

    if (updateErr) {
      console.error('Failed to update user password:', updateErr.message);
      return;
    }
    console.log('Password set successfully.');

    // Initialize anon client to sign in
    const authClient = createClient(supabaseUrl, supabaseAnonKey);

    console.log('\nSigning in as accounting user...');
    const { data: sessionData, error: signInErr } = await authClient.auth.signInWithPassword({
      email,
      password: tempPassword
    });

    if (signInErr) {
      console.error('Sign in failed:', signInErr.message);
      return;
    }
    console.log('Signed in successfully.');

    const accountingSessionClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      }
    });

    console.log('\n--- TESTING ACCESS CONTROLS ---');

    // 1. SELECT profiles
    const { data: pSelect, error: pSelectErr } = await accountingSessionClient
      .from('profiles')
      .select('id, email, role')
      .limit(5);
    console.log(`profiles SELECT: Length=${pSelect?.length || 0} (Err: ${pSelectErr?.message || 'None'})`);

    // 2. SELECT temp_leads_basics
    const { data: lSelect, error: lSelectErr } = await accountingSessionClient
      .from('temp_leads_basics')
      .select('id, client_name, policy_number, expected_commission');
    console.log(`temp_leads_basics SELECT: Length=${lSelect?.length || 0} (Err: ${lSelectErr?.message || 'None'})`);

    // 3. SELECT lead_stage_history
    const { data: hSelect, error: hSelectErr } = await accountingSessionClient
      .from('lead_stage_history')
      .select('id, stage_name')
      .limit(5);
    console.log(`lead_stage_history SELECT: Length=${hSelect?.length || 0} (Err: ${hSelectErr?.message || 'None'})`);

    // 4. SELECT accounting_logs
    const { data: aSelect, error: aSelectErr } = await accountingSessionClient
      .from('accounting_logs')
      .select('*')
      .limit(5);
    console.log(`accounting_logs SELECT: Length=${aSelect?.length || 0} (Err: ${aSelectErr?.message || 'None'})`);

    // 5. UPDATE temp_leads_basics (Try to update the commission of a lead)
    // We know from check_db_evidence that 'a8f9beaf-97a9-48ac-ba8e-792ab4cd14fc' is a valid lead ID
    const leadId = 'a8f9beaf-97a9-48ac-ba8e-792ab4cd14fc';
    console.log(`\nAttempting to UPDATE expected_commission on lead ${leadId}...`);
    const { data: lUpdate, error: lUpdateErr } = await accountingSessionClient
      .from('temp_leads_basics')
      .update({ expected_commission: 150 })
      .eq('id', leadId)
      .select();
    console.log(`temp_leads_basics UPDATE: Result=${JSON.stringify(lUpdate)} (Err: ${lUpdateErr?.message || 'None'})`);

    // 6. INSERT temp_leads_basics (Try to create a lead)
    console.log('\nAttempting to INSERT a new lead...');
    // We need pipeline_id. Let's use personal lines pipeline 'f77d068d-1754-421b-b2ce-d527ec8bd0f3'
    const { data: lInsert, error: lInsertErr } = await accountingSessionClient
      .from('temp_leads_basics')
      .insert({
        client_name: 'TEST LEADS INSERT',
        phone: '1234567890',
        insurence_category: 'personal',
        policy_flow: 'new',
        policy_type: 'auto',
        pipeline_id: 'f77d068d-1754-421b-b2ce-d527ec8bd0f3',
        assigned_csr: userId
      })
      .select();
    console.log(`temp_leads_basics INSERT: Result=${JSON.stringify(lInsert)} (Err: ${lInsertErr?.message || 'None'})`);

    // Clean up inserted lead if successful
    if (lInsert && lInsert.length > 0) {
      console.log('Cleaning up inserted lead...');
      await serviceClient.from('temp_leads_basics').delete().eq('client_name', 'TEST LEADS INSERT');
    }

  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

testAccess();
