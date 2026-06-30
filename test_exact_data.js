// EXACT SIMULATION of data flow from DB to Email preview based on user selecting "Home" and "Auto"

// 1. User selected "Home" and "Auto" in checkboxes in app/(dashboard)/csr/leads/new/page.tsx
// This creates lead_policies in DB as: [{ policy_type: 'Home' }, { policy_type: 'Auto' }]
const leadData = {
  id: "lead_123",
  lead_policies: [
    { policy_type: "Home" },
    { policy_type: "Auto" }
  ]
};

console.log("1. leadData.lead_policies");
console.log(JSON.stringify(leadData.lead_policies, null, 2));

// 2. EmailGenerator.tsx maps lead_policies into initialPolicies
const initialPolicies = leadData.lead_policies.map((p) => {
  const type = p.policy_type || 'home';
  return {
    id: "mock_id_" + type,
    type: type, // This preserves the exact casing from the DB
  }
});

console.log("\n2. initialPolicies");
console.log(JSON.stringify(initialPolicies, null, 2));

// 3. data.policies before replaceTemplate()
console.log("\n3. data.policies before replaceTemplate()");
console.log(JSON.stringify(initialPolicies, null, 2));

// 4. The argument received by generateDynamicSections()
console.log("\n4. The argument received by generateDynamicSections()");
console.log(JSON.stringify(initialPolicies, null, 2));

// Simulating generateDynamicSections execution in lib/emailTemplating.ts
console.log("\nSimulating generateDynamicSections...");
let sections = '';
let counter = 1;
const processedCategories = new Set();

if (initialPolicies && initialPolicies.length > 0) {
  initialPolicies.forEach((p, idx) => {
    console.log(`\nIteration ${idx + 1}`);
    const type = (p.type || '').toLowerCase(); // THIS IS IN lib/emailTemplating.ts
    console.log(`type = "${type}"`);
    
    if (['home', 'condo', 'landlord_home', 'landlord_condo'].includes(type)) {
      if (!processedCategories.has('property')) {
        console.log(`Matched:\nProperty`);
        sections += `Property Insurance Details...`;
        counter++;
        processedCategories.add('property');
      } else {
        console.log(`Matched:\nProperty (Skipped due to processedCategories)`);
      }
    } else if (['auto', 'motorcycle'].includes(type)) {
      if (!processedCategories.has('vehicle')) {
        console.log(`Matched:\nVehicle`);
        sections += `Driver & Vehicle Information...`;
        counter++;
        processedCategories.add('vehicle');
      } else {
        console.log(`Matched:\nVehicle (Skipped due to processedCategories)`);
      }
    } else if (type === 'umbrella') {
      if (!processedCategories.has('umbrella')) {
        console.log(`Matched:\nUmbrella`);
        sections += `Umbrella Coverage Details...`;
        counter++;
        processedCategories.add('umbrella');
      } else {
        console.log(`Matched:\nUmbrella (Skipped due to processedCategories)`);
      }
    } else {
      console.log(`No Match`);
    }
  });
}
