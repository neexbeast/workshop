import type { User } from "@/lib/firebase/auth-provider"

// Base URL for API requests
const API_BASE_URL = "/api"

// Helper function to get the auth token from the current user
async function getAuthToken(user: User | null): Promise<string | null> {
  if (!user) return null
  return await user.getIdToken()
}

// Helper function to build headers with auth token
async function buildHeaders(user: User | null): Promise<HeadersInit> {
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
async function fetchWithAuth<T>(url: string, options: RequestInit, user: User | null): Promise<T> {
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
  getCustomers: async (user: User | null, search?: string, page = 1, limit = 50) => {
    const queryParams = new URLSearchParams()
    if (search) queryParams.append("search", search)
    if (page) queryParams.append("page", page.toString())
    if (limit) queryParams.append("limit", limit.toString())

    return fetchWithAuth(`${API_BASE_URL}/customers?${queryParams.toString()}`, { method: "GET" }, user)
  },

  getCustomer: async (user: User | null, id: string) => {
    return fetchWithAuth(`${API_BASE_URL}/customers/${id}`, { method: "GET" }, user)
  },

  createCustomer: async (user: User | null, customerData: any) => {
    return fetchWithAuth(
      `${API_BASE_URL}/customers`,
      {
        method: "POST",
        body: JSON.stringify(customerData),
      },
      user,
    )
  },

  updateCustomer: async (user: User | null, id: string, customerData: any) => {
    return fetchWithAuth(
      `${API_BASE_URL}/customers/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(customerData),
      },
      user,
    )
  },

  deleteCustomer: async (user: User | null, id: string) => {
    return fetchWithAuth(`${API_BASE_URL}/customers/${id}`, { method: "DELETE" }, user)
  },
}

// API client for vehicles
export const vehiclesApi = {
  getVehicles: async (user: User | null, search?: string, customerId?: string, page = 1, limit = 50) => {
    const queryParams = new URLSearchParams()
    if (search) queryParams.append("search", search)
    if (customerId) queryParams.append("customerId", customerId)
    if (page) queryParams.append("page", page.toString())
    if (limit) queryParams.append("limit", limit.toString())

    return fetchWithAuth(`${API_BASE_URL}/vehicles?${queryParams.toString()}`, { method: "GET" }, user)
  },

  getVehicle: async (user: User | null, id: string) => {
    return fetchWithAuth(`${API_BASE_URL}/vehicles/${id}`, { method: "GET" }, user)
  },

  createVehicle: async (user: User | null, vehicleData: any) => {
    return fetchWithAuth(
      `${API_BASE_URL}/vehicles`,
      {
        method: "POST",
        body: JSON.stringify(vehicleData),
      },
      user,
    )
  },

  updateVehicle: async (user: User | null, id: string, vehicleData: any) => {
    return fetchWithAuth(
      `${API_BASE_URL}/vehicles/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(vehicleData),
      },
      user,
    )
  },

  deleteVehicle: async (user: User | null, id: string) => {
    return fetchWithAuth(`${API_BASE_URL}/vehicles/${id}`, { method: "DELETE" }, user)
  },
}

// API client for services
export const servicesApi = {
  getServices: async (user: User | null, search?: string, vehicleId?: string, page = 1, limit = 50) => {
    const queryParams = new URLSearchParams()
    if (search) queryParams.append("search", search)
    if (vehicleId) queryParams.append("vehicleId", vehicleId)
    if (page) queryParams.append("page", page.toString())
    if (limit) queryParams.append("limit", limit.toString())

    return fetchWithAuth(`${API_BASE_URL}/services?${queryParams.toString()}`, { method: "GET" }, user)
  },

  getService: async (user: User | null, id: string) => {
    return fetchWithAuth(`${API_BASE_URL}/services/${id}`, { method: "GET" }, user)
  },

  createService: async (user: User | null, serviceData: any) => {
    return fetchWithAuth(
      `${API_BASE_URL}/services`,
      {
        method: "POST",
        body: JSON.stringify(serviceData),
      },
      user,
    )
  },

  updateService: async (user: User | null, id: string, serviceData: any) => {
    return fetchWithAuth(
      `${API_BASE_URL}/services/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(serviceData),
      },
      user,
    )
  },

  deleteService: async (user: User | null, id: string) => {
    return fetchWithAuth(`${API_BASE_URL}/services/${id}`, { method: "DELETE" }, user)
  },
}

// API client for reminders
export const remindersApi = {
  getReminders: async (user: User | null, vehicleId?: string, upcoming = false, page = 1, limit = 50) => {
    const queryParams = new URLSearchParams()
    if (vehicleId) queryParams.append("vehicleId", vehicleId)
    if (upcoming) queryParams.append("upcoming", "true")
    if (page) queryParams.append("page", page.toString())
    if (limit) queryParams.append("limit", limit.toString())

    return fetchWithAuth(`${API_BASE_URL}/reminders?${queryParams.toString()}`, { method: "GET" }, user)
  },

  getReminder: async (user: User | null, id: string) => {
    return fetchWithAuth(`${API_BASE_URL}/reminders/${id}`, { method: "GET" }, user)
  },

  createReminder: async (user: User | null, reminderData: any) => {
    return fetchWithAuth(
      `${API_BASE_URL}/reminders`,
      {
        method: "POST",
        body: JSON.stringify(reminderData),
      },
      user,
    )
  },

  updateReminder: async (user: User | null, id: string, reminderData: any) => {
    return fetchWithAuth(
      `${API_BASE_URL}/reminders/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(reminderData),
      },
      user,
    )
  },

  deleteReminder: async (user: User | null, id: string) => {
    return fetchWithAuth(`${API_BASE_URL}/reminders/${id}`, { method: "DELETE" }, user)
  },

  sendReminders: async (user: User | null) => {
    return fetchWithAuth(`${API_BASE_URL}/reminders/send`, { method: "POST" }, user)
  },
}

