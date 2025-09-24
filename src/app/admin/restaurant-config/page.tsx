import { RestaurantContactInfo, QuickContact, BusinessStatus } from '@/components/ui/RestaurantContactInfo'
import {
  getRestaurantName,
  getFormattedContactInfo,
  getSupportInfo,
  getDeliveryInfo,
  getAllBusinessHours,
  isRestaurantOpen,
  getMinimumOrder,
  getDeliveryCharge,
  restaurantConfig
} from '@/lib/restaurant-config'

export const metadata = {
  title: 'Restaurant Configuration Demo',
  description: 'Demonstration of centralized restaurant configuration usage'
}

export default function RestaurantConfigDemo() {
  const contactInfo = getFormattedContactInfo()
  const supportInfo = getSupportInfo()
  const deliveryInfo = getDeliveryInfo()
  const businessHours = getAllBusinessHours()
  const isOpen = isRestaurantOpen()
  const minOrder = getMinimumOrder()
  const deliveryCharge = getDeliveryCharge(500) // Example order amount

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {getRestaurantName()} - Configuration Demo
          </h1>
          <p className="text-lg text-gray-600">
            Centralized restaurant configuration system in action
          </p>
          <BusinessStatus className="justify-center mt-4" />
        </div>

        {/* Configuration Overview */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Restaurant Name:</span> {getRestaurantName()}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <span className={`ml-2 ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
                  {isOpen ? 'Currently Open' : 'Currently Closed'}
                </span>
              </div>
              <div>
                <span className="font-medium">Contact Phone:</span> {contactInfo.phone}
              </div>
              <div>
                <span className="font-medium">Contact Email:</span> {contactInfo.email}
              </div>
              <div>
                <span className="font-medium">Location:</span> {contactInfo.address}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Delivery Configuration</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Delivery Available:</span> 
                <span className={`ml-2 ${deliveryInfo.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                  {deliveryInfo.isAvailable ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <span className="font-medium">Minimum Order:</span> BDT {minOrder}
              </div>
              <div>
                <span className="font-medium">Delivery Charge:</span> BDT {deliveryCharge}
              </div>
              <div>
                <span className="font-medium">Estimated Time:</span> {deliveryInfo.estimatedTime}
              </div>
              {deliveryInfo.freeDeliveryThreshold && (
                <div className="text-green-600 text-sm">
                  Free delivery on orders above BDT {deliveryInfo.freeDeliveryThreshold}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information Components */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Contact Information Components</h2>
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Full Contact Info */}
              <div>
                <h3 className="text-lg font-medium mb-3">Full Contact Information</h3>
                <RestaurantContactInfo 
                  variant="full" 
                  showSocial={true} 
                  showHours={true} 
                />
              </div>

              {/* Support Only */}
              <div>
                <h3 className="text-lg font-medium mb-3">Support Information Only</h3>
                <RestaurantContactInfo variant="support-only" />
                
                <h3 className="text-lg font-medium mb-3 mt-6">Delivery Information Only</h3>
                <RestaurantContactInfo variant="delivery-only" />
              </div>
            </div>
          </div>

          {/* Compact Components */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Compact Components</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-medium mb-3">Compact Contact Info</h3>
                <RestaurantContactInfo variant="compact" />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-3">Quick Contact (for headers/footers)</h3>
                <div className="bg-gray-800 text-white p-3 rounded">
                  <QuickContact className="text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Business Hours</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-3">Weekly Schedule</h3>
                  <div className="space-y-2">
                    {businessHours.map(({ day, hours }) => (
                      <div key={day} className="flex justify-between">
                        <span className="font-medium">{day}:</span>
                        <span className="text-gray-600">{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-3">Current Status</h3>
                  <BusinessStatus />
                  <div className="mt-4 text-sm text-gray-600">
                    <p>This status is calculated based on current day and time.</p>
                    <p>Business hours are configured centrally and can be easily updated.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configuration Code Example */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">How to Use</h2>
            <div className="bg-gray-900 text-white p-6 rounded-lg">
              <pre className="text-sm overflow-x-auto">
{`// Import the configuration functions
import { 
  getRestaurantName, 
  getContactPhone,
  getSupportInfo,
  isRestaurantOpen 
} from '@/lib/restaurant-config'

// Use in your components
export default function MyComponent() {
  const restaurantName = getRestaurantName()
  const isOpen = isRestaurantOpen()
  const supportInfo = getSupportInfo()
  
  return (
    <div>
      <h1>{restaurantName}</h1>
      <p>Status: {isOpen ? 'Open' : 'Closed'}</p>
      <p>Support: {supportInfo.phone}</p>
    </div>
  )
}`}
              </pre>
            </div>
          </div>

          {/* Raw Configuration */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Raw Configuration Data</h2>
            <div className="bg-white p-6 rounded-lg shadow">
              <details>
                <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800">
                  Click to view raw configuration object
                </summary>
                <pre className="mt-4 text-sm bg-gray-100 p-4 rounded overflow-x-auto">
                  {JSON.stringify(restaurantConfig, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-600">
              All restaurant information is managed from <code className="bg-gray-100 px-2 py-1 rounded text-sm">src/lib/restaurant-config.ts</code>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Update the configuration once, and it applies everywhere in your application.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}