"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreHorizontal, Edit, Trash, ArrowLeft, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/firebase/auth-hooks"
import { servicesApi } from "@/lib/api/api-client"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import type { Vehicle, Customer } from "@/lib/mongodb/models"
import { format } from "date-fns"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useServices, useVehicles, useCustomers } from "@/lib/api/hooks"
import { useMutation, useQueryClient } from "@tanstack/react-query"

export default function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const auth = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const vehicleId = searchParams.get("vehicleId") || undefined
  const queryClient = useQueryClient()

  // Fetch data using React Query
  const { data: servicesData, isLoading: isLoadingServices } = useServices(undefined, vehicleId)
  const { data: vehiclesData } = useVehicles()
  const { data: customersData } = useCustomers()

  // Create lookup maps for vehicles and customers
  const vehicles = vehiclesData?.vehicles.reduce((acc, vehicle) => {
    acc[vehicle.id] = vehicle
    return acc
  }, {} as { [key: string]: Vehicle }) || {}

  const customers = customersData?.customers.reduce((acc, customer) => {
    acc[customer.id] = customer
    return acc
  }, {} as { [key: string]: Customer }) || {}

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteService({ firebaseUser: auth.firebaseUser }, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] })
      toast({
        title: "Success",
        description: "Service deleted successfully",
      })
    },
    onError: (error) => {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: "Failed to delete service. Please try again.",
        variant: "destructive",
      })
    },
  })

  const services = servicesData?.services || []

  const filteredServices = services.filter(
    (service) =>
      service.serviceType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicles[service.vehicleId]?.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicles[service.vehicleId]?.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicles[service.vehicleId]?.model.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Filter services based on date
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingServices = filteredServices
    .filter(service => new Date(service.serviceDate) >= today)
    .sort((a, b) => new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime())

  const pastServices = filteredServices
    .filter(service => new Date(service.serviceDate) < today)
    .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())

  const allServices = filteredServices
    .sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime())

  const displayedServices = {
    all: allServices,
    upcoming: upcomingServices,
    past: pastServices
  }[activeTab] || []

  const handleDeleteService = async (id: string) => {
    if (!auth.firebaseUser) return
    deleteMutation.mutate(id)
  }

  function renderServicesList() {
    if (isLoadingServices) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )
    }

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedServices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No services found
                </TableCell>
              </TableRow>
            ) : (
              displayedServices.map((service) => {
                const vehicle = vehicles[service.vehicleId]
                const customer = vehicle ? customers[vehicle.customerId] : null

                return (
                  <TableRow key={service.id}>
                    <TableCell>{format(new Date(service.serviceDate), "PPP")}</TableCell>
                    <TableCell>
                      {vehicle ? (
                        <Link href={`/admin/vehicles/${vehicle.id}`} className="hover:underline">
                          {vehicle.make} {vehicle.model} ({vehicle.year})
                        </Link>
                      ) : (
                        "Unknown Vehicle"
                      )}
                    </TableCell>
                    <TableCell>
                      {customer ? (
                        <Link href={`/admin/customers/${customer.id}`} className="hover:underline">
                          {customer.name}
                        </Link>
                      ) : (
                        "Unknown Customer"
                      )}
                    </TableCell>
                    <TableCell>{service.serviceType}</TableCell>
                    <TableCell>{service.description}</TableCell>
                    <TableCell>${(service.cost ?? 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
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
                            <Link href={`/admin/services/edit/${service.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Services</h1>
            {vehicleId && vehicles[vehicleId] && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
                <Link href="/admin/vehicles" className="hover:text-foreground">
                  Back to Vehicles
                </Link>
              </div>
            )}
          </div>
          <Link href={vehicleId ? `/admin/services/add?vehicleId=${vehicleId}` : "/admin/services/add"}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Service
            </Button>
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Services</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming Services</TabsTrigger>
            <TabsTrigger value="past">Past Services</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search all services..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {renderServicesList()}
          </TabsContent>
          <TabsContent value="upcoming" className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search upcoming services..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {renderServicesList()}
          </TabsContent>
          <TabsContent value="past" className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search past services..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {renderServicesList()}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
} 