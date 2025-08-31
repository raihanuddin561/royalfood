import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
import Link from 'next/link'

export default async function PurchasesPage() {
  const purchases = await prisma.purchase.findMany({
    orderBy: { purchaseDate: 'desc' },
    take: 50,
    include: {
      supplier: true,
      purchaseItems: { include: { item: true } }
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Purchases</h1>
        <div>
          <Link href={`/admin/purchases/new`} className="btn btn-primary">Create Purchase</Link>
        </div>
      </div>
      <div className="bg-white shadow rounded p-4">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left">
              <th>Purchase#</th>
              <th>Items</th>
              <th>Date</th>
              <th>Total</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {purchases.map(p => (
              <tr key={p.id} className="border-t">
                <td className="py-2">{p.purchaseNumber}</td>
                <td className="py-2">{(p.purchaseItems || []).map(pi => pi.item?.name).filter(Boolean).join(', ')}</td>
                <td className="py-2">{new Date(p.purchaseDate).toLocaleDateString()}</td>
                <td className="py-2">{p.totalAmount}</td>
                <td className="py-2">{p.status}</td>
                <td className="py-2">
                  <Link href={`/admin/purchases/${p.id}`} className="text-indigo-600 mr-3">View</Link>
                  <Link href={`/admin/purchases/${p.id}/receive`} className="text-green-600">Receive</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
