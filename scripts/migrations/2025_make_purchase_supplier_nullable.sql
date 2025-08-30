DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'supplierId' AND is_nullable = 'NO'
  ) THEN
    PERFORM (
      SELECT 1
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'purchases' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'supplierId'
    );

    EXECUTE 'ALTER TABLE "purchases" ALTER COLUMN "supplierId" DROP NOT NULL;';

    DO $$
    DECLARE
      fk_name text;
    BEGIN
      SELECT tc.constraint_name INTO fk_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'purchases' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'supplierId'
      LIMIT 1;

      IF fk_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE "purchases" DROP CONSTRAINT %I', fk_name);
      END IF;

      EXECUTE 'ALTER TABLE "purchases" ADD CONSTRAINT purchases_supplierId_fkey FOREIGN KEY ("supplierId") REFERENCES "suppliers"(id) ON DELETE SET NULL ON UPDATE CASCADE;';
    END$$;

  END IF;
END$$;
