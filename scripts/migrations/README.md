Reason for this folder state
=============================

This repository currently contains a single migration under `scripts/migrations/` that makes
`purchases.supplierId` nullable and enforces the FK with `ON DELETE SET NULL`.

At one point earlier a decision was made to remove all previously present migration files and
keep only this single migration file. That change is destructive with respect to migration
history and must be treated carefully. The instructions below explain the risks and the
manual reconciliation steps for databases and other environments.

Risks
-----
- If other environments (staging / production / CI / other dev machines) already applied the
  deleted migrations, those environments now have a migration-history mismatch. This may cause
  deploys or migration checks to fail.
- Deleted migration files may have contained DDL that created enums, tables, indexes, and
  constraints. If any environment lacks those objects, the schema may be incomplete or broken.

Pre-change checklist (do not skip)
---------------------------------
1. Take a full backup of the target database you plan to modify (production, staging, or dev).
2. Notify other team members and pause deployments until reconciliation is complete.

PowerShell commands (copyable)
------------------------------
Replace the placeholders with your actual DB connection values.

Backup (custom format, recommended):
```powershell
$env:PGPASSWORD = 'YOUR_DB_PASSWORD'
pg_dump -Fc -h YOUR_HOST -p YOUR_PORT -U YOUR_DB_USER -d YOUR_DB_NAME -f .\backups\royalfood_pre_supplier_nullable.dump
Remove-Item Env:\PGPASSWORD
```

Backup (plain SQL):
```powershell
$env:PGPASSWORD = 'YOUR_DB_PASSWORD'
pg_dump -h YOUR_HOST -p YOUR_PORT -U YOUR_DB_USER -d YOUR_DB_NAME -f .\backups\royalfood_pre_supplier_nullable.sql
Remove-Item Env:\PGPASSWORD
```

Apply the single remaining migration (stop on first error):
```powershell
$env:PGPASSWORD = 'YOUR_DB_PASSWORD'
psql "host=YOUR_HOST port=YOUR_PORT dbname=YOUR_DB_NAME user=YOUR_DB_USER" -v ON_ERROR_STOP=1 -f .\scripts\migrations\2025_make_purchase_supplier_nullable.sql
Remove-Item Env:\PGPASSWORD
```

Validation SQL (run in psql or any SQL client)
```sql
-- Confirm column nullability
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_name = 'purchases' AND column_name = 'supplierId';

-- Confirm FK definition
SELECT con.conname, pg_get_constraintdef(con.oid) AS def
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'purchases' AND con.contype = 'f';

-- Quick safe insert test (use staging):
INSERT INTO purchases (id, "purchaseNumber", "purchaseDate", "totalAmount", status, "createdAt", "updatedAt")
VALUES ('test-null-supplier', 'TEST-NULL-1', now(), 0, 'PENDING', now(), now());
SELECT * FROM purchases WHERE id = 'test-null-supplier';
DELETE FROM purchases WHERE id = 'test-null-supplier';
```

Rollback (restore from custom dump):
```powershell
$env:PGPASSWORD = 'YOUR_DB_PASSWORD'
pg_restore -h YOUR_HOST -p YOUR_PORT -U YOUR_DB_USER -d YOUR_DB_NAME .\backups\royalfood_pre_supplier_nullable.dump
Remove-Item Env:\PGPASSWORD
```

Rollback (restore plain SQL):
```powershell
$env:PGPASSWORD = 'YOUR_DB_PASSWORD'
psql "host=YOUR_HOST port=YOUR_PORT dbname=YOUR_DB_NAME user=YOUR_DB_USER" -f .\backups\royalfood_pre_supplier_nullable.sql
Remove-Item Env:\PGPASSWORD
```

Git & team reconciliation
-------------------------
- If you removed migration files from the repository but other clones still have them, coordinate
  so everyone pulls the same branch state. If the deleted files were committed previously and you
  want to restore them, you can recover from git history on any machine that still has them, e.g.: 

```powershell
# show commits that touched migrations
git log -- scripts/migrations --oneline

# restore a file from a specific commit
git show <commit>:`scripts/migrations/2025_create_all_tables_except_users.sql` > scripts/migrations/2025_create_all_tables_except_users.sql
git add scripts/migrations/2025_create_all_tables_except_users.sql
git commit -m "restore migration"
```

- If you cannot find the original files in git history, someone on the team must supply the missing
  migration files or you must recreate the DDL for any missing objects manually.

Prisma & local dev
-------------------
- After the database is updated, run:
```powershell
npx prisma generate
npm run dev
```
- Ensure `prisma/schema.prisma` matches the expected schema (for example, `Purchase.supplierId` should be optional if the DB column is now nullable).

If you want help
---------------
- I can provide a tailored command snippet if you share the DB host, port, user and whether you use a connection URL (do NOT paste passwords here) — I will produce copy/paste-ready commands with placeholders.
- I can also help validate your DB after you run the migration: paste the output of the validation queries and I will interpret them and suggest fixes.

Final note
----------
This README documents a destructive repository state. Proceed only after backing up and coordinating with your team. If you prefer, I can revert the deletions and restore the original migration history (safer) — ask me to attempt a restoration from git history.
