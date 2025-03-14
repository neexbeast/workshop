"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { customersApi, vehiclesApi, servicesApi, remindersApi } from "@/lib/api/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Car, Wrench, Bell } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    customers: 0,
    vehicles: 0,
    services: 0,
    reminders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Fetch customers count
        const customersResponse = await customersApi.getCustomers(user, "", 1, 1)
        const customersCount = customersResponse.pagination?.total || 0

        // Fetch vehicles count
        const vehiclesResponse = await vehiclesApi.getVehicles(user, "", "", 1, 1)
        const vehiclesCount = vehiclesResponse.pagination?.total || 0

        // Fetch services count
        const servicesResponse = await servicesApi.getServices(user, "", "", 1, 1)
        const servicesCount = servicesResponse.pagination?.total || 0

        // Fetch upcoming reminders count
        const remindersResponse = await remindersApi.getReminders(user, "", true, 1, 1)
        const remindersCount = remindersResponse.pagination?.total || 0

        setStats({
          customers: customersCount,
          vehicles: vehiclesCount,
          services: servicesCount,
          reminders: remindersCount,
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.customers}</div>
              <p className="text-xs text-muted-foreground">Registered customers</p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vehicles Serviced</CardTitle>
          <Car className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.vehicles}</div>
              <p className="text-xs text-muted-foreground">Registered vehicles</p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Services Completed</CardTitle>
          <Wrench className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.services}</div>
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
          {loading ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.reminders}</div>
              <p className="text-xs text-muted-foreground">Due in the next 30 days</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

