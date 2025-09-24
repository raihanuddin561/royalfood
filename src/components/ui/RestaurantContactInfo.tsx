'use client'

import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Truck,
  Facebook,
  Instagram,
  Twitter,
  MessageCircle
} from 'lucide-react'
import {
  getRestaurantName,
  getFormattedContactInfo,
  getSupportInfo,
  getDeliveryInfo,
  getAllBusinessHours,
  getSocialMedia,
  getFullAddress,
  isRestaurantOpen,
  getEstimatedDeliveryTime,
  isDeliveryAvailable
} from '@/lib/restaurant-config'

interface ContactInfoProps {
  variant?: 'full' | 'compact' | 'support-only' | 'delivery-only'
  showSocial?: boolean
  showHours?: boolean
  className?: string
}

export function RestaurantContactInfo({ 
  variant = 'full', 
  showSocial = false, 
  showHours = false,
  className = '' 
}: ContactInfoProps) {
  const contactInfo = getFormattedContactInfo()
  const supportInfo = getSupportInfo()
  const deliveryInfo = getDeliveryInfo()
  const businessHours = getAllBusinessHours()
  const socialMedia = getSocialMedia()
  const isOpen = isRestaurantOpen()

  if (variant === 'support-only') {
    return (
      <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
        <h3 className="text-lg font-semibold mb-3">Need Help?</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-blue-600" />
            <a href={`tel:${supportInfo.phone}`} className="text-blue-600 hover:underline">
              {supportInfo.phone}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-600" />
            <a href={`mailto:${supportInfo.email}`} className="text-blue-600 hover:underline">
              {supportInfo.email}
            </a>
          </div>
          {supportInfo.whatsapp && (
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <a 
                href={`https://wa.me/${supportInfo.whatsapp.replace(/[^0-9]/g, '')}`} 
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline"
              >
                WhatsApp Support
              </a>
            </div>
          )}
          <div className="text-sm text-gray-600">
            <Clock className="h-4 w-4 inline mr-1" />
            Support Hours: {supportInfo.hours}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'delivery-only') {
    return (
      <div className={`bg-white p-4 rounded-lg shadow ${className}`}>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Delivery Information
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Delivery Available:</span>
            <span className={deliveryInfo.isAvailable ? 'text-green-600' : 'text-red-600'}>
              {deliveryInfo.isAvailable ? 'Yes' : 'No'}
            </span>
          </div>
          {deliveryInfo.isAvailable && (
            <>
              <div className="flex justify-between">
                <span>Estimated Time:</span>
                <span>{getEstimatedDeliveryTime()}</span>
              </div>
              {deliveryInfo.minimumOrder && (
                <div className="flex justify-between">
                  <span>Minimum Order:</span>
                  <span>BDT {deliveryInfo.minimumOrder}</span>
                </div>
              )}
              {deliveryInfo.deliveryCharge && (
                <div className="flex justify-between">
                  <span>Delivery Charge:</span>
                  <span>BDT {deliveryInfo.deliveryCharge}</span>
                </div>
              )}
              {deliveryInfo.freeDeliveryThreshold && (
                <div className="text-sm text-green-600">
                  Free delivery on orders above BDT {deliveryInfo.freeDeliveryThreshold}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-gray-50 p-3 rounded ${className}`}>
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3" />
            <span>{contactInfo.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3" />
            <span>{contactInfo.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs">{isOpen ? 'Open Now' : 'Closed'}</span>
          </div>
        </div>
      </div>
    )
  }

  // Full variant
  return (
    <div className={`bg-white p-6 rounded-lg shadow-lg ${className}`}>
      <h2 className="text-xl font-bold mb-4">{getRestaurantName()}</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Contact Information */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </h3>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 mt-0.5 text-blue-600" />
              <div>
                <a href={`tel:${contactInfo.phone}`} className="text-blue-600 hover:underline">
                  {contactInfo.phone}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 mt-0.5 text-blue-600" />
              <div>
                <a href={`mailto:${contactInfo.email}`} className="text-blue-600 hover:underline">
                  {contactInfo.email}
                </a>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 text-gray-600" />
              <div className="text-sm text-gray-600">
                {getFullAddress()}
              </div>
            </div>
            {contactInfo.whatsapp && (
              <div className="flex items-start gap-2">
                <MessageCircle className="h-4 w-4 mt-0.5 text-green-600" />
                <div>
                  <a 
                    href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline text-sm"
                  >
                    WhatsApp: {contactInfo.whatsapp}
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Business Hours */}
        {showHours && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Business Hours
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                isOpen 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isOpen ? 'Open Now' : 'Closed'}
              </span>
            </h3>
            <div className="space-y-1">
              {businessHours.map(({ day, hours }) => (
                <div key={day} className="flex justify-between text-sm">
                  <span className="font-medium">{day}:</span>
                  <span className="text-gray-600">{hours}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Social Media */}
      {showSocial && socialMedia && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold mb-3">Follow Us</h3>
          <div className="flex gap-4">
            {socialMedia.facebook && (
              <a 
                href={socialMedia.facebook} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                <Facebook className="h-5 w-5" />
              </a>
            )}
            {socialMedia.instagram && (
              <a 
                href={socialMedia.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-pink-600 hover:text-pink-800"
              >
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {socialMedia.twitter && (
              <a 
                href={socialMedia.twitter} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-600"
              >
                <Twitter className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Quick contact component for headers/footers
export function QuickContact({ className = '' }: { className?: string }) {
  const contactInfo = getFormattedContactInfo()
  const isOpen = isRestaurantOpen()
  
  return (
    <div className={`flex items-center gap-4 text-sm ${className}`}>
      <div className="flex items-center gap-1">
        <Phone className="h-3 w-3" />
        <a href={`tel:${contactInfo.phone}`} className="hover:underline">
          {contactInfo.phone}
        </a>
      </div>
      <div className="flex items-center gap-1">
        <div className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs">{isOpen ? 'Open Now' : 'Closed'}</span>
      </div>
    </div>
  )
}

// Business status indicator
export function BusinessStatus({ className = '' }: { className?: string }) {
  const isOpen = isRestaurantOpen()
  const deliveryAvailable = isDeliveryAvailable()
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
        isOpen 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        <div className={`h-2 w-2 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
        {isOpen ? 'Open Now' : 'Closed'}
      </div>
      
      {deliveryAvailable && (
        <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
          <Truck className="h-3 w-3" />
          Delivery Available
        </div>
      )}
    </div>
  )
}