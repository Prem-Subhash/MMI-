export function formatUSPhone(value: string): string {
  if (!value) return value;
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
}

export function parseNumber(value: string): number | null {
  const parsed = Number(value);
  return isNaN(parsed) ? null : parsed;
}
