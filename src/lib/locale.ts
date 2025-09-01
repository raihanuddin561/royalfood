// Language configuration for the restaurant management system
// Currently using English, but can be easily switched to Bengali or other languages

import { currentCurrency, formatCurrency } from './currency-config'

export type SupportedLocale = 'en' | 'bn'

export const defaultLocale: SupportedLocale = 'en'

export const localeConfig = {
  en: {
    currency: {
      locale: 'en-US',
      currency: currentCurrency.code,
      currencyDisplay: 'symbol' as const
    },
    date: {
      locale: 'en-US',
      timeZone: 'Asia/Dhaka'
    },
    numbers: {
      locale: 'en-US'
    }
  },
  bn: {
    currency: {
      locale: 'bn-BD',
      currency: currentCurrency.code,
      currencyDisplay: 'symbol' as const
    },
    date: {
      locale: 'bn-BD',
      timeZone: 'Asia/Dhaka'
    },
    numbers: {
      locale: 'bn-BD'
    }
  }
}

// Get current locale configuration
export function getCurrentLocaleConfig() {
  return localeConfig[defaultLocale]
}

// Format currency with current locale - now uses centralized currency config
export function formatCurrencyWithLocale(amount: number, locale: SupportedLocale = defaultLocale): string {
  // Use the centralized currency formatting for consistency
  return formatCurrency(amount)
}

// Format date with current locale
export function formatDateWithLocale(date: Date | string, locale: SupportedLocale = defaultLocale): string {
  const config = localeConfig[locale]
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(config.date.locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: config.date.timeZone
  }).format(d)
}

// Format date and time with current locale
export function formatDateTimeWithLocale(date: Date | string, locale: SupportedLocale = defaultLocale): string {
  const config = localeConfig[locale]
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat(config.date.locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: config.date.timeZone
  }).format(d)
}

// Format numbers with current locale
export function formatNumberWithLocale(number: number, locale: SupportedLocale = defaultLocale): string {
  const config = localeConfig[locale]
  return new Intl.NumberFormat(config.numbers.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(number)
}
