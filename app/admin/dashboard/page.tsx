"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { DashboardStats } from "@/components/admin/dashboard/dashboard-stats"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Wrench, Calendar, Plus } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { servicesApi, remindersApi } from "@/lib/api/api-client"
import { Skeleton } from "@/components/ui/skeleton"

export default function AdminDashboard() {
  const { user } = useAuth()
  const [recentServices, setRecentServices] = useState<any[]>([])
  const [upcomingReminders, setUpcomingReminders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return

      setLoading(true)
      try {
        // Fetch recent services
        const servicesResponse = await servicesApi.getServices(user, "", "", 1, 5)
        setRecentServices(servicesResponse.services || [])

        // Fetch upcoming reminders
        const remindersResponse = await remindersApi.getReminders(user, "", true, 1, 5)
        setUpcomingReminders(remindersResponse.reminders || [])
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user])

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex space-x-2">
            <Button asChild>
              <Link href="/admin/services/add">
                <Plus className="mr-2 h-4 w-4" />
                New Service
              </Link>
            </Button>
          </div>
        </div>

        <DashboardStats />

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Services</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your workshop's recent service activities</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded-full mr-4" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-[250px]" />
                          <Skeleton className="h-4 w-[200px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : recentServices.length > 0 ? (
                  <div className="space-y-4">
                    {recentServices.map((service) => (
                      <div key={service._id} className="flex items-center">
                        <div className="mr-4 rounded-full p-2 bg-muted">
                          <Wrench className="h-4 w-4" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <p className="text-sm font-medium leading-none">
                            {service.serviceType} for {service.vehicle?.make} {service.vehicle?.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(service.serviceDate).toLocaleDateString()} • {service.mileage.toLocaleString()} km
                          </p>
                        </div>
                        <div className="text-sm font-medium">${service.cost.toFixed(2)}</div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/admin/services">View All Services</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No recent services found.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="upcoming" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Services</CardTitle>
                <CardDescription>Services scheduled for the next 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
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
                ) : upcomingReminders.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingReminders.map((reminder) => (
                      <div key={reminder._id} className="flex items-center">
                        <div className="mr-4 rounded-full p-2 bg-muted">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {reminder.service?.serviceType} for {reminder.vehicle?.make} {reminder.vehicle?.model}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(reminder.reminderDate).toLocaleDateString()} •{reminder.customer?.name}
                          </p>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/admin/reminders">View All Reminders</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No upcoming reminders found.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

