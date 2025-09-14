ALTER TABLE "purchase_items" 
ADD COLUMN IF NOT EXISTS "receivedQuantity" DOUBLE PRECISION DEFAULT 0;

ALTER TABLE "purchase_items" 
ADD COLUMN IF NOT EXISTS "lastReceivedAt" TIMESTAMPTZ;

ALTER TABLE "users" 
ALTER COLUMN "partnerId" DROP NOT NULL;

ALTER TABLE "purchases" 
ALTER COLUMN "supplierId" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "purchase_items_receivedQuantity_idx" ON "purchase_items"("receivedQuantity");
CREATE INDEX IF NOT EXISTS "purchase_items_lastReceivedAt_idx" ON "purchase_items"("lastReceivedAt");
CREATE INDEX IF NOT EXISTS "users_partnerId_idx" ON "users"("partnerId");
CREATE INDEX IF NOT EXISTS "purchases_supplierId_idx" ON "purchases"("supplierId");