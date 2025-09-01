# Currency Configuration System

This document explains the centralized currency configuration system implemented in the Royal Food Management System.

## Overview

All currency-related formatting and display is now managed from a single configuration file to ensure consistency across the entire application and make currency changes effortless.

## Configuration File

**Location**: `src/lib/currency-config.ts`

This is the **single source of truth** for all currency settings.

## Current Configuration

```typescript
export const CURRENCY_CONFIG: CurrencyConfig = {
  code: 'BDT',
  name: 'Bangladesh Taka',
  symbol: 'BDT',
  displaySymbol: 'BDT', // What users see in the UI
  locale: 'en-US', // Number formatting locale
  precision: 2, // Decimal places
  position: 'before' // Symbol position: "BDT 100.00" vs "100.00 BDT"
}
```

## How to Change Currency

To change the currency across the entire application:

1. Open `src/lib/currency-config.ts`
2. Update the `CURRENCY_CONFIG` object with your desired currency settings
3. Save the file - all components will automatically use the new currency

## Available Functions

### Core Functions
- `formatCurrency(amount)` - Formats amount with currency symbol
- `formatAmount(amount)` - Formats amount without currency symbol
- `getCurrencySymbol()` - Returns current currency symbol
- `getCurrencyCode()` - Returns current currency code
- `getCurrencyName()` - Returns current currency name

### Utility Functions
- `isValidCurrencyAmount(amount)` - Validates if amount is valid
- `parseCurrencyAmount(amount)` - Parses string to number
- `getQuickAmountOptions()` - Returns quick amount buttons for UI

## Integration Points

The following components and utilities have been updated to use the centralized configuration:

### Core Utilities
- `src/lib/utils.ts` - Main utility functions
- `src/lib/locale.ts` - Localization support

### Components
- `src/components/ui/SmartPriceInput.tsx` - Price input component
- Quick amount buttons automatically use centralized config

### Pages & Features
- Dashboard components
- Financial management
- Expense management  
- Sales pages
- Inventory management
- Menu management
- Reports
- Settings page

## Benefits

1. **Single Point of Control**: Change currency once, affects entire app
2. **Consistency**: All currency displays use the same format
3. **Maintainability**: No need to hunt down hardcoded currency symbols
4. **Flexibility**: Easy to add new currencies or change formatting rules
5. **Type Safety**: TypeScript interfaces ensure proper usage

## Migration from Old System

Previously, currency symbols were hardcoded throughout the application:
- `৳` (Bangla Taka symbol)
- `₹` (Indian Rupee symbol) 
- `$` (Dollar symbol)
- `BDT` (hardcoded text)

All of these have been replaced with calls to the centralized currency functions.

## Example Usage

```typescript
import { formatCurrency, getCurrencySymbol } from '@/lib/currency-config'

// Format currency
const price = formatCurrency(1250.50) // Returns: "BDT 1250.50"

// Get symbol for labels
const symbol = getCurrencySymbol() // Returns: "BDT"

// In components
<SmartPriceInput 
  value={price}
  onChange={setPrice}
  // No need to specify currency prop - uses centralized config
/>
```

## Adding New Currencies (Future)

To add support for additional currencies, add them to the `AVAILABLE_CURRENCIES` object:

```typescript
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
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    displaySymbol: '$',
    locale: 'en-US',
    precision: 2,
    position: 'before' as const
  }
}
```

## Testing

After making changes to the currency configuration:

1. Run `npm run build` to ensure no compilation errors
2. Test key pages: Dashboard, Sales, Inventory, Expenses
3. Verify currency symbols display correctly in forms and reports
4. Check that quick amount buttons show correct currency

## Troubleshooting

**Issue**: Currency not updating in some components
**Solution**: Ensure the component imports from `@/lib/currency-config` not hardcoded values

**Issue**: Build errors after changing currency
**Solution**: Check that all imports are correctly updated and TypeScript types match

**Issue**: Inconsistent formatting
**Solution**: Verify all components use `formatCurrency()` function instead of manual formatting
