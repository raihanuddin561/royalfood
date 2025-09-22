import { prisma } from '@/lib/prisma'
import EditPurchaseForm from './EditPurchaseForm'
import Link from 'next/link'
export const dynamic = 'force-dynamic'

type Props = { params: { id: string } }

export default async function EditPurchasePage({ params }: Props) {
  const [purchase, suppliers, items] = await Promise.all([
    prisma.purchase.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        purchaseItems: {
          include: {
            item: true
          }
        }
      }
    }),
    prisma.supplier.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.item.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        unit: true
      }
    })
  ])

  if (!purchase) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Purchase Not Found</h1>
          <p className="text-gray-600 mb-4">The purchase you're looking for doesn't exist.</p>
          <Link href="/admin/purchases" className="btn btn-primary">
            Back to Purchases
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit Purchase {purchase.purchaseNumber}</h1>
          <p className="text-gray-600 mt-1">
            Status: <span className="font-medium">{purchase.status}</span> | 
            Created: {new Date(purchase.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/purchases/${purchase.id}`} className="btn btn-secondary">
            View Purchase
          </Link>
          <Link href="/admin/purchases" className="btn">
            Back to List
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <EditPurchaseForm
          purchase={{
            ...purchase,
            purchaseDate: purchase.purchaseDate.toISOString()
          }}
          suppliers={suppliers}
          items={items}
        />
      </div>
    </div>
  )
}