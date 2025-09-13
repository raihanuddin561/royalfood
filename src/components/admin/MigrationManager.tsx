'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Database, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react'

interface MigrationStatus {
  success: boolean
  status: 'up-to-date' | 'pending' | 'unknown'
  output: string
  error?: string
  hasPendingMigrations: boolean
  timestamp: string
}

interface MigrationResult {
  success: boolean
  action: string
  message?: string
  output?: string
  error?: string
  timestamp: string
}

export default function MigrationManager() {
  const [migrationStatus, setMigrationStatus] = useState<MigrationStatus | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastResult, setLastResult] = useState<MigrationResult | null>(null)

  const fetchMigrationStatus = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/prisma-migrate')
      const data = await response.json()
      setMigrationStatus(data)
    } catch (error) {
      console.error('Failed to fetch migration status:', error)
      setLastResult({
        success: false,
        action: 'status',
        error: 'Failed to fetch migration status',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  const executeMigrationAction = async (action: string, force = false) => {
    setIsLoading(true)
    setLastResult(null)
    
    try {
      const response = await fetch('/api/admin/prisma-migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, force })
      })
      
      const data = await response.json()
      setLastResult(data)
      
      // Refresh status after successful operation
      if (data.success) {
        setTimeout(() => fetchMigrationStatus(), 1000)
      }
    } catch (error) {
      console.error(`Migration ${action} failed:`, error)
      setLastResult({
        success: false,
        action,
        error: 'Network error occurred',
        timestamp: new Date().toISOString()
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMigrationStatus()
  }, [])

  const getStatusBadge = () => {
    if (!migrationStatus) return null
    
    switch (migrationStatus.status) {
      case 'up-to-date':
        return <Badge variant="default" className="bg-green-100 text-green-800">Up to Date</Badge>
      case 'pending':
        return <Badge variant="destructive">Pending Migrations</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Migration Manager
          </CardTitle>
          <CardDescription>
            Manage Prisma database migrations and schema updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Migration Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">Current Status:</span>
              {getStatusBadge()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMigrationStatus}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Migration Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => executeMigrationAction('deploy')}
              disabled={isLoading || migrationStatus?.status === 'up-to-date'}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Deploy Migrations
            </Button>

            <Button
              variant="outline"
              onClick={() => executeMigrationAction('generate')}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Generate Client
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Are you sure? This will reset the entire database!')) {
                  executeMigrationAction('reset', true)
                }
              }}
              disabled={isLoading || process.env.NODE_ENV === 'production'}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              Reset Database
            </Button>
          </div>

          {/* Status Output */}
          {migrationStatus && (
            <div className="space-y-2">
              <h4 className="font-medium">Migration Status Output:</h4>
              <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">
                {migrationStatus.output}
              </pre>
              {migrationStatus.error && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {migrationStatus.error}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Last Operation Result */}
          {lastResult && (
            <Alert className={lastResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex items-start gap-2">
                {lastResult.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <strong>
                      {lastResult.success ? 'Success' : 'Error'} - {lastResult.action}:
                    </strong>
                    <div className="mt-1">
                      {lastResult.message || lastResult.error}
                    </div>
                    {lastResult.output && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium">
                          View Output
                        </summary>
                        <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
                          {lastResult.output}
                        </pre>
                      </details>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}

          {/* Help Text */}
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Deploy Migrations:</strong> Apply pending database schema changes</p>
            <p><strong>Generate Client:</strong> Update Prisma client with latest schema</p>
            <p><strong>Reset Database:</strong> ⚠️ Dangerous - Only available in development</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}