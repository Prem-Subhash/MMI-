export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') return '$0.00'
  const numericAmount = typeof amount === 'string' ? parseFloat(amount.toString().replace(/[^0-9.-]+/g, "")) : amount
  if (isNaN(numericAmount)) return '$0.00'
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numericAmount)
}
