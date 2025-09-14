-- Migration to add deliveryCharge column to menu_items table
-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN "deliveryCharge" DOUBLE PRECISION NOT NULL DEFAULT 0;