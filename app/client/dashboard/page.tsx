"use client"

import { ClientLayout } from "@/components/client/client-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Wrench, Bell, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { useClientVehicles, useClientServices, useClientReminders } from "@/lib/api/hooks"
import { format, subDays, addDays } from "date-fns"

export default function ClientDashboard() {
  const { firebaseUser } = useAuth()
  const customerId = firebaseUser?.uid

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useClientVehicles(customerId)
  const { data: servicesData, isLoading: isLoadingServices } = useClientServices(customerId)
  const { data: remindersData, isLoading: isLoadingReminders } = useClientReminders(customerId)

  const vehicles = vehiclesData?.vehicles || []
  const services = servicesData?.services || []
  const reminders = remindersData?.reminders || []

  const today = new Date()
  const thirtyDaysAgo = subDays(today, 30)
  const thirtyDaysFromNow = addDays(today, 30)

  // Filter recent services (last 30 days)
  const recentServices = services
    .filter(service => {
      const serviceDate = new Date(service.serviceDate)
      return serviceDate >= thirtyDaysAgo && serviceDate <= today
    })
    .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())

  // Filter upcoming services (next 30 days)
  const upcomingServices = services
    .filter(service => {
      const serviceDate = new Date(service.serviceDate)
      return serviceDate > today && serviceDate <= thirtyDaysFromNow
    })
    .sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime())

  const isLoading = isLoadingVehicles || isLoadingServices || isLoadingReminders

  return (
    <ClientLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{vehicles.length}</div>
                  <p className="text-xs text-muted-foreground">Registered vehicles</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Services</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-[100px]" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{recentServices.length}</div>
                  <p className="text-xs text-muted-foreground">In the last 30 days</p>
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
                  <div className="text-2xl font-bold">{reminders.length}</div>
                  <p className="text-xs text-muted-foreground">Due in the next 30 days</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Vehicles</CardTitle>
            <CardDescription>Your registered vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full mr-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No vehicles registered.</div>
            ) : (
              <div className="space-y-4">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4 rounded-full p-2 bg-muted">
                        <Car className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </p>
                        <p className="text-sm text-muted-foreground">
                          VIN: {vehicle.vin}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/client/vehicles/${vehicle.id}`}>View Details</Link>
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/client/vehicles">View All Vehicles</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Services</CardTitle>
            <CardDescription>Services scheduled for the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full mr-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : upcomingServices.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No upcoming services.</div>
            ) : (
              <div className="space-y-4">
                {upcomingServices.map((service) => (
                  <div key={service.id} className="flex items-center">
                    <div className="mr-4 rounded-full p-2 bg-muted">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {service.serviceType}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Scheduled for {format(new Date(service.serviceDate), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/client/reminders">View All Reminders</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Service History</CardTitle>
            <CardDescription>Your recent service activities</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center">
                    <Skeleton className="h-10 w-10 rounded-full mr-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentServices.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">No recent services.</div>
            ) : (
              <div className="space-y-4">
                {recentServices.map((service) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-4 rounded-full p-2 bg-muted">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {service.serviceType}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Completed on {format(new Date(service.serviceDate), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm font-medium">${(service.cost ?? 0).toFixed(2)}</div>
                  </div>
                ))}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/client/service-history">View Full History</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ClientLayout>
  )
}

