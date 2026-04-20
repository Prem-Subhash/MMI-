export interface PolicyBreakdown {
  id: string;
  type: string;
  cName: string;   // Current Carrier
  nName: string;   // New Carrier
  term: string;
  a1: string;      // Current/Old Premium
  a2: string;      // New Premium
  driver?: string;
  vehicle?: string;
  vin?: string;
  oldPremium?: string;
  newPremium?: string;
}

export interface EmailData {
  clientName: string;
  effDate: string;
  singleCarrier: string;
  defCurrentCarrier: string;
  defNewCarrier: string;
  payType: string;
  last4: string;
  manualYear: string;
  policies: PolicyBreakdown[];
}

export function getCombinedTypes(policies: PolicyBreakdown[]): string {
  // Focus only on HOME
  return 'Home';
}

export function calculateTotalSavings(policies: PolicyBreakdown[]): string {
  let totalSavings = 0;
  policies.forEach(p => {
    // Check both legacy a1/a2 and new old/newPremium fields
    const oldVal = parseFloat(p.oldPremium || p.a1) || 0;
    const newVal = parseFloat(p.newPremium || p.a2) || 0;
    if (oldVal && newVal) {
      totalSavings += (oldVal - newVal);
    }
  });
  return totalSavings > 0 ? totalSavings.toFixed(2) : '0.00';
}

export function generatePolicyBreakdown(templateKey: string, policies: PolicyBreakdown[]): string {
  if (!policies || policies.length === 0) return '';
  
  // Specific formatting for different template types
  if (templateKey === 'renewal_same') {
    return policies.map((p, idx) => `• <b>Policy ${idx + 1}: ${p.type} Insurance Premium:</b> $${p.a1 || '0.00'}`).join('<br>');
  } 
  if (templateKey === 'renewal_switch') {
    return policies.map((p, idx) => `<b>Policy ${idx + 1}: ${p.type} Policy Comparison:</b><br>• Current ${p.cName || '[Carrier]'} Carrier (Renewal Premium): $${p.a1 || '0.00'}<br>• New ${p.nName || '[New Carrier]'} Carrier (Quoted Premium): $${p.a2 || '0.00'}`).join('<br><br>');
  }
  if (templateKey === 'payment_reminder') {
    return policies.map((p, idx) => `• <b>Policy ${idx + 1}: ${p.type} Insurance</b> with ${p.cName || '[Carrier]'}: <b>$${p.a1 || '0.00'}</b>`).join('<br>');
  }
  if (templateKey === 'new_lead') {
    return policies.map((p, idx) => `<b>Policy ${idx + 1}: ${p.type} Insurance Quote:</b><br>Carrier: ${p.cName || '[Carrier]'}<br>Coverage Term: 12 months<br>Premium Amount: <b>$${p.a1 || '0.00'}</b>`).join('<br><br>');
  }

  // Refined production format with numbering and auto-skipping empty fields
  return policies.map((p, idx) => {
    let lines = [`<b>Policy ${idx + 1}:</b>`];
    
    if (p.type === 'auto') {
      lines.push(`Type: Auto Insurance`);
      if (p.driver) lines.push(`Driver: ${p.driver}`);
      if (p.vehicle) lines.push(`Vehicle: ${p.vehicle}`);
      if (p.vin) lines.push(`VIN: ${p.vin}`);
      if (p.cName) lines.push(`Carrier: ${p.cName}`);
      if (p.a1 || p.newPremium) lines.push(`Premium: $${p.newPremium || p.a1}`);
    } else {
      lines.push(`Type: ${p.type} Insurance`);
      if (p.cName) lines.push(`Carrier: ${p.cName}`);
      if (p.a1) lines.push(`Premium: $${p.a1}`);
    }
    
    return lines.join('<br>') + '<br>';
  }).join('<br>');
}

export function generateDynamicSections(flowType: string): { sections: string, counter: number } {
  let sections = '';
  let counter = 1;
  
  if (flowType === 'home') {
    sections += `<b>${counter}. Property Insurance Details</b><br>• A copy of your current property insurance policy OR<br>• For a new purchase: a copy of the purchase agreement along with your current address<br><br>`;
    counter++;
  }
  
  return { sections, counter };
}

export function replaceTemplate(templateKey: string, templateString: string, data: EmailData, leadData?: any, formLink?: string): string {
  if (!templateString) return '';
  
  // Normalize key for logic matching
  const normalizedKey = templateKey.toLowerCase().replace(/\s+/g, '_');
  
  const combinedTypes = getCombinedTypes(data.policies);
  const totalSavings = calculateTotalSavings(data.policies);
  const breakdown = generatePolicyBreakdown(normalizedKey, data.policies);
  
  const { sections: dynamicSections, counter: formCounter } = generateDynamicSections('home');
  
  const idText = '';
  const pluralPol = data.policies.length > 1 ? 'policies' : 'policy';

  // Sourcing singular values from the first policy if available
  const firstPolicy = data.policies[0];
  const activeCarrier = firstPolicy?.cName || data.singleCarrier || '';
  const activePremium = firstPolicy?.a1 || '';
  const activeTerm = firstPolicy?.term || '12 months';

  const replacements: Record<string, string> = {
    // Output Standard: Relying on breakdown and aggregate savings
    policy_breakdown: breakdown,
    bullets: breakdown,
    savings_amount: totalSavings,
    savings_breakdown: totalSavings,

    // Core variables
    client_name: data.clientName || leadData?.client_name || '[Client Name]',
    combined_types: combinedTypes,
    eff_date: data.effDate || '[Effective Date]',
    renewal_date: leadData?.renewal_date ? new Date(leadData.renewal_date).toLocaleDateString() : data.effDate || '[Renewal Date]',
    single_carrier: data.singleCarrier || activeCarrier || '[Carrier Name]',
    manual_year: data.manualYear || '[Year]',
    dynamic_sections: dynamicSections,
    counter: formCounter.toString(),
    pay_type: data.payType || 'Bank Account',
    last4: data.last4 || '[Last 4 Digits]',
    id_text: idText,
    plural_pol: pluralPol,

    // Singular fallbacks (deprioritized in favor of breakdown)
    premium: activePremium || '[Premium Amount]',
    old_premium: firstPolicy?.oldPremium || firstPolicy?.a1 || '[Old Premium]',
    new_premium: firstPolicy?.newPremium || firstPolicy?.a2 || '[New Premium]',
    renewal_premium: leadData?.renewal_premium ? `$${leadData.renewal_premium}` : firstPolicy?.newPremium || firstPolicy?.a2 || '[Renewal Premium]',
    carrier: activeCarrier || '[Carrier Name]',
    term: activeTerm,
    form_link: formLink || '{{form_link}}'
  };
  
  let output = templateString;

  // STEP 1 & 3: Loop Replacements with Whitespace-resilient Regex for {{ tag }}
  Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      output = output.replace(regex, value);
  });

  // STEP 4: Support for legacy [tag] style used in some database templates
  Object.entries(replacements).forEach(([key, value]) => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\[${escapedKey}\\]`, "g");
      output = output.replace(regex, value);
  });
  
  return output;
}
