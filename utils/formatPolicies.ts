/**
 * Format an array of policy type strings into a readable comma-separated list.
 * Fallbacks to a single string if that's what's provided (for legacy compatibility).
 *
 * Example:
 * formatPolicies(['home', 'auto', 'umbrella'])
 * // => "Home, Auto, Umbrella"
 */
export function formatPolicies(raw?: string | string[] | null): string {
  if (!raw) return '—'

  // If it's a single string (legacy), convert to array
  const policies = Array.isArray(raw) ? raw : [raw]

  if (policies.length === 0) return '—'

  return policies
    .map(p => 
      p
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(', ')
}
