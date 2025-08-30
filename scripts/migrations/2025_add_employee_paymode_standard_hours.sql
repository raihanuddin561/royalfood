-- Safe migration: add PayMode enum and employee columns if missing
-- Non-destructive and idempotent: will only create enum/columns if they don't already exist

BEGIN;

DO $$
BEGIN
  -- Create PayMode enum if missing
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE lower(typname) = lower('PayMode')) THEN
    EXECUTE 'CREATE TYPE "PayMode" AS ENUM (''DAILY'',''HOURLY'')';
  END IF;
END$$;

DO $$
BEGIN
  -- Add payMode column to employees if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'payMode'
  ) THEN
    EXECUTE 'ALTER TABLE "employees" ADD COLUMN "payMode" "PayMode" NOT NULL DEFAULT ''DAILY''';
  END IF;

  -- Add standardHoursPerDay column to employees if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'standardHoursPerDay'
  ) THEN
    EXECUTE 'ALTER TABLE "employees" ADD COLUMN "standardHoursPerDay" INTEGER NOT NULL DEFAULT 8';
  END IF;
END$$;

COMMIT;
