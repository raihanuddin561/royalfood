"use client"
import React, { useState } from 'react'

type PurchaseItem = {
  id: string
  itemId: string
  item: { id: string; name: string; unit: string }
  quantity: number
  receivedQuantity?: number
  unitPrice: number
}

export default function ReceiveForm({ purchase }: any) {
  const [lines, setLines] = useState<PurchaseItem[]>(
    (purchase.purchaseItems || []).map((pi: any) => ({ ...pi }))
  )
  const [loading, setLoading] = useState(false)

  function updateLine(id: string, patch: Partial<PurchaseItem>) {
    setLines(prev => prev.map(l => (l.id === id ? { ...l, ...patch } : l)))
  }

  async function submit() {
    setLoading(true)
    try {
      const payload = { lines: lines.map(l => ({ purchaseItemId: l.id, receivedQuantity: Number(l.receivedQuantity ?? l.quantity), unitPrice: Number(l.unitPrice) })) }
      const res = await fetch(`/api/admin/purchases/${purchase.id}/receive`, { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Receive failed')
      alert('Purchase received/updated successfully')
      // refresh
      location.assign(`/admin/purchases/${purchase.id}`)
    } catch (e: any) {
      alert(e.message || 'Failed')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <table className="w-full table-auto mb-4">
        <thead>
          <tr className="text-left">
            <th>Item</th>
            <th>Ordered</th>
            <th>Already Received</th>
            <th>Receive Now</th>
            <th>Unit Price</th>
          </tr>
        </thead>
        <tbody>
          {lines.map(l => (
            <tr key={l.id} className="border-t">
              <td className="py-2">{l.item?.name}</td>
              <td className="py-2">{l.quantity} {l.item?.unit}</td>
              <td className="py-2">{l.receivedQuantity ?? 0}</td>
              <td className="py-2">
                <input type="number" min={0} step="0.01" className="input" value={l.receivedQuantity ?? l.quantity} onChange={e => updateLine(l.id, { receivedQuantity: Number(e.target.value) })} />
              </td>
              <td className="py-2">
                <input type="number" min={0} step="0.01" className="input" value={l.unitPrice} onChange={e => updateLine(l.id, { unitPrice: Number(e.target.value) })} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex gap-2">
        <button onClick={submit} disabled={loading} className="btn btn-primary">{loading ? 'Receiving...' : 'Receive'}</button>
        <a href={`/admin/purchases/${purchase.id}`} className="btn">Back</a>
      </div>
    </div>
  )
}
