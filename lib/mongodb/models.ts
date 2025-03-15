export interface User {
  id: string
  email: string
  role: "admin" | "worker" | "client"
  createdAt: Date
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  address?: string
  userId: string // Reference to the admin/worker who created this customer
  createdAt: Date
  updatedAt: Date
}

export interface Vehicle {
  id: string
  vin: string
  make: string
  model: string
  year: number
  color?: string
  licensePlate?: string
  customerId: string // Reference to the customer who owns this vehicle
  mileage: number
  lastService?: string // Date of the last service
  createdAt: Date
  updatedAt: Date
}

export interface Service {
  id: string
  vehicleId: string // Reference to the vehicle that received the service
  serviceType: string
  serviceDate: Date
  mileage: number
  description: string
  parts?: string[]
  cost: number
  technicianId: string // Reference to the worker who performed the service
  createdAt: Date
  updatedAt: Date
}

export interface Reminder {
  id: string
  serviceId: string // Reference to the service that needs a reminder
  vehicleId: string // Reference to the vehicle
  customerId: string // Reference to the customer
  reminderDate: Date
  reminderType: "time" | "mileage" | "both"
  mileageThreshold?: number
  sent: boolean
  email: string
  message?: string
  createdAt: Date
  updatedAt: Date
}

