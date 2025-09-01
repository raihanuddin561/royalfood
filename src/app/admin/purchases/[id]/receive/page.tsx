import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
import ReceiveForm from './ReceiveForm'

type Props = { params: { id: string } }

export default async function Page({ params }: Props) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: params.id },
    include: { purchaseItems: { include: { item: true } }, supplier: true }
  })

  if (!purchase) return <div className="p-4">Purchase not found</div>

  // Prevent accessing receive page for already received purchases
  if (purchase.status === 'RECEIVED') {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4">Purchase Already Received</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-yellow-800">
            Purchase {purchase.purchaseNumber} has already been fully received. 
            Stock quantities have already been updated.
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`/admin/purchases/${purchase.id}`} className="btn btn-primary">
            View Purchase Details
          </a>
          <a href="/admin/purchases" className="btn">
            Back to Purchases
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Receive Purchase: {purchase.purchaseNumber}</h1>
      <p className="text-sm text-gray-600 mb-4">Supplier: {purchase.supplier?.name}</p>
      <div className="bg-white shadow rounded p-4">
        <ReceiveForm purchase={purchase} />
      </div>
    </div>
  )
}
