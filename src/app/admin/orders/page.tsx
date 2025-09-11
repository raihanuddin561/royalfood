'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar, 
  Edit, 
  RefreshCw,
  Filter,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

type OrderStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'PREPARING' 
  | 'READY' 
  | 'OUT_FOR_DELIVERY' 
  | 'DELIVERED' 
  | 'CANCELLED'

type Order = {
  id: string
  orderNumber: string
  status: OrderStatus
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'
  totalAmount: number
  estimatedTime?: number
  guestName?: string
  guestPhone?: string
  guestEmail?: string
  guestAddress?: string
  tableNumber?: string
  notes?: string
  kitchenNotes?: string
  isPreOrder: boolean
  scheduledDate?: string
  scheduledTime?: string
  orderDate: string
  confirmedAt?: string
  preparingAt?: string
  readyAt?: string
  deliveredAt?: string
  orderItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    menuItem?: {
      name: string
    }
  }>
  customer?: {
    name: string
    email: string
    phone: string
  }
}

const statusOptions: { value: OrderStatus; label: string; color: string }[] = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'bg-blue-500' },
  { value: 'PREPARING', label: 'Preparing', color: 'bg-orange-500' },
  { value: 'READY', label: 'Ready', color: 'bg-green-500' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'bg-purple-500' },
  { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-600' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-500' }
]

const getStatusColor = (status: OrderStatus): string => {
  return statusOptions.find(option => option.value === status)?.color || 'bg-gray-500'
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'ALL'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [newStatus, setNewStatus] = useState<OrderStatus>('PENDING')
  const [statusNotes, setStatusNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showPreOrdersOnly, setShowPreOrdersOnly] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, selectedStatus, searchTerm, showPreOrdersOnly])

  const loadOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/orders/list')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      } else {
        toast.error('Failed to load orders')
      }
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
    } finally {
      setIsLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    // Filter by status
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(order => order.status === selectedStatus)
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.guestPhone?.includes(searchTerm) ||
        order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter pre-orders
    if (showPreOrdersOnly) {
      filtered = filtered.filter(order => order.isPreOrder)
    }

    // Sort by order date (newest first)
    filtered.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return

    try {
      setIsUpdating(true)
      const response = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          status: newStatus,
          notes: statusNotes
        })
      })

      if (response.ok) {
        toast.success('Order status updated successfully')
        setSelectedOrder(null)
        setStatusNotes('')
        loadOrders() // Reload orders to get updated data
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString()
  }

  const getNextStatus = (currentStatus: OrderStatus, orderType: string): OrderStatus | null => {
    const deliveryFlow: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED']
    const dineInTakeawayFlow: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED']
    
    const flow = orderType === 'DELIVERY' ? deliveryFlow : dineInTakeawayFlow
    const currentIndex = flow.indexOf(currentStatus)
    
    if (currentIndex >= 0 && currentIndex < flow.length - 1) {
      return flow[currentIndex + 1]
    }
    return null
  }

  const quickUpdateStatus = async (order: Order) => {
    const nextStatus = getNextStatus(order.status, order.orderType)
    if (!nextStatus) return

    try {
      const response = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: order.id,
          status: nextStatus
        })
      })

      if (response.ok) {
        toast.success(`Order status updated to ${nextStatus.replace('_', ' ')}`)
        loadOrders()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-600 mt-1">Manage and track all customer orders</p>
          </div>
          <Button onClick={loadOrders} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Status Filter</label>
                <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Orders</SelectItem>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                <Input
                  placeholder="Order number, customer name, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant={showPreOrdersOnly ? "default" : "outline"}
                  onClick={() => setShowPreOrdersOnly(!showPreOrdersOnly)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Pre-orders Only
                </Button>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  Showing {filteredOrders.length} of {orders.length} orders
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="grid lg:grid-cols-4 gap-6">
                  {/* Order Info */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{order.orderNumber}</h3>
                      <Badge className={`${getStatusColor(order.status)} text-white`}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><Clock className="w-3 h-3 inline mr-1" />{formatTime(order.orderDate)}</p>
                      <p><MapPin className="w-3 h-3 inline mr-1" />{order.orderType.replace('_', ' ')}</p>
                      {order.tableNumber && (
                        <p>Table: {order.tableNumber}</p>
                      )}
                      {order.isPreOrder && (
                        <p className="text-blue-600">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          Pre-order: {order.scheduledDate && formatDate(order.scheduledDate)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div>
                    <h4 className="font-medium mb-2">Customer</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>{order.guestName || order.customer?.name}</p>
                      <p><Phone className="w-3 h-3 inline mr-1" />{order.guestPhone || order.customer?.phone}</p>
                      {(order.guestEmail || order.customer?.email) && (
                        <p><Mail className="w-3 h-3 inline mr-1" />{order.guestEmail || order.customer?.email}</p>
                      )}
                      {order.guestAddress && (
                        <p className="text-xs">{order.guestAddress}</p>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="font-medium mb-2">Items ({order.orderItems.length})</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      {order.orderItems.slice(0, 3).map((item) => (
                        <p key={item.id}>
                          {item.quantity}× {item.menuItem?.name || 'Item'} - ₹{item.totalPrice}
                        </p>
                      ))}
                      {order.orderItems.length > 3 && (
                        <p className="text-gray-500">+{order.orderItems.length - 3} more items</p>
                      )}
                      <div className="font-semibold text-orange-600 mt-2">
                        Total: ₹{order.totalAmount}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col space-y-2">
                    {/* Quick Status Update */}
                    {getNextStatus(order.status, order.orderType) && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                      <Button
                        size="sm"
                        onClick={() => quickUpdateStatus(order)}
                        className="w-full"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Mark as {getNextStatus(order.status, order.orderType)?.replace('_', ' ')}
                      </Button>
                    )}

                    {/* Manual Status Update */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setSelectedOrder(order)
                            setNewStatus(order.status)
                            setStatusNotes('')
                          }}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Update Status
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update Order Status</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Order</label>
                            <p className="text-sm text-gray-600">{selectedOrder?.orderNumber} - {selectedOrder?.guestName}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">New Status</label>
                            <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {statusOptions
                                  .filter(option => 
                                    selectedOrder?.orderType === 'DELIVERY' || 
                                    option.value !== 'OUT_FOR_DELIVERY'
                                  )
                                  .map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
                            <Textarea
                              value={statusNotes}
                              onChange={(e) => setStatusNotes(e.target.value)}
                              placeholder="Add notes about the status change..."
                              rows={3}
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={updateOrderStatus}
                              disabled={isUpdating}
                              className="flex-1"
                            >
                              {isUpdating ? 'Updating...' : 'Update Status'}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Estimated Time */}
                    {order.estimatedTime && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                      <div className="text-xs text-gray-500 text-center">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Est. {order.estimatedTime}min
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {(order.notes || order.kitchenNotes) && (
                  <div className="mt-4 pt-4 border-t">
                    {order.notes && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Customer Notes:</strong> {order.notes}
                      </p>
                    )}
                    {order.kitchenNotes && (
                      <p className="text-sm text-gray-600">
                        <strong>Kitchen Notes:</strong> {order.kitchenNotes}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {filteredOrders.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No orders found matching your criteria</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
