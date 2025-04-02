"use client"

import { useAuth } from "@/lib/firebase/auth-hooks"
import { customersApi, vehiclesApi, servicesApi, remindersApi } from "@/lib/api/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Car, Wrench, Bell } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery } from "@tanstack/react-query"

export function DashboardStats() {
  const { firebaseUser } = useAuth()

  const { data: customersData, isLoading: isLoadingCustomers } = useQuery({
    queryKey: ["customers", "count"],
    queryFn: () => customersApi.getCustomers({ firebaseUser }, undefined, 1, 1),
    enabled: !!firebaseUser,
  })

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles", "count"],
    queryFn: () => vehiclesApi.getVehicles({ firebaseUser }, undefined, undefined, 1, 1),
    enabled: !!firebaseUser,
  })

  const { data: servicesData, isLoading: isLoadingServices } = useQuery({
    queryKey: ["services", "count"],
    queryFn: () => servicesApi.getServices({ firebaseUser }, undefined, undefined, 1, 1),
    enabled: !!firebaseUser,
  })

  const { data: remindersData, isLoading: isLoadingReminders } = useQuery({
    queryKey: ["reminders", "count"],
    queryFn: () => remindersApi.getReminders({ firebaseUser }, { upcoming: true }),
    enabled: !!firebaseUser,
  })

  const isLoading = isLoadingCustomers || isLoadingVehicles || isLoadingServices || isLoadingReminders

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">{customersData?.pagination.total || 0}</div>
              <p className="text-xs text-muted-foreground">Registered customers</p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">{vehiclesData?.pagination.total || 0}</div>
              <p className="text-xs text-muted-foreground">Registered vehicles</p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Services</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">{servicesData?.pagination.total || 0}</div>
              <p className="text-xs text-muted-foreground">Total services performed</p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Reminders</CardTitle>
          <Bell className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">{remindersData?.pagination.total || 0}</div>
              <p className="text-xs text-muted-foreground">Due in the next 30 days</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

