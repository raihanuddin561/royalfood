'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Mail, Phone, MapPin, Calendar, Heart } from 'lucide-react'
import { toast } from 'sonner'

type CustomerData = {
  name: string
  email: string
  phone: string
  address?: string
  dateOfBirth?: string
  preferences?: string
}

type AuthModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (customer: CustomerData) => void
}

export default function CustomerAuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    preferences: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      toast.error('Please enter both email and password')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/public/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })

      const result = await response.json()
      if (response.ok && result.success) {
        toast.success('Welcome back!')
        onSuccess(result.customer)
      } else {
        toast.error(result.error || 'Login failed')
      }
    } catch (error) {
      toast.error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!registerData.name || !registerData.email || !registerData.password || !registerData.phone || !registerData.address) {
      toast.error('Please fill in all required fields (Name, Email, Password, Phone, Address)')
      return
    }

    // Additional client-side validation
    if (registerData.name.length < 2) {
      toast.error('Name must be at least 2 characters long')
      return
    }

    if (registerData.phone.length < 10) {
      toast.error('Phone number must be at least 10 digits')
      return
    }

    if (registerData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (registerData.address.length < 10) {
      toast.error('Address must be at least 10 characters (include street, city)')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/public/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData)
      })

      const result = await response.json()
      if (response.ok && result.success) {
        toast.success('Account created successfully!')
        onSuccess(result.customer)
      } else {
        // Show detailed validation errors if available
        if (result.message) {
          toast.error(result.message)
        } else if (result.validationErrors && result.validationErrors.length > 0) {
          const errors = result.validationErrors.map((err: any) => err.message).join('. ')
          toast.error(`Validation errors: ${errors}`)
        } else {
          toast.error(result.error || 'Registration failed')
        }
      }
    } catch (error) {
      toast.error('Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white">Customer Account</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
              <div>
                <Label htmlFor="login-email" className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="login-password" className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Password
                </Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter your password"
                />
              </div>
              <Button 
                onClick={handleLogin} 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
              <p className="text-sm text-gray-600 text-center">
                Login with your registered email and password
              </p>
            </TabsContent>
            
            <TabsContent value="register" className="space-y-4">
              <div>
                <Label htmlFor="register-name" className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Full Name *
                </Label>
                <Input
                  id="register-name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <Label htmlFor="register-email" className="flex items-center">
                  <Mail className="w-4 h-4 mr-1" />
                  Email *
                </Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="register-password" className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  Password *
                </Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Create a password (6+ characters)"
                />
              </div>
              <div>
                <Label htmlFor="register-phone" className="flex items-center">
                  <Phone className="w-4 h-4 mr-1" />
                  Phone Number *
                </Label>
                <Input
                  id="register-phone"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number (10+ digits)"
                />
              </div>
              <div>
                <Label htmlFor="register-address" className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  Address *
                </Label>
                <Input
                  id="register-address"
                  value={registerData.address}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter your full address (e.g., 123 Main St, City)"
                />
              </div>
              <div>
                <Label htmlFor="register-dob" className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Date of Birth
                </Label>
                <Input
                  id="register-dob"
                  type="date"
                  value={registerData.dateOfBirth}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="register-preferences" className="flex items-center">
                  <Heart className="w-4 h-4 mr-1" />
                  Food Preferences
                </Label>
                <Input
                  id="register-preferences"
                  value={registerData.preferences}
                  onChange={(e) => setRegisterData(prev => ({ ...prev, preferences: e.target.value }))}
                  placeholder="e.g., Vegetarian, Spicy food, No nuts"
                />
              </div>
              <Button 
                onClick={handleRegister} 
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
              <p className="text-sm text-gray-600 text-center">
                * Required fields: Name, Email, Password, Phone, Address
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
