import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-protection'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { Client } from 'pg'

const MIGRATIONS_DIR = path.join(process.cwd(), 'scripts', 'migrations')

async function listMigrations() {
  try {
    if (!fs.existsSync(MIGRATIONS_DIR)) return []
    const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort()
    return files.map(file => {
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
      const checksum = crypto.createHash('sha256').update(sql).digest('hex')
      return { file, checksum, sql }
    })
  } catch (error) {
    console.error('Error listing migrations:', error)
    return []
  }
}

async function getAppliedMigrations(client: Client) {
  const res = await client.query(`
    SELECT filename, checksum, applied_at FROM applied_migrations ORDER BY applied_at
  `)
  return res.rows
}

async function createBackups(client: Client) {
  try {
    // Create a backup table for every user table in public schema
    const res = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `)

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const created: string[] = []

    for (const row of res.rows) {
      const tbl = row.table_name
      // Skip our applied_migrations bookkeeping table and any existing backups
      if (tbl === 'applied_migrations' || tbl.startsWith('backup_before_migration_')) continue
      const backupName = `backup_before_migration_${timestamp}_${tbl}`
      // Use CREATE TABLE AS SELECT to copy data
      const sql = `CREATE TABLE IF NOT EXISTS "${backupName}" AS TABLE "${tbl}";`
      try {
        await client.query(sql)
        created.push(backupName)
      } catch (err) {
        // If any backup fails, throw to abort migration
        const e = err as any
        throw new Error(`Failed to create backup for ${tbl}: ${e?.message ?? String(err)}`)
      }
    }
    return created
  } catch (error) {
    console.error('Error creating backups:', error)
    throw error
  }
}

async function applyMigrationsDirect(client: Client, migrations: any[]) {
  // Direct migration application without child processes (Vercel-compatible)
  try {
    // Ensure applied_migrations table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS applied_migrations (
        filename TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ DEFAULT now()
      );
    `)

    const results: any[] = []

    for (const migration of migrations) {
      const { file, checksum, sql } = migration
      console.log('Considering migration:', file)

      // Check if already applied
      const res = await client.query('SELECT checksum FROM applied_migrations WHERE filename = $1', [file])
      if (res.rows.length > 0) {
        const existing = res.rows[0].checksum
        if (existing === checksum) {
          console.log(`  ✓ already applied: ${file}`)
          results.push({ file, status: 'already_applied' })
          continue
        } else {
          throw new Error(`Checksum mismatch for ${file}. Migration file changed after applied - aborting.`)
        }
      }

      console.log('  -> applying', file)
      try {
        await client.query('BEGIN')
        // Run migration SQL (may contain multiple statements)
        await client.query(sql)
        await client.query('INSERT INTO applied_migrations(filename, checksum) VALUES($1, $2)', [file, checksum])
        await client.query('COMMIT')
        console.log(`  ✅ applied: ${file}`)
        results.push({ file, status: 'applied' })
      } catch (err) {
        await client.query('ROLLBACK')
        const error = err as any
        console.error(`  ❌ migration ${file} failed:`, error.message || error)
        throw new Error(`Migration ${file} failed: ${error.message || error}`)
      }
    }

    return results
  } catch (error) {
    console.error('Migration process failed:', error)
    throw error
  }
}

export const GET = requireAdmin(async (req: any) => {
  // Dry-run: report pending migrations and applied migrations
  const dbUrl = process.env.DATABASE_URL_NEW || process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!dbUrl) return NextResponse.json({ error: 'No DATABASE_URL configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    // ensure applied_migrations exists (the safe runner will create it, but for reporting create it here if missing)
    await client.query(`CREATE TABLE IF NOT EXISTS applied_migrations (filename TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ DEFAULT now())`)
    const applied = await getAppliedMigrations(client)
    const all = await listMigrations()
    const pending = all.filter(a => !applied.find(x => x.filename === a.file))

    // Don't include SQL content in the response for GET requests
    const pendingFiles = pending.map(({ file, checksum }) => ({ file, checksum }))
    const allFiles = all.map(({ file, checksum }) => ({ file, checksum }))

    return NextResponse.json({ 
      applied, 
      pending: pendingFiles,
      all: allFiles,
      migrationsDir: MIGRATIONS_DIR,
      totalMigrations: all.length,
      appliedCount: applied.length,
      pendingCount: pendingFiles.length
    })
  } catch (err) {
    const e = err as any
    return NextResponse.json({ error: e?.message ?? String(err) }, { status: 500 })
  } finally {
    try { await client.end() } catch (_) {}
  }
})

export const POST = requireAdmin(async (req: any) => {
  // Apply migrations: body { backup: boolean }
  const body = await req.json().catch(() => ({}))
  const doBackup = Boolean(body.backup)
  const dbUrl = process.env.DATABASE_URL_NEW || process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!dbUrl) return NextResponse.json({ error: 'No DATABASE_URL configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()

    // Create applied_migrations table if missing
    await client.query(`CREATE TABLE IF NOT EXISTS applied_migrations (filename TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TIMESTAMPTZ DEFAULT now())`)

    const migrations = await listMigrations()
    if (!migrations.length) return NextResponse.json({ message: 'No migration files found' })

    let backups: string[] = []
    if (doBackup) {
      // Create backups for all public tables
      await client.query('BEGIN')
      try {
        backups = await createBackups(client)
        await client.query('COMMIT')
        console.log('Created backups:', backups.join(', '))
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    }

    // Apply migrations directly (Vercel-compatible, no child processes)
    const results = await applyMigrationsDirect(client, migrations)

    return NextResponse.json({ 
      ok: true, 
      results,
      backups,
      message: 'All migrations processed successfully'
    })
  } catch (err) {
    const e = err as any
    console.error('Migration failed:', e.message || err)
    return NextResponse.json({ 
      ok: false, 
      error: e?.message ?? String(err) 
    }, { status: 500 })
  } finally {
    try { await client.end() } catch (_) {}
  }
})

export const dynamic = 'force-dynamic'
