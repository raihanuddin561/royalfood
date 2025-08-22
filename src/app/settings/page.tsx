'use client'

import { useState } from 'react'
import { Settings, Globe, DollarSign, Clock, Save, User, Bell } from 'lucide-react'

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' }
]

const currencies = [
  { code: 'BDT', name: 'Bangladesh Taka (BDT)', symbol: 'BDT' },
  { code: 'USD', name: 'US Dollar ($)', symbol: '$' }
]

const timezones = [
  { code: 'Asia/Dhaka', name: 'Asia/Dhaka (GMT+6)', offset: '+6:00' },
  { code: 'UTC', name: 'UTC (GMT+0)', offset: '+0:00' }
]

export default function SettingsPage() {
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [selectedCurrency, setSelectedCurrency] = useState('BDT')
  const [selectedTimezone, setSelectedTimezone] = useState('Asia/Dhaka')
  const [showSaveNotification, setShowSaveNotification] = useState(false)

  const handleSaveSettings = () => {
    // Here you would typically save to database or localStorage
    setShowSaveNotification(true)
    setTimeout(() => setShowSaveNotification(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure system preferences and regional settings
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Settings
        </button>
      </div>

      {/* Save Notification */}
      {showSaveNotification && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Bell className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Settings saved successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Language & Regional Settings */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Globe className="h-5 w-5 text-blue-500 mr-2" />
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Language & Regional Settings
              </h3>
            </div>
            
            <div className="space-y-6">
              {/* Language Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Display Language
                </label>
                <div className="space-y-2">
                  {languages.map((lang) => (
                    <div key={lang.code} className="flex items-center">
                      <input
                        id={`lang-${lang.code}`}
                        name="language"
                        type="radio"
                        value={lang.code}
                        checked={selectedLanguage === lang.code}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      <label htmlFor={`lang-${lang.code}`} className="ml-3 flex items-center">
                        <span className="mr-2 text-lg">{lang.flag}</span>
                        <span className="text-sm text-gray-900">{lang.name}</span>
                        {lang.code === 'en' && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            Current
                          </span>
                        )}
                        {lang.code === 'bn' && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                            Coming Soon
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Currently using English. Bengali language support will be available in future updates.
                </p>
              </div>

              {/* Currency Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <DollarSign className="inline h-4 w-4 mr-1" />
                  Currency
                </label>
                <div className="space-y-2">
                  {currencies.map((currency) => (
                    <div key={currency.code} className="flex items-center">
                      <input
                        id={`currency-${currency.code}`}
                        name="currency"
                        type="radio"
                        value={currency.code}
                        checked={selectedCurrency === currency.code}
                        onChange={(e) => setSelectedCurrency(e.target.value)}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      <label htmlFor={`currency-${currency.code}`} className="ml-3 flex items-center">
                        <span className="text-sm text-gray-900">{currency.name}</span>
                        {currency.code === 'BDT' && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Active
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timezone Selection */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Timezone
                </label>
                <div className="space-y-2">
                  {timezones.map((tz) => (
                    <div key={tz.code} className="flex items-center">
                      <input
                        id={`tz-${tz.code}`}
                        name="timezone"
                        type="radio"
                        value={tz.code}
                        checked={selectedTimezone === tz.code}
                        onChange={(e) => setSelectedTimezone(e.target.value)}
                        className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-600"
                      />
                      <label htmlFor={`tz-${tz.code}`} className="ml-3 flex items-center">
                        <span className="text-sm text-gray-900">{tz.name}</span>
                        {tz.code === 'Asia/Dhaka' && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                            Current
                          </span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center mb-4">
              <Settings className="h-5 w-5 text-gray-500 mr-2" />
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                System Preferences
              </h3>
            </div>
            
            <div className="space-y-6">
              {/* Number Formatting */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Number Formatting
                </label>
                <div className="bg-gray-50 rounded-md p-4">
                  <div className="text-sm text-gray-900 space-y-1">
                    <div className="flex justify-between">
                      <span>Currency:</span>
                      <span className="font-mono">BDT 1,234.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Numbers:</span>
                      <span className="font-mono">1,234.56</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="font-mono">08/15/2025</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="font-mono">02:30 PM</span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Currently using English (US) formatting. This will change when you switch languages.
                </p>
              </div>

              {/* User Preferences */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  <User className="inline h-4 w-4 mr-1" />
                  User Preferences
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">Show tooltips</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      defaultChecked
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">Compact view</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">Auto-save forms</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                      defaultChecked
                    />
                  </div>
                </div>
              </div>

              {/* Future Features */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Coming Soon
                </label>
                <div className="bg-blue-50 rounded-md p-4">
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Bengali language interface</li>
                    <li>• Multiple currency support</li>
                    <li>• Custom date formats</li>
                    <li>• Theme customization</li>
                    <li>• Export language preferences</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Configuration Summary */}
      <div className="rounded-md bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Settings className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Current Configuration</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc space-y-1 pl-5">
                <li>Language: English (US)</li>
                <li>Currency: Bangladesh Taka (BDT)</li>
                <li>Timezone: Asia/Dhaka (GMT+6)</li>
                <li>Number Format: English style (1,234.56)</li>
                <li>Date Format: MM/DD/YYYY</li>
              </ul>
            </div>
            <div className="mt-4">
              <p className="text-sm text-blue-600">
                <strong>Note:</strong> Language settings will be implemented in future updates. 
                Currently, all text displays in English while maintaining BDT currency and Dhaka timezone.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
