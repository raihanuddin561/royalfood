import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function PurchasesPage() {
  const purchases = await prisma.purchase.findMany({ orderBy: { purchaseDate: 'desc' }, take: 50, include: { supplier: true } })

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Purchases</h1>
      <div className="bg-white shadow rounded p-4">
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left">
              <th>Purchase#</th>
              <th>Supplier</th>
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
                <td className="py-2">{p.supplier?.name}</td>
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
