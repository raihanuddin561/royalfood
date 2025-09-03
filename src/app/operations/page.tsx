import DailyOperationsDashboard from '@/app/dashboard/components/DailyOperationsDashboard'
import CostTrackingDashboard from '@/app/operations/CostTrackingDashboard'

export default function OperationsPage() {
  return (
    <div className="space-y-8">
      {/* Daily Operations */}
      <DailyOperationsDashboard />
      
      {/* Cost Tracking Dashboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Cost Tracking & Analysis</h2>
          <p className="text-sm text-gray-600 mt-1">Monitor operational costs across all time periods</p>
        </div>
        <div className="p-6">
          <CostTrackingDashboard />
        </div>
      </div>
    </div>
  )
}
