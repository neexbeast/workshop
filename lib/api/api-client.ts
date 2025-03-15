import type { Customer, Vehicle, Service, Reminder } from "@/lib/mongodb/models"
import type { User as AuthUser } from "@/lib/firebase/auth-provider"
import type { User as FirebaseUser } from "firebase/auth"

// Base URL for API requests
const API_BASE_URL = "/api"

// Helper function to get the auth token from the current user
async function getAuthToken(user: { firebaseUser: FirebaseUser | null } | FirebaseUser | null): Promise<string | null> {
  if (!user) return null
  
  // If the user object has a firebaseUser property, use that
  if ('firebaseUser' in user && user.firebaseUser) {
    return await user.firebaseUser.getIdToken()
  }
  
  // Otherwise, assume it's a Firebase user object directly
  return await user.getIdToken()
}

// Helper function to build headers with auth token
async function buildHeaders(user: { firebaseUser: FirebaseUser | null } | FirebaseUser | null): Promise<HeadersInit> {
  const token = await getAuthToken(user)
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  return headers
}

// Generic fetch function with authentication
async function fetchWithAuth<T>(url: string, options: RequestInit, user: { firebaseUser: FirebaseUser | null } | FirebaseUser | null): Promise<T> {
  const headers = await buildHeaders(user)
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `API request failed with status ${response.status}`)
  }

  return response.json()
}

// API client for customers
export const customersApi = {
  getCustomers: async (user: { firebaseUser: FirebaseUser | null } | null, search?: string, page = 1, limit = 50) => {
    const queryParams = new URLSearchParams()
    if (search) queryParams.append("search", search)
    if (page) queryParams.append("page", page.toString())
    if (limit) queryParams.append("limit", limit.toString())

    return fetchWithAuth<{ customers: Customer[]; pagination: { total: number; page: number; limit: number; pages: number } }>(
      `${API_BASE_URL}/customers?${queryParams.toString()}`,
      { method: "GET" },
      user
    )
  },

  getCustomer: async (user: { firebaseUser: FirebaseUser | null } | null, id: string) => {
    return fetchWithAuth<{ customer: Customer }>(
      `${API_BASE_URL}/customers/${id}`,
      { method: "GET" },
      user
    )
  },

  createCustomer: async (user: { firebaseUser: FirebaseUser | null } | null, customerData: Omit<Customer, "id" | "createdAt" | "updatedAt">) => {
    return fetchWithAuth<{ customer: Customer }>(
      `${API_BASE_URL}/customers`,
      {
        method: "POST",
        body: JSON.stringify(customerData),
      },
      user,
    )
  },

  updateCustomer: async (user: { firebaseUser: FirebaseUser | null } | null, id: string, customerData: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt">>) => {
    return fetchWithAuth<{ customer: Customer }>(
      `${API_BASE_URL}/customers/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(customerData),
      },
      user,
    )
  },

  deleteCustomer: async (user: { firebaseUser: FirebaseUser | null } | null, id: string) => {
    return fetchWithAuth<{ success: true }>(
      `${API_BASE_URL}/customers/${id}`,
      { method: "DELETE" },
      user
    )
  },
}

// API client for vehicles
export const vehiclesApi = {
  getVehicles: async (user: { firebaseUser: FirebaseUser | null } | null, search?: string, customerId?: string, page = 1, limit = 50) => {
    const queryParams = new URLSearchParams()
    if (search) queryParams.append("search", search)
    if (customerId) queryParams.append("customerId", customerId)
    if (page) queryParams.append("page", page.toString())
    if (limit) queryParams.append("limit", limit.toString())

    return fetchWithAuth<{ vehicles: Vehicle[]; pagination: { total: number; page: number; limit: number; pages: number } }>(
      `${API_BASE_URL}/vehicles?${queryParams.toString()}`,
      { method: "GET" },
      user
    )
  },

  getVehicle: async (user: { firebaseUser: FirebaseUser | null } | null, id: string) => {
    return fetchWithAuth<{ vehicle: Vehicle }>(
      `${API_BASE_URL}/vehicles/${id}`,
      { method: "GET" },
      user
    )
  },

  createVehicle: async (user: { firebaseUser: FirebaseUser | null } | null, vehicleData: Omit<Vehicle, "id" | "createdAt" | "updatedAt">) => {
    return fetchWithAuth<{ vehicle: Vehicle }>(
      `${API_BASE_URL}/vehicles`,
      {
        method: "POST",
        body: JSON.stringify(vehicleData),
      },
      user,
    )
  },

  updateVehicle: async (user: { firebaseUser: FirebaseUser | null } | null, id: string, vehicleData: Partial<Omit<Vehicle, "id" | "createdAt" | "updatedAt">>) => {
    return fetchWithAuth<{ vehicle: Vehicle }>(
      `${API_BASE_URL}/vehicles/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(vehicleData),
      },
      user,
    )
  },

  deleteVehicle: async (user: { firebaseUser: FirebaseUser | null } | null, id: string) => {
    return fetchWithAuth<{ success: true }>(
      `${API_BASE_URL}/vehicles/${id}`,
      { method: "DELETE" },
      user
    )
  },
}

// API client for services
export const servicesApi = {
  getServices: async (user: { firebaseUser: FirebaseUser | null } | null, search?: string, vehicleId?: string, page = 1, limit = 50) => {
    const queryParams = new URLSearchParams()
    if (search) queryParams.append("search", search)
    if (vehicleId) queryParams.append("vehicleId", vehicleId)
    if (page) queryParams.append("page", page.toString())
    if (limit) queryParams.append("limit", limit.toString())

    return fetchWithAuth<{ services: Service[]; pagination: { total: number; page: number; limit: number; pages: number } }>(
      `${API_BASE_URL}/services?${queryParams.toString()}`,
      { method: "GET" },
      user
    )
  },

  getService: async (user: { firebaseUser: FirebaseUser | null } | null, id: string) => {
    return fetchWithAuth<{ service: Service }>(
      `${API_BASE_URL}/services/${id}`,
      { method: "GET" },
      user
    )
  },

  createService: async (user: { firebaseUser: AuthUser | null } | null, serviceData: Omit<Service, "id" | "createdAt" | "updatedAt">) => {
    return fetchWithAuth<{ service: Service }>(
      `${API_BASE_URL}/services`,
      {
        method: "POST",
        body: JSON.stringify(serviceData),
      },
      user,
    )
  },

  updateService: async (user: { firebaseUser: AuthUser | null } | null, id: string, serviceData: Partial<Omit<Service, "id" | "createdAt" | "updatedAt">>) => {
    return fetchWithAuth<{ service: Service }>(
      `${API_BASE_URL}/services/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(serviceData),
      },
      user,
    )
  },

  deleteService: async (user: { firebaseUser: AuthUser | null } | null, id: string) => {
    return fetchWithAuth<{ success: true }>(
      `${API_BASE_URL}/services/${id}`,
      { method: "DELETE" },
      user
    )
  },
}

// API client for reminders
export const remindersApi = {
  getReminders: async (user: { firebaseUser: AuthUser | null } | null, vehicleId?: string, upcoming = false, page = 1, limit = 50) => {
    const queryParams = new URLSearchParams()
    if (vehicleId) queryParams.append("vehicleId", vehicleId)
    if (upcoming) queryParams.append("upcoming", "true")
    if (page) queryParams.append("page", page.toString())
    if (limit) queryParams.append("limit", limit.toString())

    return fetchWithAuth<{ reminders: Reminder[]; pagination: { total: number; page: number; limit: number; pages: number } }>(
      `${API_BASE_URL}/reminders?${queryParams.toString()}`,
      { method: "GET" },
      user
    )
  },

  getReminder: async (user: { firebaseUser: AuthUser | null } | null, id: string) => {
    return fetchWithAuth<{ reminder: Reminder }>(
      `${API_BASE_URL}/reminders/${id}`,
      { method: "GET" },
      user
    )
  },

  createReminder: async (user: { firebaseUser: AuthUser | null } | null, reminderData: Omit<Reminder, "id" | "createdAt" | "updatedAt">) => {
    return fetchWithAuth<{ reminder: Reminder }>(
      `${API_BASE_URL}/reminders`,
      {
        method: "POST",
        body: JSON.stringify(reminderData),
      },
      user,
    )
  },

  updateReminder: async (user: { firebaseUser: AuthUser | null } | null, id: string, reminderData: Partial<Omit<Reminder, "id" | "createdAt" | "updatedAt">>) => {
    return fetchWithAuth<{ reminder: Reminder }>(
      `${API_BASE_URL}/reminders/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(reminderData),
      },
      user,
    )
  },

  deleteReminder: async (user: { firebaseUser: AuthUser | null } | null, id: string) => {
    return fetchWithAuth<{ success: true }>(
      `${API_BASE_URL}/reminders/${id}`,
      { method: "DELETE" },
      user
    )
  },

  sendReminders: async (user: { firebaseUser: AuthUser | null } | null) => {
    return fetchWithAuth<{ message: string; count: number }>(
      `${API_BASE_URL}/reminders/send`,
      { method: "POST" },
      user
    )
  },
}

