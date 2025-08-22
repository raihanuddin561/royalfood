'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp,
  Settings,
  FileText,
  Clock,
  ChefHat,
  Calculator,
  Activity,
  Shield,
  Building2,
  User
} from 'lucide-react'
import { UserRole } from '@prisma/client'
import { RoleGuard } from '@/components/auth/RoleGuard'

interface NavigationItem {
  name: string
  href: string
  icon: any
  roles?: UserRole[]
  description?: string
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Main overview' },
  { name: 'Daily Operations', href: '/operations', icon: Clock, description: 'Daily cost tracking' },
  { 
    name: 'Admin Panel', 
    href: '/admin', 
    icon: Shield, 
    roles: [UserRole.ADMIN],
    description: 'System administration' 
  },
  { name: 'Inventory', href: '/inventory', icon: Package, description: 'Stock management' },
  { name: 'Stock Usage', href: '/inventory/usage', icon: Activity, description: 'Track ingredient usage' },
  { name: 'Orders', href: '/orders', icon: ShoppingCart, description: 'Customer orders' },
  { name: 'Menu', href: '/menu', icon: ChefHat, description: 'Menu management' },
  { 
    name: 'Employees', 
    href: '/employees', 
    icon: Users, 
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    description: 'Staff management' 
  },
  { name: 'Sales', href: '/sales', icon: DollarSign, description: 'Sales tracking' },
  { 
    name: 'Expenses', 
    href: '/expenses', 
    icon: TrendingUp, 
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    description: 'Expense management' 
  },
  { 
    name: 'Reports', 
    href: '/reports', 
    icon: FileText, 
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    description: 'Financial reports' 
  },
  { 
    name: 'Partnership', 
    href: '/partnership', 
    icon: Building2, 
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    description: 'Partnership management' 
  },
  { 
    name: 'Settings', 
    href: '/settings', 
    icon: Settings, 
    roles: [UserRole.ADMIN, UserRole.MANAGER],
    description: 'System settings' 
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const isCurrentPath = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true
    if (href !== '/dashboard' && pathname.startsWith(href)) return true
    return false
  }

  const getRoleBadge = (userRole: UserRole) => {
    switch (userRole) {
      case UserRole.ADMIN:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-sm">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </span>
        )
      case UserRole.MANAGER:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm">
            <Settings className="w-3 h-3 mr-1" />
            Manager
          </span>
        )
      case UserRole.EMPLOYEE:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm">
            <User className="w-3 h-3 mr-1" />
            Employee
          </span>
        )
      default:
        return null
    }
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-gradient-to-b from-gray-900 to-gray-800 fixed left-0 top-0 z-40 border-r border-gray-700 shadow-xl">
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center px-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Royal Food</h1>
        </div>
      </div>

      {/* User Info */}
      {session?.user && (
        <div className="px-4 py-4 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {session.user.email}
              </p>
            </div>
          </div>
          <div className="mt-3">
            {getRoleBadge(session.user.role)}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex flex-1 flex-col px-3 py-4 overflow-y-auto">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
            // Check if user has required role for this item
            const hasAccess = !item.roles || item.roles.includes(session?.user?.role as UserRole)
            
            if (!hasAccess) return null

            const isActive = isCurrentPath(item.href)
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`group flex items-center gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gray-800 text-white shadow-lg border border-gray-700'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
                  }`}
                  title={item.description}
                >
                  <item.icon className={`h-5 w-5 shrink-0 transition-colors ${
                    isActive ? 'text-blue-400' : 'text-gray-400 group-hover:text-white'
                  }`} />
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Role-specific sections */}
        <RoleGuard allowedRoles={[UserRole.ADMIN]}>
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Administration
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/admin/users"
                  className="group flex items-center gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all"
                >
                  <Users className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-white" />
                  User Management
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/system"
                  className="group flex items-center gap-x-3 rounded-lg p-3 text-sm leading-6 font-medium text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all"
                >
                  <Settings className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-white" />
                  System Config
                </Link>
              </li>
            </ul>
          </div>
        </RoleGuard>
      </nav>
    </aside>
  )
}
