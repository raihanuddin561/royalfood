import Link from 'next/link'
import { ChefHat, Users, ShoppingCart, BarChart3, Clock, MapPin, Phone, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Navigation Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <ChefHat className="h-8 w-8 text-orange-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">Royal Food</span>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/public-menu" className="text-gray-700 hover:text-orange-600 font-medium">
                Menu
              </Link>
              <Link href="#about" className="text-gray-700 hover:text-orange-600 font-medium">
                About
              </Link>
              <Link href="#contact" className="text-gray-700 hover:text-orange-600 font-medium">
                Contact
              </Link>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/public-menu" 
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Order Now
              </Link>
              <Link 
                href="/auth/signin" 
                className="text-gray-700 hover:text-orange-600 font-medium border border-gray-300 px-4 py-2 rounded-lg hover:border-orange-600 transition-colors"
              >
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Welcome to <span className="text-orange-600">Royal Food</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience authentic flavors and exceptional dining. Fresh ingredients, 
              traditional recipes, and modern convenience - all in one place.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link 
                href="/public-menu" 
                className="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 transition-colors font-semibold text-lg flex items-center justify-center"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Browse Our Menu
              </Link>
              <a 
                href="tel:+8801711111111" 
                className="bg-white text-orange-600 border-2 border-orange-600 px-8 py-4 rounded-lg hover:bg-orange-50 transition-colors font-semibold text-lg flex items-center justify-center"
              >
                <Phone className="w-5 h-5 mr-2" />
                Call to Order
              </a>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">500+</div>
                <div className="text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">50+</div>
                <div className="text-gray-600">Menu Items</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">24/7</div>
                <div className="text-gray-600">Service Available</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Royal Food?</h2>
            <p className="text-xl text-gray-600">We're committed to providing the best dining experience</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <Clock className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Service</h3>
              <p className="text-gray-600">Quick preparation and timely delivery for all orders</p>
            </div>
            
            <div className="text-center p-6">
              <Star className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality Food</h3>
              <p className="text-gray-600">Fresh ingredients and authentic recipes for the best taste</p>
            </div>
            
            <div className="text-center p-6">
              <MapPin className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Convenient Location</h3>
              <p className="text-gray-600">Easy to find with multiple ordering options available</p>
            </div>
          </div>
        </div>
      </section>

      {/* Order Options Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How to Order</h2>
            <p className="text-xl text-gray-600">Multiple convenient ways to enjoy our food</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Online Ordering */}
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <ShoppingCart className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Online Ordering</h3>
              <p className="text-gray-600 mb-4">Browse our menu and place orders online for pickup or delivery</p>
              <Link 
                href="/public-menu" 
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium inline-block"
              >
                Order Online
              </Link>
            </div>
            
            {/* Dine In */}
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <Users className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Dine In</h3>
              <p className="text-gray-600 mb-4">Visit our restaurant for a complete dining experience</p>
              <div className="text-orange-600 font-medium">
                Walk-ins Welcome
              </div>
            </div>
            
            {/* Phone Orders */}
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <Phone className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Phone Orders</h3>
              <p className="text-gray-600 mb-4">Call us directly to place your order over the phone</p>
              <a 
                href="tel:+8801711111111" 
                className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium inline-block"
              >
                Call Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">About Royal Food</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">Our Story</h3>
              <p className="text-gray-600 mb-6">
                Royal Food has been serving delicious, authentic cuisine with a commitment to quality and customer satisfaction. 
                We use only the freshest ingredients and time-tested recipes to create memorable dining experiences.
              </p>
              <p className="text-gray-600 mb-6">
                Our team of experienced chefs and dedicated staff work together to ensure every dish meets our high standards 
                of taste, presentation, and service.
              </p>
              <div className="flex items-center space-x-4">
                <ChefHat className="w-8 h-8 text-orange-600" />
                <span className="text-gray-700 font-medium">Professional Kitchen & Expert Chefs</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-lg p-8">
              <h4 className="text-xl font-semibold text-gray-900 mb-4">What Makes Us Special</h4>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-center">
                  <Star className="w-5 h-5 text-orange-600 mr-3" />
                  Fresh ingredients sourced daily
                </li>
                <li className="flex items-center">
                  <Star className="w-5 h-5 text-orange-600 mr-3" />
                  Traditional recipes with modern techniques
                </li>
                <li className="flex items-center">
                  <Star className="w-5 h-5 text-orange-600 mr-3" />
                  Hygienic food preparation standards
                </li>
                <li className="flex items-center">
                  <Star className="w-5 h-5 text-orange-600 mr-3" />
                  Fast and reliable service
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-xl text-gray-600">Get in touch for orders, inquiries, or feedback</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <Phone className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone</h3>
              <p className="text-gray-600">+880 171 111 1111</p>
              <p className="text-gray-600">+880 191 111 1111</p>
            </div>
            
            <div className="text-center">
              <MapPin className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
              <p className="text-gray-600">123 Food Street</p>
              <p className="text-gray-600">Dhaka, Bangladesh</p>
            </div>
            
            <div className="text-center">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hours</h3>
              <p className="text-gray-600">Daily: 10:00 AM - 11:00 PM</p>
              <p className="text-gray-600">Delivery: 11:00 AM - 10:30 PM</p>
            </div>
          </div>
        </div>
      </section>

      {/* Staff Access Section */}
      <section className="py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-white mb-4">Staff & Management Access</h3>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                href="/auth/signin" 
                className="bg-white text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors font-medium flex items-center justify-center"
              >
                <Users className="w-5 h-5 mr-2" />
                Staff Login
              </Link>
              <Link 
                href="/admin/customer-orders" 
                className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Admin Dashboard
              </Link>
            </div>
            <p className="text-gray-400 mt-4 text-sm">
              For staff: Use your employee credentials to access the management system
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <ChefHat className="h-6 w-6 text-orange-600" />
              <span className="ml-2 text-lg font-semibold text-gray-900">Royal Food</span>
            </div>
            
            <div className="flex space-x-6">
              <Link href="/public-menu" className="text-gray-600 hover:text-orange-600">
                Menu
              </Link>
              <Link href="/auth/signin" className="text-gray-600 hover:text-orange-600">
                Staff Login
              </Link>
              <a href="tel:+8801711111111" className="text-gray-600 hover:text-orange-600">
                Contact
              </a>
            </div>
            
            <div className="text-gray-500 text-sm mt-4 md:mt-0">
              © 2025 Royal Food. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
