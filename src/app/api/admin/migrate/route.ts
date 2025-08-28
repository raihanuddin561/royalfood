import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-protection'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { Client } from 'pg'
import { spawn } from 'child_process'

const MIGRATIONS_DIR = path.join(process.cwd(), 'scripts', 'migrations')
const SAFE_RUN_SCRIPT = path.join(process.cwd(), 'scripts', 'apply_migrations_safe.js')

async function listMigrations() {
  if (!fs.existsSync(MIGRATIONS_DIR)) return []
  const files = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort()
  return files.map(file => {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')
    const checksum = crypto.createHash('sha256').update(sql).digest('hex')
    return { file, checksum }
  })
}

async function getAppliedMigrations(client: Client) {
  const res = await client.query(`
    SELECT filename, checksum, applied_at FROM applied_migrations ORDER BY applied_at
  `)
  return res.rows
}

async function createBackups(client: Client) {
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

    return NextResponse.json({ applied, pending, migrationsDir: MIGRATIONS_DIR })
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

    if (doBackup) {
      // Create backups for all public tables
      await client.query('BEGIN')
      try {
        const backups = await createBackups(client)
        await client.query('COMMIT')
        console.log('Created backups:', backups.join(', '))
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      }
    }

    // Run the safe runner script via node child process
    if (!fs.existsSync(SAFE_RUN_SCRIPT)) {
      return NextResponse.json({ error: `Safe runner not found at ${SAFE_RUN_SCRIPT}` }, { status: 500 })
    }

    return new Promise((resolve) => {
      const env = { ...process.env, DATABASE_URL_NEW: dbUrl }
      const child = spawn(process.execPath, [SAFE_RUN_SCRIPT], { env })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (chunk) => { stdout += String(chunk) })
      child.stderr.on('data', (chunk) => { stderr += String(chunk) })

      child.on('close', async (code) => {
        try { await client.end() } catch (_) {}
        if (code === 0) {
          resolve(NextResponse.json({ ok: true, code, stdout }))
        } else {
          resolve(NextResponse.json({ ok: false, code, stdout, stderr }, { status: 500 }))
        }
      })
    })
  } catch (err) {
    try { await client.end() } catch (_) {}
    const e = err as any
    return NextResponse.json({ error: e?.message ?? String(err) }, { status: 500 })
  }
})

export const dynamic = 'force-dynamic'
