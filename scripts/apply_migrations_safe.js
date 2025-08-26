#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { Client } = require('pg')

/*
  Safe migration runner:
  - Tracks applied migrations in `applied_migrations` table
  - Applies new SQL files from scripts/migrations in alphabetical order
  - Skips files that were already applied (by filename + checksum)
  - If a migration file checksum changes, it will abort (to avoid accidental reapplication)
  Usage (CI / local):
    DATABASE_URL_NEW="postgresql://..." node ./scripts/apply_migrations_safe.js
    or set DATABASE_URL_NEW in env and run `npm run db:migrate:safe`
*/

function loadEnvIfNeeded() {
  if (process.env.DATABASE_URL || process.env.DATABASE_URL_NEW) return
  const envPath = path.join(__dirname, '..', '.env')
  if (!fs.existsSync(envPath)) return
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Za-z0-9_]+)=(.*)$/)
    if (m) {
      const key = m[1]
      let val = m[2]
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) process.env[key] = val
    }
  })
}

async function run() {
  loadEnvIfNeeded()

  const migrationsDir = path.join(__dirname, 'migrations')
  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found:', migrationsDir)
    return
  }

  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()
  if (!files.length) {
    console.log('No migration files found.')
    return
  }

  const dbUrl = process.env.DATABASE_URL_NEW || process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
  if (!dbUrl) {
    console.error('DATABASE_URL or DATABASE_URL_NEW environment variable is required (or set in .env file)')
    process.exit(1)
  }

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()

    // Ensure applied_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS applied_migrations (
        filename TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT now()
      );
    `)

    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      console.log('Considering migration:', file)
      const sql = fs.readFileSync(filePath, 'utf8')
      const checksum = crypto.createHash('sha256').update(sql).digest('hex')

      const res = await client.query('SELECT checksum FROM applied_migrations WHERE filename = $1', [file])
      if (res.rows.length > 0) {
        const existing = res.rows[0].checksum
        if (existing === checksum) {
          console.log(`  ✓ already applied: ${file}`)
          continue
        } else {
          console.error(`  ✗ checksum mismatch for ${file}. Migration file changed after applied - aborting.`)
          console.error('  Existing checksum:', existing)
          console.error('  New checksum     :', checksum)
          process.exit(1)
        }
      }

      console.log('  -> applying', file)
      try {
        await client.query('BEGIN')
        // run migration SQL (may contain multiple statements)
        await client.query(sql)
        await client.query('INSERT INTO applied_migrations(filename, checksum) VALUES($1, $2)', [file, checksum])
        await client.query('COMMIT')
        console.log(`  ✅ applied: ${file}`)
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`  ❌ migration ${file} failed:`, err.message || err)
        throw err
      }
    }

    console.log('All migrations processed')
  } catch (err) {
    console.error('Migration process failed:', err.message || err)
    process.exitCode = 1
  } finally {
    try { await client.end() } catch (_) {}
  }
}

if (require.main === module) {
  run()
}

module.exports = { run }
