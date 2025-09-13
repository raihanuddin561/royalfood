'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Save, Settings, DollarSign, Truck } from 'lucide-react'

type TaxSettings = {
  id: string
  taxRate: number
  isTaxActive: boolean
  taxLabel: string
  includeInPrice: boolean
}

type DeliverySettings = {
  id: string
  globalDeliveryCharge: number
  freeDeliveryThreshold: number
  isGlobalChargeActive: boolean
  maxDeliveryDistance: number
}

export default function OrderSettingsPage() {
  const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null)
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings')
      const data = await response.json()
      
      if (data.success) {
        setTaxSettings(data.taxSettings)
        setDeliverySettings(data.deliverySettings)
      } else {
        toast.error('Failed to load settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    try {
      setSaving(true)
      
      // Save tax settings
      if (taxSettings) {
        const taxResponse = await fetch('/api/admin/settings/tax', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(taxSettings)
        })
        
        if (!taxResponse.ok) {
          throw new Error('Failed to save tax settings')
        }
      }
      
      // Save delivery settings
      if (deliverySettings) {
        const deliveryResponse = await fetch('/api/admin/settings/delivery', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(deliverySettings)
        })
        
        if (!deliveryResponse.ok) {
          throw new Error('Failed to save delivery settings')
        }
      }
      
      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <Settings className="h-8 w-8 mr-3 text-blue-600" />
            Order Settings
          </h1>
          <p className="text-gray-600">Configure tax rates, delivery charges, and order policies</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tax Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Tax Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {taxSettings && (
                <>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tax-active">Enable Tax Calculation</Label>
                    <Switch
                      id="tax-active"
                      checked={taxSettings.isTaxActive}
                      onCheckedChange={(checked) => 
                        setTaxSettings({...taxSettings, isTaxActive: checked})
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="tax-rate">Tax Rate (%)</Label>
                    <Input
                      id="tax-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={taxSettings.taxRate * 100}
                      onChange={(e) => 
                        setTaxSettings({
                          ...taxSettings, 
                          taxRate: parseFloat(e.target.value) / 100
                        })
                      }
                      placeholder="Enter tax rate (e.g., 5 for 5%)"
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Current rate: {(taxSettings.taxRate * 100).toFixed(2)}%
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="tax-label">Tax Label</Label>
                    <Input
                      id="tax-label"
                      value={taxSettings.taxLabel}
                      onChange={(e) => 
                        setTaxSettings({...taxSettings, taxLabel: e.target.value})
                      }
                      placeholder="Tax display name (e.g., VAT, Sales Tax)"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="tax-included">Tax Included in Menu Prices</Label>
                      <p className="text-sm text-gray-500">
                        Whether tax is already included in the displayed menu prices
                      </p>
                    </div>
                    <Switch
                      id="tax-included"
                      checked={taxSettings.includeInPrice}
                      onCheckedChange={(checked) => 
                        setTaxSettings({...taxSettings, includeInPrice: checked})
                      }
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Delivery Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Truck className="h-5 w-5 mr-2 text-purple-600" />
                Delivery Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {deliverySettings && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="global-delivery-active">Enable Global Delivery Charge</Label>
                      <p className="text-sm text-gray-500">
                        Use a flat delivery fee when items don't have specific charges
                      </p>
                    </div>
                    <Switch
                      id="global-delivery-active"
                      checked={deliverySettings.isGlobalChargeActive}
                      onCheckedChange={(checked) => 
                        setDeliverySettings({...deliverySettings, isGlobalChargeActive: checked})
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="global-delivery-charge">Global Delivery Charge ($)</Label>
                    <Input
                      id="global-delivery-charge"
                      type="number"
                      step="0.01"
                      min="0"
                      value={deliverySettings.globalDeliveryCharge}
                      onChange={(e) => 
                        setDeliverySettings({
                          ...deliverySettings, 
                          globalDeliveryCharge: parseFloat(e.target.value) || 0
                        })
                      }
                      placeholder="Enter global delivery charge"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="free-delivery-threshold">Free Delivery Threshold ($)</Label>
                    <Input
                      id="free-delivery-threshold"
                      type="number"
                      step="0.01"
                      min="0"
                      value={deliverySettings.freeDeliveryThreshold}
                      onChange={(e) => 
                        setDeliverySettings({
                          ...deliverySettings, 
                          freeDeliveryThreshold: parseFloat(e.target.value) || 0
                        })
                      }
                      placeholder="Minimum order for free delivery (0 to disable)"
                      className="mt-1"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Orders above this amount get free delivery
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="max-delivery-distance">Maximum Delivery Distance (km)</Label>
                    <Input
                      id="max-delivery-distance"
                      type="number"
                      step="0.1"
                      min="0"
                      value={deliverySettings.maxDeliveryDistance}
                      onChange={(e) => 
                        setDeliverySettings({
                          ...deliverySettings, 
                          maxDeliveryDistance: parseFloat(e.target.value) || 0
                        })
                      }
                      placeholder="Maximum delivery distance"
                      className="mt-1"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Current Configuration Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tax Configuration</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>Status: {taxSettings?.isTaxActive ? 
                    <span className="text-green-600">Active ({(taxSettings.taxRate * 100).toFixed(2)}%)</span> : 
                    <span className="text-red-600">Disabled</span>
                  }</li>
                  <li>Label: {taxSettings?.taxLabel}</li>
                  <li>Included in prices: {taxSettings?.includeInPrice ? 'Yes' : 'No'}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Delivery Configuration</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>Global charge: {deliverySettings?.isGlobalChargeActive ? 
                    <span className="text-green-600">Active (${deliverySettings.globalDeliveryCharge.toFixed(2)})</span> : 
                    <span className="text-red-600">Disabled</span>
                  }</li>
                  <li>Free delivery: {deliverySettings?.freeDeliveryThreshold > 0 ? 
                    `$${deliverySettings.freeDeliveryThreshold.toFixed(2)}+` : 'Disabled'
                  }</li>
                  <li>Max distance: {deliverySettings?.maxDeliveryDistance}km</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="mt-8 flex justify-center">
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}