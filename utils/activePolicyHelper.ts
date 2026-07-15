export interface PolicyRecord {
  carrier?: string | null
  policy_number?: string | null
  current_premium?: number | string | null
  renewal_premium?: number | string | null
  total_premium?: number | string | null
  new_carrier?: string | null
  new_policy_number?: string | null
  new_premium?: number | string | null
  [key: string]: any
}

export interface ActivePolicyResult {
  activeCarrier: string | null
  activePolicyNumber: string | null
  activePremium: number
  isSwitched: boolean
}

/**
 * Resolves the active carrier, active policy number, and active premium for any lead or renewal record.
 * Following client business rules:
 * - When new_carrier, new_policy_number, or new_premium are present (from a "Completed (Switch)"),
 *   those values become the ACTIVE policy across the CRM.
 * - Otherwise, falls back cleanly to existing base policy attributes without duplicating fallback expressions.
 */
export function getActivePolicy(record?: PolicyRecord | null): ActivePolicyResult {
  if (!record) {
    return {
      activeCarrier: null,
      activePolicyNumber: null,
      activePremium: 0,
      isSwitched: false,
    }
  }

  const isSwitched = Boolean(
    (record.new_carrier && record.new_carrier.toString().trim() !== '') ||
    (record.new_policy_number && record.new_policy_number.toString().trim() !== '') ||
    (record.new_premium !== null && record.new_premium !== undefined && record.new_premium !== '')
  )

  const activeCarrier = (record.new_carrier && record.new_carrier.toString().trim() !== '') 
    ? record.new_carrier.toString() 
    : (record.carrier ? record.carrier.toString() : null)

  const activePolicyNumber = (record.new_policy_number && record.new_policy_number.toString().trim() !== '') 
    ? record.new_policy_number.toString() 
    : (record.policy_number ? record.policy_number.toString() : null)

  let activePremiumVal = 0
  if (record.new_premium !== null && record.new_premium !== undefined && record.new_premium !== '') {
    const parsed = Number(record.new_premium)
    if (!isNaN(parsed)) activePremiumVal = parsed
  } else if (record.total_premium !== null && record.total_premium !== undefined && record.total_premium !== '') {
    const parsed = Number(record.total_premium)
    if (!isNaN(parsed)) activePremiumVal = parsed
  } else if (record.renewal_premium !== null && record.renewal_premium !== undefined && record.renewal_premium !== '') {
    const parsed = Number(record.renewal_premium)
    if (!isNaN(parsed)) activePremiumVal = parsed
  } else if (record.current_premium !== null && record.current_premium !== undefined && record.current_premium !== '') {
    const parsed = Number(record.current_premium)
    if (!isNaN(parsed)) activePremiumVal = parsed
  }

  return {
    activeCarrier,
    activePolicyNumber,
    activePremium: activePremiumVal,
    isSwitched,
  }
}

/**
 * Convenience helper to get just the active premium number from a record.
 */
export function getActivePremium(record?: PolicyRecord | null): number {
  return getActivePolicy(record).activePremium
}

/**
 * Convenience helper to get just the active carrier string from a record.
 */
export function getActiveCarrier(record?: PolicyRecord | null, fallback = '—'): string {
  return getActivePolicy(record).activeCarrier || fallback
}

/**
 * Convenience helper to get just the active policy number string from a record.
 */
export function getActivePolicyNumber(record?: PolicyRecord | null, fallback = '—'): string {
  return getActivePolicy(record).activePolicyNumber || fallback
}
