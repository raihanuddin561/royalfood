const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

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

  loadEnvIfNeeded()

  const dbUrl = process.env.DATABASE_URL_NEW || process.env.DATABASE_URL
  if (!dbUrl) {
    console.error('DATABASE_URL or DATABASE_URL_NEW environment variable is required (or set in .env file)')
    process.exit(1)
  }

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    for (const file of files) {
      const filePath = path.join(migrationsDir, file)
      console.log('Running migration:', file)
      const sql = fs.readFileSync(filePath, 'utf8')
      try {
        // Wrap each migration in a transaction to keep it safe
        await client.query('BEGIN')
        // run whole file (may contain multiple statements)
        await client.query(sql)
        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        console.error(`Migration ${file} failed:`)
        console.error(err.message || err)
        throw err
      }
    }
    console.log('Migrations completed successfully')
  } catch (err) {
    console.error('Migration process failed:', err.message || err)
    process.exitCode = 1
  } finally {
    try { await client.end() } catch (_) {}
  }
}

run()
