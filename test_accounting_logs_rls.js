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

async function testAccountingLogs() {
  try {
    console.log('Inserting mock log...');
    const { data: insertData, error: insErr } = await serviceClient
      .from('accounting_logs')
      .insert({
        lead_id: 'a8f9beaf-97a9-48ac-ba8e-792ab4cd14fc', // existing lead id
        updated_by: '8f2b99e9-6fa2-4223-8079-8ab69e8efafd', // existing user id
        old_expected_commission: 100,
        new_expected_commission: 120,
        old_actual_commission: 0,
        new_actual_commission: 0,
        old_status: 'unreconciled',
        new_status: 'unreconciled',
        notes: 'TEST MOCK LOG'
      })
      .select();

    if (insErr) {
      console.error('Insert failed:', insErr.message);
      return;
    }
    console.log('Inserted successfully:', insertData);

    console.log('\nQuerying accounting_logs using Anon client...');
    const { data: anonData, error: anonErr } = await anonClient
      .from('accounting_logs')
      .select('*');

    console.log(`Anon Result: Length=${anonData?.length || 0} (Err: ${anonErr?.message || 'None'})`);

    console.log('\nQuerying accounting_logs using Service client...');
    const { data: serviceData } = await serviceClient
      .from('accounting_logs')
      .select('*');
    console.log(`Service Result: Length=${serviceData?.length || 0}`);

    // Clean up mock log
    console.log('\nCleaning up mock log...');
    const { error: delErr } = await serviceClient
      .from('accounting_logs')
      .delete()
      .eq('notes', 'TEST MOCK LOG');
    if (delErr) console.error('Cleanup failed:', delErr.message);
    else console.log('Cleaned up successfully.');

  } catch (err) {
    console.error('Failed test:', err);
  }
}

testAccountingLogs();
