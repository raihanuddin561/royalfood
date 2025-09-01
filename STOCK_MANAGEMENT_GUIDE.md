# Royal Food Stock Management - Best Practices Guide

## ✅ Stock Management Issue RESOLVED

**Your Example:**
- Had: 15 kg chicken
- Used: 5 kg → Expected: 10 kg ✓ (Correct)
- Purchased: 10 kg → Expected: 20 kg ✓ (Now shows 20 kg correctly)

**What Caused the 25 kg Issue:**
- Multiple purchase entries for the same stock addition
- Using both Purchase Orders AND direct inventory addition
- This created double-counting (15+10=25 instead of 10+10=20)

---

## 🎯 RECOMMENDED WORKFLOW

### For PURCHASES (95% of stock additions):
1. **Create Purchase Order** → Menu → Purchase Orders → New Order
2. **Receive Items** → Purchase Orders → Mark as Received  
3. **Stock Updates Automatically** ✅

### For STOCK USAGE:
1. **Recipe Usage** → Operations → Record Recipe Usage
2. **Sales** → Automatically deducts stock when order placed
3. **Manual Usage** → Operations → Record Stock Usage

### For ADJUSTMENTS (rare):
1. **Use Stock Reconciliation** → Financial Management → Stock Reconciliation
2. **Only if actual discrepancy found** → Create manual adjustment

---

## ❌ AVOID THESE COMMON MISTAKES

### ❌ WRONG: Multiple Stock Entry Methods
```
Creating Purchase Order → THEN also adding via Financial → Inventory
This creates DOUBLE stock addition!
```

### ❌ WRONG: Direct Inventory Addition for Purchases  
```
Financial → Quick Actions → Stock Input
(Only use this for one-time corrections, not regular purchases)
```

### ❌ WRONG: Not Checking Existing Stock Logs
```
Adding stock without checking if purchase was already recorded
```

---

## ✅ CORRECT WORKFLOWS

### New Purchase Received:
```
1. Menu → Purchase Orders → Create New Order
2. Enter: Supplier, Items, Quantities, Prices  
3. Save Purchase Order
4. When delivered: Mark Order as "Received"
5. Stock automatically updates ✅
```

### Recipe Made (Stock Used):
```
1. Operations → Record Recipe Usage
2. Select Recipe → Enter Quantity Made
3. Stock automatically reduces ✅
```

### Stock Count Discrepancy:
```
1. Financial Management → Stock Reconciliation
2. Review discrepancies (system shows expected vs actual)
3. Only create adjustment if real discrepancy found
```

---

## 🔍 HOW TO CHECK FOR ISSUES

### Stock Reconciliation (Weekly):
1. Go to **Financial Management** → **Stock Reconciliation**
2. Review any discrepancies shown
3. Differences < 0.001 kg = Normal (floating point precision)
4. Differences > 0.1 kg = Investigate

### Recent Stock Movements:
1. In Stock Reconciliation page
2. Click **"View Recent Movements"**
3. Look for duplicate entries with same quantity/date

---

## 🚨 WARNING SYSTEM

The system now warns you when:
- ⚠️ Multiple similar purchases in short time
- ⚠️ Insufficient stock for usage
- ⚠️ Potential duplicate entries

**If you see warnings:**
1. Check if purchase was already recorded via Purchase Orders
2. Use Purchase Order workflow instead of direct inventory addition
3. Contact admin if unsure

---

## 📊 MONITORING & REPORTS

### Daily Checks:
- Stock levels for low-stock items
- Today's stock movements in Operations

### Weekly Checks:  
- Stock Reconciliation report
- Purchase Order completion status

### Monthly Checks:
- Full financial reports including stock valuations
- Supplier purchase patterns

---

## 🔧 TROUBLESHOOTING

### "Stock showing wrong amount":
1. Check Stock Reconciliation first
2. Review Recent Stock Movements  
3. Look for duplicate purchase entries
4. Use reconciliation tool to fix if needed

### "Cannot use stock - insufficient quantity":
1. Check current stock levels
2. Verify if recent purchases were recorded properly
3. Check if stock was double-counted elsewhere

### "Expense not matching stock purchase":
1. Ensure Purchase Orders include correct prices
2. Check expense categories are set up properly
3. Use Purchase Order workflow (creates expenses automatically)

---

## 📞 SUPPORT

If you continue seeing discrepancies:
1. Run Stock Reconciliation report
2. Note specific items showing issues  
3. Check Recent Stock Movements for those items
4. Document the expected vs actual stock amounts

The system is now protected against the most common causes of stock calculation errors!
