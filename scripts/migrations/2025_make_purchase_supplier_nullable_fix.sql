BEGIN;

-- Make purchases.supplierId nullable and ensure FK uses ON DELETE SET NULL
ALTER TABLE "purchases" ALTER COLUMN "supplierId" DROP NOT NULL;

-- Try dropping common constraint name variants if they exist, then re-add desired FK
ALTER TABLE "purchases" DROP CONSTRAINT IF EXISTS purchases_supplierid_fkey;
ALTER TABLE "purchases" DROP CONSTRAINT IF EXISTS "purchases_supplierId_fkey";

ALTER TABLE "purchases" ADD CONSTRAINT purchases_supplierId_fkey FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
