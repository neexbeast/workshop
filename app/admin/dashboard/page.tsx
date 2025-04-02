"use client"

import { useState, useEffect } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, MoreHorizontal, Edit, Trash } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { servicesApi, vehiclesApi, customersApi } from "@/lib/api/api-client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import type { Service, Vehicle, Customer } from "@/lib/mongodb/models"
import { format, addDays, subDays } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { DashboardStats } from "@/components/admin/dashboard/dashboard-stats"

export default function AdminDashboardPage() {
  const { user, firebaseUser } = useAuth()
  const [recentServices, setRecentServices] = useState<Service[]>([])
  const [upcomingServices, setUpcomingServices] = useState<Service[]>([])
  const [vehicles, setVehicles] = useState<{ [key: string]: Vehicle }>({})
  const [customers, setCustomers] = useState<{ [key: string]: Customer }>({})
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !firebaseUser) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const today = new Date()
        const thirtyDaysAgo = subDays(today, 30)
        const thirtyDaysFromNow = addDays(today, 30)

        // Fetch all services
        const servicesResponse = await servicesApi.getServices({ firebaseUser })
        const allServices = servicesResponse.services || []

        // Fetch vehicles and customers
        const vehiclesResponse = await vehiclesApi.getVehicles({ firebaseUser })
        const vehiclesMap = vehiclesResponse.vehicles.reduce((acc, vehicle) => {
          acc[vehicle.id] = vehicle
          return acc
        }, {} as { [key: string]: Vehicle })
        setVehicles(vehiclesMap)

        const customersResponse = await customersApi.getCustomers({ firebaseUser })
        const customersMap = customersResponse.customers.reduce((acc, customer) => {
          acc[customer.id] = customer
          return acc
        }, {} as { [key: string]: Customer })
        setCustomers(customersMap)

        // Filter recent services (last 30 days)
        const recent = allServices
          .filter(service => {
            const serviceDate = new Date(service.serviceDate)
            return serviceDate >= thirtyDaysAgo && serviceDate <= today
          })
          .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())
        setRecentServices(recent)

        // Filter upcoming services (next 30 days)
        const upcoming = allServices
          .filter(service => {
            const serviceDate = new Date(service.serviceDate)
            return serviceDate > today && serviceDate <= thirtyDaysFromNow
          })
          .sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime())
        setUpcomingServices(upcoming)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
        toast({
          title: "Error",
          description: "Failed to fetch dashboard data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user, firebaseUser])

  const handleDeleteService = async (id: string) => {
    if (!user || !firebaseUser) return
    
    try {
      await servicesApi.deleteService({ firebaseUser }, id)
      setRecentServices(prev => prev.filter(s => s.id !== id))
      setUpcomingServices(prev => prev.filter(s => s.id !== id))
      toast({
        title: "Success",
        description: "Service deleted successfully",
      })
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      })
    }
  }

  function renderServicesTable(services: Service[]) {
    if (loading) {
      return (
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
      )
    }

    if (services.length === 0) {
      return <div className="text-center py-4 text-muted-foreground">No services found.</div>
    }

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map((service) => {
              const vehicle = vehicles[service.vehicleId]
              const customer = vehicle ? customers[vehicle.customerId] : null

              return (
                <TableRow key={service.id}>
                  <TableCell>{format(new Date(service.serviceDate), "MMM d, yyyy")}</TableCell>
                  <TableCell>{service.serviceType}</TableCell>
                  <TableCell>
                    {vehicle ? (
                      <div>
                        <div>
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </div>
                        <div className="text-sm text-muted-foreground">{vehicle.vin}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Vehicle not found</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {customer ? (
                      <div>
                        <div>{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Customer not found</span>
                    )}
                  </TableCell>
                  <TableCell>${service.cost?.toFixed(2)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/services/${service.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

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
                <CardDescription>Your workshop&apos;s recent service activities</CardDescription>
              </CardHeader>
              <CardContent>
                {renderServicesTable(recentServices)}
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
                {renderServicesTable(upcomingServices)}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}

