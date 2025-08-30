"use client"
import { useState } from 'react'
import { ConfirmModal } from '@/components/ui/Modal'

type Supplier = { id: string; name: string }
type Item = { id: string; name: string; sku?: string; currentStock?: number }

export default function CreatePurchaseForm({ suppliers, items }: { suppliers: Supplier[]; items: Item[] }) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '')
  const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>(suppliers)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState('')
  const [creatingSupplier, setCreatingSupplier] = useState(false)
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10))
  const [lines, setLines] = useState([{ itemId: items[0]?.id || '', quantity: 1, unitPrice: 0 }])
  const [receiveNow, setReceiveNow] = useState(true)
  const [loading, setLoading] = useState(false)

  function updateLine(index: number, patch: Partial<{ itemId: string; quantity: number; unitPrice: number }>) {
    setLines(prev => prev.map((l, i) => i === index ? { ...l, ...patch } : l))
  }
  function addLine() { setLines(prev => [...prev, { itemId: items[0]?.id || '', quantity: 1, unitPrice: 0 }]) }
  function removeLine(i: number) { setLines(prev => prev.filter((_, idx) => idx !== i)) }

  async function submit(e: any) {
    e.preventDefault()
    // open confirmation modal
    setShowConfirm(true)
  }

  const [showConfirm, setShowConfirm] = useState(false)

  async function doSubmit() {
    setShowConfirm(false)
    setLoading(true)
    try {
      const body = { supplierId, purchaseDate, lines, receiveImmediately: receiveNow }
      const res = await fetch('/admin/purchases/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!data?.success) throw new Error(data?.error || 'Failed')
      location.assign(`/admin/purchases/${data.purchaseId}`)
    } catch (err: any) {
      alert(err?.message || String(err))
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
                  alert(err?.message || String(err))
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
        {lines.map((l, i) => (
          <div key={i} className="flex gap-2 items-center mb-2">
            <label htmlFor={`item-select-${i}`} className="sr-only">Item</label>
            <select id={`item-select-${i}`} className="input flex-1" value={l.itemId} onChange={e => updateLine(i, { itemId: e.target.value })} disabled={noItems}>
              <option value="">Select item…</option>
              {items.map(it => <option key={it.id} value={it.id}>{it.name}{it.sku ? ` (${it.sku})` : ''}</option>)}
            </select>
            <div className="flex flex-col">
              <label htmlFor={`qty-${i}`} className="text-xs text-gray-600">Quantity</label>
              <input id={`qty-${i}`} className="input w-24" type="number" min={0} value={l.quantity} onChange={e => updateLine(i, { quantity: Number(e.target.value) })} />
            </div>
            <div className="flex flex-col">
              <label htmlFor={`price-${i}`} className="text-xs text-gray-600">Unit price</label>
              <input id={`price-${i}`} className="input w-32" type="number" step="0.01" value={l.unitPrice} onChange={e => updateLine(i, { unitPrice: Number(e.target.value) })} />
            </div>
            <button type="button" className="btn" onClick={() => removeLine(i)}>Remove</button>
          </div>
        ))}
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
  <button className="btn btn-primary" disabled={loading || noItems || invalidLine}>{loading ? 'Creating...' : 'Create Purchase'}</button>
  </div>
  <ConfirmModal isOpen={showConfirm} title="Confirm create purchase" description={`Create purchase with ${lines.length} line(s)${receiveNow ? ' and receive now (update stock).' : '.'}`} onConfirm={doSubmit} onCancel={() => setShowConfirm(false)} />
    </form>
  )
}
