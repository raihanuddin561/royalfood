BEGIN;
CREATE TYPE IF NOT EXISTS "UserRole" AS ENUM ('ADMIN','MANAGER','EMPLOYEE','CUSTOMER');
CREATE TYPE IF NOT EXISTS "PayrollStatus" AS ENUM ('PENDING','APPROVED','PAID');
CREATE TYPE IF NOT EXISTS "InventoryLogType" AS ENUM ('STOCK_IN','STOCK_OUT','ADJUSTMENT','WASTE','TRANSFER');
CREATE TYPE IF NOT EXISTS "PurchaseStatus" AS ENUM ('PENDING','RECEIVED','CANCELLED');
CREATE TYPE IF NOT EXISTS "OrderType" AS ENUM ('DINE_IN','TAKEAWAY','DELIVERY');
CREATE TYPE IF NOT EXISTS "OrderStatus" AS ENUM ('PENDING','CONFIRMED','PREPARING','READY','SERVED','COMPLETED','CANCELLED');
CREATE TYPE IF NOT EXISTS "PaymentMethod" AS ENUM ('CASH','CARD','DIGITAL_WALLET','BANK_TRANSFER');
CREATE TYPE IF NOT EXISTS "SaleStatus" AS ENUM ('COMPLETED','REFUNDED','CANCELLED');
CREATE TYPE IF NOT EXISTS "ExpenseType" AS ENUM ('OPERATIONAL','STOCK','PAYROLL','UTILITIES','RENT','MARKETING','MAINTENANCE','INSURANCE','TAXES','OTHER');
CREATE TYPE IF NOT EXISTS "ExpenseStatus" AS ENUM ('PENDING','APPROVED','REJECTED','PAID');
CREATE TYPE IF NOT EXISTS "RecurringPeriod" AS ENUM ('DAILY','WEEKLY','MONTHLY','QUARTERLY','YEARLY');
CREATE TYPE IF NOT EXISTS "ReportType" AS ENUM ('DAILY','WEEKLY','MONTHLY','QUARTERLY','YEARLY','CUSTOM');

 
CREATE TABLE IF NOT EXISTS "partners" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "sharePercent" DOUBLE PRECISION NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "partners_email_key" ON "partners"("email");

CREATE TABLE IF NOT EXISTS "profit_shares" (
  "id" TEXT PRIMARY KEY,
  "partnerId" TEXT NOT NULL,
  "period" TIMESTAMPTZ NOT NULL,
  "revenue" DOUBLE PRECISION NOT NULL,
  "expenses" DOUBLE PRECISION NOT NULL,
  "profit" DOUBLE PRECISION NOT NULL,
  "share" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "profit_shares_partnerId_idx" ON "profit_shares"("partnerId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profit_shares_partnerId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "profit_shares" ADD CONSTRAINT "profit_shares_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "partners"("id") ON DELETE CASCADE ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

 
CREATE TABLE IF NOT EXISTS "employees" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "position" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "salary" DOUBLE PRECISION NOT NULL,
  "hourlyRate" DOUBLE PRECISION,
  "hireDate" TIMESTAMPTZ NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "employees_userId_key" ON "employees"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "employees_employeeId_key" ON "employees"("employeeId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_userId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "employees" ADD CONSTRAINT "employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

CREATE TABLE IF NOT EXISTS "attendance" (
  "id" TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "date" TIMESTAMPTZ NOT NULL,
  "checkIn" TIMESTAMPTZ,
  "checkOut" TIMESTAMPTZ,
  "totalHours" DOUBLE PRECISION,
  "overtimeHours" DOUBLE PRECISION,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "attendance_employeeId_idx" ON "attendance"("employeeId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_employeeId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "attendance" ADD CONSTRAINT "attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

CREATE TABLE IF NOT EXISTS "payrolls" (
  "id" TEXT PRIMARY KEY,
  "employeeId" TEXT NOT NULL,
  "period" TIMESTAMPTZ NOT NULL,
  "basicSalary" DOUBLE PRECISION NOT NULL,
  "overtime" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "bonuses" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "deductions" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "status" "PayrollStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "payrolls_employeeId_idx" ON "payrolls"("employeeId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payrolls_employeeId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

 
CREATE TABLE IF NOT EXISTS "categories" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name");

CREATE TABLE IF NOT EXISTS "suppliers" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "contactName" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "address" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "items" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "supplierId" TEXT,
  "sku" TEXT NOT NULL,
  "description" TEXT,
  "specification" TEXT,
  "brand" TEXT,
  "grade" TEXT,
  "expiryDate" TIMESTAMPTZ,
  "receivedDate" TIMESTAMPTZ,
  "unit" TEXT NOT NULL,
  "packSize" TEXT,
  "costPrice" DOUBLE PRECISION NOT NULL,
  "sellingPrice" DOUBLE PRECISION,
  "reorderLevel" DOUBLE PRECISION NOT NULL,
  "currentStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "items_sku_key" ON "items"("sku");
CREATE INDEX IF NOT EXISTS "items_categoryId_idx" ON "items"("categoryId");
CREATE INDEX IF NOT EXISTS "items_supplierId_idx" ON "items"("supplierId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'items_categoryId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "items" ADD CONSTRAINT "items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'items_supplierId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "items" ADD CONSTRAINT "items_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

 
CREATE TABLE IF NOT EXISTS "inventory_logs" (
  "id" TEXT PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "InventoryLogType" NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "previousStock" DOUBLE PRECISION NOT NULL,
  "newStock" DOUBLE PRECISION NOT NULL,
  "reason" TEXT,
  "reference" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "inventory_logs_itemId_idx" ON "inventory_logs"("itemId");
CREATE INDEX IF NOT EXISTS "inventory_logs_userId_idx" ON "inventory_logs"("userId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_logs_itemId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_logs_userId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "inventory_logs" ADD CONSTRAINT "inventory_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

 
CREATE TABLE IF NOT EXISTS "stock_usage" (
  "id" TEXT PRIMARY KEY,
  "itemId" TEXT NOT NULL,
  "menuItemId" TEXT,
  "orderId" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "costPerUnit" DOUBLE PRECISION NOT NULL,
  "totalCost" DOUBLE PRECISION NOT NULL,
  "usageDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "reason" TEXT NOT NULL DEFAULT 'PRODUCTION',
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "stock_usage_itemId_idx" ON "stock_usage"("itemId");
CREATE INDEX IF NOT EXISTS "stock_usage_menuItemId_idx" ON "stock_usage"("menuItemId");
CREATE INDEX IF NOT EXISTS "stock_usage_orderId_idx" ON "stock_usage"("orderId");
CREATE INDEX IF NOT EXISTS "stock_usage_userId_idx" ON "stock_usage"("userId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_usage_itemId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "stock_usage" ADD CONSTRAINT "stock_usage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_usage_menuItemId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "stock_usage" ADD CONSTRAINT "stock_usage_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_usage_orderId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "stock_usage" ADD CONSTRAINT "stock_usage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stock_usage_userId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "stock_usage" ADD CONSTRAINT "stock_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

 
CREATE TABLE IF NOT EXISTS "menu_items" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "description" TEXT,
  "price" DOUBLE PRECISION NOT NULL,
  "costPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isAvailable" BOOLEAN NOT NULL DEFAULT TRUE,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "image" TEXT,
  "prepTime" INTEGER,
  "servingSize" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "menu_items_categoryId_idx" ON "menu_items"("categoryId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_items_categoryId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

CREATE TABLE IF NOT EXISTS "recipe_items" (
  "id" TEXT PRIMARY KEY,
  "menuItemId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "recipe_items_menuItemId_idx" ON "recipe_items"("menuItemId");
CREATE INDEX IF NOT EXISTS "recipe_items_itemId_idx" ON "recipe_items"("itemId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_items_menuItemId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'recipe_items_itemId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "recipe_items" ADD CONSTRAINT "recipe_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

 
CREATE TABLE IF NOT EXISTS "purchases" (
  "id" TEXT PRIMARY KEY,
  "supplierId" TEXT NOT NULL,
  "purchaseNumber" TEXT NOT NULL,
  "purchaseDate" TIMESTAMPTZ NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "status" "PurchaseStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "purchases_purchaseNumber_key" ON "purchases"("purchaseNumber");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_supplierId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

CREATE TABLE IF NOT EXISTS "purchase_items" (
  "id" TEXT PRIMARY KEY,
  "purchaseId" TEXT NOT NULL,
  "itemId" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "totalPrice" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "purchase_items_purchaseId_idx" ON "purchase_items"("purchaseId");
CREATE INDEX IF NOT EXISTS "purchase_items_itemId_idx" ON "purchase_items"("itemId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_items_purchaseId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchase_items_itemId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

 
CREATE TABLE IF NOT EXISTS "orders" (
  "id" TEXT PRIMARY KEY,
  "orderNumber" TEXT NOT NULL,
  "customerId" TEXT,
  "userId" TEXT NOT NULL,
  "orderType" "OrderType" NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "tableNumber" TEXT,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "finalAmount" DOUBLE PRECISION NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "orders_orderNumber_key" ON "orders"("orderNumber");
CREATE INDEX IF NOT EXISTS "orders_userId_idx" ON "orders"("userId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_userId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

CREATE TABLE IF NOT EXISTS "order_items" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "menuItemId" TEXT,
  "itemId" TEXT,
  "quantity" DOUBLE PRECISION NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "totalPrice" DOUBLE PRECISION NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "order_items_orderId_idx" ON "order_items"("orderId");
CREATE INDEX IF NOT EXISTS "order_items_menuItemId_idx" ON "order_items"("menuItemId");
CREATE INDEX IF NOT EXISTS "order_items_itemId_idx" ON "order_items"("itemId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_orderId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_menuItemId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_itemId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "order_items" ADD CONSTRAINT "order_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

 
CREATE TABLE IF NOT EXISTS "sales" (
  "id" TEXT PRIMARY KEY,
  "orderId" TEXT,
  "saleNumber" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "saleDate" TIMESTAMPTZ NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "finalAmount" DOUBLE PRECISION NOT NULL,
  "paymentMethod" "PaymentMethod" NOT NULL,
  "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "sales_saleNumber_key" ON "sales"("saleNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "sales_orderId_key" ON "sales"("orderId");
CREATE INDEX IF NOT EXISTS "sales_userId_idx" ON "sales"("userId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_userId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "sales" ADD CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sales_orderId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "sales" ADD CONSTRAINT "sales_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

CREATE TABLE IF NOT EXISTS "menu_item_sales" (
  "id" TEXT PRIMARY KEY,
  "menuItemId" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "totalPrice" DOUBLE PRECISION NOT NULL,
  "unitCost" DOUBLE PRECISION NOT NULL,
  "totalCost" DOUBLE PRECISION NOT NULL,
  "grossProfit" DOUBLE PRECISION,
  "profitMargin" DOUBLE PRECISION,
  "saleDate" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "menu_item_sales_saleId_idx" ON "menu_item_sales"("saleId");
CREATE INDEX IF NOT EXISTS "menu_item_sales_menuItemId_idx" ON "menu_item_sales"("menuItemId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_item_sales_saleId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "menu_item_sales" ADD CONSTRAINT "menu_item_sales_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'menu_item_sales_menuItemId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "menu_item_sales" ADD CONSTRAINT "menu_item_sales_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "menu_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

 
CREATE TABLE IF NOT EXISTS "expense_categories" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "type" "ExpenseType" NOT NULL DEFAULT 'OPERATIONAL',
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "expense_categories_name_key" ON "expense_categories"("name");

CREATE TABLE IF NOT EXISTS "expenses" (
  "id" TEXT PRIMARY KEY,
  "expenseCategoryId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "expenseDate" TIMESTAMPTZ NOT NULL,
  "receiptImage" TEXT,
  "supplierInfo" TEXT,
  "payrollId" TEXT,
  "employeeId" TEXT,
  "purchaseId" TEXT,
  "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isRecurring" BOOLEAN NOT NULL DEFAULT FALSE,
  "recurringPeriod" "RecurringPeriod",
  "nextDueDate" TIMESTAMPTZ,
  "notes" TEXT,
  "status" "ExpenseStatus" NOT NULL DEFAULT 'APPROVED',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "expenses_expenseCategoryId_idx" ON "expenses"("expenseCategoryId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_expenseCategoryId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "expenses" ADD CONSTRAINT "expenses_expenseCategoryId_fkey" FOREIGN KEY ("expenseCategoryId") REFERENCES "expense_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_employeeId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "expenses" ADD CONSTRAINT "expenses_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_purchaseId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "expenses" ADD CONSTRAINT "expenses_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;$cmd$;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expenses_payrollId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE SET NULL ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

 
CREATE TABLE IF NOT EXISTS "financial_reports" (
  "id" TEXT PRIMARY KEY,
  "reportType" "ReportType" NOT NULL,
  "periodStart" TIMESTAMPTZ NOT NULL,
  "periodEnd" TIMESTAMPTZ NOT NULL,
  "totalRevenue" DOUBLE PRECISION NOT NULL,
  "totalExpenses" DOUBLE PRECISION NOT NULL,
  "totalProfit" DOUBLE PRECISION NOT NULL,
  "stockExpenses" DOUBLE PRECISION NOT NULL,
  "payrollExpenses" DOUBLE PRECISION NOT NULL,
  "operationalExpenses" DOUBLE PRECISION NOT NULL,
  "taxExpenses" DOUBLE PRECISION NOT NULL,
  "partnerShare1" DOUBLE PRECISION,
  "partnerShare2" DOUBLE PRECISION,
  "reportData" JSONB NOT NULL,
  "generatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

 
CREATE TABLE IF NOT EXISTS "security_logs" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT,
  "eventType" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "security_logs_userId_idx" ON "security_logs"("userId");
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'security_logs_userId_fkey') THEN
    EXECUTE $cmd$ALTER TABLE "security_logs" ADD CONSTRAINT "security_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;$cmd$;
  END IF;
EXCEPTION WHEN undefined_table THEN null; END $$;

 
CREATE TABLE IF NOT EXISTS "applied_migrations" (
  "filename" TEXT PRIMARY KEY,
  "checksum" TEXT NOT NULL,
  "applied_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
