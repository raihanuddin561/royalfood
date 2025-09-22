import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
import Link from 'next/link'

type Props = { params: { id: string } }

export default async function Page({ params }: Props) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: params.id },
    include: { purchaseItems: { include: { item: true } }, supplier: true }
  })

  if (!purchase) return <div className="p-4">Purchase not found</div>

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Purchase {purchase.purchaseNumber}</h1>
        <div className="flex gap-2">
          <Link href={`/admin/purchases/${purchase.id}/edit`} className="btn btn-primary">Edit</Link>
          {purchase.status === 'PENDING' && (
            <Link href={`/admin/purchases/${purchase.id}/receive`} className="btn btn-secondary">Receive</Link>
          )}
          <Link href="/admin/purchases" className="btn">Back</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white shadow rounded p-4">
          <p className="text-sm text-gray-600">Supplier</p>
          <p className="font-medium">{purchase.supplier?.name ?? '(none)'}</p>
          <p className="text-sm text-gray-600 mt-2">Purchase date</p>
          <p>{new Date(purchase.purchaseDate).toLocaleString()}</p>
        </div>
        <div className="bg-white shadow rounded p-4">
          <p className="text-sm text-gray-600">Status</p>
          <p className="font-medium">{purchase.status}</p>
          <p className="text-sm text-gray-600 mt-2">Total amount</p>
          <p className="font-medium">{purchase.totalAmount}</p>
        </div>
      </div>

      <div className="bg-white shadow rounded p-4">
        <h2 className="font-semibold mb-3">Lines</h2>
        <table className="w-full table-auto">
          <thead>
            <tr className="text-left text-sm text-gray-600">
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {purchase.purchaseItems.map(pi => (
              <tr key={pi.id} className="border-t">
                <td className="py-2">{pi.item?.name ?? pi.itemId}</td>
                <td className="py-2">{pi.quantity}</td>
                <td className="py-2">{pi.unitPrice}</td>
                <td className="py-2">{pi.totalPrice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
