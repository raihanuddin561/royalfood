# Cost Calculation System - Complete Analysis

## Issue Resolution: Missing Costs in Reports

### Problem Identified
You reported that "only salary is counted for costs, usage stock not calculated for costs" - this was partially correct. The system actually has **two different report pages** with different levels of cost tracking:

### 📊 **Main Reports Page** (`/reports`) - ✅ COMPLETE COST TRACKING
**Location**: `src/app/reports/page.tsx`
**Function**: Uses `getComprehensiveProfitAnalysis()` 
**Includes ALL costs**:
- ✅ **COGS (Cost of Goods Sold)**: From inventory stock-outs
- ✅ **Stock Expenses**: From `expenses` table with type='STOCK'
- ✅ **Payroll/Salary**: From `expenses` table with type='PAYROLL'
- ✅ **Utilities**: From `expenses` table with type='UTILITIES'
- ✅ **Operational**: From `expenses` table with type='OPERATIONAL'
- ✅ **Rent, Maintenance, Insurance, Taxes, Marketing**: All included

### 📦 **Inventory Reports Page** (`/inventory/reports`) - ⚠️ WAS INCOMPLETE (NOW FIXED)
**Location**: `src/app/inventory/reports/page.tsx`
**Previous State**: Only calculated basic inventory movements
**Fixed Now**: Added comprehensive cost tracking

## 🔧 What I Fixed

### 1. Added Missing Data Sources
```typescript
// Added to data fetching:
- StockUsage costs (ingredient consumption)
- Expense table costs (salary, utilities, operational)
- Monthly breakdowns for both
```

### 2. Enhanced Cost Calculations
```typescript
// COGS now includes ALL cost components:
const totalCOGS = stockOutValue + wasteValue + totalStockUsageCost

// Added Net Profit calculation:
const netProfit = grossProfit - totalOperatingExpenses
```

### 3. Added Comprehensive UI
- **Cost Breakdown Analysis** section showing:
  - COGS breakdown (Stock movements, Production usage, Waste)
  - Operating expenses by type (Payroll, Utilities, Operational, etc.)
  - Monthly vs total comparisons

## 💰 Complete Cost Structure

### Cost of Goods Sold (COGS)
1. **Stock Movement (Sales)**: From `inventoryLogs` with type='STOCK_OUT'
2. **Stock Usage (Production)**: From `stockUsage` table with `totalCost` field
3. **Waste & Spoilage**: From `inventoryLogs` with type='WASTE'

### Operating Expenses
1. **Payroll**: Employee salaries from `expenses` table
2. **Utilities**: Electricity, water, gas costs
3. **Operational**: Daily operation costs
4. **Rent**: Property rental costs
5. **Maintenance**: Equipment repairs
6. **Insurance**: Business insurance
7. **Marketing**: Advertising costs
8. **Taxes**: Government taxes
9. **Other**: Miscellaneous expenses

## 📋 Database Tables Used

### Primary Cost Tables:
- `stock_usage`: Daily ingredient consumption with `totalCost`
- `expenses`: All operational costs categorized by type
- `inventory_logs`: Stock movements for COGS calculation

### Cost Calculation Flow:
1. **StockUsage** → Tracks daily ingredient costs (`quantity × costPerUnit = totalCost`)
2. **InventoryLog** → Tracks stock movements for sales/waste
3. **Expense** → Tracks all operational costs (salary, utilities, etc.)
4. **ExpenseCategory** → Categorizes expenses by type

## 🎯 How to Use the System

### For Complete Cost Analysis:
- **Main Reports** (`/reports`): View comprehensive profit/loss with all costs
- **Inventory Reports** (`/inventory/reports`): Focus on inventory-specific costs with breakdown

### For Cost Entry:
1. **Stock Costs**: Automatically calculated from purchases and usage
2. **Salary Costs**: Enter in expenses with category type='PAYROLL'
3. **Utility Costs**: Enter in expenses with category type='UTILITIES'
4. **Operational Costs**: Enter in expenses with category type='OPERATIONAL'

## ✅ Resolution Summary

**Fixed Issues**:
1. ✅ Stock usage costs now included in inventory reports COGS
2. ✅ All expense types (salary, utilities, operational) now displayed
3. ✅ Comprehensive cost breakdown with detailed categories
4. ✅ Monthly vs total cost comparisons
5. ✅ Net profit calculation including all operating expenses

**Both report pages now provide complete cost tracking** - use the main `/reports` page for business overview, and `/inventory/reports` page for detailed inventory cost analysis.
