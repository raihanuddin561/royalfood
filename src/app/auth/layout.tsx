import React from 'react'

export const metadata = {
  title: 'Auth - Royal Food'
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl">
        {children}
      </div>
    </div>
  )
}
