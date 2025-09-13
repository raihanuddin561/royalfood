import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/api-protection'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Enhanced admin protection for migration operations
async function verifyMigrationAuth(request: NextRequest) {
  // Use the existing requireAdmin protection
  // Additional check for migration-specific token if needed
  const migrationToken = process.env.MIGRATION_ADMIN_TOKEN
  
  if (migrationToken) {
    const authHeader = request.headers.get('x-migration-token')
    if (!authHeader || authHeader !== migrationToken) {
      throw new Error('Migration token required for this operation')
    }
  }
}

export const GET = requireAdmin(async (req: NextRequest) => {
  try {
    // Get Prisma migration status
    const { stdout, stderr } = await execAsync('npx prisma migrate status')
    
    // Parse the output to determine status
    const isPending = stdout.includes('pending') || stdout.includes('drift')
    const isUpToDate = stdout.includes('up to date')
    const hasIssues = stderr && stderr.length > 0
    
    return NextResponse.json({
      success: true,
      status: isUpToDate ? 'up-to-date' : isPending ? 'pending' : 'unknown',
      output: stdout,
      error: stderr || null,
      hasPendingMigrations: isPending,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Prisma migration status error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check migration status',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
})

export const POST = requireAdmin(async (req: NextRequest) => {
  try {
    await verifyMigrationAuth(req)
    
    const body = await req.json().catch(() => ({}))
    const { action, force = false } = body
    
    switch (action) {
      case 'deploy':
        return await deployPrismaMigrations(force)
      case 'generate':
        return await generatePrismaClient()
      case 'reset':
        return await resetPrismaMigrations(force)
      case 'resolve':
        return await resolveMigrationIssues(body)
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: deploy, generate, reset, or resolve' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Prisma migration operation error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration operation failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
})

async function deployPrismaMigrations(force = false) {
  try {
    // First check if there are pending migrations
    const { stdout: statusOutput } = await execAsync('npx prisma migrate status')
    
    if (statusOutput.includes('up to date') && !force) {
      return NextResponse.json({
        success: true,
        action: 'deploy',
        message: 'Database schema is already up to date',
        output: statusOutput,
        timestamp: new Date().toISOString()
      })
    }
    
    // Deploy pending migrations
    const deployCommand = force ? 'npx prisma migrate deploy --force' : 'npx prisma migrate deploy'
    const { stdout, stderr } = await execAsync(deployCommand)
    
    // Generate client after successful migration
    const { stdout: generateOutput } = await execAsync('npx prisma generate')
    
    return NextResponse.json({
      success: true,
      action: 'deploy',
      message: 'Migrations deployed successfully',
      output: stdout,
      generateOutput,
      error: stderr || null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      action: 'deploy',
      error: error instanceof Error ? error.message : 'Migration deployment failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function generatePrismaClient() {
  try {
    const { stdout, stderr } = await execAsync('npx prisma generate')
    
    return NextResponse.json({
      success: true,
      action: 'generate',
      message: 'Prisma client generated successfully',
      output: stdout,
      error: stderr || null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      action: 'generate',
      error: error instanceof Error ? error.message : 'Client generation failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function resetPrismaMigrations(force = false) {
  // Only allow reset in development environment
  if (process.env.NODE_ENV === 'production' && !force) {
    return NextResponse.json({
      success: false,
      action: 'reset',
      error: 'Reset operation is not allowed in production environment',
      timestamp: new Date().toISOString()
    }, { status: 403 })
  }
  
  try {
    const { stdout, stderr } = await execAsync('npx prisma migrate reset --force')
    
    return NextResponse.json({
      success: true,
      action: 'reset',
      message: 'Database reset completed',
      output: stdout,
      error: stderr || null,
      warning: 'This operation deleted all data in the database',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      action: 'reset',
      error: error instanceof Error ? error.message : 'Reset operation failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

async function resolveMigrationIssues(body: any) {
  const { migrationName, action: resolveAction } = body
  
  if (!migrationName || !resolveAction) {
    return NextResponse.json({
      success: false,
      error: 'Migration name and resolve action are required',
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
  
  try {
    let command = ''
    
    switch (resolveAction) {
      case 'applied':
        command = `npx prisma migrate resolve --applied ${migrationName}`
        break
      case 'rolled-back':
        command = `npx prisma migrate resolve --rolled-back ${migrationName}`
        break
      default:
        throw new Error('Invalid resolve action. Use: applied or rolled-back')
    }
    
    const { stdout, stderr } = await execAsync(command)
    
    return NextResponse.json({
      success: true,
      action: 'resolve',
      message: `Migration ${migrationName} marked as ${resolveAction}`,
      output: stdout,
      error: stderr || null,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      action: 'resolve',
      error: error instanceof Error ? error.message : 'Resolve operation failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export const dynamic = 'force-dynamic'