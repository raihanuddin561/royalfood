import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency in BDT (Bangladesh Taka) with English locale
// Note: Using English formatting as requested. Bengali locale available in locale.ts
export function formatCurrency(amount: number | null | undefined): string {
  try {
    const value = amount || 0
    if (!isFinite(value) || isNaN(value)) {
      return '৳0.00'
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  } catch (error) {
    console.warn('Currency formatting error:', error)
    return `৳${(amount || 0).toFixed(2)}`
  }
}

// Format currency without symbol (just the number with commas) - English locale
export function formatAmount(amount: number | null | undefined): string {
  try {
    const value = amount || 0
    if (!isFinite(value) || isNaN(value)) {
      return '0.00'
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  } catch (error) {
    console.warn('Amount formatting error:', error)
    return (amount || 0).toFixed(2)
  }
}

// Generate unique IDs for orders, purchases, etc.
export function generateId(prefix: string = ''): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 7)
  return `${prefix}${timestamp}${random}`.toUpperCase()
}

// Format date to English locale with Dhaka timezone
// Note: Using English formatting as requested. Bengali locale available in locale.ts
export function formatDate(date: Date | string | null | undefined): string {
  try {
    if (!date) return new Date().toLocaleDateString('en-US')
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) {
      return new Date().toLocaleDateString('en-US')
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'Asia/Dhaka'
    }).format(d)
  } catch (error) {
    console.warn('Date formatting error:', error)
    return new Date().toLocaleDateString('en-US')
  }
}

// Format date and time - English locale with Dhaka timezone
export function formatDateTime(date: Date | string | null | undefined): string {
  try {
    if (!date) return new Date().toLocaleString('en-US')
    const d = typeof date === 'string' ? new Date(date) : date
    if (isNaN(d.getTime())) {
      return new Date().toLocaleString('en-US')
    }
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Dhaka'
    }).format(d)
  } catch (error) {
    console.warn('DateTime formatting error:', error)
    return new Date().toLocaleString('en-US')
  }
}

// Calculate percentage
export function calculatePercentage(value: number | null | undefined, total: number | null | undefined): number {
  try {
    const val = value || 0
    const tot = total || 0
    if (tot === 0 || !isFinite(val) || !isFinite(tot)) return 0
    return (val / tot) * 100
  } catch (error) {
    console.warn('Percentage calculation error:', error)
    return 0
  }
}

// Round to 2 decimal places
export function roundToTwo(num: number | null | undefined): number {
  try {
    const value = num || 0
    if (!isFinite(value) || isNaN(value)) return 0
    return Math.round(value * 100) / 100
  } catch (error) {
    console.warn('Rounding error:', error)
    return 0
  }
}
