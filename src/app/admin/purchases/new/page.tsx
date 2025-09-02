import { prisma } from '@/lib/prisma'
import CreatePurchaseForm from './CreatePurchaseForm'
export const dynamic = 'force-dynamic'

export default async function Page() {
  const [suppliers, items] = await Promise.all([
    prisma.supplier.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.item.findMany({ select: { id: true, name: true, sku: true, currentStock: true, unit: true }, orderBy: { name: 'asc' }, take: 1000 })
  ])

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Create Purchase</h1>
      <div className="bg-white shadow rounded p-4">
        <CreatePurchaseForm suppliers={suppliers} items={items} />
      </div>
    </div>
  )
}
