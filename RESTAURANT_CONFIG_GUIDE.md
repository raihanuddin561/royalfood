# Restaurant Configuration System

This system provides a centralized way to manage all restaurant information, contact details, and business settings throughout the application.

## 📍 Configuration File Location

The main configuration is located at:
```
src/lib/restaurant-config.ts
```

## 🎯 Purpose

- **Single Source of Truth**: All restaurant information in one place
- **Easy Updates**: Change contact info, hours, or settings once and it applies everywhere
- **Type Safety**: Full TypeScript support with proper interfaces
- **Utility Functions**: Helper functions for common operations

## 📋 What's Included

### Basic Information
- Restaurant name, description, tagline
- Logo path

### Contact Information
- Phone, email, WhatsApp
- Website URL

### Location Details
- Full address with coordinates
- City, area, postal code

### Business Hours
- Weekly schedule with open/close times
- Status checking (is restaurant open now?)

### Delivery Settings
- Availability, minimum order, charges
- Coverage areas, estimated delivery time
- Free delivery thresholds

### Support Information
- Dedicated support contact details
- Support hours

### Social Media Links
- Facebook, Instagram, Twitter, etc.

### Legal Information
- Business license, tax ID
- Owner information, establishment year

## 🚀 How to Use

### Basic Usage

```typescript
import { 
  getRestaurantName, 
  getContactPhone, 
  getContactEmail,
  isRestaurantOpen
} from '@/lib/restaurant-config'

export default function MyComponent() {
  const name = getRestaurantName()
  const phone = getContactPhone()
  const isOpen = isRestaurantOpen()
  
  return (
    <div>
      <h1>{name}</h1>
      <p>Call us: {phone}</p>
      <p>Status: {isOpen ? 'Open Now' : 'Closed'}</p>
    </div>
  )
}
```

### Using Contact Components

```typescript
import { RestaurantContactInfo } from '@/components/ui/RestaurantContactInfo'

// Full contact information with social media and hours
<RestaurantContactInfo 
  variant="full" 
  showSocial={true} 
  showHours={true} 
/>

// Just support information
<RestaurantContactInfo variant="support-only" />

// Just delivery information  
<RestaurantContactInfo variant="delivery-only" />

// Compact version for headers/footers
<RestaurantContactInfo variant="compact" />
```

### Business Logic

```typescript
import { 
  isDeliveryAvailable,
  getDeliveryCharge,
  getMinimumOrder
} from '@/lib/restaurant-config'

// Check if delivery is available for a specific area
const canDeliver = isDeliveryAvailable('Gulshan')

// Calculate delivery charge based on order amount
const charge = getDeliveryCharge(800) // Returns 0 if above free delivery threshold

// Get minimum order requirement
const minOrder = getMinimumOrder()
```

## 🔧 Available Functions

### Basic Information
- `getRestaurantName()` - Get restaurant name
- `getFullAddress()` - Get complete formatted address
- `getRestaurantCoordinates()` - Get lat/lng coordinates

### Contact Information
- `getContactPhone()` - Get main contact phone
- `getContactEmail()` - Get main contact email
- `getFormattedContactInfo()` - Get all contact info formatted
- `getSupportInfo()` - Get support-specific contact details

### Business Status
- `isRestaurantOpen(day?, time?)` - Check if restaurant is open
- `getBusinessHours(day)` - Get hours for specific day
- `getAllBusinessHours()` - Get complete weekly schedule

### Delivery Functions
- `isDeliveryAvailable(area?)` - Check delivery availability
- `getDeliveryCharge(orderAmount)` - Calculate delivery charge
- `getMinimumOrder()` - Get minimum order amount
- `getEstimatedDeliveryTime()` - Get delivery time estimate

### Social & Other
- `getSocialMedia()` - Get social media links
- `getDeliveryInfo()` - Get complete delivery configuration

## 📝 Updating Configuration

To update restaurant information:

1. Open `src/lib/restaurant-config.ts`
2. Modify the `RESTAURANT_CONFIG` object
3. Save the file - changes apply immediately throughout the app

### Example Update

```typescript
// Update restaurant name
export const RESTAURANT_CONFIG: RestaurantConfig = {
  name: 'New Restaurant Name', // ← Change here
  // ... rest of config
}

// Update contact phone
contact: {
  phone: '+880 1234 567890', // ← Change here
  email: 'info@royalfood.com',
  // ...
}

// Update business hours
businessHours: {
  monday: { isOpen: true, openTime: '09:00', closeTime: '23:00' }, // ← Change here
  // ...
}
```

## 🎨 UI Components

### RestaurantContactInfo Component

A flexible component that displays restaurant information in different formats:

- **full**: Complete information with optional social media and hours
- **compact**: Minimal contact info for tight spaces
- **support-only**: Just support contact information
- **delivery-only**: Just delivery information

### QuickContact Component

Minimal contact display for headers/footers.

### BusinessStatus Component

Shows current open/closed status with delivery availability.

## 🔍 Demo Page

Visit `/admin/restaurant-config` to see all components and functions in action with live data.

## 🏗️ Architecture Benefits

1. **Maintainability**: Single source of truth for all restaurant data
2. **Consistency**: Same information everywhere in the app
3. **Type Safety**: Full TypeScript support prevents errors
4. **Flexibility**: Easy to add new fields or functions
5. **Reusability**: Components can be used anywhere in the app
6. **Performance**: Static configuration, no database queries needed

## 📱 Usage Examples in the App

The configuration is already being used in:

- **Sidebar**: Restaurant name in navigation
- **Header**: Restaurant name in logo alt text
- **Login Pages**: Restaurant name in titles
- **Dashboard**: Restaurant name in descriptions
- **Layout Metadata**: Page titles include restaurant name

## 🔄 Migration Guide

If you have hardcoded restaurant information elsewhere:

1. Replace hardcoded strings with function calls
2. Import the appropriate functions from `@/lib/restaurant-config`
3. Update the central configuration as needed

### Before
```typescript
<h1>Royal Food Restaurant</h1>
<p>Call us: +880 1234 567890</p>
```

### After
```typescript
import { getRestaurantName, getContactPhone } from '@/lib/restaurant-config'

<h1>{getRestaurantName()} Restaurant</h1>
<p>Call us: {getContactPhone()}</p>
```

This ensures all information stays consistent and can be updated from one place.