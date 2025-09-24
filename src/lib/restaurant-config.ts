// Centralized Restaurant Configuration
// This is the single source of truth for all restaurant information and settings

export interface RestaurantConfig {
  // Basic Information
  name: string
  description: string
  tagline?: string
  logo?: string
  
  // Contact Information
  contact: {
    phone: string
    email: string
    whatsapp?: string
    website?: string
  }
  
  // Location Information
  location: {
    address: string
    city: string
    area?: string
    zipCode?: string
    country: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  
  // Business Hours
  businessHours: {
    [key: string]: {
      isOpen: boolean
      openTime?: string
      closeTime?: string
    }
  }
  
  // Delivery Information
  delivery: {
    isAvailable: boolean
    minimumOrder?: number
    deliveryCharge?: number
    freeDeliveryThreshold?: number
    estimatedTime: string
    coverageAreas?: string[]
  }
  
  // Social Media
  social?: {
    facebook?: string
    instagram?: string
    twitter?: string
    youtube?: string
  }
  
  // Support Information
  support: {
    email: string
    phone: string
    hours: string
    whatsapp?: string
  }
  
  // Legal Information
  legal: {
    businessLicense?: string
    taxId?: string
    ownerName?: string
    establishedYear?: number
  }
}

// Main restaurant configuration - update this to change restaurant info across entire app
export const RESTAURANT_CONFIG: RestaurantConfig = {
  // Basic Information
  name: 'Royal Food',
  description: 'Authentic flavors delivered fresh to your doorstep',
  tagline: 'Royal taste, delivered with care',
  logo: '/logo.png',
  
  // Contact Information
  contact: {
    phone: '01918744551',
    email: 'info@royalfood.com',
    whatsapp: '01918744551',
    website: 'https://royalfoodbd.vercel.app'
  },
  
  // Location Information
  location: {
    address: '123 Food Street, Gulshan Circle',
    city: 'Dhaka',
    area: 'Gulshan',
    zipCode: '1212',
    country: 'Bangladesh',
    coordinates: {
      lat: 23.7808875,
      lng: 90.4133714
    }
  },
  
  // Business Hours
  businessHours: {
    monday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
    tuesday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
    wednesday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
    thursday: { isOpen: true, openTime: '10:00', closeTime: '22:00' },
    friday: { isOpen: true, openTime: '10:00', closeTime: '23:00' },
    saturday: { isOpen: true, openTime: '10:00', closeTime: '23:00' },
    sunday: { isOpen: true, openTime: '11:00', closeTime: '22:00' }
  },
  
  // Delivery Information
  delivery: {
    isAvailable: true,
    freeDeliveryThreshold: 1000,
    estimatedTime: '30-45 minutes',
    coverageAreas: [
      'Alam market'
    ]
  },
  
  // Social Media
  social: {
    facebook: 'https://facebook.com/royalfoodbd',
    instagram: 'https://instagram.com/royalfoodbd',
    twitter: 'https://twitter.com/royalfoodbd'
  },
  
  // Support Information
  support: {
    email: 'support@royalfood.com',
    phone: '01918744551',
    hours: 'Daily 10:00 AM - 10:00 PM',
    whatsapp: '01918744551'
  },
  
  // Legal Information
  legal: {
    businessLicense: 'RL-2024-001',
    taxId: 'VAT-123456789',
    ownerName: 'Royal Food Limited',
    establishedYear: 2024
  }
}

// Utility functions to get specific restaurant information

// Get restaurant name
export function getRestaurantName(): string {
  return RESTAURANT_CONFIG.name
}

// Get contact phone
export function getContactPhone(): string {
  return RESTAURANT_CONFIG.contact.phone
}

// Get contact email
export function getContactEmail(): string {
  return RESTAURANT_CONFIG.contact.email
}

// Get support information
export function getSupportInfo(): RestaurantConfig['support'] {
  return RESTAURANT_CONFIG.support
}

// Get delivery information
export function getDeliveryInfo(): RestaurantConfig['delivery'] {
  return RESTAURANT_CONFIG.delivery
}

// Get full address
export function getFullAddress(): string {
  const { address, area, city, zipCode, country } = RESTAURANT_CONFIG.location
  const parts = [address]
  if (area) parts.push(area)
  parts.push(city)
  if (zipCode) parts.push(zipCode)
  parts.push(country)
  return parts.join(', ')
}

// Get formatted business hours for a specific day
export function getBusinessHours(day: string): string {
  const dayData = RESTAURANT_CONFIG.businessHours[day.toLowerCase()]
  if (!dayData || !dayData.isOpen) {
    return 'Closed'
  }
  return `${dayData.openTime} - ${dayData.closeTime}`
}

// Check if restaurant is open at current time
export function isRestaurantOpen(day?: string, time?: string): boolean {
  const currentDay = day || new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
  const currentTime = time || new Date().toTimeString().slice(0, 5)
  
  const dayData = RESTAURANT_CONFIG.businessHours[currentDay]
  if (!dayData || !dayData.isOpen || !dayData.openTime || !dayData.closeTime) {
    return false
  }
  
  return currentTime >= dayData.openTime && currentTime <= dayData.closeTime
}

// Get all business hours formatted for display
export function getAllBusinessHours(): Array<{day: string, hours: string}> {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  return days.map(day => ({
    day: day.charAt(0).toUpperCase() + day.slice(1),
    hours: getBusinessHours(day)
  }))
}

// Get social media links
export function getSocialMedia(): RestaurantConfig['social'] {
  return RESTAURANT_CONFIG.social
}

// Format contact information for display
export function getFormattedContactInfo(): {
  phone: string
  email: string
  address: string
  whatsapp?: string
} {
  return {
    phone: RESTAURANT_CONFIG.contact.phone,
    email: RESTAURANT_CONFIG.contact.email,
    address: getFullAddress(),
    whatsapp: RESTAURANT_CONFIG.contact.whatsapp
  }
}

// Get restaurant coordinates for maps
export function getRestaurantCoordinates(): { lat: number; lng: number } | null {
  return RESTAURANT_CONFIG.location.coordinates || null
}

// Check if delivery is available for an area
export function isDeliveryAvailable(area?: string): boolean {
  if (!RESTAURANT_CONFIG.delivery.isAvailable) return false
  if (!area || !RESTAURANT_CONFIG.delivery.coverageAreas) return true
  
  return RESTAURANT_CONFIG.delivery.coverageAreas.some(
    coverageArea => coverageArea.toLowerCase().includes(area.toLowerCase())
  )
}

// Get delivery charge (considering free delivery threshold)
export function getDeliveryCharge(orderAmount: number): number {
  if (!RESTAURANT_CONFIG.delivery.isAvailable) return 0
  
  const { deliveryCharge = 0, freeDeliveryThreshold } = RESTAURANT_CONFIG.delivery
  
  if (freeDeliveryThreshold && orderAmount >= freeDeliveryThreshold) {
    return 0
  }
  
  return deliveryCharge
}

// Get minimum order amount
export function getMinimumOrder(): number {
  return RESTAURANT_CONFIG.delivery.minimumOrder || 0
}

// Get estimated delivery time
export function getEstimatedDeliveryTime(): string {
  return RESTAURANT_CONFIG.delivery.estimatedTime
}

// Export the main config for direct access when needed
export const restaurantConfig = RESTAURANT_CONFIG

// Export commonly used combinations
export const contactInfo = getFormattedContactInfo()
export const supportInfo = getSupportInfo()
export const deliveryInfo = getDeliveryInfo()
export const businessHours = getAllBusinessHours()