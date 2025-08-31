"use client"

import { useRouter } from 'next/navigation'

export default function BackHome() {
  const router = useRouter()

  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50"
      >
        Back
      </button>
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700"
      >
        Home
      </button>
    </div>
  )
}
