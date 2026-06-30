function generateDynamicSections(policies) {
  let sections = '';
  let counter = 1;
  const processedCategories = new Set();
  
  if (policies && policies.length > 0) {
    policies.forEach(p => {
    const type = (p.type || '').toLowerCase();
    
    if (['home', 'condo', 'landlord_home', 'landlord_condo'].includes(type)) {
      if (!processedCategories.has('property')) {
        sections += `<b>${counter}. Property Insurance Details</b><br>• A copy of your current property insurance policy OR<br>• For a new purchase: a copy of the purchase agreement along with your current address<br><br>`;
        counter++;
        processedCategories.add('property');
      }
    } else if (['auto', 'motorcycle'].includes(type)) {
      if (!processedCategories.has('vehicle')) {
        sections += `<b>${counter}. Driver & Vehicle Information</b><br>• Driver’s licenses for all household drivers<br>• Vehicle Identification Numbers (VINs) for all vehicles<br><br>`;
        counter++;
        processedCategories.add('vehicle');
      }
    } else if (type === 'umbrella') {
      if (!processedCategories.has('umbrella')) {
        sections += `<b>${counter}. Umbrella Coverage Details</b><br>• A copy of your current underlying home and auto insurance declaration pages<br><br>`;
        counter++;
        processedCategories.add('umbrella');
      }
    }
  });
  }

  sections += `<b>${counter}. Additional Information Form</b><br>For your convenience...`;
  counter++;

  return { sections, counter };
}

console.log(generateDynamicSections([{ type: 'Home' }, { type: 'Auto' }]));
console.log(generateDynamicSections([{ type: 'home' }, { type: 'auto' }]));
