/*
  Warnings:

  - You are about to drop the column `mealType` on the `menu_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."menu_items" DROP COLUMN "mealType",
ADD COLUMN     "mealTypes" "public"."MealType"[] DEFAULT ARRAY['LUNCH']::"public"."MealType"[];
