# 🚀 VERCEL PRODUCTION MIGRATION & TESTING GUIDE

## 📋 **MIGRATION FILES CREATED**

### **1. SQL Migration File**
- **File**: `scripts/migrations/2025_09_01_customer_system_migration.sql`
- **Purpose**: Complete database schema update for customer system
- **Features**: Customers, delivery addresses, enhanced orders, sales integration

### **2. Migration API Endpoint** 
- **Endpoint**: `/api/admin/migrate/customer-system`
- **Methods**: 
  - `GET` - Check migration status
  - `POST` - Run migration
- **Security**: Admin access only

### **3. Test Scripts**
- **File**: `scripts/test-customer-system.js` - Comprehensive test suite
- **File**: `scripts/simple-customer-test.js` - Basic API tests
- **File**: `scripts/run-production-migration.js` - Production migration runner

## 🔄 **RUNNING MIGRATION ON VERCEL**

### **Method 1: Via API Endpoint (Recommended)**

1. **Deploy your code to Vercel**:
   ```bash
   git add .
   git commit -m "Add customer system migration"
   git push origin main
   ```

2. **Check migration status**:
   ```bash
   curl -X GET "https://your-app.vercel.app/api/admin/migrate/customer-system"
   ```

3. **Run migration**:
   ```bash
   curl -X POST "https://your-app.vercel.app/api/admin/migrate/customer-system" \
     -H "Content-Type: application/json"
   ```

### **Method 2: Via Browser (Easier)**

1. **Go to your Vercel deployment**
2. **Open browser console** (F12)
3. **Check status**:
   ```javascript
   fetch('/api/admin/migrate/customer-system')
     .then(r => r.json())
     .then(console.log)
   ```

4. **Run migration**:
   ```javascript
   fetch('/api/admin/migrate/customer-system', { method: 'POST' })
     .then(r => r.json())
     .then(console.log)
   ```

### **Method 3: Via Prisma (Alternative)**

If you prefer using Prisma directly:
```bash
# On your local machine with production DATABASE_URL
npx prisma db push --accept-data-loss
```

## 🧪 **TESTING CUSTOMER FEATURES**

### **1. Test Public Menu**
- **URL**: `https://your-app.vercel.app/public-menu`
- **Expected**: Menu categories and items display
- **Test**: Add items to cart, proceed to checkout

### **2. Test Order Submission**
- **Action**: Complete an order from public menu
- **Expected**: Order number generated, success message
- **Check**: Order appears in admin dashboard

### **3. Test Admin Dashboard**
- **URL**: `https://your-app.vercel.app/admin/customer-orders`
- **Expected**: See submitted orders
- **Test**: Update order status, see sales records created

### **4. Test API Endpoints**

#### **Public Menu API**
```bash
curl "https://your-app.vercel.app/api/public/menu"
```

#### **Customer Registration**
```bash
curl -X POST "https://your-app.vercel.app/api/public/customers/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+8801711111111", 
    "name": "Test Customer",
    "address": "123 Test Street"
  }'
```

#### **Order Submission**
```bash
curl -X POST "https://your-app.vercel.app/api/public/orders/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "orderType": "DELIVERY",
    "items": [{"menuItemId": "MENU_ITEM_ID", "quantity": 1, "unitPrice": 100}],
    "customerInfo": {
      "name": "Test Customer",
      "phone": "+8801711111111",
      "email": "test@example.com", 
      "address": "123 Test Street"
    }
  }'
```

## 🔒 **SECURITY VERIFICATION**

### **Admin Access Check**
```bash
# This should fail with 401 Unauthorized
curl -X POST "https://your-app.vercel.app/api/admin/migrate/customer-system"
```

### **Public Access Check**
```bash
# This should work without authentication
curl "https://your-app.vercel.app/api/public/menu"
```

## 📊 **FEATURE VERIFICATION CHECKLIST**

### **✅ Database Migration**
- [ ] Customer table created
- [ ] Delivery addresses table created  
- [ ] Orders table enhanced with customer columns
- [ ] Sales table enhanced with customer columns
- [ ] Foreign key constraints added
- [ ] Indexes created for performance

### **✅ Public Customer Features**
- [ ] Public menu displays correctly (`/public-menu`)
- [ ] Cart functionality works
- [ ] Order submission works
- [ ] Customer registration works
- [ ] Guest orders work (no registration required)

### **✅ Admin Management Features**  
- [ ] Customer orders dashboard works (`/admin/customer-orders`)
- [ ] Order status updates work
- [ ] Customer information displays correctly
- [ ] Sales records created automatically
- [ ] Order filtering and search work

### **✅ API Endpoints**
- [ ] `GET /api/public/menu` - Menu display
- [ ] `POST /api/public/customers/register` - Customer registration
- [ ] `POST /api/public/orders/submit` - Order submission
- [ ] `GET /api/public/customers/{id}/orders` - Order history
- [ ] `GET /api/admin/orders` - Admin order management
- [ ] `PATCH /api/admin/orders` - Order status updates

## 🚨 **TROUBLESHOOTING**

### **Migration Issues**
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('customers', 'delivery_addresses');

-- Check orders table columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name LIKE '%customer%';
```

### **API Issues**
- **Check Vercel logs** for detailed error information
- **Verify environment variables** are set correctly
- **Test locally first** before deploying to production

### **Customer Feature Issues**
- **Add menu items** if none exist - customer can't order without menu
- **Check user roles** - ensure admin/manager users exist
- **Verify database connection** - ensure Neon/Vercel Postgres is accessible

## 🎯 **PRODUCTION DEPLOYMENT STEPS**

### **1. Pre-deployment**
```bash
# Test locally
npm run dev
# Visit http://localhost:3000/public-menu

# Build and test
npm run build
npm start
```

### **2. Deploy to Vercel**
```bash
git add .
git commit -m "Add customer system with migration"
git push origin main
```

### **3. Run Migration**
Visit: `https://your-app.vercel.app/api/admin/migrate/customer-system`
(Use browser console method shown above)

### **4. Verify Customer Features**
- Visit: `https://your-app.vercel.app/public-menu`
- Test: Complete order flow
- Check: `https://your-app.vercel.app/admin/customer-orders`

## 📈 **SUCCESS INDICATORS**

### **Migration Successful** ✅
- Customer and delivery_addresses tables created
- Orders and sales tables enhanced  
- API endpoints return valid responses
- No database connection errors

### **Customer System Working** ✅
- Public menu displays menu items
- Orders can be submitted successfully
- Admin dashboard shows customer orders
- Order status updates create sales records

### **Ready for Production** ✅
- All API endpoints respond correctly
- Customer ordering flow works end-to-end
- Admin management features functional
- Database integrity maintained

---

## 🎉 **NEXT STEPS AFTER MIGRATION**

1. **Add Menu Items**: Ensure your menu has items for customers to order
2. **Test Complete Flow**: Place a test order from public menu
3. **Train Staff**: Show admin team the new customer orders dashboard
4. **Share Public Menu**: Give customers the `/public-menu` URL
5. **Monitor Orders**: Use `/admin/customer-orders` for order management

Your restaurant app now has a complete customer ordering system ready for production! 🍽️✨
