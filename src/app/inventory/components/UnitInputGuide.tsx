import { Info, Plus, Check } from 'lucide-react'

export function UnitInputGuide() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start">
        <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Custom Units Feature
          </h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p>
              You can now use custom units for your inventory items:
            </p>
            <ul className="space-y-1 ml-4">
              <li className="flex items-center">
                <Check className="w-3 h-3 text-blue-600 mr-2" />
                <span>Select from predefined units (kg, pcs, box, etc.)</span>
              </li>
              <li className="flex items-center">
                <Plus className="w-3 h-3 text-blue-600 mr-2" />
                <span>Add custom units like "tray", "carton", "bundle"</span>
              </li>
              <li className="flex items-center">
                <Check className="w-3 h-3 text-blue-600 mr-2" />
                <span>Custom units are saved and reused across items</span>
              </li>
            </ul>
            <p className="text-xs text-blue-600 mt-2">
              <strong>Tip:</strong> Custom units must be 1-20 characters and contain only letters, numbers, and basic symbols.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
