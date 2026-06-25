import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

async function main() {
  console.log("Checking constraints on clients table...")
  
  // Checking unique constraints or indexes
  // Note: we can try to insert a test client and see what constraints fail, but let's query postgres if possible.
  // Supabase JS doesn't allow direct SQL by default via select, but we can call a function or try a test insert.
  
  // Let's insert a test client
  const testEmail = 'test_audit_1@example.com'
  const testPhone = '9998887776'

  console.log("\n1. Inserting first client...")
  const { data: client1, error: err1 } = await supabase.from('clients').insert({
    client_name: 'Test Audit Client 1',
    email: testEmail,
    phone: testPhone
  }).select().single()
  
  if (err1) console.log("Error inserting client1:", err1)
  else console.log("Inserted client1:", client1.id)

  if (client1) {
    console.log("\n2. Attempting to insert duplicate client with same email and phone...")
    const { data: client2, error: err2 } = await supabase.from('clients').insert({
      client_name: 'Test Audit Client 2',
      email: testEmail,
      phone: testPhone
    }).select().single()
    if (err2) console.log("Error inserting client2 (expected duplicate error):", err2)
    else console.log("Inserted client2:", client2.id)

    console.log("\n3. Testing leads for same client...")
    console.log("Inserting Lead 1 (Auto)...")
    const { data: lead1, error: lErr1 } = await supabase.from('temp_leads_basics').insert({
      client_id: client1.id,
      policy_type: 'auto',
      policy_flow: 'new',
      request_type: 'new_lead',
      insurence_category: 'personal',
      is_additional_quote: false,
      pipeline_id: 'f77d068d-1754-421b-b2ce-d527ec8bd0f3'
    }).select().single()
    if (lErr1) console.log("Error Lead 1:", lErr1)
    else console.log("Inserted Lead 1:", lead1.id)

    if (lead1) {
      console.log("\nInserting Lead 2 (Auto, is_additional_quote=false)...")
      const { data: lead2, error: lErr2 } = await supabase.from('temp_leads_basics').insert({
        client_id: client1.id,
        policy_type: 'auto',
        policy_flow: 'new',
        request_type: 'new_lead',
        insurence_category: 'personal',
        is_additional_quote: false,
        pipeline_id: 'f77d068d-1754-421b-b2ce-d527ec8bd0f3'
      }).select().single()
      if (lErr2) console.log("Error Lead 2:", lErr2)
      else console.log("Inserted Lead 2:", lead2.id)

      console.log("\nInserting Lead 3 (Home, is_additional_quote=false)...")
      const { data: lead3, error: lErr3 } = await supabase.from('temp_leads_basics').insert({
        client_id: client1.id,
        policy_type: 'home',
        policy_flow: 'new',
        request_type: 'new_lead',
        insurence_category: 'personal',
        is_additional_quote: false,
        pipeline_id: 'f77d068d-1754-421b-b2ce-d527ec8bd0f3'
      }).select().single()
      if (lErr3) console.log("Error Lead 3:", lErr3)
      else console.log("Inserted Lead 3:", lead3?.id)

      console.log("\nCleaning up leads...")
      await supabase.from('temp_leads_basics').delete().in('id', [lead1.id, lead2?.id, lead3?.id].filter(Boolean) as string[])
    }
    
    console.log("\nCleaning up clients...")
    await supabase.from('clients').delete().eq('id', client1.id)
    if (client2 && !err2) await supabase.from('clients').delete().eq('id', client2.id)
  }
}

main()
