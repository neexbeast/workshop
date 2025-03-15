"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { customersApi, vehiclesApi, servicesApi, remindersApi } from "@/lib/api/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Car, Wrench, Bell } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
  totalCustomers: number
  totalVehicles: number
  totalServices: number
  totalReminders: number
}

export function DashboardStats() {
  const { user, firebaseUser } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalVehicles: 0,
    totalServices: 0,
    totalReminders: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user || !firebaseUser) return

        setLoading(true)

        const [customersResponse, vehiclesResponse, servicesResponse, remindersResponse] = await Promise.all([
          customersApi.getCustomers(firebaseUser),
          vehiclesApi.getVehicles(firebaseUser),
          servicesApi.getServices(firebaseUser),
          remindersApi.getReminders(firebaseUser, undefined, true),
        ])

        setStats({
          totalCustomers: customersResponse.pagination.total,
          totalVehicles: vehiclesResponse.pagination.total,
          totalServices: servicesResponse.pagination.total,
          totalReminders: remindersResponse.pagination.total,
        })
      } catch (error) {
        console.error("Error fetching dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user, firebaseUser])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.totalCustomers}</div>
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
          {loading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.totalVehicles}</div>
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
          {loading ? (
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.totalServices}</div>
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
            <Skeleton className="h-8 w-[100px]" />
          ) : (
            <>
              <div className="text-2xl font-bold">{stats.totalReminders}</div>
              <p className="text-xs text-muted-foreground">Due in the next 30 days</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

