/**
 * Formats a raw phone string into (XXX) XXX-XXXX format.
 * Strips any existing non-digits before formatting.
 */
export function formatPhoneNumber(value: string | null | undefined): string {
  if (!value) return '';
  
  // Remove all non-digits
  const cleaned = value.replace(/\D/g, '');
  
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 3) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  
  // Limit to 10 digits
  const max10 = cleaned.slice(0, 10);
  return `(${max10.slice(0, 3)}) ${max10.slice(3, 6)}-${max10.slice(6, 10)}`;
}

/**
 * Strips formatting and returns only digits.
 * Limits to 10 digits maximum.
 */
export function stripPhoneNumber(value: string | null | undefined): string {
  if (!value) return '';
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.slice(0, 10);
}

/**
 * Validates if the given string represents exactly 10 digits.
 */
export function isValidPhoneNumber(value: string | null | undefined): boolean {
  if (!value) return false;
  return stripPhoneNumber(value).length === 10;
}
