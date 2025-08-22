'use client'

import { Bell, Search, User, LogOut, Settings, Shield } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { useState, useRef, useEffect } from 'react'

export default function Header() {
  const { data: session } = useSession()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'MANAGER':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'EMPLOYEE':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="h-3 w-3" />
      case 'MANAGER':
        return <Settings className="h-3 w-3" />
      case 'EMPLOYEE':
        return <User className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8 w-full">
      {/* Search Section */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <form className="relative flex flex-1 max-w-md" action="#" method="GET">
          <label htmlFor="search-field" className="sr-only">
            Search
          </label>
          <Search
            className="pointer-events-none absolute inset-y-0 left-0 h-full w-5 text-gray-400 ml-3"
            aria-hidden="true"
          />
          <input
            id="search-field"
            className="block h-full w-full rounded-lg border-0 bg-gray-50 py-0 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-600 focus:bg-white sm:text-sm"
            placeholder="Search orders, inventory, menu items..."
            type="search"
            name="search"
            suppressHydrationWarning
          />
        </form>
        
        {/* Action Items */}
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <button 
            type="button" 
            className="relative -m-2.5 p-2.5 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            suppressHydrationWarning
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" aria-hidden="true" />
            {/* Notification badge */}
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-300" aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-x-3 lg:gap-x-4 hover:bg-gray-50 rounded-lg p-2 transition-colors duration-200"
            >
              {/* User Info - Desktop */}
              <div className="hidden lg:block lg:text-right">
                <div className="text-sm font-semibold leading-6 text-gray-900">
                  {session?.user?.name || 'User'}
                </div>
                {session?.user?.role && (
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(session.user.role)}`}>
                    {getRoleIcon(session.user.role)}
                    {session.user.role}
                  </div>
                )}
              </div>
              
              {/* Avatar */}
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-sm ring-2 ring-white">
                <User className="h-5 w-5 text-white" />
              </div>
            </button>

            {/* Dropdown menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl bg-white py-2 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100">
                {/* User Profile Header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-gray-900 truncate">{session?.user?.name}</p>
                      <p className="text-sm text-gray-600 truncate">{session?.user?.email}</p>
                      {session?.user?.employee && (
                        <p className="text-xs text-gray-500 truncate">
                          {session.user.employee.position} • {session.user.employee.department}
                        </p>
                      )}
                      {session?.user?.role && (
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 mt-1 rounded-full text-xs font-medium border ${getRoleColor(session.user.role)}`}>
                          {getRoleIcon(session.user.role)}
                          {session.user.role}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Menu Items */}
                <div className="py-1">
                  <button
                    className="flex w-full items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setIsDropdownOpen(false)
                      // Add profile navigation if needed
                    }}
                  >
                    <User className="mr-3 h-4 w-4 text-gray-400" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Profile</div>
                      <div className="text-xs text-gray-500">View and edit profile</div>
                    </div>
                  </button>
                  
                  <button
                    className="flex w-full items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setIsDropdownOpen(false)
                      // Add settings navigation if needed
                    }}
                  >
                    <Settings className="mr-3 h-4 w-4 text-gray-400" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Settings</div>
                      <div className="text-xs text-gray-500">Preferences and configuration</div>
                    </div>
                  </button>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">Sign out</div>
                      <div className="text-xs text-red-500">Sign out of your account</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
