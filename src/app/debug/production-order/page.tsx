'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

export default function ProductionDebugPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/production-order')
      const result = await response.json()
      setDiagnostics(result)
    } catch (error) {
      console.error('Diagnostics error:', error)
      setDiagnostics({ error: 'Failed to run diagnostics', details: error })
    } finally {
      setLoading(false)
    }
  }

  const testOrderSubmission = async () => {
    setLoading(true)
    try {
      // Create a minimal test order
      const testOrder = {
        orderType: 'DELIVERY',
        items: [
          {
            menuItemId: 'test-item-id',
            quantity: 1,
            notes: 'Test order from debug page'
          }
        ],
        guestName: 'Debug Test User',
        guestPhone: '01700000000',
        guestAddress: 'Test Address for debugging',
        isPreOrder: false,
        notes: 'This is a test order from the debug page'
      }

      const response = await fetch('/api/debug/production-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testOrder)
      })
      
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      console.error('Test submission error:', error)
      setTestResult({ error: 'Failed to test order submission', details: error })
    } finally {
      setLoading(false)
    }
  }

  const testDirectOrderSubmission = async () => {
    setLoading(true)
    try {
      // Test the actual order submission endpoint directly
      const testOrder = {
        orderType: 'DELIVERY',
        items: [
          {
            menuItemId: 'test-item-id',
            quantity: 1
          }
        ],
        guestName: 'Direct Test User',
        guestPhone: '01700000001',
        guestAddress: 'Direct test address',
        isPreOrder: false
      }

      const response = await fetch('/api/public/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testOrder)
      })
      
      const result = await response.json()
      setTestResult({
        direct: true,
        status: response.status,
        ok: response.ok,
        result
      })
    } catch (error) {
      console.error('Direct test error:', error)
      setTestResult({ 
        direct: true,
        error: 'Failed direct order test', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'success':
      case 'exists':
      case 'validation_working':
        return <Badge className="bg-green-500">✓ {status}</Badge>
      case 'error':
      case 'missing_or_error':
        return <Badge variant="destructive">✗ {status}</Badge>
      case 'checking':
        return <Badge variant="secondary">⏳ {status}</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Production Order Debug Tool</CardTitle>
          <p className="text-gray-600">
            Diagnose order submission issues on production deployment
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 flex-wrap">
            <Button 
              onClick={runDiagnostics} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Running...' : '🔍 Run Diagnostics'}
            </Button>
            <Button 
              onClick={testDirectOrderSubmission} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Testing...' : '🧪 Test Direct Order'}
            </Button>
            <Button 
              onClick={testOrderSubmission} 
              disabled={loading}
              variant="outline"
            >
              {loading ? 'Testing...' : '🔄 Test via Proxy'}
            </Button>
            <Button 
              onClick={() => window.open('/admin/migrate', '_blank')} 
              variant="secondary"
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              🔧 Open Migration Panel
            </Button>
          </div>
        </CardContent>
      </Card>

      {diagnostics && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Diagnostic Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Environment:</strong> {diagnostics.diagnostics?.environment}
                </div>
                <div>
                  <strong>Vercel:</strong> {diagnostics.diagnostics?.vercel ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Timestamp:</strong> {diagnostics.diagnostics?.timestamp}
                </div>
              </div>

              {diagnostics.diagnostics?.checks?.database && (
                <div>
                  <strong>Database Connection:</strong> {getStatusBadge(diagnostics.diagnostics.checks.database.status)}
                  {diagnostics.diagnostics.checks.database.error && (
                    <div className="text-red-600 text-sm mt-1">
                      {diagnostics.diagnostics.checks.database.error}
                    </div>
                  )}
                </div>
              )}

              {diagnostics.diagnostics?.checks?.tables && (
                <div>
                  <strong>Database Tables:</strong>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {Object.entries(diagnostics.diagnostics.checks.tables).map(([table, check]: [string, any]) => (
                      <div key={table} className="flex items-center gap-2">
                        <span className="text-sm">{table}:</span>
                        {getStatusBadge(check.status)}
                        {check.hasData !== undefined && (
                          <span className="text-xs text-gray-500">
                            ({check.hasData ? 'has data' : 'empty'})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {diagnostics.diagnostics?.checks?.menuItems && (
                <div>
                  <strong>Menu Items Check:</strong> {getStatusBadge(diagnostics.diagnostics.checks.menuItems.status)}
                  {diagnostics.diagnostics.checks.menuItems.count !== undefined && (
                    <div className="text-sm text-gray-600 mt-1">
                      Found {diagnostics.diagnostics.checks.menuItems.count} menu items
                    </div>
                  )}
                  {diagnostics.diagnostics.checks.menuItems.sample && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer text-blue-600">Show sample menu items</summary>
                      <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(diagnostics.diagnostics.checks.menuItems.sample, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {diagnostics.diagnostics?.recommendations && diagnostics.diagnostics.recommendations.length > 0 && (
                <div>
                  <strong>🎯 Recommendations:</strong>
                  <div className="space-y-2 mt-2">
                    {diagnostics.diagnostics.recommendations.map((rec: any, index: number) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        rec.priority === 'CRITICAL' ? 'bg-red-50 border-red-200' :
                        rec.priority === 'HIGH' ? 'bg-orange-50 border-orange-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-start gap-2">
                          <Badge variant={
                            rec.priority === 'CRITICAL' ? 'destructive' :
                            rec.priority === 'HIGH' ? 'secondary' : 'outline'
                          }>
                            {rec.priority}
                          </Badge>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{rec.issue}</div>
                            <div className="text-sm text-gray-600 mt-1">
                              <strong>Solution:</strong> {rec.solution}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <details>
                <summary className="text-blue-600 cursor-pointer">View Full Diagnostics</summary>
                <Textarea 
                  value={JSON.stringify(diagnostics, null, 2)} 
                  readOnly 
                  className="mt-2 font-mono text-xs h-64"
                />
              </details>
            </div>
          </CardContent>
        </Card>
      )}

      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle>🧪 Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            {testResult.error ? (
              <div className="text-red-600">
                <strong>Error:</strong> {testResult.error}
                {testResult.details && (
                  <div className="text-sm mt-1">{JSON.stringify(testResult.details)}</div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <strong>Status:</strong> 
                  <Badge className={testResult.ok || testResult.result?.success ? 'bg-green-500' : 'bg-red-500'}>
                    {testResult.status || (testResult.result?.success ? 'Success' : 'Failed')}
                  </Badge>
                </div>
                
                {testResult.result?.error && (
                  <div className="text-red-600">
                    <strong>API Error:</strong> {testResult.result.error}
                  </div>
                )}

                {testResult.result?.details && (
                  <div className="text-gray-600">
                    <strong>Details:</strong> {testResult.result.details}
                  </div>
                )}

                <details>
                  <summary className="text-blue-600 cursor-pointer">View Full Response</summary>
                  <Textarea 
                    value={JSON.stringify(testResult, null, 2)} 
                    readOnly 
                    className="mt-2 font-mono text-xs h-48"
                  />
                </details>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📋 Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p><strong>1. Run Diagnostics:</strong> Check database connectivity, table existence, and environment configuration</p>
            <p><strong>2. Check Recommendations:</strong> Review prioritized action items to fix identified issues</p>
            <p><strong>3. Use Migration Panel:</strong> Click "Open Migration Panel" to run database migrations if needed</p>
            <p><strong>4. Test Order Submission:</strong> Use test buttons to verify order submission works after fixes</p>
            <p><strong>5. Common Fixes:</strong> Missing tables → Run migrations, No menu items → Add via admin panel</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}