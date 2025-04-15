import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { customersApi, vehiclesApi, servicesApi, remindersApi } from "./api-client"
import type { Customer } from "@/lib/mongodb/models"

export function useCustomers(search?: string, page = 1, limit = 50) {
  const { firebaseUser } = useAuth()
  return useQuery({
    queryKey: ["customers", search, page, limit],
    queryFn: () => customersApi.getCustomers({ firebaseUser }, search, page, limit),
    enabled: !!firebaseUser,
  })
}

export function useCustomer(id: string) {
  const { firebaseUser } = useAuth()
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => customersApi.getCustomer({ firebaseUser }, id),
    enabled: !!firebaseUser && !!id,
  })
}

export function useCreateCustomer() {
  const { firebaseUser } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (customerData: Omit<Customer, "id" | "createdAt" | "updatedAt" | "userId">) =>
      customersApi.createCustomer({ firebaseUser }, customerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

export function useUpdateCustomer() {
  const { firebaseUser } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Customer, "id" | "createdAt" | "updatedAt" | "userId">> }) =>
      customersApi.updateCustomer({ firebaseUser }, id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
      queryClient.invalidateQueries({ queryKey: ["customer", id] })
    },
  })
}

export function useDeleteCustomer() {
  const { firebaseUser } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => customersApi.deleteCustomer({ firebaseUser }, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] })
    },
  })
}

export function useVehicles(search?: string, customerId?: string, page = 1, limit = 50) {
  const { firebaseUser } = useAuth()
  return useQuery({
    queryKey: ["vehicles", search, customerId, page, limit],
    queryFn: () => vehiclesApi.getVehicles({ firebaseUser }, search, customerId, page, limit),
    enabled: !!firebaseUser,
  })
}

export function useVehicle(id: string) {
  const { firebaseUser } = useAuth()
  return useQuery({
    queryKey: ["vehicle", id],
    queryFn: () => vehiclesApi.getVehicle({ firebaseUser }, id),
    enabled: !!firebaseUser && !!id,
  })
}

export function useServices(search?: string, vehicleId?: string, page = 1, limit = 50) {
  const { firebaseUser } = useAuth()
  return useQuery({
    queryKey: ["services", search, vehicleId, page, limit],
    queryFn: () => servicesApi.getServices({ firebaseUser }, search, vehicleId, page, limit),
    enabled: !!firebaseUser,
  })
}

export function useService(id: string) {
  const { firebaseUser } = useAuth()
  return useQuery({
    queryKey: ["service", id],
    queryFn: () => servicesApi.getService({ firebaseUser }, id),
    enabled: !!firebaseUser && !!id,
  })
}

export function useReminders(options: { vehicleId?: string; upcoming?: boolean; dateFilter?: string }) {
  const { firebaseUser } = useAuth()
  return useQuery({
    queryKey: ["reminders", options.vehicleId, options.upcoming, options.dateFilter],
    queryFn: () => remindersApi.getReminders({ firebaseUser }, options),
    enabled: !!firebaseUser,
  })
}

export function useReminder(id: string) {
  const { firebaseUser } = useAuth()
  return useQuery({
    queryKey: ["reminder", id],
    queryFn: () => remindersApi.getReminder({ firebaseUser }, id),
    enabled: !!firebaseUser && !!id,
  })
}

// Client-specific hooks
export const useClientVehicles = (customerId?: string) => {
  const { firebaseUser } = useAuth()
  return useQuery({
    queryKey: ["vehicles", "client", customerId],
    queryFn: () => vehiclesApi.getVehicles({ firebaseUser }, undefined, customerId),
    enabled: !!firebaseUser && !!customerId,
  })
}

export const useClientServices = (customerId?: string) => {
  const { firebaseUser } = useAuth()
  return useQuery({
    queryKey: ["services", "client", customerId],
    queryFn: async () => {
      // First get all vehicles for this customer
      const vehiclesResponse = await vehiclesApi.getVehicles({ firebaseUser }, undefined, customerId)
      const vehicleIds = vehiclesResponse.vehicles.map(v => v.id)
      
      // Then get services for these vehicles
      const servicesResponse = await servicesApi.getServices({ firebaseUser }, undefined, undefined, 1, 50)
      const filteredServices = servicesResponse.services.filter(service => vehicleIds.includes(service.vehicleId))
      
      return {
        services: filteredServices,
        pagination: {
          ...servicesResponse.pagination,
          total: filteredServices.length
        }
      }
    },
    enabled: !!firebaseUser && !!customerId,
  })
}

export const useClientReminders = (customerId?: string) => {
  const { firebaseUser } = useAuth()
  return useQuery({
    queryKey: ["reminders", "client", customerId],
    queryFn: async () => {
      // First get all vehicles for this customer
      const vehiclesResponse = await vehiclesApi.getVehicles({ firebaseUser }, undefined, customerId)
      const vehicleIds = vehiclesResponse.vehicles.map(v => v.id)
      
      // Then get reminders for these vehicles
      const remindersResponse = await remindersApi.getReminders({ firebaseUser }, { upcoming: true })
      const filteredReminders = remindersResponse.reminders.filter(reminder => 
        reminder.vehicleId && vehicleIds.includes(reminder.vehicleId)
      )
      
      return {
        reminders: filteredReminders,
        pagination: {
          ...remindersResponse.pagination,
          total: filteredReminders.length
        }
      }
    },
    enabled: !!firebaseUser && !!customerId,
  })
} 