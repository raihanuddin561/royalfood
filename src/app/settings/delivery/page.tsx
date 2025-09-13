'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { SmartPriceInput } from '@/components/ui/SmartPriceInput'
import { Truck, Settings, DollarSign, Clock, MapPin, Plus, X } from 'lucide-react'
import { toast } from 'sonner'

interface DeliverySettings {
  id: string
  globalDeliveryCharge: number
  freeDeliveryThreshold: number
  isGlobalChargeActive: boolean
  maxDeliveryDistance: number
  deliveryTimeSlots: string[]
}

export default function DeliverySettingsPage() {
  const [settings, setSettings] = useState<DeliverySettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [newTimeSlot, setNewTimeSlot] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/delivery-settings')
      const data = await response.json()
      
      if (data.success) {
        setSettings(data.settings)
      } else {
        toast.error('Failed to load delivery settings')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load delivery settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/delivery-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Delivery settings updated successfully')
        setSettings(data.settings)
      } else {
        toast.error(data.error || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const addTimeSlot = () => {
    if (!newTimeSlot.trim() || !settings) return
    
    setSettings({
      ...settings,
      deliveryTimeSlots: [...settings.deliveryTimeSlots, newTimeSlot.trim()]
    })
    setNewTimeSlot('')
  }

  const removeTimeSlot = (index: number) => {
    if (!settings) return
    
    setSettings({
      ...settings,
      deliveryTimeSlots: settings.deliveryTimeSlots.filter((_, i) => i !== index)
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load delivery settings</p>
        <Button onClick={fetchSettings} className="mt-4">Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Truck className="h-6 w-6 mr-2" />
            Delivery Settings
          </h1>
          <p className="text-gray-600">Configure global delivery charges and policies</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Global Delivery Charges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Delivery Charges
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Global Charge Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Use Global Delivery Charge</Label>
                <p className="text-xs text-gray-500">Apply global charge when item-specific charge is 0</p>
              </div>
              <Switch
                checked={settings.isGlobalChargeActive}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, isGlobalChargeActive: checked })
                }
              />
            </div>

            {/* Global Delivery Charge */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Global Delivery Charge (BDT)
              </Label>
              <SmartPriceInput
                value={settings.globalDeliveryCharge}
                onChange={(value) => 
                  setSettings({ ...settings, globalDeliveryCharge: value })
                }
                currency="BDT"
                placeholder="0.00"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default delivery charge applied to items with no specific charge
              </p>
            </div>

            {/* Free Delivery Threshold */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Free Delivery Threshold (BDT)
              </Label>
              <SmartPriceInput
                value={settings.freeDeliveryThreshold}
                onChange={(value) => 
                  setSettings({ ...settings, freeDeliveryThreshold: value })
                }
                currency="BDT"
                placeholder="0.00"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Free delivery for orders above this amount (0 = disabled)
              </p>
            </div>

            {/* Max Delivery Distance */}
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Delivery Distance (km)
              </Label>
              <Input
                type="number"
                value={settings.maxDeliveryDistance}
                onChange={(e) => 
                  setSettings({ ...settings, maxDeliveryDistance: parseFloat(e.target.value) || 0 })
                }
                placeholder="10"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum distance for delivery orders
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Time Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Delivery Time Slots
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add New Time Slot */}
            <div className="flex gap-2">
              <Input
                value={newTimeSlot}
                onChange={(e) => setNewTimeSlot(e.target.value)}
                placeholder="e.g., 9:00-12:00"
                className="flex-1"
              />
              <Button onClick={addTimeSlot} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Time Slots */}
            <div className="space-y-2">
              {settings.deliveryTimeSlots.map((slot, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                  <span className="text-sm">{slot}</span>
                  <Button
                    onClick={() => removeTimeSlot(index)}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              
              {settings.deliveryTimeSlots.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  No time slots configured
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Current Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ৳{settings.globalDeliveryCharge}
              </div>
              <div className="text-sm text-blue-800">Global Charge</div>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ৳{settings.freeDeliveryThreshold}
              </div>
              <div className="text-sm text-green-800">Free Delivery Above</div>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {settings.maxDeliveryDistance} km
              </div>
              <div className="text-sm text-purple-800">Max Distance</div>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {settings.deliveryTimeSlots.length}
              </div>
              <div className="text-sm text-orange-800">Time Slots</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}