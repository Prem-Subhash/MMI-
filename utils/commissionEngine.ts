import Decimal from 'decimal.js';

export interface CommissionEngineInput {
  premium: number;
  carrier_percent: number;
  referral_percent?: number | null;
}

export interface CommissionEngineResult {
  gross_commission: number;
  admin_charge: number;
  net_commission: number;
  referral_payout: number;
  company_commission: number;
}

export function calculateCommissionSplit({
  premium,
  carrier_percent,
  referral_percent
}: CommissionEngineInput): CommissionEngineResult {
  // Ensure we are working with Decimal objects
  const p = new Decimal(premium);
  const cPct = new Decimal(carrier_percent).div(100);
  
  // 1. Gross Commission (Rounded immediately)
  const grossRaw = p.mul(cPct);
  const gross = grossRaw.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
  
  let admin = new Decimal(0);
  let net = gross;
  let referralPayout = new Decimal(0);
  let companyCommission = gross;

  // 2. If Referral Exists
  if (referral_percent !== undefined && referral_percent !== null) {
    const rPct = new Decimal(referral_percent).div(100);
    
    // Admin Charge (10% of ROUNDED Gross), then rounded
    const adminRaw = gross.mul(new Decimal(0.1));
    admin = adminRaw.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    
    // Net Commission is derived from ROUNDED values
    net = gross.minus(admin);
    
    // Referral Payout is calculated from ROUNDED Net, then rounded
    const referralPayoutRaw = net.mul(rPct);
    referralPayout = referralPayoutRaw.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    
    // Company Commission is exactly Gross - Referral Payout (both already rounded)
    companyCommission = gross.minus(referralPayout);
  }

  return {
    gross_commission: gross.toNumber(),
    admin_charge: admin.toNumber(),
    net_commission: net.toNumber(),
    referral_payout: referralPayout.toNumber(),
    company_commission: companyCommission.toNumber()
  };
}
