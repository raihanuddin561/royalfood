"use client"
import { useState, useEffect } from 'react'
import { useNotification } from '@/components/ui/Notification'
import { toast } from '@/components/ui/Toast'
import { SmartQuantityInput } from '@/components/ui/SmartQuantityInput'
import { SmartPriceInput } from '@/components/ui/SmartPriceInput'

type Supplier = { id: string; name: string }
type Item = { id: string; name: string; sku?: string; currentStock?: number; unit?: string }
type PurchaseItem = { id: string; itemId: string; quantity: number; unitPrice: number; item?: Item }
type Purchase = { 
  id: string
  supplierId?: string | null
  purchaseDate: string
  purchaseItems: PurchaseItem[]
  status: string
  purchaseNumber: string
}

interface EditPurchaseFormProps {
  purchase: Purchase
  suppliers: Supplier[]
  items: Item[]
  onSuccess?: () => void
  onCancel?: () => void
}

export default function EditPurchaseForm({ purchase, suppliers, items, onSuccess, onCancel }: EditPurchaseFormProps) {
  const { showNotification } = useNotification()
  const [supplierId, setSupplierId] = useState(purchase.supplierId || '')
  const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>(suppliers)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [creatingSupplier, setCreatingSupplier] = useState(false)
  const [purchaseDate, setPurchaseDate] = useState(
    new Date(purchase.purchaseDate).toISOString().slice(0, 10)
  )
  const [lines, setLines] = useState(
    purchase.purchaseItems.map(pi => ({
      itemId: pi.itemId,
      quantity: pi.quantity,
      unitPrice: pi.unitPrice
    }))
  )
  const [loading, setLoading] = useState(false)
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0)

  function updateLine(index: number, patch: Partial<{ itemId: string; quantity: number; unitPrice: number }>) {
    setLines(prev => prev.map((l, i) => i === index ? { ...l, ...patch } : l))
  }
  
  function addLine() { 
    setLines(prev => [...prev, { itemId: items[0]?.id || '', quantity: 1, unitPrice: 0 }]) 
  }
  
  function removeLine(i: number) { 
    setLines(prev => prev.filter((_, idx) => idx !== i)) 
  }

  async function submit(e: any) {
    e.preventDefault()
    
    const now = Date.now()
    
    // Prevent double submission with 3-second cooldown
    if (loading) {
      console.log('Form already submitting, ignoring duplicate submission')
      toast.warning('Please Wait', 'Purchase is being updated. Please do not click multiple times.')
      return
    }
    
    if (now - lastSubmissionTime < 3000) {
      console.log('Submission too fast, enforcing cooldown')
      toast.warning('Too Fast', 'Please wait 3 seconds between submissions to prevent duplicates.')
      return
    }
    
    setLastSubmissionTime(now)
    
    await doSubmit()
  }

  async function doSubmit() {
    if (loading) {
      console.log('Already processing, ignoring duplicate submission')
      return
    }
    
    setLoading(true)
    try {
      const body = { 
        supplierId: supplierId || null, 
        purchaseDate, 
        lines 
      }
      
      console.log('Updating purchase:', {
        purchaseId: purchase.id,
        supplierId,
        lineCount: lines.length,
        totalQuantity: lines.reduce((sum, l) => sum + l.quantity, 0)
      })
      
      const res = await fetch(`/api/admin/purchases/${purchase.id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      })
      
      const data = await res.json()
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to update purchase')
      }
      
      // Show success notification
      if (purchase.status === 'RECEIVED') {
        toast.success(
          'Purchase Updated & Stock Adjusted',
          `Purchase ${purchase.purchaseNumber} updated successfully. Stock levels have been automatically adjusted.`
        )
      } else {
        toast.success(
          'Purchase Updated',
          `Purchase ${purchase.purchaseNumber} updated successfully.`
        )
      }
      
      // Call success callback or redirect
      if (onSuccess) {
        onSuccess()
      } else {
        setTimeout(() => {
          window.location.href = `/admin/purchases/${purchase.id}`
        }, 1500)
      }
      
    } catch (err: any) {
      console.error('Purchase update error:', err)
      const errorMessage = err?.message || String(err)
      
      showNotification('error', errorMessage)
      toast.error(
        'Purchase Update Failed',
        'Unable to update purchase order. Please verify your data and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function deletePurchase() {
    if (!confirm(`Are you sure you want to delete purchase ${purchase.purchaseNumber}? This action cannot be undone.`)) {
      return
    }

    if (purchase.status === 'RECEIVED') {
      if (!confirm('This purchase has been received and will affect stock levels. Are you absolutely sure you want to delete it?')) {
        return
      }
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/purchases/${purchase.id}`, { 
        method: 'DELETE'
      })
      
      const data = await res.json()
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to delete purchase')
      }
      
      toast.success(
        'Purchase Deleted',
        `Purchase ${purchase.purchaseNumber} has been deleted successfully.`
      )
      
      setTimeout(() => {
        window.location.href = '/admin/purchases'
      }, 1500)
      
    } catch (err: any) {
      console.error('Purchase delete error:', err)
      const errorMessage = err?.message || String(err)
      
      showNotification('error', errorMessage)
      toast.error('Delete Failed', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const noItems = items.length === 0
  const invalidLine = lines.some(l => !l.itemId || Number(l.quantity) <= 0)
  const isReceived = purchase.status === 'RECEIVED'

  return (
    <div>
      {isReceived && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Warning:</strong> This purchase has been received and stock levels have been updated. 
            Editing will automatically adjust stock levels to reflect the changes.
          </p>
        </div>
      )}

      <form onSubmit={submit}>
        <div className="mb-3">
          <label htmlFor="supplier-select" className="block text-sm">Supplier</label>
          <select 
            id="supplier-select" 
            className="input" 
            value={supplierId} 
            onChange={e => setSupplierId(e.target.value)}
          >
            <option value="">(Optional) Select supplier…</option>
            {localSuppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div className="mt-2 flex items-center gap-2">
            <button 
              type="button" 
              className="btn" 
              onClick={() => setShowAddSupplier(v => !v)}
            >
              {showAddSupplier ? 'Cancel' : 'Add supplier'}
            </button>
            {showAddSupplier && (
              <div className="flex gap-2 items-center">
                <input 
                  type="text" 
                  placeholder="Supplier name" 
                  className="input" 
                  value={newSupplierName} 
                  onChange={e => setNewSupplierName(e.target.value)} 
                />
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  disabled={creatingSupplier || !newSupplierName.trim()} 
                  onClick={async () => {
                    setCreatingSupplier(true)
                    try {
                      const res = await fetch('/api/admin/suppliers', { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ name: newSupplierName.trim() }) 
                      })
                      const data = await res.json()
                      if (!data?.success) throw new Error(data?.error || 'Failed to create supplier')
                      
                      setLocalSuppliers(prev => [data.supplier, ...prev])
                      setSupplierId(data.supplier.id)
                      setNewSupplierName('')
                      setShowAddSupplier(false)
                    } catch (err: any) {
                      toast.error('Supplier Creation Failed', err?.message || String(err))
                    } finally {
                      setCreatingSupplier(false)
                    }
                  }}
                >
                  {creatingSupplier ? 'Adding…' : 'Add'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="mb-3">
          <label htmlFor="purchase-date" className="block text-sm">Purchase Date</label>
          <input 
            id="purchase-date" 
            className="input" 
            type="date" 
            value={purchaseDate} 
            onChange={e => setPurchaseDate(e.target.value)} 
          />
        </div>

        <div className="mb-3">
          <label className="block text-sm font-medium">Lines</label>
          {noItems && (
            <div className="text-sm text-red-600 mb-2">
              No inventory items found. Add items from the Inventory section.
            </div>
          )}
          {lines.map((l, i) => {
            const selectedItem = items.find(item => item.id === l.itemId)
            return (
              <div key={i} className="flex gap-2 items-start mb-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <label htmlFor={`item-select-${i}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Item
                  </label>
                  <select 
                    id={`item-select-${i}`} 
                    className="input w-full" 
                    value={l.itemId} 
                    onChange={e => updateLine(i, { itemId: e.target.value })} 
                    disabled={noItems}
                  >
                    <option value="">Select item…</option>
                    {items.map(it => (
                      <option key={it.id} value={it.id}>
                        {it.name}{it.sku ? ` (${it.sku})` : ''}{it.unit ? ` - Unit: ${it.unit}` : ''}
                        {it.currentStock !== undefined ? ` - Current: ${it.currentStock}` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedItem && (
                    <div className="mt-1 text-xs text-gray-600">
                      Unit: <span className="font-medium text-blue-600">{selectedItem.unit || 'Not specified'}</span>
                    </div>
                  )}
                </div>
                
                <div className="w-32">
                  <SmartQuantityInput
                    label="Quantity"
                    value={l.quantity}
                    onChange={(newQty) => updateLine(i, { quantity: newQty })}
                    unit={selectedItem?.unit || 'units'}
                    min={0.001}
                    placeholder="0.000"
                    showConverter={true}
                  />
                </div>
                
                <div className="w-32">
                  <label htmlFor={`price-${i}`} className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price (BDT)
                  </label>
                  <SmartPriceInput
                    value={l.unitPrice}
                    onChange={(value: number) => updateLine(i, { unitPrice: value })}
                    currency="BDT"
                    placeholder="0.00"
                    className="w-full"
                  />
                </div>
                
                <div className="w-32 pt-6">
                  <div className="text-sm text-gray-600">
                    Total: BDT {(l.quantity * l.unitPrice).toFixed(2)}
                  </div>
                </div>
                
                <div className="pt-6">
                  <button 
                    type="button" 
                    className="btn btn-secondary text-sm px-2 py-1" 
                    onClick={() => removeLine(i)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
          <div>
            <button 
              type="button" 
              className="btn" 
              onClick={addLine} 
              disabled={noItems || loading}
            >
              Add line
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            type="submit"
            className={`btn btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            disabled={loading || noItems || invalidLine || lines.length === 0}
            style={{ pointerEvents: loading ? 'none' : 'auto' }}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating Purchase...
              </span>
            ) : (
              'Update Purchase'
            )}
          </button>

          {onCancel && (
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}

          <button 
            type="button" 
            className="btn btn-danger ml-auto" 
            onClick={deletePurchase}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Delete Purchase'}
          </button>
        </div>

        {loading && (
          <p className="text-sm text-gray-600 mt-2">
            ⏳ Please wait... Updating purchase order{isReceived ? ' and adjusting stock levels' : ''}.
          </p>
        )}
      </form>
    </div>
  )
}