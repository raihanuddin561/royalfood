BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE lower(typname) = lower('PayMode')) THEN
    EXECUTE 'CREATE TYPE "PayMode" AS ENUM (''DAILY'',''HOURLY'')';
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'payMode'
  ) THEN
    EXECUTE 'ALTER TABLE "employees" ADD COLUMN "payMode" "PayMode" NOT NULL DEFAULT ''DAILY''';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'employees' AND column_name = 'standardHoursPerDay'
  ) THEN
    EXECUTE 'ALTER TABLE "employees" ADD COLUMN "standardHoursPerDay" INTEGER NOT NULL DEFAULT 8';
  END IF;
END$$;

COMMIT;
