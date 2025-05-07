"use client"

import { ClientLayout } from "@/components/client/client-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Wrench, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { useClientVehicles, useClientServices } from "@/lib/api/hooks"
import { format, subDays, addDays } from "date-fns"
import { useTranslations } from 'next-intl'

export default function ClientDashboard() {
  const t = useTranslations('dashboard');
  const { firebaseUser } = useAuth()
  const customerId = firebaseUser?.uid

  const { data: vehiclesData, isLoading: isLoadingVehicles } = useClientVehicles(customerId)
  const { data: servicesData, isLoading: isLoadingServices } = useClientServices(customerId)

  const vehicles = vehiclesData?.vehicles || []
  const services = servicesData?.services || []

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

  const isLoading = isLoadingVehicles || isLoadingServices

  return (
    <ClientLayout>
      <div className="flex flex-col space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>{t('vehicles.title')}</CardTitle>
              <CardDescription>Manage your vehicles</CardDescription>
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
                <div className="text-center py-4 text-muted-foreground">{t('vehicles.noVehicles')}</div>
              ) : (
                <div className="space-y-4">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center">
                      <div className="mr-4 rounded-full p-2 bg-muted">
                        <Car className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {vehicle.make} {vehicle.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.year} • {vehicle.licensePlate}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild className="ml-auto">
                        <Link href={`/client/vehicles/${vehicle.id}`}>View Details</Link>
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/client/vehicles">{t('vehicles.addVehicle')}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('services.upcoming')}</CardTitle>
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
                <div className="text-center py-4 text-muted-foreground">{t('services.noServices')}</div>
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
                    <Link href="/client/reminders">{t('reminders.viewAll')}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('services.recent')}</CardTitle>
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
                <div className="text-center py-4 text-muted-foreground">{t('services.noServices')}</div>
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
                    <Link href="/client/service-history">{t('services.viewAll')}</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ClientLayout>
  )
} 