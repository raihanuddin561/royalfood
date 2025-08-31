import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-protection'
import path from 'path'
import fs from 'fs/promises'

// Allowlist of migration files that can be executed via the endpoint
const ALLOWED_MIGRATIONS = [
  '2025_add_user_partner_nullable.sql'
]

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  return requireAdmin(async (r: any) => {
    try {
      const body = await req.json()
      const name = body?.name

      if (!name || typeof name !== 'string') {
        return NextResponse.json({ error: 'Migration name is required' }, { status: 400 })
      }

      if (!ALLOWED_MIGRATIONS.includes(name)) {
        return NextResponse.json({ error: 'Migration not allowed' }, { status: 403 })
      }

      const filePath = path.join(process.cwd(), 'scripts', 'migrations', name)
      const sql = await fs.readFile(filePath, 'utf-8')

      const { prisma } = await import('@/lib/prisma')

      // Split statements by semicolon and execute sequentially. This keeps idempotent
      // statements safe because the migration SQL uses IF EXISTS/IF NOT EXISTS.
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0)

      const results: Array<{ statement: string; rowCount?: number | null; error?: string }> = []

      for (const stmt of statements) {
        try {
          // Use executeRawUnsafe for arbitrary SQL
          const res = await prisma.$executeRawUnsafe(stmt)
          results.push({ statement: stmt.slice(0, 200), rowCount: typeof res === 'number' ? res : null })
        } catch (err: any) {
          // record error but continue to next statements
          results.push({ statement: stmt.slice(0, 200), error: String(err.message || err) })
        }
      }

      return NextResponse.json({ success: true, executed: results.length, results })
    } catch (err: any) {
      console.error('Migration runner error:', err)
      return NextResponse.json({ error: err.message || 'Migration failed' }, { status: 500 })
    }
  })(null as any)
}
