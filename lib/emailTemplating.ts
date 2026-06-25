import { formatCurrency } from './currency';

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

export interface CsrData {
  full_name?: string;
  email?: string;
  phone?: string;
}

export function getCombinedTypes(policies: PolicyBreakdown[]): string {
  if (!policies || policies.length === 0) return 'Insurance';
  const types = Array.from(new Set(policies.map(p => p.type)));
  return types.join(' / ');
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
  return totalSavings > 0 ? formatCurrency(totalSavings) : formatCurrency(0);
}

export function generatePolicyBreakdown(templateKey: string, policies: PolicyBreakdown[]): string {
  if (!policies || policies.length === 0) return '';
  
  // Specific formatting for different template types
  if (templateKey === 'renewal_same') {
    return policies.map((p, idx) => `• <b>Policy ${idx + 1}: ${p.type} Insurance Premium:</b> ${formatCurrency(p.oldPremium || p.newPremium || p.a1 || p.a2 || 0)}`).join('<br>');
  } 
  if (templateKey === 'renewal_switch') {
    return policies.map((p, idx) => `<b>Policy ${idx + 1}: ${p.type} Policy Comparison:</b><br>• Current ${p.cName || '[Carrier]'} Carrier (Renewal Premium): ${formatCurrency(p.oldPremium || p.a1 || 0)}<br>• New ${p.nName || '[New Carrier]'} Carrier (Quoted Premium): ${formatCurrency(p.newPremium || p.a2 || 0)}`).join('<br><br>');
  }
  if (templateKey === 'payment_reminder') {
    return policies.map((p, idx) => `• <b>Policy ${idx + 1}: ${p.type} Insurance</b> with ${p.cName || '[Carrier]'}: <b>${formatCurrency(p.oldPremium || p.newPremium || p.a1 || p.a2 || 0)}</b>`).join('<br>');
  }
  if (templateKey === 'new_lead') {
    return policies.map((p, idx) => `<b>Policy ${idx + 1}: ${p.type} Insurance Quote:</b><br>Carrier: ${p.cName || '[Carrier]'}<br>Coverage Term: ${p.term || '12 months'}<br>Premium Amount: <b>${formatCurrency(p.oldPremium || p.newPremium || p.a1 || p.a2 || 0)}</b>`).join('<br><br>');
  }

  // Refined production format with numbering and auto-skipping empty fields
  return policies.map((p, idx) => {
    let lines = [`<b>Policy ${idx + 1}:</b>`];
    
    const pType = p.type ? p.type.toLowerCase() : '';
    const isAutoLayout = pType === 'auto' || pType === 'motorcycle';
    
    lines.push(`Type: ${p.type} Insurance`);
    
    if (isAutoLayout) {
      if (p.driver) lines.push(`Driver: ${p.driver}`);
      if (p.vehicle) lines.push(`Vehicle: ${p.vehicle}`);
      if (p.vin) lines.push(`VIN: ${p.vin}`);
    }
    
    if (p.cName) lines.push(`Carrier: ${p.cName}`);
    else if (p.nName) lines.push(`Carrier: ${p.nName}`);

    // Determine the premium to show
    const currentPrem = p.oldPremium || p.a1;
    const newPrem = p.newPremium || p.a2;

    if (currentPrem && newPrem) {
      lines.push(`Current Premium: ${formatCurrency(currentPrem)}`);
      lines.push(`New Premium: ${formatCurrency(newPrem)}`);
    } else if (newPrem) {
      lines.push(`Premium: ${formatCurrency(newPrem)}`);
    } else if (currentPrem) {
      lines.push(`Premium: ${formatCurrency(currentPrem)}`);
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

export function replaceTemplate(templateKey: string, templateString: string, data: EmailData, leadData?: any, formLink?: string, csrData?: CsrData, notes?: string): string {
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
  const activePremium = firstPolicy?.a1 || firstPolicy?.oldPremium || firstPolicy?.newPremium || firstPolicy?.a2 || '';
  const activeTerm = firstPolicy?.term || '12 months';

  const replacements: Record<string, string> = {
    // Output Standard: Relying on breakdown and aggregate savings
    policy_breakdown: breakdown,
    bullets: breakdown,
    savings_amount: totalSavings,
    savings_breakdown: totalSavings,

    // Core variables
    client_name: data.clientName || leadData?.client_name || '',
    combined_types: combinedTypes,
    eff_date: data.effDate || '',
    effective_date: data.effDate || '',
    renewal_date: leadData?.renewal_date ? new Date(leadData.renewal_date).toLocaleDateString() : data.effDate || '',
    single_carrier: data.singleCarrier || activeCarrier || '',
    manual_year: data.manualYear || '',
    dynamic_sections: dynamicSections,
    counter: formCounter.toString(),
    pay_type: data.payType || 'Bank Account',
    last4: data.last4 || '',
    id_text: idText,
    plural_pol: pluralPol,

    // Singular fallbacks and extracted policy fields
    current_carrier: data.defCurrentCarrier || firstPolicy?.cName || '',
    new_carrier: data.defNewCarrier || firstPolicy?.nName || '',
    driver: firstPolicy?.driver || '',
    vehicle: firstPolicy?.vehicle || '',
    vin: firstPolicy?.vin || '',
    
    premium: activePremium ? formatCurrency(activePremium) : '',
    premium_amount: activePremium ? formatCurrency(activePremium) : '',
    old_premium: firstPolicy?.oldPremium || firstPolicy?.a1 ? formatCurrency(firstPolicy?.oldPremium || firstPolicy?.a1) : '',
    new_premium: firstPolicy?.newPremium || firstPolicy?.a2 ? formatCurrency(firstPolicy?.newPremium || firstPolicy?.a2) : '',
    renewal_premium: leadData?.renewal_premium ? formatCurrency(leadData.renewal_premium) : (firstPolicy?.newPremium || firstPolicy?.a2 ? formatCurrency(firstPolicy?.newPremium || firstPolicy?.a2) : ''),
    carrier: activeCarrier || '',
    term: activeTerm,
    form_link: formLink || '{{form_link}}',
    form_links: formLink || '{{form_link}}',

    // CSR Data
    csr_name: csrData?.full_name || '',
    csr_email: csrData?.email || '',
    csr_phone: csrData?.phone || '',

    // Extended Support for Template Builder Fields
    email: leadData?.email || '',
    phone: leadData?.phone || '',
    policy_type: data.policies[0]?.type || leadData?.policy_type || '',
    pipeline_name: leadData?.pipeline?.name || leadData?.pipeline_name || '',
    status: leadData?.status || '',
    notes: notes || leadData?.notes || ''
  };
  
  let output = templateString;

  // New Generalized Replacement Engine
  // Matches: {{ variable_name }} OR [Variable Name] OR $[Variable Name] etc.
  // The currency format in legacy templates might be $[Premium]. We should match the brackets without the $ and let formatCurrency apply.
  const combinedRegex = /(?:\{\{\s*(.*?)\s*\}\})|(?:\[\s*(.*?)\s*\])/g;

  output = output.replace(combinedRegex, (match, p1, p2) => {
    const rawKey = p1 || p2;
    if (!rawKey) return match;

    // Normalize: e.g., "Client Name", "client_name", " Client Name " -> "client_name"
    const normalizedMatchKey = rawKey.trim().toLowerCase().replace(/\s+/g, '_');

    if (normalizedMatchKey in replacements) {
      const val = replacements[normalizedMatchKey];
      return val !== undefined && val !== null ? val.toString() : '';
    }

    // Preserve form_link if it wasn't replaced yet
    if (normalizedMatchKey === 'form_link') {
      return '{{form_link}}';
    }

    // Unmapped placeholders default to empty string for graceful degradation
    return '';
  });

  // Handle legacy $[tag] where formatCurrency already includes the $ sign
  output = output.replace(/\$\$/g, '$');
  
  return output;
}
