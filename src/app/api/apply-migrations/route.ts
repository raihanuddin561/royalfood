import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

// Protected route to run migrations. Requires header: x-migrate-secret
// WARNING: This endpoint should be used carefully and removed after use.

export async function POST(req: NextRequest) {
  const secret = process.env.MIGRATE_RUNNER_SECRET
  const header = req.headers.get('x-migrate-secret')
  // Helpful diagnostics: if secret is not configured, return 500 so you know to set it in Vercel
  if (!secret) {
    return NextResponse.json({ success: false, error: 'MIGRATE_RUNNER_SECRET is not configured on the server' }, { status: 500 })
  }

  if (header !== secret) {
    return NextResponse.json({ success: false, error: 'Unauthorized - invalid migrate secret' }, { status: 401 })
  }

  const runnerPath = path.join(process.cwd(), 'scripts', 'apply_migrations_safe.js')
  if (!runnerPath) {
    return NextResponse.json({ success: false, error: 'Runner not found' }, { status: 500 })
  }

  return new Promise((resolve) => {
    const node = process.env.NODE || 'node'
    const proc = spawn(node, [runnerPath], { env: process.env })
    let out = ''
    let err = ''
    proc.stdout.on('data', (d) => { out += d.toString() })
    proc.stderr.on('data', (d) => { err += d.toString() })
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(NextResponse.json({ success: true, output: out }))
      } else {
        resolve(NextResponse.json({ success: false, output: out, error: err }, { status: 500 }))
      }
    })
  })
}
