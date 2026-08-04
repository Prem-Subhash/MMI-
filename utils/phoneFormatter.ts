export const PHONE_REGEX = /^\(\d{3}\) \d{3}-\d{4}$/;

/**
 * Formats a raw phone string into (XXX) XXX-XXXX format.
 * Primarily used for input onChange handlers.
 */
export const formatPhoneInput = (value: string): string => {
    // Strip all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');
    
    if (digitsOnly.length === 0) return '';
    if (digitsOnly.length <= 3) return `(${digitsOnly}`;
    if (digitsOnly.length <= 6) return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
};

/**
 * Strips formatting from a formatted phone string to return only digits.
 * Useful for normalizing search queries to match against the DB.
 */
export const extractDigits = (value: string): string => {
    return value.replace(/\D/g, '');
};

/**
 * Normalizes a user search term.
 * If the user types digits, it returns a partially or fully formatted string 
 * so that `.includes()` or `ilike` works against the formatted DB string.
 * Example: '987' -> '(987', '9876' -> '(987) 6'
 */
export const normalizePhoneSearch = (term: string): string => {
    const digits = extractDigits(term);
    if (!digits) return term; // Return original if no digits
    return formatPhoneInput(digits);
};

/**
 * Safely reformats an unformatted phone number from the database to (XXX) XXX-XXXX.
 * Useful when displaying legacy unformatted numbers during the transition phase.
 */
export const formatDatabasePhone = (phone: string | null | undefined): string => {
    if (!phone) return '';
    // If it's already correctly formatted, return it
    if (PHONE_REGEX.test(phone)) return phone;
    
    // Otherwise try to reformat it
    const digits = extractDigits(phone);
    if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    return phone;
};
