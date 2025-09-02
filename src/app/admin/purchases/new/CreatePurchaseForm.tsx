"use client"
import { useState } from 'react'
import { useNotification } from '@/components/ui/Notification'
import { toast } from '@/components/ui/Toast'
import { SmartQuantityInput } from '@/components/ui/SmartQuantityInput'
import { SmartPriceInput } from '@/components/ui/SmartPriceInput'

type Supplier = { id: string; name: string }
type Item = { id: string; name: string; sku?: string; currentStock?: number; unit?: string }

export default function CreatePurchaseForm({ suppliers, items }: { suppliers: Supplier[]; items: Item[] }) {
  const { showNotification } = useNotification()
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '')
  const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>(suppliers)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [creatingSupplier, setCreatingSupplier] = useState(false)
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10))
  const [lines, setLines] = useState([{ itemId: items[0]?.id || '', quantity: 1, unitPrice: 0 }])
  const [receiveNow, setReceiveNow] = useState(true)
  const [loading, setLoading] = useState(false)
  const [lastSubmissionTime, setLastSubmissionTime] = useState(0)

  function updateLine(index: number, patch: Partial<{ itemId: string; quantity: number; unitPrice: number }>) {
    setLines(prev => prev.map((l, i) => i === index ? { ...l, ...patch } : l))
  }
  function addLine() { setLines(prev => [...prev, { itemId: items[0]?.id || '', quantity: 1, unitPrice: 0 }]) }
  function removeLine(i: number) { setLines(prev => prev.filter((_, idx) => idx !== i)) }

  async function submit(e: any) {
    e.preventDefault()
    
    const now = Date.now()
    
    // Prevent double submission with 3-second cooldown
    if (loading) {
      console.log('Form already submitting, ignoring duplicate submission')
      toast.warning('Please Wait', 'Purchase is being created. Please do not click multiple times.')
      return
    }
    
    if (now - lastSubmissionTime < 3000) {
      console.log('Submission too fast, enforcing cooldown')
      toast.warning('Too Fast', 'Please wait 3 seconds between submissions to prevent duplicates.')
      return
    }
    
    setLastSubmissionTime(now)
    
    // Submit immediately (no confirmation)
    await doSubmit()
  }

  async function doSubmit() {
    // Prevent double submission
    if (loading) {
      console.log('Already processing, ignoring duplicate submission')
      return
    }
    
    setLoading(true)
    try {
      const body = { supplierId, purchaseDate, lines, receiveImmediately: receiveNow }
      
      console.log('Submitting purchase:', {
        supplierId,
        lineCount: lines.length,
        totalQuantity: lines.reduce((sum, l) => sum + l.quantity, 0),
        receiveNow
      })
      
      const res = await fetch('/admin/purchases/create', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(body) 
      })
      
      const data = await res.json()
      
      if (!data?.success) throw new Error(data?.error || 'Failed')
      
      // Show success notification and redirect appropriately
      if (receiveNow) {
        toast.success(
          'Purchase Created & Stock Updated',
          `Purchase order ${data.purchaseId} created and stock automatically updated.`
        )
        // Redirect to purchase details since stock is already updated
        setTimeout(() => {
          window.location.href = `/admin/purchases/${data.purchaseId}`
        }, 1500)
      } else {
        toast.success(
          'Purchase Order Created',
          `Purchase order ${data.purchaseId} created successfully. Redirecting to receive items.`
        )
        // Redirect to receive page since stock needs to be updated
        setTimeout(() => {
          window.location.href = `/admin/purchases/${data.purchaseId}/receive`
        }, 1500)
      }
      
    } catch (err: any) {
      console.error('Purchase creation error:', err)
      const errorMessage = err?.message || String(err)
      
      // Show both notification types for maximum visibility
      showNotification('error', errorMessage)
      toast.error(
        'Purchase Creation Failed',
        errorMessage.includes('duplicate') ? 'This purchase may already exist. Please check recent purchases before trying again.' : 'Unable to create purchase order. Please verify your data and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const noSuppliers = suppliers.length === 0
  const noItems = items.length === 0
  const invalidLine = lines.some(l => !l.itemId || Number(l.quantity) <= 0)
  const supplierRequiredButEmpty = false

  return (
    <form onSubmit={submit}>
      <div className="mb-3">
        <label htmlFor="supplier-select" className="block text-sm">Supplier</label>
        {noSuppliers ? (
          <div className="text-sm text-gray-600">No suppliers found. You can add one below.</div>
        ) : (
          <select id="supplier-select" className="input" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
            <option value="">(Optional) Select supplier…</option>
            {localSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        <div className="mt-2 flex items-center gap-2">
          <button type="button" className="btn" onClick={() => setShowAddSupplier(v => !v)}>{showAddSupplier ? 'Cancel' : 'Add supplier'}</button>
          {showAddSupplier && (
            <div className="flex gap-2 items-center">
              <input type="text" placeholder="Supplier name" className="input" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)} />
              <button type="button" className="btn btn-primary" disabled={creatingSupplier || !newSupplierName.trim()} onClick={async () => {
                setCreatingSupplier(true)
                try {
                  const res = await fetch('/api/admin/suppliers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSupplierName.trim() }) })
                  const data = await res.json()
                  if (!data?.success) throw new Error(data?.error || 'Failed to create supplier')
                  // append and select
                  setLocalSuppliers(prev => [data.supplier, ...prev])
                  setSupplierId(data.supplier.id)
                  setNewSupplierName('')
                  setShowAddSupplier(false)
                } catch (err: any) {
                  toast.error('Supplier Creation Failed', err?.message || String(err))
                } finally {
                  setCreatingSupplier(false)
                }
              }}>{creatingSupplier ? 'Adding…' : 'Add'}</button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-3">
        <label htmlFor="purchase-date" className="block text-sm">Purchase Date</label>
        <input id="purchase-date" className="input" type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium">Lines</label>
        {noItems && (
          <div className="text-sm text-red-600 mb-2">No inventory items found. Add items from the Inventory section.</div>
        )}
        {lines.map((l, i) => {
          const selectedItem = items.find(item => item.id === l.itemId)
          return (
            <div key={i} className="flex gap-2 items-start mb-2 p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label htmlFor={`item-select-${i}`} className="block text-sm font-medium text-gray-700 mb-1">Item</label>
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
                <label htmlFor={`price-${i}`} className="block text-sm font-medium text-gray-700 mb-1">Unit Price (BDT)</label>
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
          <button type="button" className="btn" onClick={addLine} disabled={noItems}>Add line</button>
        </div>
      </div>

      <div className="mb-3">
        <label className="inline-flex items-center">
          <input type="checkbox" checked={receiveNow} onChange={e => setReceiveNow(e.target.checked)} />
          <span className="ml-2">Receive immediately (update stock)</span>
        </label>
      </div>

      <div>
        <button 
          type="submit"
          className={`btn btn-primary ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
          disabled={loading || noItems || invalidLine}
          style={{ pointerEvents: loading ? 'none' : 'auto' }} // Prevent any clicks while loading
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Purchase...
            </span>
          ) : (
            'Create Purchase'
          )}
        </button>
        {loading && (
          <p className="text-sm text-gray-600 mt-2">
            ⏳ Please wait... Creating purchase order and updating stock levels.
          </p>
        )}
      </div>
    </form>
  )
}
