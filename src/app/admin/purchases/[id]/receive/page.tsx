import { prisma } from '@/lib/prisma'
import ReceiveForm from './ReceiveForm'

type Props = { params: { id: string } }

export default async function Page({ params }: Props) {
  const purchase = await prisma.purchase.findUnique({
    where: { id: params.id },
    include: { purchaseItems: { include: { item: true } }, supplier: true }
  })

  if (!purchase) return <div className="p-4">Purchase not found</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Receive Purchase: {purchase.purchaseNumber}</h1>
      <p className="text-sm text-gray-600 mb-4">Supplier: {purchase.supplier?.name}</p>
      <div className="bg-white shadow rounded p-4">
        {/* @ts-expect-error Server component passing data to client */}
        <ReceiveForm purchase={purchase} />
      </div>
    </div>
  )
}
