import { formatCurrency } from '@/lib/utils'
import { generateBalanceSheet } from '@/app/actions/sales'
import { getPartnershipDistribution } from '@/app/actions/partnership'

type Props = { monthlyRevenue: number }

export default async function ServerPartnershipSummary({ monthlyRevenue }: Props) {
  // Use generateBalanceSheet to compute retained earnings for current month
  // generateBalanceSheet expects a date; use today
  const resp = await generateBalanceSheet(new Date())

  let retained = 0
  if (resp && resp.success) {
    retained = resp.balanceSheet?.equity?.retainedEarnings || 0
  } else {
    // Fallback: estimate retained as monthlyRevenue * 0.34 (previous heuristic)
    retained = monthlyRevenue * 0.34
  }

  const dist = await getPartnershipDistribution(retained)

  const p1 = dist.partners[0]
  const p2 = dist.partners[1]

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyRevenue)}</p>
          <p className="text-sm text-gray-500">Total Revenue</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(Math.max(0, monthlyRevenue - retained))}</p>
          <p className="text-sm text-gray-500">Est. Total Expenses</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{formatCurrency(retained)}</p>
          <p className="text-sm text-gray-500">Est. Net Profit</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900">{p1 ? `${p1.name} (${p1.sharePercent}%)` : 'Partner 1'}</p>
          <p className="text-lg font-bold text-blue-900">{formatCurrency(p1 ? p1.amount : 0)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm font-medium text-green-900">{p2 ? `${p2.name} (${p2.sharePercent}%)` : 'Partner 2'}</p>
          <p className="text-lg font-bold text-green-900">{formatCurrency(p2 ? p2.amount : 0)}</p>
        </div>
      </div>
    </div>
  )
}
