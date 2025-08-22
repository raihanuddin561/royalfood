'use client'

import { Plus, Save, Tag } from 'lucide-react'
import { createCategory } from '@/app/actions/categories'
import { useFormStatus } from 'react-dom'
import { useState, useRef, useEffect } from 'react'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 transition-colors duration-200"
    >
      <Save className="w-4 h-4 mr-2" />
      {pending ? 'Creating...' : 'Create Category'}
    </button>
  )
}

export function CategoryForm() {
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    const result = await createCategory(formData)
    
    if (result.success) {
      setMessage({ type: 'success', text: result.message })
      formRef.current?.reset()
    } else {
      setMessage({ type: 'error', text: result.message })
    }
  }

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center">
          <Plus className="w-5 h-5 text-green-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Add New Category</h2>
        </div>
      </div>
      
      <div className="p-6">
        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}
        
        <form ref={formRef} action={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g., Beverages, Dairy Products, Spices"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Brief description of this category..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 bg-white resize-none"
            ></textarea>
          </div>

          <div className="flex items-center">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active (available for use)
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <Tag className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Category Guidelines:</h3>
                <ul className="mt-2 text-xs text-blue-700 list-disc list-inside space-y-1">
                  <li>Use descriptive, clear names for easy identification</li>
                  <li>Categories help organize inventory and generate reports</li>
                  <li>You can deactivate categories but not delete them if they have items</li>
                  <li>Consider grouping similar items (e.g., "Fresh Produce", "Frozen Foods")</li>
                </ul>
              </div>
            </div>
          </div>

          <SubmitButton />
        </form>
      </div>
    </div>
  )
}
