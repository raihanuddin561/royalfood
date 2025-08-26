const fs = require('fs')
const path = require('path')
const { Client } = require('pg')
const { randomUUID } = require('crypto')

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

async function runCheck() {
  loadEnvIfNeeded()
  const dbUrl = process.env.DATABASE_URL_NEW || process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL or DATABASE_URL_NEW environment variable is required')
    process.exit(2)
  }

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()

    // Check for both camelCase and snake_case column names
    const expected = ['expiryDate', 'receivedDate', 'expiry_date', 'received_date']
    const res = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'items' AND column_name = ANY($1)
    `, [expected])

    const found = res.rows.map(r => r.column_name)
    const ok = expected.some(col => found.includes(col))

    const success = ok
    const now = new Date()
    const desc = success ?
      `Post-migration check passed. Found columns: ${found.join(', ')}` :
      `Post-migration check failed. Found columns: ${found.join(', ')}`

    // Try to insert a security log record if table exists
    try {
      // If security_logs table doesn't exist, this will error and we'll fallback
      const id = randomUUID()
      await client.query(`INSERT INTO security_logs (id, "eventType", description, "createdAt") VALUES ($1, $2, $3, $4)`, [
        id, 'MIGRATION', desc, now
      ])
      console.log('Wrote security log record')
    } catch (logErr) {
      console.warn('Failed to write security log (maybe table missing):', logErr.message || logErr)
      // fallback: try creating security_logs minimally (non-destructive) - only if table missing
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS security_logs (
            id text PRIMARY KEY,
            "eventType" text,
            description text,
            "createdAt" timestamptz DEFAULT now()
          )
        `)
        const id2 = randomUUID()
        await client.query(`INSERT INTO security_logs (id, "eventType", description, "createdAt") VALUES ($1, $2, $3, $4)`, [
          id2, 'MIGRATION', desc, now
        ])
        console.log('Created fallback security_logs table and wrote record')
      } catch (createErr) {
        console.warn('Failed to create fallback security_logs table:', createErr.message || createErr)
      }
    }

    if (!success) {
      console.error('Post-migration verification failed:', desc)
      process.exit(3)
    }

    console.log('Post-migration verification succeeded:', desc)
    process.exit(0)
  } catch (err) {
    console.error('Error during post-migration check:', err.message || err)
    process.exit(1)
  } finally {
    try { await client.end() } catch (_) {}
  }
}

runCheck()
