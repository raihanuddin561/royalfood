-- CreateEnum
CREATE TYPE "public"."MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');

-- AlterTable
ALTER TABLE "public"."menu_items" ADD COLUMN     "mealType" "public"."MealType" NOT NULL DEFAULT 'LUNCH';
