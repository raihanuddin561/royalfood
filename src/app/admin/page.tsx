import { requireAuth } from '@/lib/auth-utils'
import { UserRole } from '@prisma/client'
import { Users, Shield, Database, Settings, BarChart3, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function AdminPage() {
  const user = await requireAuth([UserRole.ADMIN])

  const adminStats = [
    { name: 'Total Users', value: '12', icon: Users, change: '+2 this month' },
    { name: 'Active Sessions', value: '8', icon: Activity, change: 'Current' },
    { name: 'System Health', value: '99.9%', icon: BarChart3, change: 'Uptime' },
    { name: 'Database Size', value: '2.4GB', icon: Database, change: '+0.3GB this month' },
  ]

  const quickActions = [
    { name: 'User Management', href: '/admin/users', icon: Users, description: 'Manage user accounts and roles' },
    { name: 'System Settings', href: '/admin/system', icon: Settings, description: 'Configure system parameters' },
    { name: 'Security Settings', href: '/admin/security', icon: Shield, description: 'Manage security policies' },
    { name: 'Database Admin', href: '/admin/database', icon: Database, description: 'Database maintenance tools' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-2 text-gray-600">System administration and management tools</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          <p className="text-sm text-gray-600">Common administrative tasks</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="flex items-start p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
              >
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                  <action.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">{action.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent System Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">New user registered</p>
                <p className="text-xs text-gray-500">john.doe@example.com - 2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Settings className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">System settings updated</p>
                <p className="text-xs text-gray-500">Security policy changes - 4 hours ago</p>
              </div>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                <Database className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Database backup completed</p>
                <p className="text-xs text-gray-500">Scheduled backup - 6 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
