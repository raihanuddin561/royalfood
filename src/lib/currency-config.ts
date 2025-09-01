// Centralized Currency Configuration
// This is the single source of truth for all currency-related settings

export interface CurrencyConfig {
  code: string
  name: string
  symbol: string
  displaySymbol: string
  locale: string
  precision: number
  position: 'before' | 'after'
}

// Main currency configuration - change this to update currency across entire app
export const CURRENCY_CONFIG: CurrencyConfig = {
  code: 'BDT',
  name: 'Bangladesh Taka',
  symbol: 'BDT',
  displaySymbol: 'BDT', // What users see in the UI
  locale: 'en-US', // Number formatting locale
  precision: 2, // Decimal places
  position: 'before' // Symbol position: "BDT 100.00" vs "100.00 BDT"
}

// Alternative configurations (easily switch by changing CURRENCY_CONFIG above)
export const AVAILABLE_CURRENCIES = {
  BDT: {
    code: 'BDT',
    name: 'Bangladesh Taka',
    symbol: 'BDT',
    displaySymbol: 'BDT',
    locale: 'en-US',
    precision: 2,
    position: 'before' as const
  },
  // Future currencies can be added here if needed
  // USD: {
  //   code: 'USD',
  //   name: 'US Dollar',
  //   symbol: '$',
  //   displaySymbol: '$',
  //   locale: 'en-US',
  //   precision: 2,
  //   position: 'before' as const
  // }
} as const

// Core currency formatting function
export function formatCurrency(
  amount: number | null | undefined, 
  config: CurrencyConfig = CURRENCY_CONFIG
): string {
  try {
    const value = amount || 0
    if (!isFinite(value) || isNaN(value)) {
      return config.position === 'before' 
        ? `${config.displaySymbol} 0.${'0'.repeat(config.precision)}`
        : `0.${'0'.repeat(config.precision)} ${config.displaySymbol}`
    }

    const formattedNumber = value.toFixed(config.precision)
    
    return config.position === 'before'
      ? `${config.displaySymbol} ${formattedNumber}`
      : `${formattedNumber} ${config.displaySymbol}`
  } catch (error) {
    console.warn('Currency formatting error:', error)
    const fallback = (amount || 0).toFixed(config.precision)
    return config.position === 'before'
      ? `${config.displaySymbol} ${fallback}`
      : `${fallback} ${config.displaySymbol}`
  }
}

// Format currency using Intl.NumberFormat (more advanced formatting)
export function formatCurrencyIntl(
  amount: number | null | undefined,
  config: CurrencyConfig = CURRENCY_CONFIG
): string {
  try {
    const value = amount || 0
    if (!isFinite(value) || isNaN(value)) {
      return formatCurrency(0, config)
    }

    // For BDT, we'll use our custom format since Intl doesn't recognize BDT properly
    if (config.code === 'BDT') {
      return formatCurrency(value, config)
    }

    // For other currencies, use Intl.NumberFormat
    return new Intl.NumberFormat(config.locale, {
      style: 'currency',
      currency: config.code,
      minimumFractionDigits: config.precision,
      maximumFractionDigits: config.precision,
    }).format(value)
  } catch (error) {
    console.warn('Intl currency formatting error, falling back to basic format:', error)
    return formatCurrency(amount, config)
  }
}

// Format amount without currency symbol (just the number)
export function formatAmount(
  amount: number | null | undefined,
  config: CurrencyConfig = CURRENCY_CONFIG
): string {
  try {
    const value = amount || 0
    if (!isFinite(value) || isNaN(value)) {
      return `0.${'0'.repeat(config.precision)}`
    }

    return new Intl.NumberFormat(config.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: config.precision,
    }).format(value)
  } catch (error) {
    console.warn('Amount formatting error:', error)
    return (amount || 0).toFixed(config.precision)
  }
}

// Get currency symbol for display
export function getCurrencySymbol(config: CurrencyConfig = CURRENCY_CONFIG): string {
  return config.displaySymbol
}

// Get currency code
export function getCurrencyCode(config: CurrencyConfig = CURRENCY_CONFIG): string {
  return config.code
}

// Get currency name
export function getCurrencyName(config: CurrencyConfig = CURRENCY_CONFIG): string {
  return config.name
}

// Validate if amount is valid for currency
export function isValidCurrencyAmount(amount: any): boolean {
  if (amount === null || amount === undefined) return true // Allow null/undefined
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return typeof num === 'number' && isFinite(num) && !isNaN(num) && num >= 0
}

// Parse string amount to number
export function parseCurrencyAmount(amount: string | number): number {
  if (typeof amount === 'number') return amount
  if (typeof amount === 'string') {
    // Remove currency symbols and whitespace
    const cleaned = amount.replace(/[^\d.-]/g, '')
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

// Quick amount options for UI (like +BDT 1, +BDT 5, etc.)
export function getQuickAmountOptions(config: CurrencyConfig = CURRENCY_CONFIG): Array<{value: number, label: string}> {
  const amounts = [1, 5, 10, 50, 100, 500, 1000]
  return amounts.map(amount => ({
    value: amount,
    label: `+${config.displaySymbol} ${amount}`
  }))
}

// Export current configuration for easy access
export const currentCurrency = CURRENCY_CONFIG
export const formatCurrencyDefault = (amount: number | null | undefined) => formatCurrency(amount)
export const formatAmountDefault = (amount: number | null | undefined) => formatAmount(amount)
