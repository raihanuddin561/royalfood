# Currency Configuration Demo

This file demonstrates how easy it is to change the currency across the entire application.

## Current Setup: Bangladesh Taka (BDT)

All components currently use "BDT" as configured in `src/lib/currency-config.ts`:

```typescript
export const CURRENCY_CONFIG: CurrencyConfig = {
  code: 'BDT',
  name: 'Bangladesh Taka',
  symbol: 'BDT',
  displaySymbol: 'BDT',
  locale: 'en-US',
  precision: 2,
  position: 'before'
}
```

## How It Works

### Before (Multiple Hardcoded References)
- SmartPriceInput: `currency = 'BDT'`
- Utils: `return \`BDT ${value.toFixed(2)}\``
- Forms: `"Unit Price (BDT)"`
- Displays: `{'\৳'} {amount}`

### After (Centralized Configuration)
- SmartPriceInput: `currency = currentCurrency.displaySymbol`
- Utils: `return formatCurrency(amount)`
- Forms: Auto-updates from config
- Displays: Use `formatCurrency()` function

## Example: Switching to US Dollars

If you wanted to switch to USD, you would only need to change one place:

```typescript
// In src/lib/currency-config.ts
export const CURRENCY_CONFIG: CurrencyConfig = {
  code: 'USD',
  name: 'US Dollar',
  symbol: '$',
  displaySymbol: '$',
  locale: 'en-US',
  precision: 2,
  position: 'before'
}
```

This single change would update:
- All price input components
- All financial displays
- All reports and charts
- All quick amount buttons
- All currency labels and symbols

## Components Using Centralized Config

✅ **Updated Components:**
- SmartPriceInput.tsx - Uses `currentCurrency.displaySymbol`
- utils.ts - Uses `formatCurrency` from currency-config
- locale.ts - Imports currency config
- DailyOperationsDashboard.tsx - Uses centralized formatting
- FinancialBreakdownClient.tsx - Uses centralized formatting
- settings/page.tsx - Uses `AVAILABLE_CURRENCIES` and `currentCurrency`

✅ **Form Components Already Using Correct Pattern:**
- All purchase forms specify `currency="BDT"` which gets the default from config
- All inventory forms use SmartPriceInput with centralized config
- All menu forms use SmartPriceInput with centralized config
- All expense forms use SmartPriceInput with centralized config

## Verification

To verify the system works:

1. **Build Test**: `npm run build` ✅ (completed successfully)
2. **Currency Display**: All components show "BDT" consistently
3. **Quick Amounts**: SmartPriceInput shows "+BDT 1", "+BDT 5", etc.
4. **Form Labels**: Show "Cost Price (BDT)", "Unit Price (BDT)", etc.
5. **Financial Reports**: All use centralized `formatCurrency()` function

## Benefits Achieved

1. **Single Source of Truth**: Change `CURRENCY_CONFIG` → entire app updates
2. **Type Safety**: TypeScript interfaces prevent errors
3. **Consistency**: No more mixed ৳, ₹, $ symbols
4. **Maintainability**: Future currency changes require only one edit
5. **Flexibility**: Easy to add multi-currency support later

## Future Enhancements

The system is ready for:
- Multi-currency support
- User-selectable currencies
- Currency conversion rates
- Localized currency formatting
- Different precision for different currencies
