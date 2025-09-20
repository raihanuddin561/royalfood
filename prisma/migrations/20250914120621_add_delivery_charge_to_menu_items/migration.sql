-- Migration to add deliveryCharge column to menu_items table
-- AlterTable - Add column only if it doesn't exist
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0;